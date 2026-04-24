import React, { useState, useEffect } from 'react';
import { Button, Badge, Spinner, Modal, Form, Alert } from 'react-bootstrap';
import { FaTrash, FaEdit, FaPlus, FaClinicMedical, FaProjectDiagram } from 'react-icons/fa';
import DataTable from '../../components/common/DataTable';
import { clinicService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import notify from '../../utils/notify';

const ClinicManagement = () => {
  const { t } = useTranslation();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', description: '', status: 'active' });

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const res = await clinicService.getAll();
      setClinics(res.data);
    } catch (err) {
      notify.error(t('notify.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleOpenModal = (clinic = null) => {
    if (clinic) {
      setIsEditing(true);
      setFormData({ 
        id: clinic.id, 
        name: clinic.name, 
        description: clinic.description || '', 
        status: clinic.status 
      });
    } else {
      setIsEditing(false);
      setFormData({ id: null, name: '', description: '', status: 'active' });
    }
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        await clinicService.update(formData.id, formData);
        notify.success(t('notify.updateSuccess'));
      } else {
        await clinicService.create(formData);
        notify.success(t('notify.updateSuccess'));
      }
      setShowModal(false);
      fetchClinics(); // Refresh
    } catch (err) {
      notify.error(err.response?.data?.message || t('notify.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (clinic) => {
    setClinicToDelete(clinic);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await clinicService.delete(clinicToDelete.id);
      setClinics(clinics.filter(c => c.id !== clinicToDelete.id));
      notify.success(t('notify.updateSuccess'));
      setShowDeleteModal(false);
    } catch (err) {
      const msg = err.response?.data?.message || t('notify.errorGeneric');
      setDeleteError(msg);
      notify.error(msg);
    }
  };

  const columns = [
    { 
      header: t('admin.clinics.title'), 
      render: (row) => (
        <div className="d-flex align-items-center">
          <div className="bg-primary-light p-2 rounded-lg me-3 text-primary d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
            <FaClinicMedical size={18} />
          </div>
          <div>
            <div className="fw-bold">{row.name}</div>
            <div className="text-muted small text-truncate" style={{maxWidth: '300px'}}>{row.description || 'No description provided'}</div>
          </div>
        </div>
      )
    },
    { 
      header: t('common.status'), 
      render: (row) => (
        <Badge bg={row.status === 'active' ? 'success-light' : 'secondary-light'} className={`text-${row.status === 'active' ? 'success' : 'secondary'} px-3 py-2 rounded-pill text-capitalize`}>
          {t(`common.${row.status}`)}
        </Badge>
      )
    },
    { header: t('admin.appointments.dateLabel'), render: (row) => <span className="text-muted small">{new Date(row.created_at).toLocaleDateString(i18next.language)}</span> },
    { 
      header: t('common.actions'), 
      render: (row) => (
        <div className="d-flex gap-2 justify-content-end">
          <Button variant="link" className="text-primary p-0" onClick={() => handleOpenModal(row)} title={t('common.edit')}><FaEdit /></Button>
          <Button variant="link" className="text-danger p-0 ms-2" onClick={() => handleDeleteClick(row)} title={t('common.delete')}><FaTrash /></Button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">{t('admin.clinics.title')}</h2>
          <p className="text-muted mb-0">{t('admin.clinics.subtitle')}</p>
        </div>
        <Button variant="primary" className="rounded-pill px-4 shadow-sm fw-bold" onClick={() => handleOpenModal()}>
          <FaPlus className="me-2" /> {t('admin.clinics.add')}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm mb-4 border overflow-hidden p-4">
        <DataTable 
          data={clinics} 
          columns={columns} 
          loading={loading} 
          onRefresh={fetchClinics} 
          searchPlaceholder={t('common.search')}
          searchKey="name"
        />
      </div>

      {/* Editor Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold d-flex align-items-center">
            <div className="bg-primary-light text-primary p-2 rounded-circle me-3 mb-1"><FaProjectDiagram size={18} /></div>
            {isEditing ? t('admin.clinics.edit') : t('admin.clinics.add')}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={onFormSubmit}>
          <Modal.Body className="pt-3 p-4">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">{t('admin.clinics.name')}</Form.Label>
              <Form.Control name="name" value={formData.name} onChange={handleFormChange} required placeholder={t('admin.clinics.placeholderName')} className="bg-light border-0 py-2" />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">{t('admin.clinics.description')}</Form.Label>
              <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleFormChange} placeholder={t('admin.clinics.placeholderDesc')} className="bg-light border-0 py-2" />
            </Form.Group>

            {isEditing && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">{t('admin.clinics.status')}</Form.Label>
                <Form.Select name="status" value={formData.status} onChange={handleFormChange} className="bg-light border-0 py-2">
                  <option value="active">{t('common.active')}</option>
                  <option value="inactive">{t('common.inactive')}</option>
                </Form.Select>
              </Form.Group>
            )}

          </Modal.Body>
          <Modal.Footer className="border-0 p-4">
            <Button variant="light" onClick={() => setShowModal(false)} className="rounded-pill px-4">{t('common.cancel')}</Button>
            <Button variant="primary" type="submit" className="rounded-pill px-5 shadow fw-bold" disabled={submitting}>
              {submitting ? <Spinner size="sm" animation="border" /> : isEditing ? t('common.save') : t('common.add')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold">{t('admin.clinics.delete')}</Modal.Title></Modal.Header>
        <Modal.Body className="py-4 text-center">
          <div className="bg-danger-light text-danger p-4 rounded-circle d-inline-block mb-3">
             <FaTrash size={32} />
          </div>
          <h5 className="fw-bold">{t('common.delete')} {clinicToDelete?.name}?</h5>
          <p className="text-muted">{t('admin.clinics.confirmDelete')}</p>
          
          {deleteError && (
             <Alert variant="danger" className="text-start small fw-bold mb-0 mt-3 d-flex align-items-center gap-2">
               {deleteError}
             </Alert>
          )}

        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)} className="rounded-pill px-4">{t('common.cancel')}</Button>
          <Button variant="danger" onClick={confirmDelete} className="rounded-pill px-4 fw-bold">{t('common.confirm')}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ClinicManagement;

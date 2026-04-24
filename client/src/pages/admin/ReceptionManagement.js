import React, { useState, useEffect } from 'react';
import { Button, Badge, Modal, Form, Row, Col, Spinner } from 'react-bootstrap';
import { FaPlus, FaTrash, FaEdit, FaHospitalUser } from 'react-icons/fa';
import DataTable from '../../components/common/DataTable';
import { receptionistService, adminService, authService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import notify from '../../utils/notify';

const ReceptionManagement = () => {
  const { t } = useTranslation();
  const [receptionists, setReceptionists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await receptionistService.getAll();
      setReceptionists(res.data);
    } catch (err) {
      notify.error(t('notify.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShow = (staff = null) => {
    if (staff) {
      setIsEditing(true);
      setFormData({
        id: staff.id,
        user_id: staff.user_id,
        email: staff.email,
        first_name: staff.first_name,
        last_name: staff.last_name,
        phone: staff.phone
      });
    } else {
      setIsEditing(false);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone: ''
      });
    }
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        await adminService.updateUser(formData.user_id, formData);
        notify.success(t('notify.updateSuccess'));
      } else {
        await authService.inviteUser({ 
          ...formData, 
          role: 'receptionist' 
        });
        notify.success(t('notify.inviteSuccess'));
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || t('notify.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteStaff = async (userId) => {
    if (window.confirm(t('admin.receptionStaff.confirmDelete'))) {
      try {
        await adminService.deleteUser(userId);
        notify.success(t('notify.updateSuccess'));
        fetchData();
      } catch (err) {
        notify.error(t('notify.updateError'));
      }
    }
  };

  const columns = [
    { 
      header: t('common.name'), 
      render: (row) => (
        <div className="d-flex align-items-center">
          <div className="bg-info-light p-2 rounded-lg me-3 text-info"><FaHospitalUser /></div>
          <div>
             <div className="fw-bold">{row.first_name} {row.last_name}</div>
             <div className="text-muted small">{t('nav.reception')}</div>
          </div>
        </div>
      )
    },
    { header: t('common.phone'), key: 'phone' },
    { 
      header: t('common.status'), 
      render: () => <Badge bg="success" className="rounded-pill px-3">{t('common.active')}</Badge> 
    },
    { 
      header: t('common.actions'), 
      render: (row) => (
        <div className="d-flex gap-2 justify-content-end">
          <Button variant="link" className="text-primary p-0" onClick={() => handleShow(row)}><FaEdit /></Button>
          <Button variant="link" className="text-danger p-0" onClick={() => deleteStaff(row.user_id)}><FaTrash /></Button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">{t('admin.receptionStaff.title')}</h2>
          <p className="text-muted mb-0">{t('admin.receptionStaff.subtitle')}</p>
        </div>
        <Button variant="primary" className="rounded-pill px-4 shadow-sm fw-bold" onClick={() => handleShow()}>
          <FaPlus className="me-2" /> {t('admin.receptionStaff.add')}
        </Button>
      </div>

      <DataTable 
        data={receptionists} 
        columns={columns} 
        loading={loading} 
        onRefresh={fetchData} 
        searchPlaceholder={t('admin.receptionStaff.search')}
        searchKey="last_name"
      />

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{isEditing ? t('admin.receptionStaff.modify') : t('admin.receptionStaff.newIntake')}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="pt-4">
            {!isEditing && (
              <>
                <h6 className="text-primary fw-bold mb-3 small text-uppercase tracking-wider">{t('admin.receptionStaff.authentication')}</h6>
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-muted">{t('common.email')}</Form.Label>
                  <Form.Control type="email" name="email" value={formData.email} onChange={handleInputChange} required className="rounded-lg border-0 bg-light py-2" placeholder="staff@careplus.com" />
                  <Form.Text className="text-muted small">An invitation link will be sent to this address.</Form.Text>
                </Form.Group>
              </>
            )}

            <h6 className="text-primary fw-bold mb-3 small text-uppercase tracking-wider">{t('admin.receptionStaff.personalDetails')}</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">{t('common.name')} (First)</Form.Label>
                  <Form.Control name="first_name" value={formData.first_name} onChange={handleInputChange} required className="rounded-lg border-0 bg-light py-2" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">{t('common.name')} (Last)</Form.Label>
                  <Form.Control name="last_name" value={formData.last_name} onChange={handleInputChange} required className="rounded-lg border-0 bg-light py-2" />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted">{t('common.phone')}</Form.Label>
                  <Form.Control name="phone" value={formData.phone} onChange={handleInputChange} required className="rounded-lg border-0 bg-light py-2" placeholder="555-0102" />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={() => setShowModal(false)} className="rounded-pill px-4">{t('common.cancel')}</Button>
            <Button variant="primary" type="submit" className="rounded-pill px-4 shadow fw-bold" disabled={submitting}>
              {submitting ? <Spinner size="sm" animation="border" /> : isEditing ? t('common.save') : t('common.submit')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ReceptionManagement;

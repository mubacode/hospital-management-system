import React, { useState, useEffect } from 'react';
import { Button, Badge, Modal, Form, Row, Col, Spinner } from 'react-bootstrap';
import { FaPlus, FaTrash, FaEdit, FaUserMd } from 'react-icons/fa';
import DataTable from '../../components/common/DataTable';
import { doctorService, adminService, clinicService, authService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import notify from '../../utils/notify';

const DoctorManagement = () => {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    specialization: '',
    qualification: 'MD',
    phone: '',
    clinic_id: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [docRes, clinicRes] = await Promise.all([
        doctorService.getAll(),
        clinicService.getAll()
      ]);
      setDoctors(docRes.data);
      setClinics(clinicRes.data);
    } catch (err) {
      notify.error(t('admin.specialists.errorSync') || 'Unable to synchronize with medical archives.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleShow = (doctor = null) => {
    if (doctor) {
      setIsEditing(true);
      setFormData({
        id: doctor.id,
        user_id: doctor.user_id,
        email: doctor.email,
        first_name: doctor.first_name,
        last_name: doctor.last_name,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        phone: doctor.phone,
        clinic_id: doctor.clinic_id
      });
    } else {
      setIsEditing(false);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        specialization: '',
        qualification: 'MD',
        phone: '',
        clinic_id: ''
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
        notify.success(t('admin.specialists.updateSuccess'));
      } else {
        // Invite system for NEW doctors
        await authService.inviteUser({ ...formData, role: 'doctor' });
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

  const deleteDoctor = async (userId) => {
    if (window.confirm(t('admin.specialists.confirmDelete'))) {
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
          <div className="bg-primary-light p-2 rounded-lg me-3 text-primary"><FaUserMd /></div>
          <div>
            <div className="fw-bold">Dr. {row.first_name} {row.last_name}</div>
            <div className="text-muted small">{row.qualification}</div>
          </div>
        </div>
      )
    },
    { header: t('admin.specialists.specialization'), key: 'specialization' },
    { 
      header: t('admin.specialists.clinic'), 
      render: (row) => <Badge bg="light" className="text-dark border rounded-pill">{row.clinic_name || 'N/A'}</Badge> 
    },
    { header: t('common.phone'), key: 'phone' },
    { 
      header: t('common.actions'), 
      render: (row) => (
        <div className="d-flex gap-2 justify-content-end">
          <Button variant="link" className="text-primary p-0" onClick={() => handleShow(row)}><FaEdit /></Button>
          <Button variant="link" className="text-danger p-0" onClick={() => deleteDoctor(row.user_id)}><FaTrash /></Button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">{t('admin.specialists.title')}</h2>
          <p className="text-muted mb-0">{t('admin.specialists.subtitle')}</p>
        </div>
        <Button variant="primary" className="rounded-pill px-4 shadow-sm fw-bold" onClick={() => handleShow()}>
          <FaPlus className="me-2" /> {t('admin.specialists.add')}
        </Button>
      </div>

      <DataTable 
        data={doctors} 
        columns={columns} 
        loading={loading} 
        onRefresh={fetchData} 
        searchPlaceholder={t('admin.specialists.search')}
        searchKey="last_name"
      />

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{isEditing ? t('admin.specialists.modify') : t('admin.specialists.newIntake')}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="pt-4">
            {!isEditing && (
              <>
                <h6 className="text-primary fw-bold mb-3">{t('admin.specialists.systemAccount')}</h6>
                <Row className="mb-4">
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">{t('common.email')}</Form.Label>
                      <Form.Control type="email" name="email" value={formData.email} onChange={handleInputChange} required className="rounded-lg shadow-sm border-0 bg-light" placeholder="doctor@careplus.com" />
                      <Form.Text className="text-muted small px-1">An invitation link will be sent to this address.</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}

            <h6 className="text-primary fw-bold mb-3">{t('admin.specialists.professionalIdentity')}</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">{t('common.name')} (First)</Form.Label>
                  <Form.Control name="first_name" value={formData.first_name} onChange={handleInputChange} required className="rounded-lg shadow-sm border-0 bg-light" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">{t('common.name')} (Last)</Form.Label>
                  <Form.Control name="last_name" value={formData.last_name} onChange={handleInputChange} required className="rounded-lg shadow-sm border-0 bg-light" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">{t('admin.specialists.specialization')}</Form.Label>
                  <Form.Control name="specialization" value={formData.specialization} onChange={handleInputChange} required className="rounded-lg shadow-sm border-0 bg-light" placeholder="e.g. Cardiology" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">{t('admin.specialists.clinic')}</Form.Label>
                  <Form.Select name="clinic_id" value={formData.clinic_id} onChange={handleInputChange} required className="rounded-lg shadow-sm border-0 bg-light">
                    <option value="">-- {t('common.selectOption')} --</option>
                    {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">{t('common.phone')}</Form.Label>
                  <Form.Control name="phone" value={formData.phone} onChange={handleInputChange} required className="rounded-lg shadow-sm border-0 bg-light" placeholder="555-0011" />
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

export default DoctorManagement;

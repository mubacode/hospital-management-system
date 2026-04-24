import React, { useState, useEffect } from 'react';
import { Button, Badge, Modal, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { FaSync, FaEdit, FaUserMd } from 'react-icons/fa';
import DataTable from '../../components/common/DataTable';
import { appointmentService, clinicService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import notify from '../../utils/notify';
import i18next from 'i18next';

const GlobalScheduleMonitor = () => {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editData, setEditData] = useState({
    status: '',
    doctorId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const aptRes = await appointmentService.getAll();
      setAppointments(aptRes.data);
    } catch (err) {
      notify.error(t('notify.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManageClick = async (apt) => {
    setSelectedApt(apt);
    setEditData({
      status: apt.status,
      doctorId: apt.doctor_id || ''
    });
    
    // Load specialist list for the same clinic
    setLoading(true);
    try {
      const docRes = await clinicService.getDoctors(apt.clinic_id);
      setDoctors(docRes.data);
      setShowModal(true);
    } catch (err) {
      notify.error(t('reception.globalSchedule.errorDocs') || 'Unable to retrieve specialists.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await appointmentService.update(selectedApt.id, {
        status: editData.status,
        doctorId: editData.doctorId
      });
      notify.success(t('notify.updateSuccess'));
      setShowModal(false);
      fetchData();
    } catch (err) {
      notify.error(t('notify.updateError'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'completed': 'success',
      'scheduled': 'primary',
      'confirmed': 'info',
      'pending': 'warning',
      'cancelled': 'danger',
      'pending_assignment': 'dark'
    };
    return (
      <Badge bg={variants[status] || 'secondary'} className="rounded-pill px-3 py-2">
        {t(`reception.globalSchedule.statusLabels.${status}`) || status}
      </Badge>
    );
  };

  const columns = [
    { 
      header: t('reception.globalSchedule.consultation'), 
      render: (row) => (
        <div>
          <div className="fw-bold text-primary">{new Date(row.appointment_date).toLocaleDateString(i18next.language)}</div>
          <div className="small text-muted">{row.appointment_time.slice(0, 5)}</div>
        </div>
      )
    },
    { 
      header: t('reception.globalSchedule.patientInfo'), 
      render: (row) => (
        <div>
          <div className="fw-bold">{row.patient_first_name} {row.patient_last_name}</div>
          <small className="text-muted">{row.clinic_name}</small>
        </div>
      )
    },
    { 
      header: t('reception.globalSchedule.specialistAssigned'), 
      render: (row) => (
        <div className="d-flex align-items-center">
          <FaUserMd className="text-muted me-2" />
          <span className={row.doctor_id ? 'fw-medium small' : 'text-danger small fw-bold italic'}>
             {row.doctor_id ? `Dr. ${row.doctor_first_name} ${row.doctor_last_name}` : t('reception.globalSchedule.awaitingAssignment')}
          </span>
        </div>
      )
    },
    { header: t('common.status'), render: (row) => getStatusBadge(row.status) },
    { 
      header: t('common.actions'), 
      render: (row) => (
        <Button variant="outline-primary" size="sm" className="rounded-pill px-3 fw-bold" onClick={() => handleManageClick(row)}>
          <FaEdit className="me-2" /> {t('reception.globalSchedule.manageVisit')}
        </Button>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">{t('reception.globalSchedule.title')}</h2>
          <p className="text-muted mb-0">{t('reception.globalSchedule.subtitle')}</p>
        </div>
        <Button variant="light" className="rounded-pill border shadow-sm px-4" onClick={fetchData} disabled={loading}>
           <FaSync className={loading ? 'fa-spin' : ''} /> {t('reception.globalSchedule.refresh')}
        </Button>
      </div>

      <DataTable 
        data={appointments} 
        columns={columns} 
        loading={loading} 
        onRefresh={fetchData} 
        searchPlaceholder={t('reception.globalSchedule.search')}
        searchKey="patient_last_name"
      />

      {/* Global Manage Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{t('reception.globalSchedule.operationalControl')}: #{selectedApt?.id}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="pt-4">
            <Row className="mb-4">
               <Col md={12}>
                  <div className="bg-light p-3 rounded-xl border d-flex justify-content-between mb-4 mt-2 shadow-sm">
                     <div>
                        <small className="text-muted fw-bold small text-uppercase" style={{fontSize: '0.7rem'}}>{t('reception.globalSchedule.patientRegistered')}</small>
                        <p className="mb-0 fw-bold">{selectedApt?.patient_first_name} {selectedApt?.patient_last_name}</p>
                     </div>
                     <div className="text-end">
                        <small className="text-muted fw-bold small text-uppercase" style={{fontSize: '0.7rem'}}>{t('reception.globalSchedule.unit')}</small>
                        <p className="mb-0 fw-bold text-primary">{selectedApt?.clinic_name}</p>
                     </div>
                  </div>
               </Col>
               <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted text-uppercase">{t('reception.globalSchedule.visitStatus')}</Form.Label>
                    <Form.Select name="status" value={editData.status} onChange={handleInputChange} className="rounded-lg border-0 bg-light shadow-sm py-2 px-3 fw-bold">
                      <option value="pending_assignment">{t('reception.globalSchedule.statusLabels.pending_assignment')}</option>
                      <option value="pending">{t('reception.globalSchedule.statusLabels.pending')}</option>
                      <option value="confirmed">{t('reception.globalSchedule.statusLabels.confirmed')}</option>
                      <option value="scheduled">{t('reception.globalSchedule.statusLabels.scheduled')}</option>
                      <option value="cancelled">{t('reception.globalSchedule.statusLabels.cancelled')}</option>
                      <option value="completed">{t('reception.globalSchedule.statusLabels.completed')}</option>
                    </Form.Select>
                  </Form.Group>
               </Col>
               <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted text-uppercase">{t('reception.globalSchedule.assignSpecialist')}</Form.Label>
                    <Form.Select name="doctorId" value={editData.doctorId} onChange={handleInputChange} className="rounded-lg border-0 bg-light shadow-sm py-2 px-3 fw-bold">
                      <option value="">-- {t('reception.globalSchedule.noAssignment')} --</option>
                      {doctors.map(d => (
                        <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name} ({d.specialization})</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
               </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 justify-content-center pb-4">
            <Button variant="light" onClick={() => setShowModal(false)} className="rounded-pill px-4">{t('common.close')}</Button>
            <Button variant="primary" type="submit" className="rounded-pill px-5 shadow fw-bold" disabled={submitting}>
              {submitting ? <Spinner size="sm" animation="border" /> : t('reception.globalSchedule.finalizeUpdate')}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default GlobalScheduleMonitor;

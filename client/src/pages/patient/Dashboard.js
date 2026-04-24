import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, Spinner, ListGroup } from 'react-bootstrap';
import { FaCalendarPlus, FaHistory, FaUserMd, FaPrescription, FaNotesMedical, FaChevronRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { appointmentService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await appointmentService.getMyAppointments();
        setAppointments(res.data);
      } catch (err) {
        console.error('Patient record sync failed');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const upcomingApts = appointments.filter(a => ['scheduled', 'confirmed', 'pending', 'pending_assignment', 'in-progress'].includes(a.status));
  const completedApts = appointments.filter(a => a.status === 'completed');

  const handleCancel = async (id) => {
    if (window.confirm(t('admin.appointments.confirmDelete') || 'Are you sure?')) {
      try {
        await appointmentService.update(id, { status: 'cancelled' });
        // Refresh list
        const res = await appointmentService.getMyAppointments();
        setAppointments(res.data);
      } catch (err) {
        console.error('Failed to cancel appointment');
      }
    }
  };

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">{t('patient.dashboardTitle')}</h2>
          <p className="text-muted mb-0">{t('patient.dashboardSubtitle')}</p>
        </div>
        <Button as={Link} to="/patient/appointments/book" variant="primary" className="rounded-pill px-4 shadow-sm fw-bold">
          <FaCalendarPlus className="me-2" /> {t('patient.bookNewSession')}
        </Button>
      </div>

      <Row className="mb-5">
        <Col lg={8}>
          <Card className="glass border-0 shadow-sm p-4 h-100">
            <h5 className="fw-bold mb-4">{t('patient.upcomingConsultations')}</h5>
            {upcomingApts.length > 0 ? (
              <ListGroup variant="flush">
                {upcomingApts.slice(0, 3).map((apt, idx) => (
                  <ListGroup.Item key={idx} className="px-0 py-3 bg-transparent border-0 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="bg-primary-light p-3 rounded-circle me-3 text-primary">
                        <FaUserMd />
                      </div>
                      <div>
                        <p className="mb-0 fw-bold">Dr. {apt.doctor_first_name} {apt.doctor_last_name}</p>
                        <small className="text-muted">
                          {new Date(apt.appointment_date).toLocaleDateString()} — {apt.appointment_time?.slice(0, 5)}
                        </small>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg={apt.status === 'scheduled' ? 'primary' : 'warning'} className="rounded-pill px-3 py-2 text-capitalize">
                        {t(`status.${apt.status}`, { defaultValue: apt.status })}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="soft-danger" 
                        className="rounded-circle border-0 p-2"
                        onClick={() => handleCancel(apt.id)}
                        title={t('common.cancel')}
                      >
                        ×
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <div className="text-center py-5">
                <p className="text-muted mb-4 small">{t('patient.noUpcomingApts')}</p>
                <Button as={Link} to="/patient/appointments/book" variant="outline-primary" className="rounded-pill px-4">
                  {t('patient.findSpecialist')}
                </Button>
              </div>
            )}
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="glass border-0 shadow-sm p-4 bg-primary text-white mb-4">
            <h5 className="fw-bold mb-3">{t('patient.recordGateway')}</h5>
            <p className="small opacity-75 mb-4">{t('patient.recordGatewayDesc')}</p>
            <Button as={Link} to="/patient/medical-history" variant="light" className="rounded-pill px-4 fw-bold text-primary w-100 mb-3 shadow">
              {t('patient.medicalRecords')}
            </Button>
            <div className="d-flex justify-content-between small opacity-75">
              <span>{t('patient.completedVisits')}</span>
              <span className="fw-bold">{completedApts.length}</span>
            </div>
          </Card>

          <Card className="glass border-0 shadow-sm p-4">
            <h6 className="fw-bold text-muted small text-uppercase mb-3 px-1">{t('patient.healthInsights')}</h6>
            <div className="d-grid gap-2">
              <div className="p-3 bg-light rounded-lg d-flex align-items-center border border-white">
                <FaPrescription className="text-primary me-3 fs-4" />
                <div className="flex-grow-1">
                  <p className="mb-0 fw-bold small">{t('patient.prescriptions')}</p>
                  <small className="text-muted">{t('patient.activeMeds')}</small>
                </div>
                <FaChevronRight className="text-muted small" />
              </div>
              <div className="p-3 bg-light rounded-lg d-flex align-items-center border border-white">
                <FaNotesMedical className="text-primary me-3 fs-4" />
                <div className="flex-grow-1">
                  <p className="mb-0 fw-bold small">{t('patient.clinicNotes')}</p>
                  <small className="text-muted">{t('patient.lastUpdate')}</small>
                </div>
                <FaChevronRight className="text-muted small" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="glass border-0 shadow-sm">
        <Card.Body className="p-4 d-flex align-items-center">
          <div className="me-4 text-primary fs-1">
            <FaHistory />
          </div>
          <div className="flex-grow-1">
            <h5 className="fw-bold mb-1">{t('patient.recentActivity')}</h5>
            <p className="text-muted mb-0 small">
              {completedApts.length > 0
                ? `${completedApts[0].clinic_name} — ${new Date(completedApts[0].appointment_date).toLocaleDateString()}`
                : t('patient.noRecentActivity')}
            </p>
          </div>
          <Button as={Link} to="/patient/medical-history" variant="link" className="text-primary fw-bold text-decoration-none">
            {t('patient.viewArchive')}
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PatientDashboard;

import React, { useState, useEffect } from 'react';
import notify from '../../utils/notify';
import { Row, Col, Card, ProgressBar, Spinner, Button } from 'react-bootstrap';
import { FaUserFriends, FaCalendarCheck, FaClock, FaPrescription, FaNotesMedical, FaUserMd } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { doctorService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    completedToday: 0
  });
  const [upcomingApts, setUpcomingApts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await doctorService.getAppointments();
        const allApts = res.data;
        const today = new Date().toISOString().split('T')[0];
        
        const todayApts = allApts.filter(a => a.appointment_date.includes(today) && a.status !== 'cancelled');
        const completed = todayApts.filter(a => a.status === 'completed').length;
        const uniquePatients = new Set(allApts.filter(a => a.status !== 'cancelled').map(a => a.patient_id)).size;

        setStats({
          totalPatients: uniquePatients,
          todayAppointments: todayApts.length,
          completedToday: completed
        });
        setUpcomingApts(todayApts.filter(a => a.status !== 'completed').slice(0, 5));
      } catch (err) {
        notify.error('Doctor stats sync failed');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">{t('doctor.dashboardTitle')}</h2>
          <p className="text-muted mb-0">{t('doctor.dashboardSubtitle')}</p>
        </div>
        <Button as={Link} to="/doctor/appointments" variant="primary" className="rounded-pill px-4 shadow-sm fw-bold">
          {t('doctor.viewFullSchedule')}
        </Button>
      </div>

      <Row className="mb-5">
        <Col md={4}>
          <Card className="glass border-0 shadow-sm p-4 text-center h-100 transition hover-shadow">
            <div className="bg-primary-light d-inline-block p-3 rounded-circle mx-auto mb-3 text-primary fs-4">
              <FaUserFriends />
            </div>
            <h6 className="text-muted small fw-bold text-uppercase mb-2">{t('doctor.totalPatients')}</h6>
            <h2 className="fw-bold mb-3">{stats.totalPatients}</h2>
            <ProgressBar now={100} variant="primary" style={{ height: '4px' }} className="rounded-pill" />
          </Card>
        </Col>
        <Col md={4}>
          <Card className="glass border-0 shadow-sm p-4 text-center h-100 transition hover-shadow">
            <div className="d-inline-block p-3 rounded-circle mx-auto mb-3 text-warning fs-4" style={{backgroundColor: '#fef7e0'}}>
              <FaClock />
            </div>
            <h6 className="text-muted small fw-bold text-uppercase mb-2">{t('doctor.todaysVisits')}</h6>
            <h2 className="fw-bold mb-3">{stats.todayAppointments}</h2>
            <ProgressBar 
              now={stats.todayAppointments > 0 ? (stats.completedToday / stats.todayAppointments) * 100 : 0} 
              variant="warning" style={{ height: '4px' }} className="rounded-pill" />
          </Card>
        </Col>
        <Col md={4}>
          <Card className="glass border-0 shadow-sm p-4 text-center h-100 transition hover-shadow">
            <div className="d-inline-block p-3 rounded-circle mx-auto mb-3 text-success fs-4" style={{backgroundColor: '#e6f4ea'}}>
              <FaCalendarCheck />
            </div>
            <h6 className="text-muted small fw-bold text-uppercase mb-2">{t('doctor.completedSessions')}</h6>
            <h2 className="fw-bold mb-3">{stats.completedToday}</h2>
            <ProgressBar now={100} variant="success" style={{ height: '4px' }} className="rounded-pill" />
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="glass border-0 shadow-sm p-4 h-100">
            <h5 className="fw-bold mb-4">{t('doctor.immediateSchedule')}</h5>
            {upcomingApts.length > 0 ? (
              <div className="timeline">
                {upcomingApts.map((apt, idx) => (
                  <div key={idx} className="d-flex mb-4 border-start ps-4 position-relative">
                    <div className="position-absolute bg-primary rounded-circle" style={{width: '12px', height: '12px', left: '-6px', top: '5px'}}></div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold">{apt.patient_first_name} {apt.patient_last_name}</span>
                        <span className="badge bg-light text-primary rounded-pill border">{apt.appointment_time?.slice(0, 5)}</span>
                      </div>
                      <div className="small text-muted mb-2">{apt.reason}</div>
                      <Button as={Link} to="/doctor/appointments" variant="link" size="sm" className="p-0 text-decoration-none fw-bold">
                        {t('common.updateRecord')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5 my-3 text-muted">
                <p className="mb-0">{t('doctor.noVisitsToday')}</p>
              </div>
            )}
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="glass border-0 shadow-sm p-4 h-100 bg-primary text-white overflow-hidden position-relative">
            <div className="position-relative z-index-1">
              <h5 className="fw-bold mb-3">{t('doctor.quickRecords')}</h5>
              <p className="small opacity-75 mb-4">{t('doctor.quickRecordsDesc')}</p>
              <Button as={Link} to="/doctor/patients" variant="light" className="rounded-pill px-4 fw-bold text-primary w-100 shadow">
                {t('doctor.openPatientDirectory')}
              </Button>
              <div className="mt-4 pt-4 border-top border-white border-opacity-25">
                <div className="d-flex align-items-center mb-3">
                  <FaNotesMedical className="me-3" />
                  <span className="small">{t('doctor.clinicalObservations')}</span>
                </div>
                <div className="d-flex align-items-center">
                  <FaPrescription className="me-3" />
                  <span className="small">{t('doctor.digitalRxGateway')}</span>
                </div>
              </div>
            </div>
            <FaUserMd className="position-absolute opacity-10" style={{bottom: '-20px', right: '-20px', fontSize: '180px'}} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DoctorDashboard;

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { FaUserFriends, FaCalendarCheck, FaClock, FaCheckCircle, FaUserMd } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { appointmentService } from '../../services/api';

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    completedToday: 0
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorStats = async () => {
      try {
        const aptRes = await appointmentService.getMyAppointments();
        const allApts = aptRes.data;
        const today = new Date().toISOString().split('T')[0];
        
        const todayApts = allApts.filter(a => a.appointment_date.includes(today));
        const completed = todayApts.filter(a => a.status === 'completed').length;
        const uniquePatients = new Set(allApts.map(a => a.patient_id)).size;

        setStats({
          totalPatients: uniquePatients,
          todayAppointments: todayApts.length,
          completedToday: completed
        });
        setAppointments(todayApts.slice(0, 5));
      } catch (err) {
        console.error('Error fetching doctor stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorStats();
  }, []);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Doctor Portal</h2>
          <p className="text-muted mb-0">Daily overview and patient schedule</p>
        </div>
        <Button as={Link} to="/doctor/appointments" variant="primary" className="rounded-pill px-4 shadow-sm">
          <FaCalendarCheck className="me-2" /> View All Appointments
        </Button>
      </div>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="glass border-0 shadow-sm p-3 mb-3">
             <div className="d-flex align-items-center">
                <div className="bg-primary-light p-3 rounded-lg text-primary me-3">
                  <FaUserFriends fs-4 />
                </div>
                <div>
                  <h6 className="text-muted small fw-bold mb-0">TOTAL PATIENTS</h6>
                  <h3 className="fw-bold mb-0">{stats.totalPatients}</h3>
                </div>
             </div>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="glass border-0 shadow-sm p-3 mb-3">
             <div className="d-flex align-items-center">
                <div className="bg-warning-light p-3 rounded-lg text-warning me-3" style={{backgroundColor: '#fef7e0'}}>
                  <FaClock fs-4 />
                </div>
                <div>
                  <h6 className="text-muted small fw-bold mb-0">TODAY'S APPOINTMENTS</h6>
                  <h3 className="fw-bold mb-0">{stats.todayAppointments}</h3>
                </div>
             </div>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="glass border-0 shadow-sm p-3 mb-3">
             <div className="d-flex align-items-center">
                <div className="bg-success-light p-3 rounded-lg text-success me-3" style={{backgroundColor: '#e6f4ea'}}>
                  <FaCheckCircle fs-4 />
                </div>
                <div>
                  <h6 className="text-muted small fw-bold mb-0">COMPLETED TODAY</h6>
                  <h3 className="fw-bold mb-0">{stats.completedToday}</h3>
                </div>
             </div>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="glass border-0 shadow-sm mb-4">
            <Card.Header className="bg-transparent border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Today's Schedule</h5>
              <Link to="/doctor/appointments" className="small text-decoration-none">View Full Schedule</Link>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="bg-light small fw-bold text-muted">
                  <tr>
                    <th className="ps-4 py-3 border-0">Patient</th>
                    <th className="py-3 border-0">Time</th>
                    <th className="py-3 border-0">Status</th>
                    <th className="pe-4 py-3 border-0 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length > 0 ? appointments.map((apt, idx) => (
                    <tr key={idx} className="transition h-100">
                      <td className="ps-4 align-middle">
                        <div className="fw-bold">{apt.patient_first_name} {apt.patient_last_name}</div>
                        <small className="text-muted">{apt.reason.slice(0, 30)}...</small>
                      </td>
                      <td className="align-middle fw-medium text-primary">{apt.appointment_time.slice(0, 5)}</td>
                      <td className="align-middle">
                        <Badge bg={apt.status === 'completed' ? 'success' : 'primary'} className="rounded-pill px-3 py-2 text-capitalize">
                          {apt.status}
                        </Badge>
                      </td>
                      <td className="pe-4 align-middle text-end">
                        <Button as={Link} to="/doctor/appointments" variant="outline-primary" size="sm" className="rounded-pill px-3">Enter Clinic</Button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="text-center py-5 text-muted">No appointments scheduled for today.</td></tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
           <Card className="glass border-0 shadow-sm p-4 bg-primary text-white mb-4 overflow-hidden position-relative">
              <div className="position-relative z-index-1">
                <h5 className="fw-bold mb-3">Quick Records</h5>
                <p className="small opacity-75 mb-4">Access patient vitals and health history in a single click before consultation.</p>
                <Button as={Link} to="/doctor/patients" variant="light" className="rounded-pill px-4 fw-bold text-primary w-100">Patient Directory</Button>
              </div>
              <FaUserMd className="position-absolute opacity-10" style={{bottom: '-20px', right: '-20px', fontSize: '150px'}} />
           </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DoctorDashboard;

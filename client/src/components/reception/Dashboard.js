import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { FaCalendarAlt, FaUserPlus, FaUserMd, FaClipboardList, FaAddressBook } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { appointmentService } from '../../services/api';

const ReceptionDashboard = () => {
  const [stats, setStats] = useState({
    todayTotal: 0,
    pendingAssignment: 0,
    confirmedToday: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceptionData = async () => {
      try {
        const res = await appointmentService.getAll();
        const allApts = res.data;
        const today = new Date().toISOString().split('T')[0];
        
        const todayApts = allApts.filter(a => a.appointment_date.includes(today));
        const pendingAssign = allApts.filter(a => a.status === 'pending_assignment').length;
        const confirmedToday = todayApts.filter(a => a.status === 'confirmed' || a.status === 'scheduled').length;

        setStats({
          todayTotal: todayApts.length,
          pendingAssignment: pendingAssign,
          confirmedToday: confirmedToday
        });
        setRecentAppointments(allApts.slice(0, 5));
      } catch (err) {
        console.error('Error fetching reception data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReceptionData();
  }, []);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Reception Console</h2>
          <p className="text-muted mb-0">Manage daily intake and appointment queues</p>
        </div>
        <div className="d-flex gap-2">
          <Button as={Link} to="/reception/register-patient" variant="outline-primary" className="rounded-pill px-4">
            <FaUserPlus className="me-2" /> New Intake
          </Button>
          <Button as={Link} to="/reception/appointments" variant="primary" className="rounded-pill px-4 shadow-sm">
            <FaCalendarAlt className="me-2" /> All Appointments
          </Button>
        </div>
      </div>

      <Row className="mb-4">
        <Col sm={4}>
          <Card className="glass border-0 shadow-sm p-3 mb-3 text-center">
            <div className="bg-primary-light d-inline-block p-3 rounded-circle mx-auto mb-2 text-primary fs-4">
              <FaClipboardList />
            </div>
            <h6 className="text-muted small fw-bold mt-1">TODAY'S TOTAL</h6>
            <h3 className="fw-bold mb-0">{stats.todayTotal}</h3>
          </Card>
        </Col>
        <Col sm={4}>
          <Card className="glass border-0 shadow-sm p-3 mb-3 text-center">
            <div className="bg-danger-light d-inline-block p-3 rounded-circle mx-auto mb-2 text-danger fs-4" style={{backgroundColor: '#fce8e6'}}>
              <FaUserMd />
            </div>
            <h6 className="text-muted small fw-bold mt-1">PENDING ASSIGNMENT</h6>
            <h3 className="fw-bold mb-0">{stats.pendingAssignment}</h3>
          </Card>
        </Col>
        <Col sm={4}>
          <Card className="glass border-0 shadow-sm p-3 mb-3 text-center">
            <div className="bg-success-light d-inline-block p-3 rounded-circle mx-auto mb-2 text-success fs-4" style={{backgroundColor: '#e6f4ea'}}>
              <FaCalendarAlt />
            </div>
            <h6 className="text-muted small fw-bold mt-1">CONFIRMED TODAY</h6>
            <h3 className="fw-bold mb-0">{stats.confirmedToday}</h3>
          </Card>
        </Col>
      </Row>

      <Card className="glass border-0 shadow-sm">
        <Card.Header className="bg-transparent border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Upcoming Appointment Requests</h5>
          <Link to="/reception/appointments" className="small text-decoration-none fw-bold">Manage All</Link>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light small fw-bold text-muted">
              <tr>
                <th className="ps-4 py-3 border-0">Patient Info</th>
                <th className="py-3 border-0 text-center">Date</th>
                <th className="py-3 border-0 text-center">Status</th>
                <th className="pe-4 py-3 border-0 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.length > 0 ? recentAppointments.map((apt, idx) => (
                <tr key={idx} className="transition h-100">
                  <td className="ps-4 align-middle">
                    <div className="fw-bold">{apt.patient_first_name} {apt.patient_last_name}</div>
                    <small className="text-muted">{apt.clinic_name}</small>
                  </td>
                  <td className="align-middle text-center fw-medium text-primary">
                    {new Date(apt.appointment_date).toLocaleDateString()}<br/>
                    <small className="text-muted">{apt.appointment_time.slice(0, 5)}</small>
                  </td>
                  <td className="align-middle text-center">
                    <Badge bg={apt.status === 'pending_assignment' ? 'danger' : 'primary'} className="rounded-pill px-3 py-2 text-capitalize">
                      {apt.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="pe-4 align-middle text-end">
                    <Button as={Link} to="/reception/appointments" variant="outline-primary" size="sm" className="rounded-pill px-3">Review</Button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="text-center py-5 text-muted">No appointments found.</td></tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      
      <Row className="mt-4">
        <Col md={12}>
           <Card className="border-0 shadow-sm bg-dark text-white p-4">
              <Row className="align-items-center">
                <Col md={8}>
                   <h5 className="fw-bold"><FaAddressBook className="me-2" /> New Patient Intake?</h5>
                   <p className="mb-0 opacity-75">Click below to quickly register a new patient arriving at the clinic.</p>
                </Col>
                <Col md={4} className="text-md-end mt-3 mt-md-0">
                   <Button as={Link} to="/reception/register-patient" variant="light" className="rounded-pill px-4 fw-bold text-dark">Register Patient</Button>
                </Col>
              </Row>
           </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReceptionDashboard;

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaCalendarPlus, FaHistory, FaCapsules, FaUserMd, FaChevronRight } from 'react-icons/fa';
import { appointmentService } from '../../services/api';

const PatientDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const res = await appointmentService.getMyAppointments();
        setAppointments(res.data);
      } catch (err) {
        console.error('Error fetching patient data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, []);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  const upcomingApts = appointments.filter(a => a.status === 'confirmed' || a.status === 'scheduled' || a.status === 'pending');

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Health Portal</h2>
        <p className="text-muted">Manage your wellness and upcoming appointments</p>
      </div>

      <Row className="mb-4">
        <Col lg={8}>
          <Card className="glass border-0 shadow-sm mb-4">
            <Card.Header className="bg-transparent border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Upcoming Consultations</h5>
              <Link to="/patient/appointments/book" className="text-primary fw-bold text-decoration-none small">Book New</Link>
            </Card.Header>
            <Card.Body className="px-0">
              {upcomingApts.length > 0 ? (
                <ListGroup variant="flush">
                  {upcomingApts.slice(0, 3).map((apt, idx) => (
                    <ListGroup.Item key={idx} className="px-4 py-3 bg-transparent border-0 d-flex align-items-center justify-content-between border-bottom-1 shadow-hover-light">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary-light p-2 rounded-circle me-3 text-primary">
                          <FaUserMd />
                        </div>
                        <div>
                          <p className="mb-0 fw-bold">Dr. {apt.doctor_first_name} {apt.doctor_last_name}</p>
                          <small className="text-muted">{new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time.slice(0, 5)}</small>
                        </div>
                      </div>
                      <Badge bg="primary-light" className="text-primary rounded-pill px-3 py-2 text-capitalize">{apt.status}</Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-5 px-4">
                  <p className="text-muted mb-3">You have no upcoming appointments</p>
                  <Button as={Link} to="/patient/appointments/book" variant="outline-primary" className="rounded-pill px-4">
                    Book Now
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm bg-primary text-white overflow-hidden position-relative mb-4">
            <Card.Body className="p-4 d-flex align-items-center">
              <div className="position-relative z-index-1">
                <h4 className="fw-bold mb-2">Need a checkup?</h4>
                <p className="mb-3 opacity-75">Book an online or physical consultation with our specialists in minutes.</p>
                <Button as={Link} to="/patient/appointments/book" variant="light" className="rounded-pill px-4 fw-bold text-primary shadow">
                  Book Appointment
                </Button>
              </div>
              <div className="ms-auto d-none d-md-block">
                <FaCalendarPlus size={100} className="opacity-25" />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="glass border-0 shadow-sm mb-4">
            <Card.Header className="bg-transparent border-0 pt-4 px-4">
              <h5 className="fw-bold">My Health Record</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                <div className="d-flex align-items-center p-3 rounded-lg bg-light mb-3 transition shadow-hover cursor-pointer border border-white">
                  <FaCapsules className="text-primary fs-4 me-3" />
                  <div className="flex-grow-1">
                    <p className="mb-0 fw-bold">Prescriptions</p>
                    <small className="text-muted">Digital medication history</small>
                  </div>
                  <FaChevronRight className="text-muted small" />
                </div>
                
                <Link to="/patient/medical-history" className="text-decoration-none text-dark">
                  <div className="d-flex align-items-center p-3 rounded-lg bg-light mb-3 transition shadow-hover cursor-pointer border border-white">
                    <FaHistory className="text-primary fs-4 me-3" />
                    <div className="flex-grow-1">
                      <p className="mb-0 fw-bold">Medical History</p>
                      <small className="text-muted">Past visits and clinic notes</small>
                    </div>
                    <FaChevronRight className="text-muted small" />
                  </div>
                </Link>
              </div>

              <div className="pt-2">
                <h6 className="fw-bold small text-uppercase text-muted mb-3">Health Tools</h6>
                <div className="d-grid gap-2">
                  <Button variant="outline-primary text-start border-0 bg-primary-light" as={Link} to="/patient/medical-history">
                    View Lab Results
                  </Button>
                  <Button variant="outline-primary text-start border-0 bg-primary-light" as={Link} to="/patient/medical-history">
                    Clinic Summary
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PatientDashboard;

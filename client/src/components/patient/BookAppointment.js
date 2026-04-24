import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Spinner, Alert, ListGroup, Badge } from 'react-bootstrap';
import { FaHospital, FaUserMd, FaCalendarDay, FaClock, FaCheckCircle, FaChevronRight } from 'react-icons/fa';
import { clinicService, appointmentService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const BookAppointment = () => {
  const [step, setStep] = useState(1);
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    clinicId: '',
    doctorId: '',
    date: '',
    time: '',
    reason: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 1) {
      const fetchClinics = async () => {
        setLoading(true);
        try {
          const res = await clinicService.getAll();
          setClinics(res.data);
        } catch (err) {
          setError('Failed to load clinics. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      fetchClinics();
    }
  }, [step]);

  const selectClinic = async (id) => {
    setFormData({ ...formData, clinicId: id, doctorId: '' });
    setLoading(true);
    try {
      const res = await clinicService.getDoctors(id);
      setDoctors(res.data);
      setStep(2);
    } catch (err) {
      setError('Failed to load doctors for this clinic.');
    } finally {
      setLoading(false);
    }
  };

  const selectDoctor = (id) => {
    setFormData({ ...formData, doctorId: id });
    setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await appointmentService.create(formData);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Error booking appointment.');
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

  if (loading && step === 1) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="animate-fade-in py-4">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <div className="mb-4 text-center">
            <h2 className="fw-bold mb-1">Book an Appointment</h2>
            <p className="text-muted">Complete the steps below to secure your consultation</p>
          </div>

          <div className="d-flex justify-content-center mb-5">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="d-flex align-items-center">
                <div className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm ${step >= s ? 'bg-primary text-white' : 'bg-white text-muted border'}`} style={{ width: '40px', height: '40px', fontWeight: 'bold' }}>
                  {step > s ? <FaCheckCircle /> : s}
                </div>
                {s < 4 && <div className={`mx-2 shadow-sm ${step > s ? 'bg-primary' : 'bg-light'}`} style={{ height: '3px', width: '40px' }}></div>}
              </div>
            ))}
          </div>

          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

          {step === 1 && (
            <Card className="glass border-0 shadow-sm p-4">
              <h5 className="fw-bold mb-4"><FaHospital className="me-2 text-primary" /> Select a Clinic</h5>
              <Row className="gy-3">
                {clinics.map(c => (
                  <Col md={6} key={c.id}>
                    <div className="p-4 border rounded-lg bg-white shadow-hover transition cursor-pointer h-100" onClick={() => selectClinic(c.id)}>
                      <h6 className="fw-bold mb-2">{c.name}</h6>
                      <p className="text-muted small mb-0">{c.description || 'Specialized healthcare services'}</p>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          )}

          {step === 2 && (
            <Card className="glass border-0 shadow-sm p-4">
              <h5 className="fw-bold mb-4 d-flex justify-content-between">
                <span><FaUserMd className="me-2 text-primary" /> Choose a Specialist</span>
                <Button variant="link" size="sm" onClick={() => setStep(1)} className="p-0">Back</Button>
              </h5>
              <ListGroup variant="flush">
                {doctors.length > 0 ? doctors.map(d => (
                  <ListGroup.Item key={d.id} className="p-3 bg-transparent border-0 d-flex align-items-center justify-content-between border-bottom-1 shadow-hover-light rounded-lg cursor-pointer" onClick={() => selectDoctor(d.id)}>
                    <div className="d-flex align-items-center">
                      <div className="bg-primary-light p-2 rounded-circle me-3 text-primary"><FaUserMd /></div>
                      <div>
                        <p className="mb-0 fw-bold">Dr. {d.first_name} {d.last_name}</p>
                        <small className="text-muted">{d.specialization}</small>
                      </div>
                    </div>
                    <FaChevronRight className="text-muted small" />
                  </ListGroup.Item>
                )) : <div className="text-center py-4 text-muted">No doctors found for this clinic.</div>}
              </ListGroup>
            </Card>
          )}

          {step === 3 && (
            <Card className="glass border-0 shadow-sm p-4">
              <h5 className="fw-bold mb-4 d-flex justify-content-between">
                <span><FaCalendarDay className="me-2 text-primary" /> Details & Schedule</span>
                <Button variant="link" size="sm" onClick={() => setStep(2)} className="p-0">Back</Button>
              </h5>
              <Form onSubmit={handleSubmit}>
                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Preferred Date</Form.Label>
                      <Form.Control type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required className="rounded-lg shadow-sm" min={new Date().toISOString().split('T')[0]} />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Label className="small fw-bold">Time Slot</Form.Label>
                    <div className="d-flex flex-wrap gap-2">
                       {timeSlots.map(t => (
                         <Badge 
                           key={t} 
                           variant={formData.time === t ? 'primary' : 'light'} 
                           className={`p-2 px-3 rounded-pill cursor-pointer shadow-sm ${formData.time === t ? 'bg-primary text-white border-primary' : 'bg-white text-dark border'}`}
                           onClick={() => setFormData({...formData, time: t})}
                         >
                           {t}
                         </Badge>
                       ))}
                    </div>
                  </Col>
                </Row>
                <Form.Group className="mb-4">
                   <Form.Label className="small fw-bold">Reason for Visit</Form.Label>
                   <Form.Control as="textarea" rows={3} value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} placeholder="Describe your symptoms or reason for the consultation..." required className="rounded-lg shadow-sm" />
                </Form.Group>
                <Button type="submit" variant="primary" className="w-100 py-3 rounded-pill fw-bold shadow" disabled={loading || !formData.date || !formData.time}>
                  {loading ? 'Processing...' : 'Confirm Appointment'}
                </Button>
              </Form>
            </Card>
          )}

          {step === 4 && (
            <Card className="glass border-0 shadow-sm p-5 text-center">
              <div className="bg-success-light d-inline-block p-4 rounded-circle mb-4 mx-auto text-success fs-1" style={{backgroundColor: '#e6f4ea'}}>
                <FaCheckCircle />
              </div>
              <h3 className="fw-bold mb-2">Appointment Confirmed!</h3>
              <p className="text-muted mb-4">Your appointment has been successfully scheduled. You can view the details in your dashboard or check your email for a confirmation.</p>
              <div className="d-flex justify-content-center gap-3">
                <Button variant="outline-primary" className="rounded-pill px-4" onClick={() => navigate('/patient')}>Go to Dashboard</Button>
                <Button variant="primary" className="rounded-pill px-4 shadow-sm" onClick={() => { setFormData({clinicId: '', doctorId: '', date: '', time: '', reason: '', notes: ''}); setStep(1); }}>Book Another</Button>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default BookAppointment;

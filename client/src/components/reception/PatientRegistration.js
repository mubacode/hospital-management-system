import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { FaUser, FaEnvelope, FaPhone, FaLock, FaUserPlus, FaAddressCard } from 'react-icons/fa';
import { authService } from '../../services/api';

const PatientRegistration = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: 'password123', // Default password for new registrations
    first_name: '',
    last_name: '',
    phone: '',
    role: 'patient'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await authService.register(formData);
      setSuccess(true);
      setFormData({
        username: '',
        email: '',
        password: 'password123',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'patient'
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register patient.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in py-4">
      <Row className="justify-content-center">
        <Col lg={10}>
          <div className="d-flex align-items-center mb-4">
            <div className="bg-primary-light p-3 rounded-lg me-3 text-primary shadow-sm">
               <FaUserPlus fs-3 />
            </div>
            <div>
              <h2 className="fw-bold mb-1">Patient Enrollment</h2>
              <p className="text-muted mb-0">Quickly intake and register new patients into the CarePlus system</p>
            </div>
          </div>

          <Card className="glass border-0 shadow-sm p-4">
            <Card.Body>
              {error && <Alert variant="danger" className="rounded-lg shadow-sm">{error}</Alert>}
              {success && <Alert variant="success" className="rounded-lg shadow-sm py-3 fw-bold">Patient successfully registered! Default password is 'password123'.</Alert>}

              <Form onSubmit={onSubmit}>
                <h5 className="fw-bold mb-4 text-primary border-bottom pb-2">Personal Information</h5>
                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">First Name</Form.Label>
                      <Form.Control type="text" name="first_name" value={formData.first_name} onChange={onChange} placeholder="e.g., John" required className="rounded-lg shadow-sm border-0 bg-light" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Last Name</Form.Label>
                      <Form.Control type="text" name="last_name" value={formData.last_name} onChange={onChange} placeholder="e.g., Doe" required className="rounded-lg shadow-sm border-0 bg-light" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Phone Number</Form.Label>
                      <InputGroup className="shadow-sm">
                        <InputGroup.Text className="bg-white border-0"><FaPhone className="text-muted small"/></InputGroup.Text>
                        <Form.Control type="tel" name="phone" value={formData.phone} onChange={onChange} placeholder="555-0199" required className="border-0 bg-white" />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Email Address</Form.Label>
                      <InputGroup className="shadow-sm">
                        <InputGroup.Text className="bg-white border-0"><FaEnvelope className="text-muted small"/></InputGroup.Text>
                        <Form.Control type="email" name="email" value={formData.email} onChange={onChange} placeholder="patient@example.com" required className="border-0 bg-white" />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <h5 className="fw-bold mb-4 text-primary border-bottom pb-2">System Credentials</h5>
                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Preferred Username</Form.Label>
                      <InputGroup className="shadow-sm">
                        <InputGroup.Text className="bg-white border-0"><FaUser className="text-muted small"/></InputGroup.Text>
                        <Form.Control type="text" name="username" value={formData.username} onChange={onChange} placeholder="johndoe22" required className="border-0 bg-white" />
                      </InputGroup>
                      <Form.Text className="text-muted small">Must be unique in the system</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">Default Password</Form.Label>
                      <InputGroup className="shadow-sm">
                        <InputGroup.Text className="bg-white border-0"><FaLock className="text-muted small"/></InputGroup.Text>
                        <Form.Control type="text" name="password" value={formData.password} onChange={onChange} disabled className="border-0 bg-light" />
                      </InputGroup>
                      <Form.Text className="text-muted small">Patients can change this after their first login</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-3 mt-4">
                  <Button variant="light" className="rounded-pill px-5" onClick={() => setFormData({ username: '', email: '', password: 'password123', first_name: '', last_name: '', phone: '', role: 'patient' })}>Reset Form</Button>
                  <Button variant="primary" type="submit" className="rounded-pill px-5 shadow fw-bold" disabled={loading}>
                    {loading ? <Spinner size="sm" animation="border" className="me-2" /> : <FaUserPlus className="me-2" />} Enroll Patient
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PatientRegistration;

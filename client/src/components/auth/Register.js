import React, { useState } from 'react';
import { Card, Form, Button, Container, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { FaUserPlus, FaUser, FaEnvelope, FaLock, FaAddressCard, FaPhone } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    role: 'patient'
  });
  
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { email, password, confirmPassword, first_name, last_name, phone, address, role } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Include username (matching email) to satisfy backend validation
      const payload = { 
        ...formData, 
        username: email,
        verificationCode: showVerification ? verificationCode : undefined 
      };
      
      const res = await authService.register(payload);
      
      if (res.data.verification) {
        // If backend indicates verification is needed, show the code field
        setShowVerification(true);
        setLoading(false);
        setError('A 6-digit verification code has been sent to your email. Please enter it below to complete registration.');
      } else {
        // Success
        navigate('/login', { state: { message: 'Registration successful! Please login.' } });
      }
    } catch (err) {
      // Handle the case where backend sends verification: true in error response too
      if (err.response?.data?.verification) {
        setShowVerification(true);
        setError('A verification code has been sent to your email. Please enter it below.');
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
        // If it's a "Wait for code" error, we don't clear loading necessarily if we want them to stay on the page
      }
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8} className="animate-fade-in">
          <Card className="glass border-0 rounded-lg shadow-lg">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-5">
                <div className="bg-primary-light d-inline-block p-3 rounded-circle mb-3">
                  <FaUserPlus className="text-primary fs-2" />
                </div>
                <h2 className="fw-bold mb-1">Create Account</h2>
                <p className="text-muted">Join the CarePlus health network</p>
              </div>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={onSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-medium">First Name</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-white"><FaUser className="text-muted" /></InputGroup.Text>
                        <Form.Control name="first_name" value={first_name} onChange={onChange} required />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-medium">Last Name</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-white"><FaUser className="text-muted" /></InputGroup.Text>
                        <Form.Control name="last_name" value={last_name} onChange={onChange} required />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-medium">Email Address</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-white"><FaEnvelope className="text-muted" /></InputGroup.Text>
                    <Form.Control type="email" name="email" value={email} onChange={onChange} required />
                  </InputGroup>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-medium">Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-white"><FaLock className="text-muted" /></InputGroup.Text>
                        <Form.Control type="password" name="password" value={password} onChange={onChange} required minLength="6" />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-medium">Confirm Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-white"><FaLock className="text-muted" /></InputGroup.Text>
                        <Form.Control type="password" name="confirmPassword" value={confirmPassword} onChange={onChange} required />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-medium">Phone Number</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-white"><FaPhone className="text-muted" /></InputGroup.Text>
                        <Form.Control name="phone" value={phone} onChange={onChange} />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-medium">Residential Address</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-white"><FaAddressCard className="text-muted" /></InputGroup.Text>
                    <Form.Control as="textarea" rows={2} name="address" value={address} onChange={onChange} />
                  </InputGroup>
                </Form.Group>

                {showVerification && (
                  <Alert variant="info" className="mb-4 rounded-lg shadow-sm border-0 animate-pulse">
                    <Form.Group>
                      <Form.Label className="small fw-bold text-uppercase">Enter 6-Digit Email Code</Form.Label>
                      <InputGroup size="lg">
                        <InputGroup.Text className="bg-white"><FaLock className="text-primary" /></InputGroup.Text>
                        <Form.Control 
                          placeholder="000000" 
                          value={verificationCode} 
                          onChange={(e) => setVerificationCode(e.target.value)}
                          className="fw-bold tracking-widest text-center"
                          maxLength="6"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-100 py-3 rounded-pill fw-bold shadow-sm"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : showVerification ? 'Confirm Code & Register' : 'Register Account'}
                </Button>
              </Form>

              <div className="text-center mt-4">
                <p className="small text-muted mb-0">
                  Already have an account? <Link to="/login" className="text-primary fw-bold text-decoration-none">Sign In</Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;

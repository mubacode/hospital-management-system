import React, { useState } from 'react';
import { Card, Form, Button, Container, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/api';
import { FaUser, FaLock, FaSignInAlt, FaCheckCircle } from 'react-icons/fa';

const Login = ({ login }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const { username, password } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const res = await authService.login(formData);
      login(res.data.user, res.data.token);
      // No explicit navigate here; App.js will re-render and DashboardLayout will handle the redirect
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Row className="w-100 justify-content-center">
        <Col md={8} lg={5} className="animate-fade-in">
          <Card className="glass border-0 rounded-lg p-3">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <div className="bg-primary-light d-inline-block p-3 rounded-circle mb-3">
                  <FaSignInAlt className="text-primary fs-2" />
                </div>
                <h2 className="fw-bold mb-1">Welcome Back</h2>
                <p className="text-muted">Access your hospital portal</p>
              </div>

              {successMessage && (
                <Alert variant="success" className="py-2 small d-flex align-items-center gap-2">
                  <FaCheckCircle /> {successMessage}
                </Alert>
              )}

              {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}


              <Form onSubmit={onSubmit}>
                <Form.Group className="mb-3" controlId="username">
                  <Form.Label className="small fw-medium">Username or Email</Form.Label>
                  <InputGroup className="hover-shadow-sm transition">
                    <InputGroup.Text className="bg-white border-end-0">
                      <FaUser className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="username"
                      placeholder="Enter username or email"
                      value={username}
                      onChange={onChange}
                      className="border-start-0"
                      required
                    />
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-4" controlId="password">
                  <Form.Label className="small fw-medium">Password</Form.Label>
                  <InputGroup className="hover-shadow-sm transition">
                    <InputGroup.Text className="bg-white border-end-0">
                      <FaLock className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={onChange}
                      className="border-start-0"
                      required
                    />
                  </InputGroup>
                </Form.Group>

                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-100 py-2 rounded-pill fw-bold shadow-sm mb-3"
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </Button>
              </Form>

              <div className="text-center mt-3">
                <p className="small text-muted mb-0">
                  Don't have an account? <Link to="/register" className="text-primary fw-bold text-decoration-none">Register here</Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;

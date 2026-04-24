import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Container, Row, Col, Alert, Spinner, InputGroup, Badge } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { FaLock, FaUserShield, FaKey, FaUserCheck, FaArrowRight } from 'react-icons/fa';

const SetupAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    username: ''
  });

  const { password, confirmPassword, username } = formData;

  useEffect(() => {
    // If an Admin is testing the link, they are still logged in.
    // Clear the active session so they don't get redirected back to the Admin Dashboard.
    if (localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
      return;
    }

    const verifyToken = async () => {
      if (!token) {
        setError('Invalid or missing invitation token.');
        setLoading(false);
        return;
      }

      try {
        const res = await authService.verifyInvite(token);
        setUser(res.data.user);
        setFormData(prev => ({ ...prev, username: res.data.user.username }));
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'The invitation link has expired or is invalid.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setVerifying(true);
    try {
      await authService.setupInvitedAccount({
        token,
        password,
        username
      });
      navigate('/login', { state: { message: 'Account activated successfully! You can now sign in with your new credentials.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Activation failed. Please try again.');
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <Container className="v-center text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Securing your session...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10} lg={6} className="animate-fade-in">
          <Card className="glass border-0 rounded-lg shadow-xl overflow-hidden">
             <div className="bg-primary p-4 text-center text-white">
                <div className="bg-white p-3 rounded-circle d-inline-block text-primary mb-3">
                   <FaUserShield size={32} />
                </div>
                <h3 className="fw-bold mb-1">Account Activation</h3>
                <p className="mb-0 text-white-50 small">Finalize your professional portal access</p>
             </div>
            <Card.Body className="p-4 p-md-5">
              {error ? (
                <div className="text-center py-4">
                  <Alert variant="danger" className="border-0 shadow-sm rounded-lg mb-4">{error}</Alert>
                  <Button variant="outline-primary" onClick={() => navigate('/login')} className="rounded-pill px-4">
                    Return to Portal
                  </Button>
                </div>
              ) : (
                <>
                  <div className="user-context p-3 bg-light rounded-lg mb-5 border">
                    <div className="small text-muted text-uppercase fw-bold mb-1">Onboarding As</div>
                    <div className="d-flex align-items-center">
                      <div className="avatar bg-primary text-white rounded-circle me-3 d-flex align-items-center justify-content-center fw-bold" style={{width: '40px', height: '40px'}}>
                        {user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-bold">{user.email}</div>
                        <Badge bg="primary-light" className="text-primary text-capitalize">{user.role}</Badge>
                      </div>
                    </div>
                  </div>

                  <Form onSubmit={onSubmit}>
                    <Form.Group className="mb-4">
                      <Form.Label className="small fw-bold">Set Your System Username</Form.Label>
                      <InputGroup className="shadow-xs rounded-lg overflow-hidden border-0">
                         <InputGroup.Text className="bg-white border-0"><FaKey className="text-muted" size={12} /></InputGroup.Text>
                         <Form.Control 
                            name="username" 
                            value={username} 
                            onChange={onChange} 
                            required 
                            className="bg-white border-0 py-3"
                          />
                      </InputGroup>
                      <Form.Text className="text-muted small px-1">You will use this or your email to sign in.</Form.Text>
                    </Form.Group>

                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-4">
                          <Form.Label className="small fw-bold">Choose a Secure Password</Form.Label>
                          <InputGroup className="shadow-xs rounded-lg overflow-hidden border-0">
                             <InputGroup.Text className="bg-white border-0"><FaLock className="text-muted" size={12} /></InputGroup.Text>
                             <Form.Control 
                                type="password" 
                                name="password" 
                                value={password} 
                                onChange={onChange} 
                                required 
                                minLength="8"
                                placeholder="Min. 8 characters"
                                className="bg-white border-0 py-3"
                              />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                      <Col md={12}>
                        <Form.Group className="mb-5">
                          <Form.Label className="small fw-bold">Confirm Your Password</Form.Label>
                          <InputGroup className="shadow-xs rounded-lg overflow-hidden border-0">
                             <InputGroup.Text className="bg-white border-0"><FaLock className="text-muted" size={12} /></InputGroup.Text>
                             <Form.Control 
                                type="password" 
                                name="confirmPassword" 
                                value={confirmPassword} 
                                onChange={onChange} 
                                required 
                                className="bg-white border-0 py-3"
                              />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Button 
                      type="submit" 
                      variant="primary" 
                      className="w-100 py-3 rounded-pill fw-bold shadow-lg d-flex align-items-center justify-content-center gap-2"
                      disabled={verifying}
                    >
                      {verifying ? (
                        <Spinner size="sm" animation="border" />
                      ) : (
                        <><FaUserCheck /> Complete Profile Setup <FaArrowRight /></>
                      )}
                    </Button>
                  </Form>
                </>
              )}
            </Card.Body>
          </Card>
          <p className="text-center mt-4 text-muted small">
            Secured by CarePlus Advanced Identity Management &copy; 2026
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default SetupAccount;

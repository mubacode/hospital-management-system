import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { FaLock, FaShieldAlt, FaKey } from 'react-icons/fa';
import { authService } from '../../services/api';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const { currentPassword, newPassword, confirmNewPassword } = formData;

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      return setStatus({ type: 'danger', message: 'New passwords do not match.' });
    }
    if (newPassword.length < 6) {
      return setStatus({ type: 'danger', message: 'New password must be at least 6 characters long.' });
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await authService.changePassword({ currentPassword, newPassword });
      setStatus({ type: 'success', message: 'Security credentials updated successfully.' });
      setFormData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setStatus({ 
        type: 'danger', 
        message: err.response?.data?.message || 'Failed to update security credentials.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Security Settings</h2>
        <p className="text-muted mb-0">Manage your portal access and authentication credentials</p>
      </div>

      <Row>
        <Col lg={6}>
          <Card className="glass border-0 shadow-sm p-4 h-100">
            <div className="d-flex align-items-center mb-4">
               <div className="bg-primary-light p-3 rounded-circle me-3 text-primary fs-4">
                  <FaShieldAlt />
               </div>
               <h5 className="fw-bold mb-0">Update Password</h5>
            </div>

            {status.message && (
              <Alert variant={status.type} className="rounded-lg shadow-sm border-0 mb-4 animate-fade-in">
                {status.message}
              </Alert>
            )}

            <Form onSubmit={onSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase">Current Password</Form.Label>
                <InputGroup>
                   <InputGroup.Text className="bg-light border-0"><FaKey className="text-muted small" /></InputGroup.Text>
                   <Form.Control 
                    type="password" 
                    name="currentPassword" 
                    value={currentPassword} 
                    onChange={onChange}
                    required 
                    className="rounded-lg shadow-sm border-0 bg-light py-2" 
                  />
                </InputGroup>
              </Form.Group>

              <hr className="my-4 opacity-10" />

              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-muted text-uppercase">New Password</Form.Label>
                <InputGroup>
                   <InputGroup.Text className="bg-light border-0"><FaLock className="text-muted small" /></InputGroup.Text>
                   <Form.Control 
                    type="password" 
                    name="newPassword" 
                    value={newPassword} 
                    onChange={onChange}
                    required 
                    minLength="6"
                    className="rounded-lg shadow-sm border-0 bg-light py-2" 
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-muted text-uppercase">Confirm New Password</Form.Label>
                <InputGroup>
                   <InputGroup.Text className="bg-light border-0"><FaLock className="text-muted small" /></InputGroup.Text>
                   <Form.Control 
                    type="password" 
                    name="confirmNewPassword" 
                    value={confirmNewPassword} 
                    onChange={onChange}
                    required 
                    className="rounded-lg shadow-sm border-0 bg-light py-2" 
                  />
                </InputGroup>
              </Form.Group>

              <Button 
                type="submit" 
                variant="primary" 
                className="w-100 py-3 rounded-pill fw-bold shadow-lg transition transform-hover" 
                disabled={loading}
              >
                {loading ? <Spinner size="sm" animation="border" /> : 'Update Access Credentials'}
              </Button>
            </Form>
          </Card>
        </Col>

        <Col lg={6}>
           <Card className="glass border-0 shadow-sm p-4 h-100 bg-primary text-white overflow-hidden position-relative">
              <div className="position-relative z-index-1">
                 <h5 className="fw-bold mb-3">Security Guidelines</h5>
                 <ul className="small opacity-75 pe-4 lh-lg">
                    <li>Use at least 8 characters with a mix of letters and numbers.</li>
                    <li>Avoid using personal information like your birthdate or phone number.</li>
                    <li>Change your password every 90 days for maximum safety.</li>
                    <li>Never share your credentials with anyone, including hospital staff.</li>
                 </ul>
                 <div className="mt-4 pt-4 border-top border-white border-opacity-25">
                   <p className="small mb-0">If you notice unauthorized access to your account, please contact the IT department immediately.</p>
                 </div>
              </div>
              <FaShieldAlt className="position-absolute opacity-10" style={{bottom: '-20px', right: '-20px', fontSize: '180px'}} />
           </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ChangePassword;

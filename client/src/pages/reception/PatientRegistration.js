import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { FaUserPlus, FaUser, FaEnvelope, FaPhone, FaAddressCard } from 'react-icons/fa';
import { authService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import notify from '../../utils/notify';

const PatientEnrollment = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'patient',
    address: ''
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
      await authService.inviteUser(formData);
      setSuccess(true);
      notify.success(t('reception.patientEnrollment.successMessage'));
      
      // Reset form
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'patient',
        address: ''
      });
      window.scrollTo(0, 0);
    } catch (err) {
      const msg = err.response?.data?.message || t('reception.patientEnrollment.errorMessage');
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'patient',
      address: ''
    });
  };

  return (
    <div className="animate-fade-in py-2">
      <Row className="justify-content-center">
        <Col lg={10} xl={9}>
          <div className="d-flex align-items-center mb-5">
            <div className="bg-primary-light p-3 rounded-xl me-4 text-primary shadow-sm border border-white">
              <FaUserPlus className="fs-3" />
            </div>
            <div>
              <h2 className="fw-bold mb-1 text-dark">{t('reception.patientEnrollment.title')}</h2>
              <p className="text-muted mb-0">{t('reception.patientEnrollment.subtitle')}</p>
            </div>
          </div>

          <Card className="glass border-0 shadow-lg p-xxl-5 p-4 rounded-xl">
            <Card.Body>
              {error && <Alert variant="danger" className="rounded-lg shadow-sm border-0 py-3">{error}</Alert>}
              {success && <Alert variant="success" className="rounded-lg shadow-sm border-0 py-3 fw-bold animate-fade-in">{t('reception.patientEnrollment.successMessage')}</Alert>}

              <Form onSubmit={onSubmit}>
                <h6 className="fw-bold mb-4 text-primary text-uppercase small letter-spacing-1 d-flex align-items-center">
                  <span className="bg-primary-light text-primary rounded-circle me-2 d-inline-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '10px' }}>1</span>
                  {t('reception.patientEnrollment.identityProfile')}
                </h6>
                <Row className="mb-5">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">{t('common.name')} (First)</Form.Label>
                      <Form.Control type="text" name="first_name" value={formData.first_name} onChange={onChange} placeholder="e.g., Jonathan" required className="rounded-lg shadow-sm border-0 bg-light py-2 px-3" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">{t('common.name')} (Last)</Form.Label>
                      <Form.Control type="text" name="last_name" value={formData.last_name} onChange={onChange} placeholder="e.g., Wick" required className="rounded-lg shadow-sm border-0 bg-light py-2 px-3" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">{t('common.phone')}</Form.Label>
                      <InputGroup className="shadow-sm">
                        <InputGroup.Text className="bg-white border-0"><FaPhone className="text-muted small" /></InputGroup.Text>
                        <Form.Control type="tel" name="phone" value={formData.phone} onChange={onChange} placeholder="+1 555-0012" required className="border-0 bg-white py-2" />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="d-flex align-items-end">
                    <Form.Group className="mb-3 flex-grow-1">
                      <Form.Label className="small fw-bold text-muted">{t('common.email')}</Form.Label>
                      <InputGroup className="shadow-sm">
                        <InputGroup.Text className="bg-white border-0"><FaEnvelope className="text-muted small" /></InputGroup.Text>
                        <Form.Control type="email" name="email" value={formData.email} onChange={onChange} placeholder="patient.care@example.com" required className="border-0 bg-white py-2" />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <h6 className="fw-bold mb-4 text-primary text-uppercase small letter-spacing-1 d-flex align-items-center">
                  <span className="bg-primary-light text-primary rounded-circle me-2 d-inline-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px', fontSize: '10px' }}>2</span>
                  {t('reception.patientEnrollment.accessCredentials')}
                </h6>
                <Row className="mb-5">
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted">{t('reception.patientEnrollment.usernameLabel')}</Form.Label>
                      <InputGroup className="shadow-sm">
                        <InputGroup.Text className="bg-white border-0"><FaUser className="text-muted small" /></InputGroup.Text>
                        <Form.Control type="text" name="username" value={formData.username} onChange={onChange} placeholder="jwick_continental" required className="border-0 bg-white py-2" />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={12}>
                    <Form.Group className="mt-2">
                      <Form.Label className="small fw-bold text-muted uppercase">{t('reception.patientIntake.address')}</Form.Label>
                      <InputGroup className="shadow-sm">
                        <InputGroup.Text className="bg-white border-0"><FaAddressCard className="text-muted small" /></InputGroup.Text>
                        <Form.Control as="textarea" rows={2} name="address" value={formData.address} onChange={onChange} placeholder="Full street address and zip..." className="border-0 bg-white py-2" />
                      </InputGroup>
                      <Form.Text className="text-muted small mt-2 d-block">
                        <i className="bi bi-info-circle me-1"></i> Patient will receive an email to set their own password securely.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-3 mt-4 pt-4 border-top">
                  <Button variant="light" className="rounded-pill px-5 border fw-bold text-muted" onClick={clearForm}>{t('reception.patientEnrollment.clearIntake')}</Button>
                  <Button variant="primary" type="submit" className="rounded-pill px-5 shadow-lg fw-bold transition transform-hover" disabled={loading}>
                    {loading ? <Spinner size="sm" animation="border" className="me-2" /> : <FaUserPlus className="me-2" />} {t('reception.patientEnrollment.enroll')}
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

export default PatientEnrollment;

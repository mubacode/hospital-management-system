import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Button, Row, Col, Spinner, Alert, ListGroup, Badge } from 'react-bootstrap';
import { FaHospital, FaUserMd, FaCalendarDay, FaCheckCircle, FaChevronLeft, FaChevronRight, FaExclamationTriangle, FaLightbulb } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clinicService, appointmentService } from '../../services/api';
import notify from '../../utils/notify';

const BookAppointment = () => {
  const [step, setStep] = useState(1);
  const [clinics, setClinics] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({ clinicId: '', doctorId: '', date: '', time: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);

  // Availability state
  const [availabilityStatus, setAvailabilityStatus] = useState(null); // null | 'checking' | { isAvailable, suggestions, bookedSlots }

  const { t } = useTranslation();
  const navigate = useNavigate();

  // Generate all 30-min slots 09:00–17:00
  const ALL_SLOTS = [];
  for (let h = 9; h < 17; h++) {
    ALL_SLOTS.push(`${String(h).padStart(2,'0')}:00`);
    ALL_SLOTS.push(`${String(h).padStart(2,'0')}:30`);
  }

  useEffect(() => {
    const fetchClinics = async () => {
      setLoading(true);
      try {
        const res = await clinicService.getAll();
        setClinics(res.data);
      } catch {
        setError(t('patient.book.errorMessage'));
      } finally {
        setLoading(false);
      }
    };
    fetchClinics();
  }, []);

  // ── Real-time availability check whenever doctor + date + time all chosen ─
  const checkAvailability = useCallback(async (doctorId, date, time) => {
    if (!doctorId || !date || !time) { setAvailabilityStatus(null); return; }
    setAvailabilityStatus('checking');
    try {
      const res = await appointmentService.checkAvailability(doctorId, date, `${time}:00`);
      setAvailabilityStatus(res.data);
    } catch {
      setAvailabilityStatus(null); // silently fail — let backend validate on submit
    }
  }, []);

  const selectClinic = async (clinic) => {
    setFormData(f => ({ ...f, clinicId: clinic.id, clinicName: clinic.name, doctorId: '', doctorName: '' }));
    setAvailabilityStatus(null);
    setLoading(true);
    try {
      const res = await clinicService.getDoctors(clinic.id);
      setDoctors(res.data);
      setStep(2);
    } catch {
      setError('Unable to fetch specialists for this clinic.');
    } finally {
      setLoading(false);
    }
  };

  const selectDoctor = (doctor) => {
    const updated = {
      ...formData,
      doctorId: doctor.id,
      doctorName: `Dr. ${doctor.first_name} ${doctor.last_name}`,
      specialization: doctor.specialization,
    };
    setFormData(updated);
    setAvailabilityStatus(null);
    setStep(3);
    // Re-check if date+time already selected
    if (updated.date && updated.time) {
      checkAvailability(doctor.id, updated.date, updated.time);
    }
  };

  const handleDateChange = (date) => {
    const updated = { ...formData, date, time: '' };
    setFormData(updated);
    setAvailabilityStatus(null);
  };

  const handleTimeSelect = (time) => {
    const updated = { ...formData, time };
    setFormData(updated);
    checkAvailability(updated.doctorId, updated.date, time);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation guards
    if (!formData.date || !formData.time) {
      setError(t('validation.required'));
      return;
    }

    // Block on confirmed conflict
    if (availabilityStatus && availabilityStatus.isAvailable === false) {
      setError('This time slot is already taken. Please choose a suggested time.');
      return;
    }

    setSubmitLoading(true);
    setError(null);
    try {
      await appointmentService.create({
        clinicId: formData.clinicId,
        doctorId: formData.doctorId,
        date:     formData.date,
        time:     `${formData.time}:00`,
        reason:   formData.reason,
      });
      notify.success(t('patient.book.successMessage'));
      setStep(4);
    } catch (err) {
      const msg = err.response?.data?.message || t('patient.book.errorMessage');
      setError(msg);
      notify.error(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading && step === 1) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="animate-fade-in py-2">
      <Row className="justify-content-center">
        <Col lg={10} xl={9}>
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-2">{t('patient.book.title')}</h2>
            <p className="text-muted">{t('patient.book.subtitle')}</p>
          </div>

          {/* Progress Stepper */}
          <div className="d-flex justify-content-center mb-5 align-items-center">
            {[1, 2, 3, 4].map(s => (
              <React.Fragment key={s}>
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm ${step >= s ? 'bg-primary text-white' : 'bg-white text-muted border'}`}
                  style={{ width: '45px', height: '45px', fontWeight: 'bold', fontSize: '1.1rem' }}
                >
                  {step > s ? <FaCheckCircle /> : s}
                </div>
                {s < 4 && <div className={`mx-3 ${step > s ? 'bg-primary' : 'bg-light'}`} style={{ height: '3px', width: '50px' }} />}
              </React.Fragment>
            ))}
          </div>

          {error && (
            <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-4 rounded-3 border-0 shadow-sm">
              <FaExclamationTriangle className="me-2" />{error}
            </Alert>
          )}

          {/* ── Step 1: Select Clinic ── */}
          {step === 1 && (
            <Card className="glass border-0 shadow-sm p-4 animate-fade-in">
              <h5 className="fw-bold mb-4 d-flex align-items-center">
                <FaHospital className="me-2 text-primary" /> {t('patient.book.step1')}
              </h5>
              <Row className="gy-4">
                {clinics.map(c => (
                  <Col md={6} key={c.id}>
                    <div
                      className="p-4 border rounded-3 bg-white shadow-hover transition cursor-pointer h-100 d-flex flex-column"
                      onClick={() => selectClinic(c)}
                      style={{ cursor: 'pointer' }}
                    >
                      <h6 className="fw-bold mb-2 text-primary">{c.name}</h6>
                      <p className="text-muted small mb-0 flex-grow-1">{c.description || 'Expert healthcare services.'}</p>
                      <div className="mt-3 text-end text-primary small fw-bold">
                        {t('patient.book.selectUnit')} <FaChevronRight />
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          )}

          {/* ── Step 2: Select Doctor ── */}
          {step === 2 && (
            <Card className="glass border-0 shadow-sm p-4 animate-fade-in">
              <h5 className="fw-bold mb-4 d-flex justify-content-between align-items-center">
                <span className="d-flex align-items-center"><FaUserMd className="me-2 text-primary" /> {t('patient.book.step2')}</span>
                <Button variant="link" size="sm" onClick={() => setStep(1)} className="p-0 text-decoration-none text-muted fw-bold">
                  <FaChevronLeft /> {t('common.back')}
                </Button>
              </h5>
              <ListGroup variant="flush">
                {doctors.length > 0 ? doctors.map(d => (
                  <ListGroup.Item
                    key={d.id}
                    className="p-3 bg-transparent border-0 d-flex align-items-center justify-content-between mb-2 rounded-3 border"
                    onClick={() => selectDoctor(d)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center">
                      <div className="bg-primary-light p-3 rounded-circle me-3 text-primary"><FaUserMd /></div>
                      <div>
                        <p className="mb-0 fw-bold">Dr. {d.first_name} {d.last_name}</p>
                        <small className="text-muted">{d.specialization}</small>
                      </div>
                    </div>
                    <Badge bg="light" text="primary" className="rounded-pill px-3 py-2 fw-normal border">
                      {t('patient.book.selectDoctor')}
                    </Badge>
                  </ListGroup.Item>
                )) : (
                  <div className="text-center py-5 text-muted">{t('doctor.patients.noPatients')}</div>
                )}
              </ListGroup>
            </Card>
          )}

          {/* ── Step 3: Date, Time & Reason ── */}
          {step === 3 && (
            <Card className="glass border-0 shadow-sm p-4 animate-fade-in">
              <h5 className="fw-bold mb-4 d-flex justify-content-between align-items-center">
                <span className="d-flex align-items-center"><FaCalendarDay className="me-2 text-primary" /> {t('patient.book.step3')}</span>
                <Button variant="link" size="sm" onClick={() => setStep(2)} className="p-0 text-decoration-none text-muted fw-bold">
                  <FaChevronLeft /> {t('common.back')}
                </Button>
              </h5>

              {/* Selection summary */}
              <div className="bg-light p-3 rounded-3 mb-4 border d-flex gap-4">
                <div>
                  <p className="small text-muted fw-bold text-uppercase mb-0" style={{ fontSize: '0.7rem' }}>CLINIC</p>
                  <p className="mb-0 fw-bold">{formData.clinicName}</p>
                </div>
                <div className="border-start ps-4">
                  <p className="small text-muted fw-bold text-uppercase mb-0" style={{ fontSize: '0.7rem' }}>DOCTOR</p>
                  <p className="mb-0 fw-bold">{formData.doctorName}</p>
                </div>
              </div>

              <Form onSubmit={handleSubmit}>
                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted text-uppercase">{t('patient.book.chooseDate')}</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleDateChange(e.target.value)}
                        required
                        className="rounded-3 shadow-sm border-light bg-light py-2"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Label className="small fw-bold text-muted text-uppercase">{t('patient.book.chooseTime')}</Form.Label>
                    {formData.date ? (
                      <>
                        <div className="d-flex flex-wrap gap-2">
                          {ALL_SLOTS.map(slot => {
                            const booked = availabilityStatus?.bookedSlots?.includes(slot);
                            const selected = formData.time === slot;
                            return (
                              <Badge
                                key={slot}
                                className={`p-2 px-3 rounded-pill transition ${
                                  booked ? 'bg-danger-subtle text-danger opacity-50' :
                                  selected ? 'bg-primary text-white' : 'bg-white text-dark border'
                                }`}
                                style={{ cursor: booked ? 'not-allowed' : 'pointer', fontWeight: 'normal' }}
                                onClick={() => !booked && handleTimeSelect(slot)}
                              >
                                {slot}
                                {booked && ' ✕'}
                              </Badge>
                            );
                          })}
                        </div>

                        {/* Availability Feedback */}
                        {availabilityStatus === 'checking' && (
                          <div className="mt-2 text-muted small"><Spinner size="sm" /> Checking availability...</div>
                        )}
                        {availabilityStatus && availabilityStatus !== 'checking' && !availabilityStatus.isAvailable && formData.time && (
                          <Alert variant="warning" className="mt-3 rounded-3 border-0 py-2 small">
                            <FaExclamationTriangle className="me-2" />
                            This slot is taken.
                            {availabilityStatus.suggestions?.length > 0 && (
                              <>
                                <br />
                                <FaLightbulb className="me-1 text-warning" />
                                Available: {availabilityStatus.suggestions.map(s => (
                                  <Badge key={s} className="bg-success ms-1 rounded-pill" style={{ cursor:'pointer' }} onClick={() => handleTimeSelect(s)}>{s}</Badge>
                                ))}
                              </>
                            )}
                          </Alert>
                        )}
                        {availabilityStatus?.isAvailable && formData.time && (
                          <Alert variant="success" className="mt-3 rounded-3 border-0 py-2 small">
                            <FaCheckCircle className="me-2" /> Slot available!
                          </Alert>
                        )}
                      </>
                    ) : (
                      <p className="text-muted small">Select a date first to see available slots.</p>
                    )}
                  </Col>
                </Row>

                <Form.Group className="mb-5">
                  <Form.Label className="small fw-bold text-muted text-uppercase">{t('patient.book.reason')}</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder={t('patient.book.reasonPlaceholder')}
                    required
                    className="rounded-3 shadow-sm border-light bg-light py-3"
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100 py-3 rounded-pill fw-bold shadow-sm"
                  disabled={submitLoading || !formData.date || !formData.time || (availabilityStatus?.isAvailable === false)}
                >
                  {submitLoading
                    ? <><Spinner size="sm" className="me-2" />{t('common.loading')}</>
                    : t('patient.book.confirmBooking')}
                </Button>
              </Form>
            </Card>
          )}

          {/* ── Step 4: Success ── */}
          {step === 4 && (
            <Card className="glass border-0 shadow-sm p-5 text-center animate-fade-in">
              <div className="d-inline-block p-4 rounded-circle mb-4 mx-auto text-success fs-1" style={{ background: '#e6f4ea' }}>
                <FaCheckCircle />
              </div>
              <h3 className="fw-bold mb-2">{t('patient.book.title')}</h3>
              <p className="text-muted mb-5 px-md-5">{t('patient.book.successMessage')}</p>
              <div className="d-flex justify-content-center gap-3">
                <Button variant="outline-primary" className="rounded-pill px-5 fw-bold" onClick={() => navigate('/patient')}>
                  {t('nav.dashboard')}
                </Button>
                <Button variant="primary" className="rounded-pill px-5 shadow-sm fw-bold" onClick={() => { setFormData({ clinicId:'', doctorId:'', date:'', time:'', reason:'' }); setStep(1); setAvailabilityStatus(null); }}>
                  New Booking
                </Button>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default BookAppointment;

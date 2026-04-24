import React, { useState, useEffect } from 'react';
import { Button, Badge, Modal, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { FaSync, FaPrescription, FaCheckCircle, FaNotesMedical, FaFilter } from 'react-icons/fa';
import DataTable from '../../components/common/DataTable';
import { doctorService, appointmentService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import notify from '../../utils/notify';

// Valid status transitions (state machine logic)
const STATUS_TRANSITIONS = {
  pending:            ['scheduled', 'cancelled'],
  pending_assignment: ['scheduled', 'cancelled'],
  scheduled:          ['in-progress', 'cancelled', 'no-show'],
  confirmed:          ['in-progress', 'cancelled', 'no-show'],
  'in-progress':      ['completed', 'scheduled'],
  completed:          [],       // Terminal — cannot change
  cancelled:          [],       // Terminal — cannot change
  'no-show':          ['scheduled'], // Can reschedule
};

const STATUS_CONFIG = {
  completed:          { variant: 'success',   label: 'Completed' },
  scheduled:          { variant: 'primary',   label: 'Scheduled' },
  confirmed:          { variant: 'primary',   label: 'Confirmed' },
  pending:            { variant: 'warning',   label: 'Pending' },
  pending_assignment: { variant: 'warning',   label: 'Awaiting Dr.' },
  cancelled:          { variant: 'danger',    label: 'Cancelled' },
  'in-progress':      { variant: 'info',      label: 'In Progress' },
  'no-show':          { variant: 'secondary', label: 'No-Show' },
};

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [selectedApt, setSelectedApt]   = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [formData, setFormData]         = useState({ status: '', notes: '', prescription: '' });
  const { t } = useTranslation();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await doctorService.getAppointments();
      setAppointments(res.data);
      setError(null);
    } catch {
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Apply status filter whenever source data or filter changes
  useEffect(() => {
    if (statusFilter === 'all') {
      setFiltered(appointments);
    } else {
      setFiltered(appointments.filter(a => a.status === statusFilter));
    }
  }, [appointments, statusFilter]);

  const openModal = (apt) => {
    setSelectedApt(apt);
    setFormData({ status: apt.status, notes: apt.notes || '', prescription: apt.prescription || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate transition
    const allowed = STATUS_TRANSITIONS[selectedApt.status] || [];
    if (formData.status !== selectedApt.status && !allowed.includes(formData.status)) {
      notify.error(`Cannot transition from "${selectedApt.status}" to "${formData.status}".`);
      return;
    }

    // Require notes when completing
    if (formData.status === 'completed' && !formData.notes.trim()) {
      notify.warning('Please add clinical observations before marking as completed.');
      return;
    }

    setSubmitting(true);
    try {
      await appointmentService.update(selectedApt.id, {
        status:       formData.status,
        notes:        formData.notes,
        prescription: formData.prescription,
      });
      notify.success(`Appointment marked as "${formData.status}" successfully.`);
      setShowModal(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update appointment.';
      notify.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || { variant: 'secondary', label: status };
    return <Badge bg={cfg.variant} className="rounded-pill px-3 py-2 text-capitalize">{cfg.label}</Badge>;
  };

  const columns = [
    {
      header: 'Patient',
      render: (row) => (
        <div>
          <div className="fw-bold">{row.patient_first_name} {row.patient_last_name}</div>
          <small className="text-muted">#{row.patient_id}</small>
        </div>
      )
    },
    {
      header: 'Date & Time',
      render: (row) => (
        <div>
          <div className="fw-bold text-primary">
            {new Date(row.appointment_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div className="small text-muted">{row.appointment_time?.slice(0, 5)}</div>
        </div>
      )
    },
    {
      header: 'Reason',
      render: (row) => <span className="small">{row.reason || '—'}</span>
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      render: (row) => {
        const isTerminal = STATUS_TRANSITIONS[row.status]?.length === 0;
        return (
          <Button
            variant={isTerminal ? 'outline-secondary' : 'outline-primary'}
            size="sm"
            className="rounded-pill px-3"
            onClick={() => !isTerminal && openModal(row)}
            disabled={isTerminal}
            title={isTerminal ? `Status "${row.status}" is final` : 'Update appointment'}
          >
            <FaCheckCircle className="me-1" />
            {isTerminal ? 'Finalized' : 'Update'}
          </Button>
        );
      }
    },
  ];

  // Status counts for quick summary
  const counts = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">{t('doctor.appointments.title')}</h2>
          <p className="text-muted mb-0">Manage patient consultations and update medical outcomes</p>
        </div>
        <Button variant="light" className="rounded-pill border shadow-sm px-4" onClick={fetchData} disabled={loading}>
          <FaSync className={`me-2 ${loading ? 'fa-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Quick stats row */}
      <Row className="mb-4 g-3">
        {[
          { label: 'Today', count: appointments.filter(a => new Date(a.appointment_date).toDateString() === new Date().toDateString()).length, color: 'primary' },
          { label: 'Upcoming',   count: (counts.pending || 0) + (counts.pending_assignment || 0) + (counts.scheduled || 0) + (counts.confirmed || 0), color: 'warning' },
          { label: 'Completed', count: counts.completed || 0,  color: 'success' },
          { label: 'Cancelled', count: counts.cancelled || 0,  color: 'danger' },
        ].map(s => (
          <Col key={s.label} xs={6} md={3}>
            <div className={`glass border-0 shadow-sm p-3 rounded-3 text-center border-top border-${s.color} border-3`}>
              <div className={`fs-3 fw-bold text-${s.color}`}>{s.count}</div>
              <div className="small text-muted fw-bold">{s.label}</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Status filter tabs */}
      <div className="d-flex gap-2 flex-wrap mb-3">
        <FaFilter className="text-muted my-auto me-1" />
        {['all', 'pending', 'confirmed', 'scheduled', 'in-progress', 'completed', 'cancelled'].map(s => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'primary' : 'outline-secondary'}
            className="rounded-pill px-3 text-capitalize"
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'All' : (STATUS_CONFIG[s]?.label || s)}
            {s !== 'all' && counts[s] > 0 && (
              <Badge bg="light" text="dark" className="ms-1 rounded-pill">{counts[s]}</Badge>
            )}
          </Button>
        ))}
      </div>

      {error && <Alert variant="danger" className="rounded-3 border-0">{error}</Alert>}

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        onRefresh={fetchData}
        searchPlaceholder="Search by patient name..."
        searchKey="patient_last_name"
      />

      {/* ── Update Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            Update: {selectedApt?.patient_first_name} {selectedApt?.patient_last_name}
            <div className="small text-muted fw-normal mt-1">
              {selectedApt && new Date(selectedApt.appointment_date).toLocaleDateString()} · {selectedApt?.appointment_time?.slice(0, 5)}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="pt-3">

            {/* Status selection — only shows VALID transitions */}
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted text-uppercase">Session Status</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {/* Current status always shown */}
                {[selectedApt?.status, ...(STATUS_TRANSITIONS[selectedApt?.status] || [])].filter(Boolean).map(s => {
                  const cfg = STATUS_CONFIG[s] || { variant: 'secondary', label: s };
                  const isSelected = formData.status === s;
                  return (
                    <label key={s} className={`btn rounded-pill px-3 btn-${isSelected ? cfg.variant : 'outline-secondary'} ${s === selectedApt?.status ? 'opacity-75' : ''}`}>
                      <input
                        type="radio"
                        name="status"
                        value={s}
                        className="d-none"
                        checked={isSelected}
                        onChange={() => setFormData(f => ({ ...f, status: s }))}
                      />
                      {cfg.label}
                      {s === selectedApt?.status && <span className="ms-1 small opacity-75">(current)</span>}
                    </label>
                  );
                })}
              </div>
              {formData.status === 'completed' && (
                <small className="text-warning d-block mt-2">⚠ Marking as completed is irreversible. Please add clinical notes.</small>
              )}
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted text-uppercase d-flex align-items-center">
                <FaNotesMedical className="me-2" /> Clinical Observations
                {formData.status === 'completed' && <span className="text-danger ms-1">*</span>}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.notes}
                onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                placeholder="Vitals, symptoms, diagnosis summary..."
                className="rounded-3 border-0 bg-light"
                required={formData.status === 'completed'}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="small fw-bold text-muted text-uppercase d-flex align-items-center">
                <FaPrescription className="me-2" /> Medication &amp; Rx
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.prescription}
                onChange={e => setFormData(f => ({ ...f, prescription: e.target.value }))}
                placeholder="Drug name · dosage · frequency · duration..."
                className="rounded-3 border-0 bg-light"
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer className="border-0">
            <Button variant="light" onClick={() => setShowModal(false)} className="rounded-pill px-4">
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit" className="rounded-pill px-5 shadow fw-bold" disabled={submitting}>
              {submitting ? <Spinner size="sm" animation="border" className="me-1" /> : null}
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default DoctorAppointments;

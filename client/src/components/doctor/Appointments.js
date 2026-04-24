import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Alert, Modal, Form, Dropdown } from 'react-bootstrap';
import { FaCalendarAlt, FaCheck, FaTimes, FaExternalLinkAlt, FaSync } from 'react-icons/fa';
import { appointmentService } from '../../services/api';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getMyAppointments();
      setAppointments(res.data);
      setError(null);
    } catch (err) {
      setError('Could not load appointments. Please check your connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusChange = (apt) => {
    setSelectedApt(apt);
    setNewStatus(apt.status);
    setNotes(apt.notes || '');
    setShowStatusModal(true);
  };

  const updateStatus = async () => {
    try {
      await appointmentService.updateStatus(selectedApt.id, { 
        status: newStatus,
        notes: notes
      });
      // Refresh list
      fetchAppointments();
      setShowStatusModal(false);
    } catch (err) {
      alert('Error updating status: ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'completed': 'success',
      'scheduled': 'primary',
      'pending': 'warning',
      'cancelled': 'danger',
      'in-progress': 'info'
    };
    return <Badge bg={variants[status] || 'secondary'} className="rounded-pill px-3 py-2 text-capitalize">{status}</Badge>;
  };

  if (loading && appointments.length === 0) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">My Schedule</h2>
          <p className="text-muted mb-0">Manage your patient appointments and consultations</p>
        </div>
        <Button variant="light" className="rounded-pill border shadow-sm px-3" onClick={fetchAppointments}>
          <FaSync className={loading ? 'fa-spin' : ''} /> Refresh
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="glass border-0 shadow-sm overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead className="bg-light">
            <tr>
              <th className="ps-4 py-3 border-0">Patient</th>
              <th className="py-3 border-0">Date & Time</th>
              <th className="py-3 border-0">Reason</th>
              <th className="py-3 border-0">Status</th>
              <th className="pe-4 py-3 border-0 text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length > 0 ? appointments.map((apt) => (
              <tr key={apt.id} className="transition">
                <td className="ps-4 align-middle">
                  <div className="fw-bold">{apt.patient_first_name} {apt.patient_last_name}</div>
                  <small className="text-muted">ID: #{apt.patient_id}</small>
                </td>
                <td className="align-middle">
                  <div className="fw-medium text-primary">{new Date(apt.appointment_date).toLocaleDateString()}</div>
                  <small className="text-muted">{apt.appointment_time.slice(0, 5)}</small>
                </td>
                <td className="align-middle text-muted small">{apt.reason}</td>
                <td className="align-middle">{getStatusBadge(apt.status)}</td>
                <td className="pe-4 align-middle text-end">
                  <Button variant="outline-primary" size="sm" className="rounded-pill px-3 me-2" onClick={() => handleStatusChange(apt)}>
                    Update
                  </Button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="text-center py-5 text-muted">No appointments found.</td></tr>
            )}
          </tbody>
        </Table>
      </Card>

      {/* Status Update Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Update Appointment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Appointment Status</Form.Label>
            <Form.Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="rounded-lg shadow-sm">
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In-Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No-Show</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-bold">Doctor Notes</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Enter consultation notes or follow-up instructions..."
              className="rounded-lg shadow-sm"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowStatusModal(false)}>Close</Button>
          <Button variant="primary" onClick={updateStatus} className="shadow-sm">Save Changes</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DoctorAppointments;

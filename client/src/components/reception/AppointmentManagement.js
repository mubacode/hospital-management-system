import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Alert, Modal, Form, Row, Col } from 'react-bootstrap';
import { FaCalendarCheck, FaUserMd, FaFilter, FaSync, FaEdit } from 'react-icons/fa';
import { appointmentService, clinicService } from '../../services/api';

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [assignedDoctorId, setAssignedDoctorId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const aptRes = await appointmentService.getAll();
      setAppointments(aptRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch appointments monitor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = async (apt) => {
    setSelectedApt(apt);
    setEditStatus(apt.status);
    setAssignedDoctorId(apt.doctor_id || '');
    
    // Fetch doctors for the clinic of this appointment
    try {
      if (apt.clinic_id) {
        const docRes = await clinicService.getDoctors(apt.clinic_id);
        setDoctors(docRes.data);
      }
      setShowEditModal(true);
    } catch (err) {
      alert('Could not load doctors for this clinic.');
    }
  };

  const saveChanges = async () => {
    try {
      await appointmentService.updateStatus(selectedApt.id, { 
        status: editStatus,
        doctorId: assignedDoctorId
      });
      fetchData();
      setShowEditModal(false);
    } catch (err) {
      alert('Error updating appointment.');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'completed': 'success',
      'scheduled': 'primary',
      'pending': 'warning',
      'cancelled': 'danger',
      'pending_assignment': 'dark'
    };
    return <Badge bg={variants[status] || 'secondary'} className="rounded-pill px-3 py-2 text-capitalize">{status.replace('_', ' ')}</Badge>;
  };

  if (loading && appointments.length === 0) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="animate-fade-in py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Appointment Monitor</h2>
          <p className="text-muted mb-0">Track and manage every consultation across all clinics</p>
        </div>
        <Button variant="light" className="rounded-pill border shadow-sm px-3" onClick={fetchData}>
          <FaSync className={loading ? 'fa-spin' : ''} /> Refresh
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="glass border-0 shadow-sm overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead className="bg-light text-muted uppercase small fw-bold">
            <tr>
              <th className="ps-4 py-3 border-0 text-center" style={{width: '60px'}}>#</th>
              <th className="py-3 border-0">Patient</th>
              <th className="py-3 border-0">Doctor</th>
              <th className="py-3 border-0">Schedule</th>
              <th className="py-3 border-0 text-center">Status</th>
              <th className="pe-4 py-3 border-0 text-end">Manage</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((apt) => (
              <tr key={apt.id} className="transition border-bottom">
                <td className="ps-4 align-middle text-center text-muted fw-bold">{apt.id}</td>
                <td className="align-middle">
                  <div className="fw-bold">{apt.patient_first_name} {apt.patient_last_name}</div>
                  <div className="text-muted small">{apt.clinic_name}</div>
                </td>
                <td className="align-middle">
                  {apt.doctor_id ? (
                    <div className="d-flex align-items-center">
                      <FaUserMd className="text-primary me-2" />
                      <span>Dr. {apt.doctor_first_name} {apt.doctor_last_name}</span>
                    </div>
                  ) : (
                    <Badge bg="danger-light" className="text-danger fw-normal">Unassigned</Badge>
                  )}
                </td>
                <td className="align-middle">
                  <div className="fw-medium">{new Date(apt.appointment_date).toLocaleDateString()}</div>
                  <div className="text-muted small">{apt.appointment_time.slice(0, 5)}</div>
                </td>
                <td className="align-middle text-center">{getStatusBadge(apt.status)}</td>
                <td className="pe-4 align-middle text-end">
                  <Button variant="outline-primary" size="sm" className="rounded-pill px-3" onClick={() => handleEditClick(apt)}>
                    <FaEdit /> Manage
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Management Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Manage Appointment #{selectedApt?.id}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-light-sky pb-4 rounded-lg mx-3 mb-3">
          <Row>
            <Col md={12} className="mb-3">
              <Form.Label className="small fw-bold text-muted">Current Patient</Form.Label>
              <div className="p-3 bg-white rounded-lg shadow-sm border fw-bold">
                {selectedApt?.patient_first_name} {selectedApt?.patient_last_name}
              </div>
            </Col>
            <Col md={12} className="mb-3">
              <Form.Label className="small fw-bold text-muted">Consultation Status</Form.Label>
              <Form.Select className="rounded-lg shadow-sm border-0 py-2 fw-medium" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                <option value="pending_assignment">Pending Assignment</option>
                <option value="pending">Pending Confirmation</option>
                <option value="confirmed">Confirmed</option>
                <option value="scheduled">Scheduled</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </Form.Select>
            </Col>
            <Col md={12}>
              <Form.Label className="small fw-bold text-muted">Assign/Change Doctor</Form.Label>
              <Form.Select className="rounded-lg shadow-sm border-0 py-2 fw-medium" value={assignedDoctorId} onChange={(e) => setAssignedDoctorId(e.target.value)}>
                <option value="">-- No Doctor Assigned --</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name} ({d.specialization})</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center">
          <Button variant="light" className="rounded-pill px-4" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" className="rounded-pill px-4 shadow fw-bold" onClick={saveChanges}>Apply Master Changes</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AppointmentManagement;

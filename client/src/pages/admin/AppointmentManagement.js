import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { FaCalendarAlt, FaUserMd, FaSync, FaRegClock, FaFilter } from 'react-icons/fa';
import DataTable from '../../components/common/DataTable';
import { appointmentService } from '../../services/api';

const AdminAppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getAll();
      setAppointments(res.data);
      setError(null);
    } catch (err) {
      setError('Connection interrupted while syncing with hospital schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    const variants = {
      'completed': 'success',
      'scheduled': 'primary',
      'confirmed': 'info',
      'pending': 'warning',
      'cancelled': 'danger',
      'pending_assignment': 'dark'
    };
    return <Badge bg={variants[status] || 'secondary'} className="rounded-pill px-3 py-2 text-capitalize">{status.replace('_', ' ')}</Badge>;
  };

  const columns = [
    { 
      header: 'Consultation', 
      render: (row) => (
        <div className="d-flex align-items-center">
          <div className="bg-primary-light p-2 rounded-lg me-3 text-primary"><FaRegClock /></div>
          <div>
            <div className="fw-bold">{new Date(row.appointment_date).toLocaleDateString()}</div>
            <div className="text-muted small">{row.appointment_time.slice(0, 5)}</div>
          </div>
        </div>
      )
    },
    { 
      header: 'Patient Info', 
      render: (row) => (
        <div>
          <div className="fw-medium">{row.patient_first_name} {row.patient_last_name}</div>
          <div className="text-muted small">#{row.patient_id}</div>
        </div>
      )
    },
    { 
      header: 'Specialist', 
      render: (row) => (
        <div className="d-flex align-items-center">
          <FaUserMd className="text-muted me-2" />
          <span className="small fw-medium">{row.doctor_id ? `Dr. ${row.doctor_first_name} ${row.doctor_last_name}` : <span className="text-danger italic">Unassigned</span>}</span>
        </div>
      )
    },
    { header: 'Clinic', key: 'clinic_name', render: (row) => <span className="small">{row.clinic_name}</span> },
    { header: 'Status', render: (row) => getStatusBadge(row.status) },
    { 
      header: 'Action', 
      render: (row) => (
        <Button variant="link" className="text-primary text-decoration-none small fw-bold p-0">Details</Button>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Appointment Master</h2>
          <p className="text-muted mb-0">Monitor and track every clinical session in real-time</p>
        </div>
        <div className="d-flex gap-2">
            <Button variant="light" className="rounded-pill border shadow-sm px-4">
               <FaFilter className="me-2" /> Filter Range
            </Button>
        </div>
      </div>

      {error && <Alert variant="danger" className="rounded-lg shadow-sm">{error}</Alert>}

      <DataTable 
        data={appointments} 
        columns={columns} 
        loading={loading} 
        onRefresh={fetchData} 
        searchPlaceholder="Find appointment by patient name..."
        searchKey="patient_last_name"
      />
    </div>
  );
};

export default AdminAppointmentManagement;

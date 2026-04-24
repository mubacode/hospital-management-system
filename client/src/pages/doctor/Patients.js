import React, { useState, useEffect } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { FaUserCircle, FaHistory, FaSync } from 'react-icons/fa';
import DataTable from '../../components/common/DataTable';
import { doctorService } from '../../services/api';

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await doctorService.getAppointments();
      // Extract unique patients with last visit data
      const uniquePatientsMap = {};
      res.data.forEach(apt => {
        if (!uniquePatientsMap[apt.patient_id]) {
          uniquePatientsMap[apt.patient_id] = {
            id: apt.patient_id,
            name: `${apt.patient_first_name} ${apt.patient_last_name}`,
            email: apt.patient_email || 'N/A',
            phone: apt.patient_phone || 'N/A',
            lastVisit: apt.appointment_date,
            totalVisits: 1,
            lastReason: apt.reason
          };
        } else {
          uniquePatientsMap[apt.patient_id].totalVisits += 1;
          if (new Date(apt.appointment_date) > new Date(uniquePatientsMap[apt.patient_id].lastVisit)) {
            uniquePatientsMap[apt.patient_id].lastVisit = apt.appointment_date;
            uniquePatientsMap[apt.patient_id].lastReason = apt.reason;
          }
        }
      });
      setPatients(Object.values(uniquePatientsMap));
      setError(null);
    } catch (err) {
      setError('Unable to load patient directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    { 
      header: 'Patient Profile', 
      render: (row) => (
        <div className="d-flex align-items-center">
          <div className="bg-primary-light p-2 rounded-lg me-3 text-primary"><FaUserCircle /></div>
          <div>
            <div className="fw-bold">{row.name}</div>
            <div className="text-muted small">{row.email}</div>
          </div>
        </div>
      )
    },
    { header: 'Contact', key: 'phone' },
    { 
      header: 'Last Consultation', 
      render: (row) => (
        <div>
          <div className="text-muted small">{new Date(row.lastVisit).toLocaleDateString()}</div>
          <div className="fw-medium x-small text-truncate" style={{maxWidth: '150px'}}>{row.lastReason}</div>
        </div>
      )
    },
    { 
      header: 'Visit Frequency', 
      render: (row) => <div className="px-3 py-1 bg-light d-inline-block rounded-pill fw-bold small">{row.totalVisits} visits</div> 
    },
    { 
      header: 'Action', 
      render: (row) => (
        <Button variant="outline-primary" size="sm" className="rounded-pill px-3">
          <FaHistory className="me-2" /> Medical File
        </Button>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">My Patients</h2>
          <p className="text-muted mb-0">Unified medical records for patients under your care</p>
        </div>
        <Button variant="light" className="rounded-pill border shadow-sm px-4" onClick={fetchData} disabled={loading}>
           <FaSync className={loading ? 'fa-spin' : ''} /> Sync Directory
        </Button>
      </div>

      {error && <Alert variant="danger" className="rounded-lg shadow-sm">{error}</Alert>}

      <DataTable 
        data={patients} 
        columns={columns} 
        loading={loading} 
        onRefresh={fetchData} 
        searchPlaceholder="Find patient by name..."
        searchKey="name"
      />
    </div>
  );
};

export default DoctorPatients;

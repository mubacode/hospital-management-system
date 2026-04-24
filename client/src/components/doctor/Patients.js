import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Spinner, Alert } from 'react-bootstrap';
import { FaUserCircle, FaHistory } from 'react-icons/fa';
import { appointmentService } from '../../services/api';

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchuniquePatients = async () => {
      try {
        const res = await appointmentService.getMyAppointments();
        // Extract unique patients from appointments
        const uniquePatientsMap = {};
        res.data.forEach(apt => {
          if (!uniquePatientsMap[apt.patient_id]) {
            uniquePatientsMap[apt.patient_id] = {
              id: apt.patient_id,
              name: `${apt.patient_first_name} ${apt.patient_last_name}`,
              lastVisit: apt.appointment_date,
              totalVisits: 1
            };
          } else {
            uniquePatientsMap[apt.patient_id].totalVisits += 1;
            // Update last visit if more recent
            if (new Date(apt.appointment_date) > new Date(uniquePatientsMap[apt.patient_id].lastVisit)) {
              uniquePatientsMap[apt.patient_id].lastVisit = apt.appointment_date;
            }
          }
        });
        setPatients(Object.values(uniquePatientsMap));
      } catch (err) {
        setError('Failed to fetch patient list.');
      } finally {
        setLoading(false);
      }
    };
    fetchuniquePatients();
  }, []);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">My Patients</h2>
        <p className="text-muted">A directory of patients seen in your consultations</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="glass border-0 shadow-sm overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead className="bg-light">
            <tr>
              <th className="ps-4 py-3 border-0">Patient Name</th>
              <th className="py-3 border-0">Patient ID</th>
              <th className="py-3 border-0">Last Appointment</th>
              <th className="py-3 border-0">Total Visits</th>
              <th className="pe-4 py-3 border-0 text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {patients.length > 0 ? patients.map((p) => (
              <tr key={p.id} className="transition">
                <td className="ps-4 align-middle">
                  <div className="d-flex align-items-center">
                    <FaUserCircle className="text-muted fs-4 me-3" />
                    <span className="fw-bold">{p.name}</span>
                  </div>
                </td>
                <td className="align-middle text-muted">#{p.id}</td>
                <td className="align-middle text-muted">{new Date(p.lastVisit).toLocaleDateString()}</td>
                <td className="align-middle"><div className="px-3 py-1 bg-light d-inline-block rounded-pill small fw-bold">{p.totalVisits}</div></td>
                <td className="pe-4 align-middle text-end">
                  <Button variant="outline-primary" size="sm" className="rounded-pill px-3">
                    <FaHistory className="me-2" /> Medical Records
                  </Button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="text-center py-5 text-muted">You haven't seen any patients yet.</td></tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};

export default DoctorPatients;

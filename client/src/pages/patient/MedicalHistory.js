import React, { useState, useEffect } from 'react';
import { Button, Badge, Modal, Alert, Spinner, Card } from 'react-bootstrap';
import { FaHistory, FaFileMedical, FaPrescription, FaUserMd, FaSync } from 'react-icons/fa';
import DataTable from '../../components/common/DataTable';
import { appointmentService } from '../../services/api';

const MedicalHistory = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getMyAppointments();
      // Only show completed/previous records
      const history = res.data.filter(a => ['completed', 'cancelled', 'no-show'].includes(a.status));
      setAppointments(history);
      setError(null);
    } catch (err) {
      setError('Unable to retrieve health archives.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDetailClick = (record) => {
    setSelectedRecord(record);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'completed': 'success',
      'cancelled': 'danger',
      'no-show': 'dark'
    };
    return <Badge bg={variants[status] || 'secondary'} className="rounded-pill px-3 py-2 text-capitalize">{status}</Badge>;
  };

  const columns = [
    { 
      header: 'Consultation Date', 
      render: (row) => (
        <div className="fw-bold text-primary">{new Date(row.appointment_date).toLocaleDateString()}</div>
      )
    },
    { 
      header: 'Department / Unit', 
      key: 'clinic_name',
      render: (row) => <span className="small fw-medium uppercase text-muted">{row.clinic_name}</span>
    },
    { 
      header: 'Medical Specialist', 
      render: (row) => (
        <div className="d-flex align-items-center">
          <FaUserMd className="text-muted me-2" />
          <span className="fw-medium">Dr. {row.doctor_first_name} {row.doctor_last_name}</span>
        </div>
      )
    },
    { header: 'Resolution', render: (row) => getStatusBadge(row.status) },
    { 
      header: 'Patient File', 
      render: (row) => (
        <Button variant="link" className="text-primary fw-bold text-decoration-none small p-0" onClick={() => handleDetailClick(row)}>
          <FaFileMedical className="me-2" /> View Records
        </Button>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Health Archive</h2>
          <p className="text-muted mb-0">Complete history of your clinical consultations and medical files</p>
        </div>
        <Button variant="light" className="rounded-pill border shadow-sm px-4" onClick={fetchData} disabled={loading}>
           <FaSync className={loading ? 'fa-spin' : ''} /> Refresh History
        </Button>
      </div>

      {error && <Alert variant="danger" className="rounded-lg shadow-sm border-0">{error}</Alert>}

      <DataTable 
        data={appointments} 
        columns={columns} 
        loading={loading} 
        onRefresh={fetchData} 
        searchPlaceholder="Find visit by department..."
        searchKey="clinic_name"
      />

      {/* Record Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">Clinical Session Summary</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-4">
          {selectedRecord && (
            <div className="animate-fade-in">
               <div className="d-flex justify-content-between align-items-start mb-4 bg-light p-3 rounded-xl border border-white shadow-sm">
                  <div>
                    <h6 className="small text-muted fw-bold mb-1 uppercase" style={{fontSize: '0.7rem'}}>SPECIALIST</h6>
                    <p className="mb-0 fw-bold">Dr. {selectedRecord.doctor_first_name} {selectedRecord.doctor_last_name}</p>
                    <small className="text-primary">{selectedRecord.clinic_name}</small>
                  </div>
                  <div className="text-end">
                    <h6 className="small text-muted fw-bold mb-1 uppercase" style={{fontSize: '0.7rem'}}>VISIT DATE</h6>
                    <p className="mb-0 fw-bold">{new Date(selectedRecord.appointment_date).toLocaleDateString()}</p>
                    <Badge bg="success-light" className="text-success border mt-1">{selectedRecord.status.toUpperCase()}</Badge>
                  </div>
               </div>

               <Card className="border-0 shadow-sm mb-4">
                 <Card.Body className="p-4 bg-light-sky-soft rounded-xl">
                   <h6 className="fw-bold text-primary mb-3 d-flex align-items-center">
                     <FaHistory className="me-2" /> Reason for Consultation
                   </h6>
                   <p className="text-dark small mb-0">{selectedRecord.reason || 'No specific reason recorded.'}</p>
                 </Card.Body>
               </Card>

               <div className="row g-4">
                 <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm bg-white rounded-xl">
                      <Card.Body className="p-4">
                         <h6 className="fw-bold text-success mb-3 d-flex align-items-center">
                           <FaFileMedical className="me-2" /> Clinical Notes
                         </h6>
                         <p className="text-muted small mb-0 lh-base">
                           {selectedRecord.notes || 'No clinical observations were recorded for this session.'}
                         </p>
                      </Card.Body>
                    </Card>
                 </Col>
                 <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm bg-white rounded-xl">
                      <Card.Body className="p-4">
                         <h6 className="fw-bold text-danger mb-3 d-flex align-items-center" style={{color: '#d93025'}}>
                           <FaPrescription className="me-2" /> Medication & Rx
                         </h6>
                         <p className="text-muted small mb-0 lh-base">
                            {selectedRecord.prescription || 'No active medications linked to this consultation.'}
                         </p>
                      </Card.Body>
                    </Card>
                 </Col>
               </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center pb-4">
          <Button variant="primary" onClick={() => setShowModal(false)} className="rounded-pill px-5 shadow fw-bold">Close Archive</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MedicalHistory;

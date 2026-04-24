import React, { useState, useEffect } from 'react';
import { Row, Col, Card, ProgressBar, Spinner, Button } from 'react-bootstrap';
import { FaCalendarAlt, FaUserPlus, FaUserMd, FaClipboardList, FaAddressBook, FaSync, FaSyncAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { appointmentService } from '../../services/api';

const ReceptionDashboard = () => {
  const [stats, setStats] = useState({
    todayTotal: 0,
    pendingAssignment: 0,
    confirmedToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await appointmentService.getAll();
        const allApts = res.data;
        const today = new Date().toISOString().split('T')[0];
        
        const todayApts = allApts.filter(a => a.appointment_date.includes(today));
        const pendingAssign = allApts.filter(a => a.status === 'pending_assignment').length;
        const confirmedToday = todayApts.filter(a => ['confirmed', 'scheduled'].includes(a.status)).length;

        setStats({
          todayTotal: todayApts.length,
          pendingAssignment: pendingAssign,
          confirmedToday: confirmedToday
        });
      } catch (err) {
        console.error('Operational stats sync failed');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  const statCards = [
    { title: "Today's Intake", val: stats.todayTotal, icon: <FaClipboardList />, color: 'primary' },
    { title: 'Pending Actions', val: stats.pendingAssignment, icon: <FaUserMd />, color: 'danger' },
    { title: 'Confirmed Slots', val: stats.confirmedToday, icon: <FaCalendarAlt />, color: 'success' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">Operational Hub</h2>
          <p className="text-muted mb-0">Daily patient flow and appointment monitoring</p>
        </div>
        <div className="d-flex gap-2">
           <Button as={Link} to="/reception/patients/register" variant="outline-primary" className="rounded-pill px-4 shadow-sm fw-bold">
              <FaUserPlus className="me-2" /> New Patient
           </Button>
           <Button as={Link} to="/reception/appointments" variant="primary" className="rounded-pill px-4 shadow-sm fw-bold">
              <FaCalendarAlt className="me-2" /> Master Monitor
           </Button>
        </div>
      </div>

      <Row className="mb-5">
        {statCards.map((card, idx) => (
          <Col md={4} key={idx}>
            <Card className="glass border-0 shadow-sm p-4 text-center h-100 transition hover-shadow">
               <div className={`bg-${card.color}-light d-inline-block p-3 rounded-circle mx-auto mb-3 text-${card.color} fs-4`}>
                 {card.icon}
               </div>
               <h6 className="text-muted small fw-bold text-uppercase mb-2">{card.title}</h6>
               <h2 className="fw-bold mb-3">{card.val}</h2>
               <ProgressBar now={100} variant={card.color} style={{ height: '4px' }} className="rounded-pill opacity-50" />
            </Card>
          </Col>
        ))}
      </Row>

      <Row>
        <Col lg={8}>
           <Card className="glass border-0 shadow-sm p-4 h-100">
              <div className="d-flex justify-content-between mb-4 mt-1">
                 <h5 className="fw-bold mb-0">Staffing Overview</h5>
                 <Link to="/reception/appointments" className="small text-decoration-none fw-bold">Sync Schedule</Link>
              </div>
              <div className="bg-light rounded-xl d-flex align-items-center justify-content-center border" style={{ height: '280px' }}>
                 <p className="text-muted small px-5 text-center">Live department occupancy and doctor availability tracker coming soon...</p>
              </div>
           </Card>
        </Col>
        <Col lg={4}>
           <Card className="glass border-0 shadow-sm p-4 bg-primary text-white mb-4 position-relative overflow-hidden">
              <div className="position-relative z-index-1">
                <h5 className="fw-bold mb-3">Master Control</h5>
                <p className="small opacity-75 mb-4">View every appointment across clinics, assign unassigned requests, and manage walk-in schedules from one hub.</p>
                <Button as={Link} to="/reception/appointments" variant="light" className="rounded-pill px-4 fw-bold text-primary w-100 shadow">Open Schedule Monitor</Button>
              </div>
              <FaClipboardList className="position-absolute opacity-10" style={{bottom: '-20px', right: '-20px', fontSize: '180px'}} />
           </Card>

           <Card className="glass border-0 shadow-sm p-4">
              <h6 className="fw-bold text-muted small text-uppercase mb-3">Quick Enrollment</h6>
              <p className="small text-muted mb-3 lh-base">Directly enroll walk-in patients into the Careful system and book them for the next available slot.</p>
              <Button as={Link} to="/reception/patients/register" variant="outline-primary" className="rounded-pill w-100 fw-bold border-2">Register Patient</Button>
           </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReceptionDashboard;

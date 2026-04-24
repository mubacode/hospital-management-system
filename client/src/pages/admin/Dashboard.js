import React, { useState, useEffect } from 'react';
import { Row, Col, Card, ProgressBar, Spinner, Button, Badge, Table } from 'react-bootstrap';
import { FaUsers, FaUserMd, FaCalendarCheck, FaClinicMedical, FaChartBar, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { adminService, appointmentService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, doctorsCount: 0, patientsCount: 0, clinicsCount: 0 });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getStats();
        if (res.data) setStats(res.data);
      } catch (err) {
        console.error('Basic stats fetch failed:', err);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const res = await appointmentService.getAnalytics();
        if (res.data) setAnalytics(res.data);
      } catch (err) {
        console.error('Analytics fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchAnalytics();
  }, [t]);

  const statCards = [
    { title: t('admin.registeredUsers'), val: stats.totalUsers, icon: <FaUsers />, color: 'primary', progress: 100 },
    { title: t('admin.activeDoctors'), val: stats.doctorsCount, icon: <FaUserMd />, color: 'success', progress: stats.totalUsers > 0 ? (stats.doctorsCount / stats.totalUsers) * 100 : 0 },
    { title: t('admin.activePatients'), val: stats.patientsCount, icon: <FaUsers />, color: 'info', progress: stats.totalUsers > 0 ? (stats.patientsCount / stats.totalUsers) * 100 : 0 },
    { title: t('admin.departmentsClinics'), val: stats.clinicsCount, icon: <FaClinicMedical />, color: 'warning', progress: 100 },
  ];

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  const totalAppts = analytics?.total || 0;
  const completedAppts = analytics?.completed || 0;
  const cancelledAppts = analytics?.cancelled || 0;
  const pendingAppts = (analytics?.pending || 0) + (analytics?.scheduled || 0);

  const completionRate = totalAppts > 0
    ? Math.round((completedAppts / totalAppts) * 100)
    : 0;
  const cancellationRate = totalAppts > 0
    ? Math.round((cancelledAppts / totalAppts) * 100)
    : 0;

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">{t('admin.dashboardTitle')}</h2>
          <p className="text-muted mb-0">{t('admin.dashboardSubtitle')}</p>
        </div>
      </div>

      {/* ── User stat cards ── */}
      <Row className="mb-5">
        {statCards.map((card, idx) => (
          <Col md={6} lg={3} key={idx}>
            <Card className="glass border-0 shadow-sm p-4 text-center h-100 transition hover-shadow">
              <div className={`bg-${card.color}-light d-inline-block p-3 rounded-circle mx-auto mb-3 text-${card.color} fs-4`}>
                {card.icon}
              </div>
              <h6 className="text-muted small fw-bold text-uppercase mb-2">{card.title}</h6>
              <h2 className="fw-bold mb-3">{card.val || 0}</h2>
              <ProgressBar now={card.progress || 0} variant={card.color} style={{ height: '4px' }} className="rounded-pill" />
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Appointment Analytics ── */}
      {analytics && (
        <>
          <h5 className="fw-bold mb-4 d-flex align-items-center">
            <FaChartBar className="me-2 text-primary" /> Appointment Analytics
          </h5>

          {/* KPI summary cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="border-0 shadow-sm p-4 text-center">
                <div className="text-primary fs-1 fw-bold">{analytics.total}</div>
                <div className="text-muted small fw-bold text-uppercase">Total</div>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm p-4 text-center">
                <div className="text-success fs-1 fw-bold">{analytics.completed}</div>
                <div className="text-muted small fw-bold text-uppercase d-flex align-items-center justify-content-center gap-1">
                  <FaCheckCircle className="text-success" /> Completed
                </div>
                <div className="mt-2"><Badge bg="success" className="rounded-pill">{completionRate}%</Badge></div>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm p-4 text-center">
                <div className="text-danger fs-1 fw-bold">{analytics.cancelled}</div>
                <div className="text-muted small fw-bold text-uppercase d-flex align-items-center justify-content-center gap-1">
                  <FaTimesCircle className="text-danger" /> Cancelled
                </div>
                <div className="mt-2"><Badge bg="danger" className="rounded-pill">{cancellationRate}%</Badge></div>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm p-4 text-center">
                <div className="text-warning fs-1 fw-bold">{analytics.pending + analytics.scheduled}</div>
                <div className="text-muted small fw-bold text-uppercase d-flex align-items-center justify-content-center gap-1">
                  <FaClock className="text-warning" /> Pending
                </div>
              </Card>
            </Col>
          </Row>

          {/* Per-doctor breakdown table */}
          <Row className="mb-4">
            <Col lg={8}>
              <Card className="glass border-0 shadow-sm p-4">
                <h5 className="fw-bold mb-4">Appointments per Doctor</h5>
                {analytics.perDoctor?.length > 0 ? (
                  <Table hover borderless responsive className="small mb-0">
                    <thead>
                      <tr className="text-muted text-uppercase" style={{ fontSize: '0.75rem' }}>
                        <th>Doctor</th>
                        <th>Clinic</th>
                        <th>Total</th>
                        <th>Done</th>
                        <th>Cancelled</th>
                        <th>Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.perDoctor.map((row, i) => {
                        const rate = row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0;
                        return (
                          <tr key={i}>
                            <td className="fw-bold">Dr. {row.doctor}</td>
                            <td className="text-muted">{row.clinic}</td>
                            <td><Badge bg="primary" className="rounded-pill">{row.total}</Badge></td>
                            <td className="text-success fw-bold">{row.completed}</td>
                            <td className="text-danger fw-bold">{row.cancelled}</td>
                            <td>
                              <ProgressBar now={rate} variant="success" style={{ height: '6px', minWidth: '60px' }} className="rounded-pill" />
                              <small className="text-muted">{rate}%</small>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted text-center py-3 mb-0">No appointment data yet.</p>
                )}
              </Card>
            </Col>

            <Col lg={4}>
              {/* Daily trend — last 14 days sparkline (simple bar chart) */}
              <Card className="glass border-0 shadow-sm p-4 h-100">
                <h5 className="fw-bold mb-4">14-Day Trend</h5>
                {analytics.daily?.length > 0 ? (
                  <div className="d-flex align-items-end gap-1" style={{ height: '120px' }}>
                    {analytics.daily.map((d, i) => {
                      const maxVal = Math.max(...analytics.daily.map(x => x.total), 1);
                      const barH = Math.max(4, Math.round((d.total / maxVal) * 100));
                      return (
                        <div key={i} className="flex-grow-1 d-flex flex-column align-items-center" title={`${d.date}: ${d.total}`}>
                          <div
                            className="rounded-pill bg-primary w-100"
                            style={{ height: `${barH}px`, minHeight: '4px', opacity: 0.7 + (i / analytics.daily.length) * 0.3 }}
                          />
                          {i % 3 === 0 && <small className="text-muted" style={{ fontSize: '0.6rem', whiteSpace: 'nowrap' }}>{d.date.slice(5)}</small>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted small text-center py-4">{t('admin.analyticsComingSoon')}</p>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* ── Quick Actions ── */}
      <Row>
        <Col>
          <Card className="glass border-0 shadow-sm p-4">
            <h5 className="fw-bold mb-4">{t('admin.quickActions')}</h5>
            <Row className="g-3">
              <Col md={4}>
                <Button as={Link} to="/admin/appointments" variant="light" className="text-start p-3 border rounded-3 bg-white w-100 shadow-hover transition">
                  <div className="fw-bold text-primary mb-1">{t('admin.monitorSchedule')}</div>
                  <div className="small text-muted">{t('admin.monitorScheduleDesc')}</div>
                </Button>
              </Col>
              <Col md={4}>
                <Button as={Link} to="/admin/doctors" variant="light" className="text-start p-3 border rounded-3 bg-white w-100 shadow-hover transition">
                  <div className="fw-bold text-success mb-1">{t('admin.manageSpecialists')}</div>
                  <div className="small text-muted">{t('admin.manageSpecialistsDesc')}</div>
                </Button>
              </Col>
              <Col md={4}>
                <Button as={Link} to="/admin/users" variant="light" className="text-start p-3 border rounded-3 bg-white w-100 shadow-hover transition">
                  <div className="fw-bold text-dark mb-1">{t('admin.securityAudit')}</div>
                  <div className="small text-muted">{t('admin.securityAuditDesc')}</div>
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;

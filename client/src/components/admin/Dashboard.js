import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Spinner, ProgressBar, Badge } from 'react-bootstrap';
import { FaUsers, FaUserMd, FaClinicMedical, FaChartPie, FaTools, FaUserPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { userService } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    doctorsCount: 0,
    patientsCount: 0,
    clinicsCount: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const statsRes = await userService.getStats();
        const recentRes = await userService.getRecent();
        setStats(statsRes.data);
        setRecentUsers(recentRes.data);
      } catch (err) {
        console.error('Error fetching admin data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Administrator Control</h2>
          <p className="text-muted mb-0">System performance and user management Overview</p>
        </div>
        <div className="d-flex gap-2">
          <Button as={Link} to="/admin/users" variant="outline-primary" className="rounded-pill px-4">
            <FaTools className="me-2" /> User Mgmt
          </Button>
          <Button as={Link} to="/register" variant="primary" className="rounded-pill px-4 shadow-sm">
            <FaUserPlus className="me-2" /> Add Staff
          </Button>
        </div>
      </div>

      <Row className="mb-4">
        <Col sm={6} lg={3}>
          <Card className="glass border-0 shadow-sm mb-3 text-center p-3">
            <div className="bg-primary-light d-inline-block p-3 rounded-circle mx-auto mb-3 text-primary fs-4">
              <FaUsers />
            </div>
            <h6 className="text-muted small fw-bold text-uppercase">Total Users</h6>
            <h3 className="fw-bold mb-1">{stats.totalUsers || 0}</h3>
            <ProgressBar now={100} variant="primary" style={{ height: '4px' }} className="mt-2" />
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="glass border-0 shadow-sm mb-3 text-center p-3">
            <div className="bg-success-light d-inline-block p-3 rounded-circle mx-auto mb-3 text-success fs-4" style={{backgroundColor: '#e6f4ea', color: '#1e8e3e'}}>
              <FaUserMd />
            </div>
            <h6 className="text-muted small fw-bold text-uppercase">Active Doctors</h6>
            <h3 className="fw-bold mb-1">{stats.doctorsCount || 0}</h3>
            <ProgressBar now={(stats.doctorsCount / stats.totalUsers) * 100 || 0} variant="success" style={{ height: '4px' }} className="mt-2" />
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="glass border-0 shadow-sm mb-3 text-center p-3">
            <div className="bg-warning-light d-inline-block p-3 rounded-circle mx-auto mb-3 text-warning fs-4" style={{backgroundColor: '#fef7e0', color: '#f9ab00'}}>
              <FaClinicMedical />
            </div>
            <h6 className="text-muted small fw-bold text-uppercase">Total Clinics</h6>
            <h3 className="fw-bold mb-1">{stats.clinicsCount || 0}</h3>
            <ProgressBar now={100} variant="warning" style={{ height: '4px' }} className="mt-2" />
          </Card>
        </Col>
        <Col sm={6} lg={3}>
          <Card className="glass border-0 shadow-sm mb-3 text-center p-3">
            <div className="bg-danger-light d-inline-block p-3 rounded-circle mx-auto mb-3 text-danger fs-4" style={{backgroundColor: '#fce8e6', color: '#d93025'}}>
              <FaChartPie />
            </div>
            <h6 className="text-muted small fw-bold text-uppercase">System Status</h6>
            <h3 className="fw-bold mb-1 text-success">Active</h3>
            <ProgressBar now={100} variant="success" style={{ height: '4px' }} className="mt-2" />
          </Card>
        </Col>
      </Row>

      <Card className="glass border-0 shadow-sm">
        <Card.Header className="bg-transparent border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Recent Registrations</h5>
          <Button as={Link} to="/admin/users" variant="link" className="p-0 text-decoration-none fw-bold">View Directory</Button>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4 py-3 border-0">User Profile</th>
                <th className="py-3 border-0">Username</th>
                <th className="py-3 border-0">Role</th>
                <th className="py-3 border-0">Registered</th>
                <th className="pe-4 py-3 border-0 text-end">Manage</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length > 0 ? recentUsers.map((user, idx) => (
                <tr key={idx} className="transition h-100">
                  <td className="ps-4 align-middle">
                    <div className="d-flex align-items-center">
                      <div className="bg-primary-light p-2 rounded-lg me-3 text-primary fw-bold px-3">
                        {user.username?.[0].toUpperCase()}
                      </div>
                      <div>
                         <span className="fw-bold d-block">{user.first_name ? `${user.first_name} ${user.last_name}` : 'Unknown'}</span>
                         <small className="text-muted">{user.email}</small>
                      </div>
                    </div>
                  </td>
                  <td className="align-middle fw-medium">@{user.username}</td>
                  <td className="align-middle">
                    <Badge bg="light" className="text-dark border rounded-pill px-3 py-2 text-capitalize">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="align-middle text-muted small">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="pe-4 align-middle text-end">
                    <Button as={Link} to="/admin/users" variant="outline-primary" size="sm" className="rounded-pill px-3">Profile</Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">No recent registrations found</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminDashboard;

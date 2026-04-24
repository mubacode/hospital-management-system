import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { FaHospital, FaUserCircle, FaSignOutAlt, FaUserMd, FaUserAstronaut, FaCalendarAlt, FaHistory } from 'react-icons/fa';

const Header = ({ isAuthenticated, user, logout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin': return '/admin';
      case 'doctor': return '/doctor';
      case 'patient': return '/patient';
      case 'receptionist': return '/reception';
      default: return '/';
    }
  };

  return (
    <Navbar expand="lg" className="glass sticky-top py-3 mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center fw-bold text-primary fs-4">
          <FaHospital className="me-2" />
          <span style={{ fontFamily: 'Outfit' }}>CarePlus</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {isAuthenticated ? (
              <>
                <Nav.Link as={Link} to={getDashboardLink()} className="px-3 fw-medium">Dashboard</Nav.Link>
                
                {user.role === 'patient' && (
                  <>
                    <Nav.Link as={Link} to="/patient/appointments/book" className="px-3">Book Appointment</Nav.Link>
                    <Nav.Link as={Link} to="/patient/medical-history" className="px-3">History</Nav.Link>
                  </>
                )}

                {user.role === 'doctor' && (
                  <>
                    <Nav.Link as={Link} to="/doctor/appointments" className="px-3">Schedule</Nav.Link>
                    <Nav.Link as={Link} to="/doctor/patients" className="px-3">Patients</Nav.Link>
                  </>
                )}

                <NavDropdown 
                  title={
                    <span className="d-flex align-items-center">
                      <FaUserCircle className="me-1 fs-5" />
                      {user.first_name || 'Profile'}
                    </span>
                  } 
                  id="user-dropdown"
                  className="ms-2"
                >
                  <NavDropdown.Item disabled>
                    <small className="text-muted d-block text-capitalize">Role: {user.role}</small>
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout} className="text-danger">
                    <FaSignOutAlt className="me-2" /> Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="px-3 fw-medium">Log In</Nav.Link>
                <Button 
                  as={Link} 
                  to="/register" 
                  variant="primary" 
                  className="ms-lg-3 px-4 rounded-pill shadow-sm fw-bold shadow-hover"
                >
                  Join Us
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;

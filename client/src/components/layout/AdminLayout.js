import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { FaChartLine, FaUserMd, FaUsers, FaCalendarAlt, FaCog, FaSignOutAlt } from 'react-icons/fa';

const Sidebar = ({ logout }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <FaChartLine /> },
    { name: 'Doctors', path: '/admin/doctors', icon: <FaUserMd /> },
    { name: 'Patients', path: '/admin/patients', icon: <FaUsers /> },
    { name: 'Appointments', path: '/admin/appointments', icon: <FaCalendarAlt /> },
    { name: 'Users', path: '/admin/users', icon: <FaCog /> },
  ];

  return (
    <div className="admin-sidebar bg-white border-end d-flex flex-column" style={{ width: '260px', minHeight: '100vh', position: 'fixed' }}>
      <div className="p-4 mb-2">
        <h4 className="fw-bold text-primary mb-0">CarePlus <span className="small text-muted fw-normal">Admin</span></h4>
      </div>

      <Nav className="flex-column px-3 flex-grow-1">
        {menuItems.map((item) => (
          <Nav.Link
            key={item.path}
            as={NavLink}
            to={item.path}
            end={item.path === '/admin'}
            className="rounded-lg mb-1 py-3 px-3 d-flex align-items-center transition sidebar-link"
          >
            <span className="me-3 fs-5">{item.icon}</span>
            <span className="fw-medium">{item.name}</span>
          </Nav.Link>
        ))}
      </Nav>

      <div className="p-3 border-top mt-auto">
        <Button
          variant="link"
          onClick={logout}
          className="text-danger d-flex align-items-center text-decoration-none w-100 py-2 px-3 rounded-lg hover-bg-danger-light transition"
        >
          <FaSignOutAlt className="me-3" />
          <span className="fw-bold">Sign Out</span>
        </Button>
      </div>
    </div>
  );
};

const AdminLayout = ({ children, logout }) => {
  return (
    <div className="d-flex bg-light min-vh-100">
      <Sidebar logout={logout} />
      <div className="flex-grow-1" style={{ paddingLeft: '260px' }}>
        <main className="p-4 p-lg-5">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

// Quick helper to add the Button to the imports if needed (Wait, I'll just use the Button component from React Bootstrap correctly in the code)
import { Button } from 'react-bootstrap';

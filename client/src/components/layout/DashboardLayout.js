import React from 'react';
import { Nav, Button, Container, Dropdown } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaChartLine, FaUserMd, FaUsers, FaCalendarAlt, FaSignOutAlt,
  FaHome, FaPlusCircle, FaHistory, FaClinicMedical, FaHospitalUser, FaShieldAlt, FaGlobe
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import ChatAssistant from '../chat/ChatAssistant';

/**
 * Shared layout component for all authenticated portals.
 * All navigation text is sourced from JSON locale files via the t() function.
 * Adding new languages requires ONLY adding keys to /locales/{lang}.json.
 */
const DashboardLayout = ({ children, user, logout }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    // Persisted automatically by i18next-browser-languagedetector to localStorage
  };

  // All menu labels sourced from locale JSON nav.* keys
  const getMenuItems = (role) => {
    switch (role) {
      case 'admin':
        return [
          { name: t('nav.dashboard'), path: '/admin', icon: <FaChartLine /> },
          { name: t('nav.users'), path: '/admin/users', icon: <FaUsers /> },
          { name: t('nav.appointments'), path: '/admin/appointments', icon: <FaCalendarAlt /> },
          { name: t('nav.departments'), path: '/admin/departments', icon: <FaClinicMedical /> },
        ];
      case 'doctor':
        return [
          { name: t('nav.dashboard'), path: '/doctor', icon: <FaHome /> },
          { name: t('nav.mySchedule'), path: '/doctor/appointments', icon: <FaCalendarAlt /> },
          { name: t('nav.myPatients'), path: '/doctor/patients', icon: <FaUsers /> },
        ];
      case 'patient':
        return [
          { name: t('nav.dashboard'), path: '/patient', icon: <FaHome /> },
          { name: t('nav.bookVisit'), path: '/patient/appointments/book', icon: <FaPlusCircle /> },
          { name: t('nav.history'), path: '/patient/medical-history', icon: <FaHistory /> },
        ];
      case 'receptionist':
        return [
          { name: t('nav.overview'), path: '/reception', icon: <FaClinicMedical /> },
          { name: t('nav.globalSchedule'), path: '/reception/appointments', icon: <FaCalendarAlt /> },
          { name: t('nav.patientIntake'), path: '/reception/patients/register', icon: <FaHospitalUser /> },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems(user?.role);

  return (
    <div className="dashboard-wrapper bg-light min-vh-100 d-flex">
      {/* Sidebar */}
      <aside className="bg-white border-end shadow-sm flex-shrink-0 d-flex flex-column" style={{ width: '280px', position: 'fixed', height: '100vh', zIndex: 1000 }}>
        {/* Logo + Language Switcher */}
        <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
          <h4 className="fw-bold text-primary mb-0 d-flex align-items-center">
            <div className="bg-primary rounded p-1 me-2 text-white" style={{fontSize: '0.6em'}}>CP</div>
            CarePlus
          </h4>
          {/* Language Switcher — stored in localStorage, no page reload */}
          <Dropdown align="end">
            <Dropdown.Toggle variant="light" size="sm" className="rounded-pill border-0 shadow-sm d-flex align-items-center gap-1">
              <FaGlobe className="text-primary" />
              <span>{i18n.language?.toUpperCase().slice(0, 2)}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu className="border-0 shadow-lg rounded-3 p-1">
              <Dropdown.Item 
                onClick={() => changeLanguage('en')} 
                className={`rounded-2 small px-3 py-2 ${i18n.language?.startsWith('en') ? 'fw-bold text-primary bg-primary-subtle' : ''}`}
              >
                🇬🇧 English
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={() => changeLanguage('tr')} 
                className={`rounded-2 small px-3 py-2 ${i18n.language?.startsWith('tr') ? 'fw-bold text-primary bg-primary-subtle' : ''}`}
              >
                🇹🇷 Türkçe
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>

        {/* User Profile Pill */}
        <div className="flex-grow-1 px-3 py-4 d-flex flex-column overflow-auto">
          <div className="user-profile mb-4 p-3 bg-light rounded-pill d-flex align-items-center flex-shrink-0">
            <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold me-3 flex-shrink-0" style={{width: '40px', height: '40px'}}>
              {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="fw-bold text-truncate" style={{fontSize: '0.9em'}}>{user?.first_name || user?.username}</div>
              <div className="text-muted small text-capitalize">{user?.role}</div>
            </div>
          </div>

          {/* Navigation Menu */}
          <Nav className="flex-column">
            {menuItems.map((item) => (
              <Nav.Link 
                key={item.path} 
                as={NavLink} 
                to={item.path} 
                end={['/', '/admin', '/doctor', '/patient', '/reception'].includes(item.path)}
                className="rounded-lg mb-1 py-3 px-3 d-flex align-items-center transition sidebar-link"
              >
                <span className="me-3 fs-5">{item.icon}</span>
                <span className="fw-medium">{item.name}</span>
              </Nav.Link>
            ))}
          </Nav>

          {/* Bottom pinned items */}
          <div className="mt-auto pt-3 border-top flex-shrink-0">
            <Nav.Link 
              as={NavLink} 
              to="/change-password" 
              className="rounded-lg mb-1 py-3 px-3 d-flex align-items-center transition sidebar-link"
            >
              <FaShieldAlt className="me-3 fs-5 text-muted" />
              <span className="fw-medium">{t('nav.security')}</span>
            </Nav.Link>

            <Button 
              variant="link" 
              onClick={logout} 
              className="text-danger d-flex align-items-center text-decoration-none w-100 py-3 px-3 rounded-lg hover-bg-danger-light transition"
            >
              <FaSignOutAlt className="me-3 fs-5" />
              <span className="fw-bold">{t('nav.signOut')}</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow-1" style={{ marginLeft: '280px' }}>
        <main className="p-4 p-lg-5">
          <Container fluid>
            {children}
          </Container>
        </main>
      </div>

      {/* AI Chatbot: Only visible to patients */}
      {user?.role === 'patient' && <ChatAssistant user={user} />}
    </div>
  );
};

export default DashboardLayout;

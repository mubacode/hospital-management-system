import React, { useState, useEffect } from 'react';
import { Button, Badge, Alert, Spinner, Modal, Form, Nav, Row, Col, InputGroup } from 'react-bootstrap';
import { FaTrash, FaUserPlus, FaSync, FaEnvelope, FaUserMd, FaUsers, FaHospitalAlt, FaClock, FaCheckCircle } from 'react-icons/fa';
import DataTable from '../../components/common/DataTable';
import { adminService, authService, clinicService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import notify from '../../utils/notify';
import i18next from 'i18next';

const UserManagement = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Invitation Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'doctor',
    specialization: '',
    clinic_id: ''
  });
  const [clinics, setClinics] = useState([]);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, clinicRes] = await Promise.all([
        adminService.getUsers(),
        clinicService.getAll()
      ]);
      setUsers(userRes.data);
      setClinics(clinicRes.data);
      setError(null);
    } catch (err) {
      setError(t('notify.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(u => u.role === activeTab));
    }
  }, [activeTab, users]);

  const handleInviteChange = (e) => {
    setInviteData({ ...inviteData, [e.target.name]: e.target.value });
  };

  const onInviteSubmit = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await authService.inviteUser(inviteData);
      notify.success(t('notify.inviteSuccess'));
      setShowInviteModal(false);
      setInviteData({ email: '', first_name: '', last_name: '', role: 'doctor', specialization: '', clinic_id: '' });
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || t('notify.errorGeneric'));
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await adminService.deleteUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      notify.success(t('notify.updateSuccess'));
      setShowDeleteModal(false);
    } catch (err) {
      notify.error(err.response?.data?.message || t('notify.updateError'));
    }
  };

  const columns = [
    { 
      header: t('admin.usersDirectory.identity'), 
      render: (row) => (
        <div className="d-flex align-items-center">
          <div className="bg-primary-light p-2 rounded-lg me-3 text-primary fw-bold px-3">
            {row.username?.[0]?.toUpperCase() || row.first_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="fw-bold">{row.first_name ? `${row.first_name} ${row.last_name}` : row.username}</div>
            <div className="text-muted small">{row.email}</div>
          </div>
        </div>
      )
    },
    { 
      header: t('common.role'), 
      render: (row) => (
        <Badge bg="light" className="text-dark border rounded-pill px-3 py-2 text-capitalize d-flex align-items-center gap-2" style={{width: 'fit-content'}}>
          {row.role === 'doctor' && <FaUserMd className="text-primary" />}
          {row.role === 'patient' && <FaUsers className="text-success" />}
          {row.role === 'receptionist' && <FaHospitalAlt className="text-info" />}
          {t(`common.roles.${row.role}`) || row.role}
        </Badge>
      )
    },
    { 
      header: t('admin.usersDirectory.accountStatus'), 
      render: (row) => (
        row.status === 'pending' ? (
          <Badge bg="warning-light" className="text-warning px-3 py-2 rounded-pill d-flex align-items-center gap-2" style={{width: 'fit-content'}}>
            <FaClock size={10} /> {t('admin.usersDirectory.pendingInvite')}
          </Badge>
        ) : (
          <Badge bg="success-light" className="text-success px-3 py-2 rounded-pill d-flex align-items-center gap-2" style={{width: 'fit-content'}}>
            <FaCheckCircle size={10} /> {t('common.active')}
          </Badge>
        )
      )
    },
    { header: t('admin.usersDirectory.joined'), render: (row) => <span className="text-muted small">{new Date(row.created_at).toLocaleDateString(i18next.language)}</span> },
    { 
      header: t('common.actions'), 
      render: (row) => (
        <div className="d-flex gap-2 justify-content-end">
           {row.status === 'pending' && <Button variant="link" className="text-info p-0" title="Resend Invite" onClick={() => authService.inviteUser(row).then(() => notify.success(t('notify.inviteSuccess')))}><FaSync /></Button>}
          <Button 
            variant="link" 
            className="text-danger p-0" 
            onClick={() => handleDeleteClick(row)}
            disabled={row.username === 'admin'}
          >
            <FaTrash />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">{t('admin.usersDirectory.title')}</h2>
          <p className="text-muted mb-0">{t('admin.usersDirectory.subtitle')}</p>
        </div>
        <Button variant="primary" className="rounded-pill px-4 shadow-sm fw-bold" onClick={() => setShowInviteModal(true)}>
          <FaUserPlus className="me-2" /> {t('admin.usersDirectory.invite')}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm mb-4 border overflow-hidden">
        <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="px-3 pt-2 bg-light border-0">
          <Nav.Item><Nav.Link eventKey="all" className="px-4 py-3 border-0">{t('admin.usersDirectory.all')}</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="doctor" className="px-4 py-3 border-0">{t('nav.doctors') || 'Doctors'}</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="receptionist" className="px-4 py-3 border-0">{t('nav.reception')}</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="patient" className="px-4 py-3 border-0">{t('nav.patients')}</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="admin" className="px-4 py-3 border-0">Admins</Nav.Link></Nav.Item>
        </Nav>
        
        <div className="p-4">
          {error && <Alert variant="danger" className="rounded-lg shadow-sm mb-4">{error}</Alert>}

          <DataTable 
            data={filteredUsers} 
            columns={columns} 
            loading={loading} 
            onRefresh={fetchData} 
            searchPlaceholder={t('admin.usersDirectory.identity')}
            searchKey="email"
          />
        </div>
      </div>

      {/* Invitation Modal */}
      <Modal show={showInviteModal} onHide={() => setShowInviteModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{t('admin.usersDirectory.invite')}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={onInviteSubmit}>
          <Modal.Body className="pt-4 p-4">
            <p className="text-muted mb-4">Enter user details and we'll send them a secure invitation link to set their own password.</p>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('common.name')} (First)</Form.Label>
                  <Form.Control name="first_name" value={inviteData.first_name} onChange={handleInviteChange} required placeholder="Dr. John" className="bg-light border-0 py-2" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">{t('common.name')} (Last)</Form.Label>
                  <Form.Control name="last_name" value={inviteData.last_name} onChange={handleInviteChange} required placeholder="Doe" className="bg-light border-0 py-2" />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">{t('common.email')}</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light border-0"><FaEnvelope className="text-muted" /></InputGroup.Text>
                <Form.Control type="email" name="email" value={inviteData.email} onChange={handleInviteChange} required placeholder="doctor@hospital.com" className="bg-light border-0 py-2" />
              </InputGroup>
            </Form.Group>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold">{t('common.role')}</Form.Label>
                  <div className="d-flex gap-3">
                    {['doctor', 'receptionist', 'admin'].map(r => (
                      <Button 
                        key={r}
                        type="button"
                        variant={inviteData.role === r ? 'primary' : 'light'} 
                        className={`rounded-pill px-4 flex-grow-1 border-0 py-2 text-capitalize fw-bold`}
                        onClick={() => setInviteData({...inviteData, role: r})}
                      >
                        {t(`common.roles.${r}`) || r}
                      </Button>
                    ))}
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {inviteData.role === 'doctor' && (
              <Alert variant="info" className="border-0 animate-fade-in shadow-sm rounded-lg">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">{t('admin.specialists.specialization')}</Form.Label>
                      <Form.Control name="specialization" value={inviteData.specialization} onChange={handleInviteChange} placeholder="e.g. Cardiologist" className="bg-white border-0 py-2 shadow-xs" />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">{t('admin.specialists.clinic')}</Form.Label>
                      <Form.Select name="clinic_id" value={inviteData.clinic_id} onChange={handleInviteChange} className="bg-white border-0 py-2 shadow-xs">
                        <option value="">{t('common.selectOption')}</option>
                        {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0 p-4">
            <Button variant="light" onClick={() => setShowInviteModal(false)} className="rounded-pill px-4">{t('common.cancel')}</Button>
            <Button variant="primary" type="submit" className="rounded-pill px-5 shadow fw-bold" disabled={inviting}>
              {inviting ? <Spinner size="sm" animation="border" /> : (
                <><FaEnvelope className="me-2" /> {t('admin.usersDirectory.invite')}</>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0"><Modal.Title className="fw-bold">{t('admin.usersDirectory.terminateSession')}</Modal.Title></Modal.Header>
        <Modal.Body className="py-4 text-center">
          <div className="bg-danger-light text-danger p-4 rounded-circle d-inline-block mb-3">
             <FaTrash size={32} />
          </div>
          <h5 className="fw-bold">{t('admin.usersDirectory.terminateUser')}</h5>
          <p className="text-muted">{t('admin.usersDirectory.confirmTerminate', { email: userToDelete?.email })}</p>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)} className="rounded-pill px-4">{t('admin.usersDirectory.keepAccount')}</Button>
          <Button variant="danger" onClick={confirmDelete} className="rounded-pill px-4 fw-bold">{t('admin.usersDirectory.terminateUser')}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserManagement;

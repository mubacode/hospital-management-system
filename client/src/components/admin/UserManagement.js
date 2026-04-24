import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { FaTrash, FaEdit, FaUserPlus, FaSync } from 'react-icons/fa';
import { userService } from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getAll();
      setUsers(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await userService.delete(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setShowDeleteModal(false);
    } catch (err) {
      alert('Error deleting user: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading && users.length === 0) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">User Management</h2>
          <p className="text-muted mb-0">Manage all hospital staff and patients</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="light" className="rounded-pill border shadow-sm px-3" onClick={fetchUsers}>
            <FaSync className={loading ? 'fa-spin' : ''} />
          </Button>
          <Button variant="primary" className="rounded-pill px-4 shadow-sm">
            <FaUserPlus className="me-2" /> Add New User
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="glass border-0 shadow-sm overflow-hidden">
        <Table responsive hover className="mb-0">
          <thead className="bg-light">
            <tr>
              <th className="ps-4 py-3 border-0">User Info</th>
              <th className="py-3 border-0">Username</th>
              <th className="py-3 border-0">Role</th>
              <th className="py-3 border-0">Phone</th>
              <th className="pe-4 py-3 border-0 text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="transition h-100">
                <td className="ps-4 align-middle">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary-light p-2 rounded-lg me-3 text-primary fw-bold text-uppercase">
                      {user.first_name?.[0] || user.username?.[0]}
                    </div>
                    <div>
                      <div className="fw-bold">{user.first_name ? `${user.first_name} ${user.last_name}` : 'No Name Set'}</div>
                      <div className="text-muted small">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="align-middle fw-medium">@{user.username}</td>
                <td className="align-middle">
                  <Badge 
                    bg="light" 
                    className={`text-dark border rounded-pill px-3 py-2 text-capitalize role-badge-${user.role}`}
                  >
                    {user.role}
                  </Badge>
                </td>
                <td className="align-middle text-muted small">{user.phone || 'N/A'}</td>
                <td className="pe-4 align-middle text-end">
                  <Button variant="link" className="text-primary me-2 p-0"><FaEdit /></Button>
                  <Button 
                    variant="link" 
                    className="text-danger p-0" 
                    onClick={() => handleDeleteClick(user)}
                    disabled={user.username === 'admin'}
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Delete User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete <strong>{userToDelete?.username}</strong>? 
          All related records (appointments, medical history) will also be removed.
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="light" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Yes, Delete User</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserManagement;

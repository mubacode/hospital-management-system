import React, { useState, useEffect } from 'react';
import { Button, Badge, Alert } from 'react-bootstrap';
import { FaTrash, FaUserCircle, FaHistory } from 'react-icons/fa';
import DataTable from '../../components/common/DataTable';
import { adminService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import notify from '../../utils/notify';
import i18next from 'i18next';

const PatientManagement = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers();
      // Filter for patients role
      setPatients(res.data.filter(u => u.role === 'patient'));
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

  const deletePatient = async (id) => {
    if (window.confirm(t('admin.patientRegistry.confirmDelete'))) {
      try {
        await adminService.deleteUser(id);
        notify.success(t('notify.updateSuccess'));
        fetchData();
      } catch (err) {
        notify.error(t('notify.updateError'));
      }
    }
  };

  const columns = [
    { 
      header: t('admin.patientRegistry.identity'), 
      render: (row) => (
        <div className="d-flex align-items-center">
          <div className="bg-success-light p-2 rounded-lg me-3 text-success">
             <FaUserCircle className="fs-4" />
          </div>
          <div>
            <div className="fw-bold">{row.first_name ? `${row.first_name} ${row.last_name}` : t('admin.patientRegistry.notProfiled')}</div>
            <div className="text-muted small">{row.email}</div>
          </div>
        </div>
      )
    },
    { header: t('common.username'), key: 'username', render: (row) => <span className="text-secondary fw-medium">@{row.username}</span> },
    { 
      header: t('admin.patientRegistry.registeredOn'), 
      render: (row) => <span className="small text-muted">{new Date(row.created_at).toLocaleDateString(i18next.language)}</span> 
    },
    { 
      header: t('common.status'), 
      render: () => <Badge bg="success-light" className="text-success border rounded-pill px-3">{t('admin.patientRegistry.activeFile')}</Badge> 
    },
    { 
      header: t('admin.patientRegistry.viewRecords'), 
      render: (row) => (
        <Button variant="outline-light" size="sm" className="text-primary border-0 bg-primary-light rounded-pill px-3">
          <FaHistory className="me-2" /> {t('admin.patientRegistry.viewRecords')}
        </Button>
      )
    },
    { 
      header: t('common.actions'), 
      render: (row) => (
        <Button variant="link" className="text-danger p-0 ms-3" onClick={() => deletePatient(row.id)}>
          <FaTrash />
        </Button>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">{t('admin.patientRegistry.title')}</h2>
        <p className="text-muted mb-0">{t('admin.patientRegistry.subtitle')}</p>
      </div>

      {error && <Alert variant="danger" className="rounded-lg shadow-sm">{error}</Alert>}

      <DataTable 
        data={patients} 
        columns={columns} 
        loading={loading} 
        onRefresh={fetchData} 
        searchPlaceholder={t('common.username')}
        searchKey="username"
      />
    </div>
  );
};

export default PatientManagement;

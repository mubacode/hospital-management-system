import React, { useState } from 'react';
import { Table, Form, InputGroup, Spinner, Button, Card } from 'react-bootstrap';
import { FaSearch, FaSync } from 'react-icons/fa';

/**
 * @param {Array} data - Array of objects to display
 * @param {Array} columns - Column configuration [{ header: 'Name', key: 'username', render: (row) => ... }]
 * @param {Boolean} loading - Loading state
 * @param {Function} onRefresh - Refresh callback
 * @param {String} searchKey - Key to filter data by (common: 'username' or 'name')
 */
const DataTable = ({ 
  data = [], 
  columns = [], 
  loading = false, 
  onRefresh, 
  searchPlaceholder = 'Search records...',
  searchKey = 'username'
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(item => {
    const val = item[searchKey] || '';
    return val.toString().toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <Card.Header className="bg-white py-3 border-0 d-flex justify-content-between align-items-center">
        <InputGroup className="w-50 shadow-sm rounded-pill overflow-hidden border">
          <InputGroup.Text className="bg-white border-0">
            <FaSearch className="text-muted" />
          </InputGroup.Text>
          <Form.Control
            placeholder={searchPlaceholder}
            className="border-0 shadow-none py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        
        {onRefresh && (
          <Button variant="light" size="sm" className="rounded-pill border px-3" onClick={onRefresh} disabled={loading}>
            <FaSync className={loading ? 'fa-spin' : ''} />
          </Button>
        )}
      </Card.Header>

      <Table responsive hover className="mb-0">
        <thead className="bg-light text-muted small fw-bold text-uppercase">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={`py-3 border-0 ${idx === 0 ? 'ps-4' : ''} ${idx === columns.length - 1 ? 'pe-4 text-end' : ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-5">
                <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                <span className="text-muted small fw-medium">Loading protocol...</span>
              </td>
            </tr>
          ) : filteredData.length > 0 ? (
            filteredData.map((row, rowIdx) => (
              <tr key={rowIdx} className="transition align-middle">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`py-3 ${colIdx === 0 ? 'ps-4' : ''} ${colIdx === columns.length - 1 ? 'pe-4 text-end' : ''}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center py-5 text-muted small">
                No matching records found in the system.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Card>
  );
};

export default DataTable;

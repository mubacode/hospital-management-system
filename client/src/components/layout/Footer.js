import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaHospital, FaHeart } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-white py-5 mt-auto border-top">
      <Container>
        <Row className="gy-4">
          <Col lg={4}>
            <div className="d-flex align-items-center fw-bold text-primary fs-4 mb-3">
              <FaHospital className="me-2" />
              <span style={{ fontFamily: 'Outfit' }}>CarePlus</span>
            </div>
            <p className="text-muted small">
              A state-of-the-art hospital management system designed to provide seamless healthcare experiences for patients and medical staff alike.
            </p>
          </Col>
          <Col md={4} lg={2}>
            <h6 className="fw-bold mb-3">Company</h6>
            <ul className="list-unstyled text-muted small">
              <li className="mb-2">About Us</li>
              <li className="mb-2">Our Specialists</li>
              <li className="mb-2">Contact</li>
            </ul>
          </Col>
          <Col md={4} lg={2}>
            <h6 className="fw-bold mb-3">Support</h6>
            <ul className="list-unstyled text-muted small">
              <li className="mb-2">Help Center</li>
              <li className="mb-2">Privacy Policy</li>
              <li className="mb-2">Terms of Service</li>
            </ul>
          </Col>
          <Col md={4} lg={4}>
            <h6 className="fw-bold mb-3">Stay Connected</h6>
            <p className="text-muted small mb-0">
              Subscribe to our newsletter for health tips and system updates.
            </p>
          </Col>
        </Row>
        <hr className="my-4 opacity-10" />
        <Row>
          <Col md={6}>
            <p className="small text-muted mb-0">
              © {new Date().getFullYear()} CarePlus Hospital Management. All rights reserved.
            </p>
          </Col>
          <Col md={6} className="text-md-end">
            <p className="small text-muted mb-0">
              Made with <FaHeart className="text-danger mx-1" /> for better healthcare.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;

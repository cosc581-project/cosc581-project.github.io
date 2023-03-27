
import React from "react";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

export default function NavbarComponent(props) {
  return (
    <Navbar bg="dark" variant="dark"  >
          <Navbar.Brand className="ms-5" >Demos</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link onClick={() => props.setState('basicMesh')}>Basic Mesh</Nav.Link>
            <Nav.Link onClick={() => props.setState('algorithm')}>Algorithm</Nav.Link>
            <Nav.Link onClick={() => props.setState('rendering')}>Rendering</Nav.Link>
          </Nav>
      </Navbar>
    );
}

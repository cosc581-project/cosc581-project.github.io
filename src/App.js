import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from "react";
import { useState } from 'react'
import NavbarComponent from './components/Navbar';
import BasicMesh from './components/BasicMesh';
import Algorithm from './components/Algorithm';
import Rendering from './components/Rendering';
export default function App() {
  const [state, setState] = useState('rendering')
  return (
    <main>
      <NavbarComponent state={state} setState={setState} />
      {state === 'basicMesh' && <BasicMesh />}
      {state === 'algorithm' && <Algorithm />}
      {state === 'rendering' && <Rendering />}
    </main>
  );
}


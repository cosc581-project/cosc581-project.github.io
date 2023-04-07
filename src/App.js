import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from "react";
import { useState } from 'react'
import NavbarComponent from './components/Navbar';

import VertexNormals from './components/VertexNormals';
import BasicMesh from './components/BasicMesh';
import Algorithm from './components/Algorithm';
import Rendering from './components/Rendering';

export default function App() {
  const [state, setState] = useState('vertexNormals')
  return (
    <main>
      <NavbarComponent state={state} setState={setState} />
      {state === 'vertexNormals' && <VertexNormals />}
      {state === 'basicMesh' && <BasicMesh />}
      {state === 'algorithm' && <Algorithm />}
      {state === 'rendering' && <Rendering />}
    </main>
  );
}


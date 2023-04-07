import React, { useState, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useLoader } from '@react-three/fiber'
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import Card from "react-bootstrap/Card";
import PrettyObjLoader from "./PrettyObjLoader";
const base = '/models/';
let objs = {
  bunny: {url: `${base}bunny-colored.obj`, name: 'Bunny', type: 'basic'},
  sphere: {url: `${base}sphere-colored.obj`, name: 'Sphere', type: 'basic'},
  teapot: {url: `${base}teapot-colored.obj`, name: 'Teapot', type: 'basic'},
}

export default function Pretty() {
  const [objName, setObjName] = useState('bunny');

  return (
    <div style={{
        display: 'flex',  
        justifyContent:'center', 
        alignItems:'center', 
        height: '100%',
        margin: '20px',
      }}
        >
      <Card style={{ width: '100%', hieght: '100%' }}>
        <Card.Body>
          <Card.Title>Rendering Meshes</Card.Title>
            <div style={{ height: '500px' }}>
            {/* <Canvas camera={camera}> */}
            <Canvas camera={{ position: [0, 0, 3], fov: 40}}>
              <ambientLight
                color={"#000000"} 
                intensity={0.25} 
              />
              <pointLight 
                position={[2,1,3]} 
                color="#ffffff"
              />
              <OrbitControls minDistance={1} maxDistance={200} target={[0, 0, 0]}/>
              <PrettyObjLoader url={objs[objName].url} />
            </Canvas>

            </div>
          <Card.Footer>
            Rendering Meshes with stylized lighting and materials.
            <DropdownButton 
              title={objs[objName].name}
              onSelect={setObjName} 
              >
              {
                Object.keys(objs).map((objName) => {
                  return <Dropdown.Item key={objName} eventKey={objName}>{objs[objName].name}</Dropdown.Item>
                })
              }
            </DropdownButton>
          {/* </Dropdown> */}
          </Card.Footer>
        </Card.Body>
      </Card>
    </div>
  );
}
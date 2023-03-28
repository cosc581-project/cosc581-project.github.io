import React, {  useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useLoader } from '@react-three/fiber'
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import Card from "react-bootstrap/Card";
import BasicObjLoader from "./BasicObjLoader";
import StripObjLoader from "./StripObjLoader";
const base = '/models/';
let objs = {
  bunnyBasic: {url: `${base}bunny-colored.obj`, name: 'Bunny(Basic)', type: 'basic'},
  bunnyStrip: {url: `${base}bunny-tristrip.obj`, name: 'Bunny(Strip)', type: 'strip'},
  sphereBasic: {url: `${base}sphere-colored.obj`, name: 'Sphere(Basic)', type: 'basic'},
  sphereStrip: {url: `${base}sphere-tristrip.obj`, name: 'Sphere(Strip)', type: 'strip'},
  teapotBasic: {url: `${base}teapot-colored.obj`, name: 'Teapot(Basic)', type: 'basic'},
  teapotStrip: {url: `${base}teapot-tristrip.obj`, name: 'Teapot(Strip)', type: 'strip'},
}

export default function Rendering() {
  const [objName, setObjName] = useState('bunnyStrip');
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
            <Canvas camera={{ position: [0, 0, 5], fov: 40}}>
              <ambientLight intensity={1} />
              <OrbitControls minDistance={1} maxDistance={200} target={[0, 0, 0]}/>
              {/* <group> */}
              { objs[objName].type === 'basic' 
                ? BasicObjLoader({url: objs[objName].url})
                : StripObjLoader({url: objs[objName].url})
              }
              {/* </group> */}
            </Canvas>

            </div>
          <Card.Footer>
            Rendering Basic Triangular Meshes and Triangle Strips.


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
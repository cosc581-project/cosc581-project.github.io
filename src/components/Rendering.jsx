import React, { useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useLoader } from '@react-three/fiber'
import Dropdown from 'react-bootstrap/Dropdown';
import Card from "react-bootstrap/Card";
import ObjToPrimitive from "./ObjToPrimitive";

let objs = {
  bunny: { scale: [7,7,7], url: '/models/bunny.obj' },
  cube: { scale: [1,1,1], url: '/models/cube.obj' },
  sphere: { scale: [1,1,1], url: '/models/sphere.obj' },
  nefertiti: { scale: [0.5, 0.5, 0.5], url: '/models/nerfertiti.obj' },
}

export default function Rendering() {
  const [objName, setObjName] = useState('bunny');
  const curObj = objs[objName];
  console.log(objName)
  const mat = new THREE.MeshBasicMaterial({vertexColors:true})

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
          <Card.Title>Basic Triangular Mesh</Card.Title>
            <div style={{ height: '500px' }}>
            <Canvas camera={{ position: [0, 0, 5], fov: 40}}>
              <ambientLight intensity={1} />
              <OrbitControls minDistance={1} maxDistance={200} target={[0 , 0, 0]}/>
              <mesh position={[0, 0, 0]} scale={curObj.scale} >
                {ObjToPrimitive({url: objs[objName].url, mat})}
              </mesh>
            </Canvas>
            </div>
          <Card.Footer>
            Wireframes of meshes for various shapes.

            <Dropdown>
            <Dropdown.Toggle variant="primary" id="dropdown-basic">
              Mesh
            </Dropdown.Toggle>

            <Dropdown.Menu >
              {
                Object.keys(objs).map((objName) => {
                  return <Dropdown.Item key={objName} onSelect={()=>setObjName(objName)}>{objName}</Dropdown.Item>
                })
              }
              {/* <Dropdown.Item >Action</Dropdown.Item>
              <Dropdown.Item >Another action</Dropdown.Item>
              <Dropdown.Item >Something else</Dropdown.Item> */}
            </Dropdown.Menu>
          </Dropdown>
          </Card.Footer>
        </Card.Body>
      </Card>
    </div>
  );
}
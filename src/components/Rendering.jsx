import React, {  useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useLoader } from '@react-three/fiber'
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import Card from "react-bootstrap/Card";
import ObjToPrimitive from "./ObjToPrimitive";
const base = '/cosc581-project.github.io/models/';
let objs = {
  bunny: `${base}bunny-colored.obj`,
  // cube: { scale: [1,1,1], url: '/models/cube.obj' },
  sphere: `${base}sphere-colored.obj`,
  // nefertiti: { scale: [0.5, 0.5, 0.5], url: '/models/nerfertiti.obj' },
}

export default function Rendering() {
  const [objName, setObjName] = useState('bunny');
  // const curObj = objs[objName];
  // console.log(objName)
  // console.log(objs[objName])
  // function handleSelect(e) {
  //   console.log('here')
  //   console.log(e)
  //   // setObjName(e);
  // }
  const handleSelect=(e)=>{
    console.log(e);
    setObjName(e);
  }
  var models = {

  };

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
              {/* <hemisphereLight intensity={0.35} /> */}
              <OrbitControls minDistance={1} maxDistance={200} target={[0, 0, 0]}/>
              {/* <mesh> */}
              {ObjToPrimitive({url: objs[objName]})}
              {/* </mesh> */}
            </Canvas>
            </div>
          <Card.Footer>
            Wireframes of meshes for various shapes.


            <DropdownButton 
              title={objName}
              onSelect={handleSelect} 
              >
              {
                Object.keys(objs).map((objName) => {
                  return <Dropdown.Item key={objName} eventKey={objName}>{objName}</Dropdown.Item>
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
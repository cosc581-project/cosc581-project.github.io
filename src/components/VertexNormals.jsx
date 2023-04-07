import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import * as THREE from "three";
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';

function CreateWavePlane() {
  const plane = new THREE.PlaneGeometry(10, 10, 5, 5);
  const vertices = plane.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    var x = vertices.getX( i );
    var y = vertices.getY( i );
    var z = vertices.getZ( i );
    z = Math.cos(x) + Math.sin(y);
    vertices.setXYZ( i, x, y, z );
  }
  plane.verticesNeedUpdate = true;
  plane.computeVertexNormals();
  return plane;

}

export default function VertexNormals() {
  const mesh = new THREE.Mesh(
    CreateWavePlane(),
    new THREE.MeshBasicMaterial({ color: "#049ef4", wireframe: true })
  );
  const helper = new VertexNormalsHelper(mesh, 0.5, 0xff0000)

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
          <Card.Title>Vertex Normals</Card.Title>
            <div style={{ height: '500px' }}>
            <Canvas camera={{ position: [0, -10, 10], fov: 40}}>
              <ambientLight intensity={0.2} />
              <hemisphereLight intensity={0.35} />
              <primitive object={mesh} />
              <primitive object={helper} />
              <OrbitControls minDistance={1} maxDistance={200} target={[0 , 0, 0]}/>
            </Canvas>
            </div>
          <Card.Footer>
            Wireframes to display vertex normals.
          </Card.Footer>
        </Card.Body>
      </Card>
    </div>
  );
}
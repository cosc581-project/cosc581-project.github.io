import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';

export default function BasicMesh() {
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
              {/* ground */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                <planeGeometry attach="geometry" args={[10, 10]} />
                <meshStandardMaterial color="#d3d3d3" />
              </mesh>
              <mesh position={[-2, 0, 0]}>
                <boxGeometry args={[1, 1, 1, 2, 2, 2]} />
                <meshBasicMaterial color="#049ef4" wireframe={true} />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.5, 10, 10]} />
                <meshBasicMaterial color="#049ef4" wireframe={true} />
              </mesh>
              <mesh position={[2, 0, 0]}>
                <cylinderGeometry args={[0, 0.5, 1]} />
                <meshBasicMaterial color="#049ef4" wireframe={true} />
              </mesh>
              <OrbitControls minDistance={1} maxDistance={200} target={[0 , 0, 0]}/>
            </Canvas>
            </div>
          <Card.Footer>
            Wireframes of meshes for various shapes.
          </Card.Footer>
        </Card.Body>
      </Card>
    </div>
  );
}
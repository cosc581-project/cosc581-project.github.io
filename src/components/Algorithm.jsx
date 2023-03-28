import * as THREE from "three";
import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import Card from "react-bootstrap/Card";
import { useState } from "react";
import Form from "react-bootstrap/Form";
import TriStrip from "./TriStrip";

function Point(props) {
  // x, y, color, radius=1
  const point = new THREE.Shape();
  const x = props.x;
  const y = props.y;
  const color = props.color;
  const radius = props.radius;
  const geometry = new THREE.SphereGeometry(radius, 32);
  const material = new THREE.MeshBasicMaterial({ color: color });
  return <mesh position={[x, y, 0]} geometry={geometry} material={material} />;
}

function Line(props) {
  // const line = new THREE.Shape();
  let x1 = props.x1;
  let y1 = props.y1;
  let x2 = props.x2;
  let y2 = props.y2;
  const w = props.w || 3;
  const color = props.color;
  const shape = new THREE.Shape();
  shape.setFromPoints([
    new THREE.Vector2(x1, y1),
    new THREE.Vector2(x2, y2),
    new THREE.Vector2(x1, y1),
  ]);
  const geometry = new THREE.ExtrudeBufferGeometry(shape, {
    steps: 1,
    depth: 0.01,
    bevelEnabled: false,
  });
  const material = new THREE.LineBasicMaterial({ color: color, linewidth: w });
  const line = new THREE.Line(geometry, material);
  return (
    <>
      { line !== null && <primitive object={line} />   }
    </>
  );
}

function Face(props) {
  let v1 = props.v1;
  let v2 = props.v2;
  let v3 = props.v3;
  const color = props.color;
  const face = new THREE.Shape();
  face.setFromPoints([
    new THREE.Vector2(v1.x, v1.y),
    new THREE.Vector2(v2.x, v2.y),
    new THREE.Vector2(v3.x, v3.y),
    new THREE.Vector2(v1.x, v1.y),
  ]);
  const geometry = new THREE.ExtrudeGeometry(face, {
    steps: 1,
    depth: 0.001,
    bevelEnabled: false,
  });
  const material = new THREE.MeshBasicMaterial({ color: color });
  return (
    <>
    <mesh position={[0, 0, 0]} geometry={geometry} material={material} />
    </>
  );
}

function TriangleGrid(props) {
  let vertices = props.vertices;
  let faces = props.faces;
  let edges = props.edges;
  let colors = props.colors;
  let points = [];
  let lines = [];
  let facesComp = [];
  for (let i = 0; i < vertices.length; i++) {
    points.push({
      x: vertices[i].x,
      y: vertices[i].y,
      color: colors.vertices[i],
      radius: 0.1,
    });
  }

  for (let i = 0; i < edges.length; i++) {
    let edge = edges[i];
    lines.push({
      x1: vertices[edge[0]].x,
      y1: vertices[edge[0]].y,
      x2: vertices[edge[1]].x,
      y2: vertices[edge[1]].y,
      color: colors.edges[i],
    });
  }

  for (let i = 0; i < faces.length; i++) {
    let face = faces[i];
    facesComp.push({ 
      v1: vertices[face[0]], 
      v2: vertices[face[1]], 
      v3: vertices[face[2]], 
      color: colors.faces[i] 
    });
  }
  return (
    <>
      {facesComp.map((face, index) => {
        return (
          <Face
            key={index}
            v1={face.v1}
            v2={face.v2}
            v3={face.v3}
            color={face.color}
          />
        );
      })}
      {lines.map((line, index) => {
        return (
          <Line
            key={index}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            color={line.color}
          />
        );
      })}
      {points.map((point, index) => {
        return (
          <Point
            key={index}
            x={point.x}
            y={point.y}
            color={point.color}
            radius={point.radius}
          />
        );
      })}
    </>
  );
}



class Graph extends React.Component {
  constructor(props) {
    super(props);
    // this.state = {
    //   vertices: props.vertices,
    //   faces: props.faces,
    //   edges: props.edges,
    //   animation: props.animation,
    // };
  }
  render() {
    return (
      <TriangleGrid
        faces={this.props.faces}
        vertices={this.props.vertices}
        edges={this.props.edges}
        colors={this.props.animation[this.props.timestep]}
      />
    );
  }
}

export default function Algorithm() {
  const [timestep, setTimestep] = useState(0);

  // Get data for the animation
  let data = getAnimationData();
  let vertices = data.vertices;
  let faces = data.faces;
  let edges = data.edges;
  let animation = data.animation;
  let cameraPosition = data.cameraPosition;
  let cameraTarget = data.cameraTarget;

  // To play animation
  // https://stackoverflow.com/questions/65608079/slide-up-down-animation-in-the-react-native 
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        margin: "20px",
      }}
    >
      <Card style={{ width: "100%", hieght: "100%" }}>
        <Card.Body>
          <Card.Title>Creating Triangle Strips</Card.Title>
          {/* <Card.Text> */}
          <div style={{ height: "500px" }}>
            <Canvas camera={{ position: cameraPosition, fov: 60 }}>
              <ambientLight intensity={1} />
              <OrbitControls  target={cameraTarget}/>
              <Graph
                vertices={vertices}
                faces={faces}
                edges={edges}
                animation={animation}
                timestep={timestep}
              />
            </Canvas>
          </div>
          {/* </Card.Text> */}
          <Card.Footer>
            <Form.Label>Step:</Form.Label>
            <Form.Range
              value={timestep}
              onChange={(e) => setTimestep(e.target.value)}
              min={0}
              max={animation.length-1}
            />
            Stepping through triangle strip generation algorithm.
          </Card.Footer>
        </Card.Body>
      </Card>
    </div>
  );
}

const ACTIVE_FACE = "#FFA52C";
const ACTIVE_EDGE = "#FF0000";
const ACTIVE_VERTEX = "#FF0000";
const DEFAULT_FACE = "#d3d3d3";
const DEFAULT_EDGE = "#000000";
const DEFAULT_VERTEX = "#000000";
const SELECTED_FACE = "#74A16D";
const SELECTED_EDGE = "#FF0000";
const SELECTED_VERTEX = "#FF0000";
const STRIP_COLORS = [
  "#74A16D",
  "#BD5391",
  "#744796",
  "#4A9EE7"
];
function processAnimationData(vertices, edges, faces, data) {
  let animation = [];
  // lengths
  let nV = vertices.length;
  let nF = faces.length;
  let nE = edges.length;
  // some default colors for each
  let vDefault = Array(nV).fill(DEFAULT_VERTEX); 
  let fDefault = Array(nF).fill(DEFAULT_FACE); 
  let eDefault = Array(nE).fill(DEFAULT_EDGE);
  animation.push({
    vertices: vDefault,
    faces: fDefault,
    edges: eDefault,
  })
  for (let i = 0; i < data.length; i++) {
    let frame = data[i];
    let strip = frame.strip;
    let faces = frame.faces;
    let allStrips = frame.allStrips;
    let allFaces = frame.allFaces;
    let vColor = [...vDefault];
    let fColor = [...fDefault];
    let eColor = [...eDefault];
    if (strip !== undefined) {
      for (let j = 0; j < strip.length; j++) {
        vColor[strip[j]] = ACTIVE_VERTEX;
      }
    }
    for (let j = 0; j < allFaces.length; j++) {
      let faceList = allFaces[j];
      for (let k = 0; k < faceList.length; k++) {
        fColor[faceList[k]] = STRIP_COLORS[j % STRIP_COLORS.length];
      }
    }
    if (faces !== undefined) {
      for (let j = 0; j < faces.length; j++) {
        fColor[faces[j]] = ACTIVE_FACE;
      }
    }
    animation.push({
      vertices: vColor,
      faces: fColor,
      edges: eColor,
    })
  }
  return animation;
}
function getEdgesFromFaces(faces) {
  let edges = [];
  for (let i = 0; i < faces.length; i++) {
    let face = faces[i];
    edges.push(face[0] < face[1] ? [face[0], face[1]] : [face[1], face[0]]);
    edges.push(face[1] < face[2] ? [face[1], face[2]] : [face[2], face[1]]);
    edges.push(face[2] < face[0] ? [face[2], face[0]] : [face[0], face[2]]);
  }
  // remove duplicates
  edges = Array.from(new Set(edges.map(JSON.stringify)), JSON.parse);
  return edges;
}
function getAnimationData() {
  let vertices = [
    { x: 0, y: 0, z: 0 }, // v1
    { x: 1, y: 0, z: 0 }, // v2
    { x: 2, y: 0, z: 0 }, // v3
    { x: 3, y: 0, z: 0 }, // v4
    { x: 0, y: 1, z: 0 }, // v5
    { x: 1, y: 1, z: 0 }, // v6
    { x: 2, y: 1, z: 0 }, // v7
    { x: 3, y: 1, z: 0 }, // v8
    { x: 1, y: 2, z: 0 }, // v9
    { x: 2, y: 2, z: 0 }, // v10
    { x: 1, y: 3, z: 0 }, // v11
    { x: 2, y: 3, z: 0 }, // v12
    { x: 3, y: 2, z: 0 }, // v13
  ];
  let faces = [
    [0, 1, 5],
    [0, 5, 4],
    [1, 2, 6],
    [1, 6, 5],
    [2, 3, 7],
    [2, 7, 6],
    [4, 5, 8],
    [5, 9, 8],
    [5, 6, 9],
    [6, 7, 9],
    [8, 9, 10],
    [9, 11, 10],
    [9, 12, 7],
  ]
  let edges = getEdgesFromFaces(faces);
  // let vertices = [
  //   { x: 0, y: 0, z: 0 }, // v0
  //   { x: 1, y: 2, z: 0 }, // v1
  //   { x: 2, y: 0, z: 0 }, // v2
  //   { x: 3, y: 2, z: 0 }, // v3
  //   { x: 4, y: 0, z: 0 }, // v4
  //   { x: 5, y: 2, z: 0 }, // v5
  //   { x: 6, y: 0, z: 0 }, // v6
  //   { x: 7, y: 2, z: 0 }, // v7
  // ];
  // let faces = [
  //   [0, 1, 2], // f0: v0, v1, v2
  //   [1, 2, 3], // f1: v1, v2, v3
  //   [2, 3, 4], // f2: v2, v3, v4
  //   [3, 4, 5], // f3: v3, v4, v5
  //   [4, 5, 6], // f4: v4, v5, v6
  //   [5, 6, 7], // f5: v5, v6, v7
  // ];
  // let edges =  [
  //   [0, 1], // e0: f0
  //   [1, 2], // e1: f0, f1
  //   [0, 2], // e2: f0
  //   [2, 3], // e3: f1, f2 
  //   [1, 3], // e4: f1
  //   [3, 4], // e5: f2, f3
  //   [2, 4], // e6: f2
  //   [4, 5], // e7: f3, f4
  //   [3, 5], // e8: f3
  //   [5, 6], // e9: f4, f5
  //   [4, 6], // e10: f4
  //   [6, 7], // e11: f5
  //   [5, 7], // e12: f5
  // ];
  let ts = new TriStrip([...vertices], [...faces]);
  let iter = ts.iterate ();
  let frame = null;
  let i = 0
  let animationData = [];
  do {
    frame = iter.next();
    // console.log(frame)
    if (frame.value !== undefined) {
      animationData.push(frame.value);
    }
    // i++;
    // if (i > 200) {
    //   break;
    // }
  } while(!frame.done)

  
  // console.log("HHERERERER")
  // console.log(animationData)


  let animation = processAnimationData(vertices, edges, faces, animationData);
  // // t0
  // animation.push({ 
  //     vertices: vDefault,
  //     faces:    fDefault,
  //     edges:    eDefault,
  // });

  // // t1
  // fColor[0] = ACTIVE_FACE;
  // animation.push({
  //   vertices: vDefault,
  //   edges: eDefault,
  //   faces: fColor,
  // });
  
  // // t2
  // vColor[0] = ACTIVE_VERTEX;
  // animation.push({
  //   vertices: vColor,
  //   edges: eDefault,
  //   faces: fColor,
  // });

  return {
    vertices: vertices,
    faces: faces,
    edges: edges,
    animation: animation,
    cameraPosition: [3.5, 1, 5],
    cameraTarget: [3.5, 1, 0]
  };
}

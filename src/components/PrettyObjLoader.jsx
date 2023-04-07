import React, { useMemo, useState, useRef } from "react";
// import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import * as THREE from "three";
import {  useFrame } from "@react-three/fiber";

import { Mesh } from "three";
import OBJData from "./obj-loader";

async function loadNetworkResourceAsText(resource){
  const response = await fetch(resource);
  const asText = await response.text();
  return asText;
}

export default function PrettyObjLoader({ url, ref }) {
  const [obj, setObj] = useState(<></>);
  var meshRef = useRef();
  useFrame(() => {
    if (meshRef.current){
      meshRef.current.rotation.y += 0.01;
    }
  });
  let mesh = null
  function loadObj(url){
    loadNetworkResourceAsText(url).then((objData) => {
      let geometry = new THREE.BufferGeometry();
      let material = new THREE.MeshPhongMaterial({
        color :"#049ef4",
        emissive: "#000000",
        specular: "#111111",
        shininess: 105,
        reflectivity: 1,
        refractionRatio: 0.98,
        flatShading: false,
      })
      // let material = new THREE.MeshBasicMaterial({vertexColors:false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1})

      const rawData = new OBJData(objData).getFlattenedDataFromModelAtIndex(0);
      const vertices = new Float32Array(rawData.vertices);
      const normals = new Float32Array(rawData.normals);
      const vertexColors = new Float32Array(rawData.colors);
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3));
      console.log(new THREE.BufferAttribute(normals, 3))
      geometry.scale(rawData.scalingVector[0], rawData.scalingVector[0], rawData.scalingVector[0]);
      console.log(geometry)
      // geometry.computeVertexNormals();
      console.log(geometry)
      mesh = new THREE.Mesh(geometry, material);
      // var geo = new THREE.WireframeGeometry( geometry );
      // var mat = new THREE.LineBasicMaterial( { color: "black", linewidth: 1 } );
      // var wireframe = new THREE.LineSegments( geo, mat );
      // mesh.add( wireframe );
      
      setObj(
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
      />

      );
      // setObj(<primitive ref={ref} object={mesh} dispose={null}/>);
    });
  }

  useMemo(() => loadObj(url), [url]);
  
  return obj;
}


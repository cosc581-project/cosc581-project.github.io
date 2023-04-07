import React, { useMemo, useState } from "react";
// import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import * as THREE from "three";

import { Mesh } from "three";
import OBJData from "./obj-loader";

async function loadNetworkResourceAsText(resource){
  const response = await fetch(resource);
  const asText = await response.text();
  return asText;
}

export default function BasicObjLoader({ url }) {
  const [obj, setObj] = useState(<></>);
  let mesh = null
  function loadObj(url){
    loadNetworkResourceAsText(url).then((objData) => {
      let geometry = new THREE.BufferGeometry();
      let material = new THREE.MeshBasicMaterial({vertexColors:true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1})

      const rawData = new OBJData(objData).getFlattenedDataFromModelAtIndex(0);
      console.log(rawData)
      const vertices = new Float32Array(rawData.vertices);
      const normals = new Float32Array(rawData.normals);
      const vertexColors = new Float32Array(rawData.colors);
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geometry.setAttribute('normals', new THREE.BufferAttribute(normals, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3));
      geometry.scale(rawData.scalingVector[0], rawData.scalingVector[0], rawData.scalingVector[0]);
      mesh = new THREE.Mesh(geometry, material);
      var geo = new THREE.WireframeGeometry( geometry );
      var mat = new THREE.LineBasicMaterial( { color: "black", linewidth: 1 } );
      var wireframe = new THREE.LineSegments( geo, mat );
      mesh.add( wireframe );
      setObj(<primitive object={mesh} dispose={null}/>);
    });
  }

  useMemo(() => loadObj(url), [url]);
  
  return obj;
}


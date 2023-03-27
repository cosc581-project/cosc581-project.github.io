import React, { useMemo, useState } from "react";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import * as THREE from "three";

import { Mesh } from "three";

export default function ObjToPrimitive({ url, mat }) {
  const [obj, setObj] = useState();
  useMemo(() => new OBJLoader().load(url, setObj), [url]);
  if (obj) {
    obj.traverse((child) => {
      if (child instanceof Mesh) {
        const positionAttribute = child.geometry.getAttribute("position");
        const colors = [];
		const color = new THREE.Color();
		for ( let i = 0; i < positionAttribute.count; i += 3 ) {
			color.set( Math.random() * 0xffffff );
			colors.push( color.r, color.g, color.b );
			colors.push( color.r, color.g, color.b );
			colors.push( color.r, color.g, color.b );
		}
        child.geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
        child.material = mat;
      }
    });
    return <primitive object={obj} />;
  }
  return null;
}
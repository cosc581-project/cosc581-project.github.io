

class AdjTriangle {
  constructor() {
    this.v_ref = [null, null, null];
    this.a_tri = [null, null, null];
  }
  findEdge(v0, v1) {
    if (this.v_ref[0] === v0 && this.v_ref[1] === v1) return 0;
    if (this.v_ref[0] === v1 && this.v_ref[1] === v0) return 0;
    if (this.v_ref[0] === v0 && this.v_ref[2] === v1) return 1;
    if (this.v_ref[0] === v1 && this.v_ref[2] === v0) return 1;
    if (this.v_ref[1] === v0 && this.v_ref[2] === v1) return 2;
    if (this.v_ref[1] === v1 && this.v_ref[2] === v0) return 2;
    return null;
  }

  getOppositeVertex(v0, v1) {
    if (this.v_ref[0] === v0 && this.v_ref[1] === v1) return this.v_ref[2];
    if (this.v_ref[0] === v1 && this.v_ref[1] === v0) return this.v_ref[2];
    if (this.v_ref[0] === v0 && this.v_ref[2] === v1) return this.v_ref[1];
    if (this.v_ref[0] === v1 && this.v_ref[2] === v0) return this.v_ref[1];
    if (this.v_ref[1] === v0 && this.v_ref[2] === v1) return this.v_ref[0];
    if (this.v_ref[1] === v1 && this.v_ref[2] === v0) return this.v_ref[0];
    return null;
  }
}

class AdjEdge {
  constructor() {
    this.ref0 = null;
    this.ref1 = null;
    this.face_nb = null;
  }
}

class AdjMesh {
  vertices = null;
  faces = null;
  n_faces = null;
  n_vertices = null;
  n_edges = null;
  edges = null;
  triangles = null;
  constructor(vertices, faces) {
    this.vertices = vertices;
    this.faces = faces;
    this.n_faces = faces.length;
    this.n_vertices = vertices.length;
    this.edges = [];
    this.triangles = [];
    // create edges and triangles
    this.createEdgeAndTriangles();
    // sort edges
    this.sortEdges();
    // create links between adjacent faces
    this.createAdjacency();
  }

  createEdgeAndTriangles() {
    for (let i = 0; i < this.n_faces; i++) {
      let face = this.faces[i];
      let triangle = new AdjTriangle();
      triangle.v_ref = face;
      for (let j = 0; j < 3; j++) {
        let edge = new AdjEdge();
        edge.face_nb = i;
        edge.ref0 = face[j];
        edge.ref1 = face[(j + 1) % 3];
        if (edge.ref0 > edge.ref1) {
          let temp = edge.ref0;
          edge.ref0 = edge.ref1;
          edge.ref1 = temp;
        }
        this.edges.push(edge);
      }
      this.triangles.push(triangle);
    }
    this.n_edges = this.edges.length;
  }

  sortEdges() {
    this.edges.sort((a, b) => {
      if (a.face_nb < b.face_nb) return -1;
      if (a.face_nb > b.face_nb) return 1;
      return 0;
    });
    this.edges.sort((a, b) => {
      if (a.ref0 < b.ref0) return -1;
      if (a.ref0 > b.ref0) return 1;
      return 0;
    });
    this.edges.sort((a, b) => {
      if (a.ref1 < b.ref1) return -1;
      if (a.ref1 > b.ref1) return 1;
      return 0;
    });
  }

  updateLink(firsttri, secondtri, ref0, ref1) {
    let tri0 = this.triangles[firsttri];
    let tri1 = this.triangles[secondtri];
    let edge0 = tri0.findEdge(ref0, ref1);
    let edge1 = tri1.findEdge(ref0, ref1);

    if (edge0 == null || edge1 == null) {
      return false;
    }
    this.triangles[firsttri].a_tri[edge0] = secondtri;
    this.triangles[secondtri].a_tri[edge1] = firsttri;
    return true;
  }

  createAdjacency() {
    let last_ref0 = this.edges[0].ref0;
    let last_ref1 = this.edges[0].ref1;
    let count = 0;
    let tmpBuffer = [];
    for (let i = 0; i < this.n_edges; i++) {
      let face = this.edges[i].face_nb;
      let ref0 = this.edges[i].ref0;
      let ref1 = this.edges[i].ref1;

      if (ref0 === last_ref0 && ref1 === last_ref1) {
        tmpBuffer.push(face);
        count++;
        if (count > 2) {
          console.error("More than 2 triangles share an edge");
        }
      }
      else {
        if (count == 2) {
          let status = this.updateLink(tmpBuffer[0], tmpBuffer[1], last_ref0, last_ref1)
          if (!status) {
            console.error("Error in updateLink");
          }
        }
        count = 1;
        tmpBuffer = [face];
        last_ref0 = ref0;
        last_ref1 = ref1;
      }
    }
    if (count == 2) {
      let status = this.updateLink(tmpBuffer[0], tmpBuffer[1], last_ref0, last_ref1)
      if (!status) {
        console.error("Error in updateLink");
      }
    }

  }
}

export default class TriStrip {
  adjMesh = null;
  connectivity = null;
  tags = null;
  constructor(vertices, faces) {
    this.adjMesh = new AdjMesh(vertices, faces);
    this.connectivity = this.getConnectivity();
  }

  getConnectivity() {
    let connectivity = [];
    for (let i = 0; i < this.adjMesh.triangles.length; i++) {
      let tri = this.adjMesh.triangles[i];
      let n = 0;
      for (let j = 0; j < 3; j++) {
        if (tri.a_tri[j] != null) {
          n++;
        }
      }
      connectivity.push({idx: i, n: n});
    }
    connectivity.sort((a, b) => {
      if (a.n < b.n) return -1;
      if (a.n > b.n) return 1;
      return 0;
    });
    return connectivity;
  }


  iterate = function* () {
    let connectivity = this.connectivity;
    let allStrips = [];
    let allFaces = [];
    let nTotalStripFaces = 0;
    let nFaces = this.adjMesh.n_faces;
    this.tags = new Array(nFaces).fill(false);
    let idx = 0;
    while (nTotalStripFaces != nFaces) {
      // search for a face thats not been used yet
      while (this.tags[connectivity[idx].idx]) {
        idx++;
      }
      let firstFace = connectivity[idx].idx;
      let stripData = null;
      let lastStripData = null;
      let iter = this.computeBestStrip(firstFace);
      while (true){
        stripData = iter.next();
        if (stripData.done) break;
        // console.log("[YIELD] FindStrips:", stripData.value)
        stripData.value['allStrips'] = [...allStrips];
        stripData.value['allFaces'] = [...allFaces];
        yield stripData.value;
        lastStripData = stripData;
      }
      stripData = stripData.value;
      // let stripData = this.computeBestStrip(firstFace);
      nTotalStripFaces += stripData.nStripFaces;
      allStrips.push(stripData.strip);
      allFaces.push(stripData.faces);
    }
    // console.log("[YIELD] FindStrips Final:", {strip: [...allStrips], faces: [...allFaces]})
    yield {allStrips: [...allStrips], allFaces: [...allFaces]};
  };

  walkStrip = function*(face, oldest, middle, tags) {
    let length = 2
    let strip = [oldest, middle];
    let faces = [];
    let walk = true;
    while (walk) {
      // console.log("[YIELD] WalkStrip:", {strip: [...strip], faces: [...faces], length: length, tags: [...tags]})
      yield {strip: [...strip], faces: [...faces], length: length, tags: [...tags]};

      // get third vertex of triangle
      let newest = this.adjMesh.triangles[face].getOppositeVertex(oldest, middle);
      strip.push(newest);
      faces.push(face);
      length++;
      tags[face] = true;

      // get edge id
      let currEdge = this.adjMesh.triangles[face].findEdge(middle, newest);
      let link = this.adjMesh.triangles[face].a_tri[currEdge];
      if (link == null) {
        walk = false;
      }
      else {
        face = link;
        if (tags[face]) {
          walk = false;
        }
      }
      oldest = middle;
      middle = newest;
    }
    // console.log("[YIELD] WalkStrip:", {strip: [...strip], faces: [...faces], length: length, tags: [...tags]})
    yield  {strip: [...strip], faces: [...faces], length: length, tags: [...tags]};
  }

  computeBestStrip = function*(face) {
    let stripsHist = [];
    let facesHist = [];
    let lengthHist = [];
    let firstLength = [];
    let tagsHist = [];

    // starting vertices
    let refs0 = [
      this.adjMesh.triangles[face].v_ref[0],
      this.adjMesh.triangles[face].v_ref[2],
      this.adjMesh.triangles[face].v_ref[1],
    ];
    let refs1 = [
      this.adjMesh.triangles[face].v_ref[1],
      this.adjMesh.triangles[face].v_ref[0],
      this.adjMesh.triangles[face].v_ref[2],
    ];

    for (let i = 0; i < 3; i++) {
      // compute initial strip and save length
      let tags = [...this.tags];
      let iter = this.walkStrip(face, refs0[i], refs1[i], tags);
      let oldWalkData = null;
      let walkData = null
      while (true) {
        walkData = iter.next();
        if (walkData.done) break;
        yield walkData.value;
        oldWalkData = walkData;
      }
      walkData = oldWalkData.value;
      // let walkData = this.walkStrip(face, refs0[i], refs1[i], tags);
      firstLength.push(walkData.length);
      let strip = walkData.strip;
      let faces = walkData.faces;

      // if (faces.length != this.adjMesh.n_faces){
      //   // reverse the first part of the strip
      //   strip.reverse();
      //   faces.reverse();

      //   // track the second part of the strip
      //   let newRef0 = strip[strip.length-3]
      //   let newRef1 = strip[strip.length-2]
      //   let iter2 = this.walkStrip(face, newRef0, newRef1, walkData.tags);
      //   let oldExtraWalkData = null;
      //   let extraWalkData = null;
      //   while (true) {
      //     extraWalkData = iter2.next();
      //     if (extraWalkData.done) break;
      //     yield extraWalkData.value;
      //     oldExtraWalkData = extraWalkData;
      //   }
      //   extraWalkData = oldExtraWalkData.value;

      //   // save histories
      //   lengthHist.push(walkData.length + extraWalkData.length - 3);
      //   tagsHist.push(extraWalkData.tags);
      //   stripsHist.push(strip.slice(0, -2).concat(extraWalkData.strip));
      //   facesHist.push(faces.slice(0, -1).concat(extraWalkData.faces));
      //   // console.log("[YIELD] ComputeBestStrip Reversed:", {strip: [...stripsHist[stripsHist.length-1]], faces: [...facesHist[facesHist.length-1]], nStripFaces: lengthHist[lengthHist.length-1] - 2})
      //   yield {
      //     strip: [...stripsHist[stripsHist.length-1]], 
      //     faces: [...facesHist[facesHist.length-1]], 
      //     nStripFaces: lengthHist[lengthHist.length-1] - 2
      //   };
      // }
      // else {
        // save histories
        lengthHist.push(walkData.length);
        tagsHist.push(walkData.tags);
        stripsHist.push(strip);
        facesHist.push(faces);
        // console.log("[YIELD] ComputeBestStrip Straight:", {strip: [...strip], faces: [...faces], nStripFaces: walkData.length - 2})
        yield {strip: [...strip], faces: [...faces], nStripFaces: walkData.length - 2};
      // }
    }
    // find the best strip
    let bestLength = getMaxOfArray(lengthHist);
    let bestIdx = lengthHist.indexOf(bestLength);
    let nFaces = bestLength - 2;
    // update tags
    this.tags = tagsHist[bestIdx];
    let strip = stripsHist[bestIdx];
    let faces = facesHist[bestIdx];

    // flip strip if needed
    // TODO - do this
    // console.log("[YIELD] ComputeBestStrip:", {strip: [...strip], faces: [...faces], nStripFaces: nFaces})
    return {strip: [...strip], faces: [...faces], nStripFaces: nFaces};
  }

}

function getMaxOfArray(numArray) {
  return Math.max.apply(null, numArray);
}
// import glMatrix from 'gl-matrix';
const glMatrix = require('gl-matrix');



export default class OBJData {
    constructor(fileContents) {
      this.fileContents = fileContents;
      this.parse(this.fileContents);
    }
  
    result = {
      models: [],
      materialLibraries: []
    };
    currentMaterial = '';
    currentGroup = '';
    currentColor = {r: 0.0, g: 0.0, b: 0.0, a: 1.0};
    smoothingGroup = 0;
    fileContents = null;
  
    parse() {
  
      const stripComment = (lineString) => {
        const commentIndex = lineString.indexOf('#');
        if (commentIndex > -1) { return lineString.substring(0, commentIndex); }
        return lineString;
      };
  
      const lines = this.fileContents.split('\n');
      for (let i = 0; i < lines.length; i += 1) {
        const line = stripComment(lines[i]);
  
        const lineItems = line.replace(/\s\s+/g, ' ').trim().split(' ');
        if (line.length <= 0) continue;
        switch (lineItems[0].toLowerCase()) {
          case 'o': // Start A New Model
            this.parseObject(lineItems);
            break;
          case 'g': // Start a new polygon group
            this.parseGroup(lineItems);
            break;
          case 'v': // Define a vertex for the current model
            this.parseVertexCoords(lineItems);
            break;
          case 'vt': // Texture Coords
            this.parseTextureCoords(lineItems);
            break;
          case 'vn': // Define a vertex normal for the current model
            this.parseVertexNormal(lineItems);
            break;
          case 's': // Smooth shading statement
            this.parseSmoothShadingStatement(lineItems);
            break;
          case 'f': // Define a Face/Polygon
            this.parsePolygon(lineItems);
            break;
          case 'fc': // Define a Face Color
            this.parseFaceColor(lineItems);
            break;
          case 'mtllib': // Reference to a material library file (.mtl)
            this.parseMtlLib(lineItems);
            break;
          case 'usemtl': // Sets the current material to be applied to polygons defined from this point forward
            this.parseUseMtl(lineItems);
            break;
          case '#':
            break;
          default:
            console.warn(`Unhandled obj statement at line #${i}: ${line}`);
            break;
        }
      }
  
      return this.result;
    }
  
    currentModel() {
      if (this.result.models.length == 0) {
        this.result.models.push({
          name: this.defaultModelName,
          vertices: [],
          textureCoords: [],
          vertexNormals: [],
          faces: [],
          n_face_colors: 0
        });
        this.currentGroup = '';
        this.smoothingGroup = 0;
      }
  
      return this.result.models[this.result.models.length - 1];
    }
  
    getModelAtIndex(index) {
      return this.result.models[index];
    }
  
    /**
     * getIndexableDataFromModelAtIndex - generates indexable raw geometry data for the model at specified index
     * @param {Number} index the index of the model you are interested in (multiple models may exist in one obj file) 
     */
    getIndexableDataFromModelAtIndex(index) {
      /*
      There is no guarantee this function works for 100% of obj models.
      This assumes for each vertex there is exactly one normal, one position, one texture coord.
      Some models do not abide by this, such as discrete models.
      */
      const model = this.result.models[index];
      const faces = model.faces;
      const vertices = model.vertices;
      const textureCoords = model.textureCoords;
      const vertexNormals = model.vertexNormals;
  
      // If the vertex normals have not been given or calculated, we need to calculate them.
      // So populate the vertex normals array with empty objects.
      const calcVertexNormals = vertexNormals.length == 0;
      if (calcVertexNormals){
        for (let i = 0; i < vertices.length; ++i){
          vertexNormals.push(glMatrix.vec3.fromValues(0,0,0));
        }
  
        faces.forEach(face => {
          let vertsOnFace = face.vertices;
          let initialVert = vertsOnFace[0];
          for (let i = 1; i < vertsOnFace.length - 1; ++i){
            let triangle = [initialVert, vertsOnFace[i], vertsOnFace[i + 1]];
            vertexNormals = this.calcVertexNormals(vertexNormals, vertices, triangle);
            
          }
        });
  
        // Convert the vertex normals to objects that are compatible with the following code
        for (let i = 0; i < vertexNormals.length; ++i){
          glMatrix.vec3.normalize(vertexNormals[i], vertexNormals[i])
  
          let normalVertexObject = { x: vertexNormals[i][0], y: vertexNormals[i][1], z: vertexNormals[i][2]}
          vertexNormals[i] = normalVertexObject;
        }
      }
  
      let indexData = [];
      faces.forEach(face => {
        // A face can have 3+ vertices.
        // Since we want triangles, we turn the face into a fan of triangles.
        // http://docs.safe.com/fme/2017.1/html/FME_Desktop_Documentation/FME_Workbench/!FME_Geometry/IFMETriangleFan.htm
        let vertsOnFace = face.vertices;
        let initialVert = vertsOnFace[0];
        for (let i = 1; i < vertsOnFace.length - 1; ++i){
          let triangle = [initialVert, vertsOnFace[i], vertsOnFace[i + 1]];
          triangle.forEach(triangleVert => {
            indexData.push(triangleVert.vertexIndex - 1);
          });
        }
      });
  
      let textureData = [];
      textureCoords.forEach(coord => {
        textureData.push(coord.u);
        textureData.push(coord.v);
      });
  
      let normalData = [];
      vertexNormals.forEach(normal => {
        normalData.push(normal.x);
        normalData.push(normal.y);
        normalData.push(normal.z);
      });
  
      let vertexData = [];
      vertices.forEach(vertex => {
        vertexData.push(vertex.x);
        vertexData.push(vertex.y);
        vertexData.push(vertex.z);
      });
  
      return {
        indices: indexData,
        uvs: textureData,
        normals: normalData,
        vertices: vertexData
      }
    }
  
    updateBbox(bbox, vertex) {
      if (vertex.x < bbox.min.x) bbox.min.x = vertex.x;
      if (vertex.y < bbox.min.y) bbox.min.y = vertex.y;
      if (vertex.z < bbox.min.z) bbox.min.z = vertex.z;
      if (vertex.x > bbox.max.x) bbox.max.x = vertex.x;
      if (vertex.y > bbox.max.y) bbox.max.y = vertex.y;
      if (vertex.z > bbox.max.z) bbox.max.z = vertex.z;
      return bbox
    }
  
    calcVertexNormals(vertexNormals, vertices, triangle) {
      let A = triangle[0];
      let B = triangle[1];
      let C = triangle[2];
      let At = vertices[A.vertexIndex - 1];
      let Bt = vertices[B.vertexIndex - 1];
      let Ct = vertices[C.vertexIndex - 1];
      let BA = glMatrix.vec3.fromValues(Bt.x - At.x, Bt.y - At.y, Bt.z - At.z);
      let CA = glMatrix.vec3.fromValues(Ct.x - At.x, Ct.y - At.y, Ct.z - At.z);
      let normal = glMatrix.vec3.create();
      glMatrix.vec3.cross(normal, BA, CA);
      glMatrix.vec3.add(vertexNormals[A.vertexIndex - 1], vertexNormals[A.vertexIndex - 1], normal);
      glMatrix.vec3.add(vertexNormals[B.vertexIndex - 1], vertexNormals[B.vertexIndex - 1], normal);
      glMatrix.vec3.add(vertexNormals[C.vertexIndex - 1], vertexNormals[C.vertexIndex - 1], normal);
      return vertexNormals;
    }
  
    /**
     * getFlattenedDataFromModelAtIndex - generates flattened geometry data, prefer the indexable method if model is not discrete
     * @param {Number} index the index of the model you are interested in (multiple models may exist in one obj file) 
     */
    getFlattenedDataFromModelAtIndex(index) {
      const model = this.result.models[index];
      const faces = model.faces;
      const vertices = model.vertices;
      const textureCoords = model.textureCoords;
      let vertexNormals = model.vertexNormals;
  
  
      // If the vertex normals have not been given or calculated, we need to calculate them.
      // So populate the vertex normals array with empty objects.
      const calcVertexNormals = vertexNormals.length == 0;
      if (calcVertexNormals){
        for (let i = 0; i < vertices.length; ++i){
          vertexNormals.push(glMatrix.vec3.fromValues(0,0,0));
        }
  
        faces.forEach(face => {
          let vertsOnFace = face.vertices;
          let initialVert = vertsOnFace[0];
          for (let i = 1; i < vertsOnFace.length - 1; ++i){
            let triangle = [initialVert, vertsOnFace[i], vertsOnFace[i + 1]];
            vertexNormals = this.calcVertexNormals(vertexNormals, vertices, triangle);
            
          }
        });
  
        // Convert the vertex normals to objects that are compatible with the following code
        for (let i = 0; i < vertexNormals.length; ++i){
          glMatrix.vec3.normalize(vertexNormals[i], vertexNormals[i])
  
          let normalVertexObject = { x: vertexNormals[i][0], y: vertexNormals[i][1], z: vertexNormals[i][2]}
          vertexNormals[i] = normalVertexObject;
        }
      }
  
  
      // If your model does not have vertex normals, you should detect that here
      // and can calculate them here.
      var bbox = { min : { x: 0, y: 0, z: 0 }, max : { x: 0, y: 0, z: 0 } };
      let textureData = [];
      let normalData = [];
      let vertexData = [];
      let faceColorData = [];
      // This is just for the wireframe shader, feel free to remove this information if not necessary
      // I am only including it here for a cheap wireframe effect.
      let barycentricCoords = [];
      let barycentricValues = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]];
      faces.forEach(face => {
        // A face can have 3+ vertices.
        // Since we want triangles, we turn the face into a fan of triangles.
        // http://docs.safe.com/fme/2017.1/html/FME_Desktop_Documentation/FME_Workbench/!FME_Geometry/IFMETriangleFan.htm
        let vertsOnFace = face.vertices;
        let initialVert = vertsOnFace[0];
        for (let i = 1; i < vertsOnFace.length - 1; ++i){
          let triangle = [initialVert, vertsOnFace[i], vertsOnFace[i + 1]];
          triangle.forEach((triangleVert, index) => {
            // Obj models are not zero index, so we subtract 1 from the indicated indices
            vertexData.push(vertices[triangleVert.vertexIndex - 1].x);
            vertexData.push(vertices[triangleVert.vertexIndex - 1].y);
            vertexData.push(vertices[triangleVert.vertexIndex - 1].z);
            this.updateBbox(bbox, vertices[triangleVert.vertexIndex - 1]);
  
            if(textureCoords[triangleVert.textureCoordsIndex - 1]) {
              textureData.push(textureCoords[triangleVert.textureCoordsIndex - 1].u);
              textureData.push(textureCoords[triangleVert.textureCoordsIndex - 1].v);
            }
            
            if(vertexNormals[triangleVert.vertexNormalIndex - 1]) {
              normalData.push(vertexNormals[triangleVert.vertexNormalIndex - 1].x);
              normalData.push(vertexNormals[triangleVert.vertexNormalIndex - 1].y);
              normalData.push(vertexNormals[triangleVert.vertexNormalIndex - 1].z);
            }
            else if(calcVertexNormals){
              normalData.push(vertexNormals[triangleVert.vertexIndex - 1].x);
              normalData.push(vertexNormals[triangleVert.vertexIndex - 1].y);
              normalData.push(vertexNormals[triangleVert.vertexIndex - 1].z);
            }
            
            faceColorData.push(face.color.r);
            faceColorData.push(face.color.g);
            faceColorData.push(face.color.b);
  
            barycentricCoords.push(barycentricValues[index][0]);
            barycentricCoords.push(barycentricValues[index][1]);
            barycentricCoords.push(barycentricValues[index][2]);
          });
        }
      });
  
      /* Calculating Vector For Scaling model */
      var maxXYZ = glMatrix.vec3.fromValues(bbox.max.x, bbox.max.y, bbox.max.z);
      var minXYZ = glMatrix.vec3.fromValues(bbox.min.x, bbox.min.y, bbox.min.z);
      var span = glMatrix.vec3.create();
      var unitSpan = glMatrix.vec3.create();
      glMatrix.vec3.subtract(span, maxXYZ, minXYZ);
      glMatrix.vec3.normalize(unitSpan, span);
      var scalingVector = glMatrix.vec3.fromValues(unitSpan[0] / span[0], unitSpan[1] / span[1], unitSpan[2] / span[2]);
  
      if (normalData.length < 1) console.warn("No normal data loaded for model.");
      if (vertexData.length < 1) console.warn("No vertex data loaded for model.");
      // if (textureData.length < 1) console.warn("No texture data loaded for model.");
      return {
        uvs: textureData,
        normals: normalData,
        vertices: vertexData,
        colors: faceColorData,
        barycentricCoords: barycentricCoords,
        scalingVector: scalingVector
      }
    }
  
    getFlattenedStripDataFromModelAtIndex(index) {
      const model = this.result.models[index];
      const faces = model.faces;
      const vertices = model.vertices;
      const textureCoords = model.textureCoords;
      let vertexNormals = model.vertexNormals;
  
  
      // If the vertex normals have not been given or calculated, we need to calculate them.
      // So populate the vertex normals array with empty objects.
      // const calcVertexNormals = vertexNormals.length == 0;
      // if (calcVertexNormals){
      //   for (let i = 0; i < vertices.length; ++i){
      //     vertexNormals.push(glMatrix.vec3.fromValues(0,0,0));
      //   }
  
      //   faces.forEach(face => {
      //     let vertsOnFace = face.vertices;
      //     let initialVert = vertsOnFace[0];
      //     for (let i = 1; i < vertsOnFace.length - 1; ++i){
      //       let triangle = [initialVert, vertsOnFace[i], vertsOnFace[i + 1]];
      //       vertexNormals = this.calcVertexNormals(vertexNormals, vertices, triangle);
            
      //     }
      //   });
  
      //   // Convert the vertex normals to objects that are compatible with the following code
      //   for (let i = 0; i < vertexNormals.length; ++i){
      //     glMatrix.vec3.normalize(vertexNormals[i], vertexNormals[i])
  
      //     let normalVertexObject = { x: vertexNormals[i][0], y: vertexNormals[i][1], z: vertexNormals[i][2]}
      //     vertexNormals[i] = normalVertexObject;
      //   }
      // }
  
  
      // If your model does not have vertex normals, you should detect that here
      // and can calculate them here.
      var bbox = { min : { x: 0, y: 0, z: 0 }, max : { x: 0, y: 0, z: 0 } };
      let textureData = [];
      let normalData = [];
      let vertexData = [];
      let faceColorData = [];
      // This is just for the wireframe shader, feel free to remove this information if not necessary
      // I am only including it here for a cheap wireframe effect.
      let barycentricCoords = [];
      let barycentricValues = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]];
      faces.forEach(face => {
        let vertsOnFace = face.vertices;
        let subVertexData = [];
        let subTextureData = [];
        let subFaceColorData = [];
        let subNormalData = [];
        let subBarycentricCoords = [];
        console.log(vertsOnFace.length)
        for (let i = 0; i < vertsOnFace.length; ++i){
          let triangleVert = vertsOnFace[i];
  
          // Obj models are not zero index, so we subtract 1 from the indicated indices
          subVertexData.push(vertices[triangleVert.vertexIndex - 1].x);
          subVertexData.push(vertices[triangleVert.vertexIndex - 1].y);
          subVertexData.push(vertices[triangleVert.vertexIndex - 1].z);
  
          this.updateBbox(bbox, vertices[triangleVert.vertexIndex - 1]);
  
          if(textureCoords[triangleVert.textureCoordsIndex - 1]) {
            subTextureData.push(textureCoords[triangleVert.textureCoordsIndex - 1].u);
            subTextureData.push(textureCoords[triangleVert.textureCoordsIndex - 1].v);
          }
            
          if(vertexNormals[triangleVert.vertexNormalIndex - 1]) {
            subNormalData.push(vertexNormals[triangleVert.vertexNormalIndex - 1].x);
            subNormalData.push(vertexNormals[triangleVert.vertexNormalIndex - 1].y);
            subNormalData.push(vertexNormals[triangleVert.vertexNormalIndex - 1].z);
          }
          // else if(calcVertexNormals){
          //   subNormalData.push(vertexNormals[triangleVert.vertexIndex - 1].x);
          //   subNormalData.push(vertexNormals[triangleVert.vertexIndex - 1].y);
          //   subNormalData.push(vertexNormals[triangleVert.vertexIndex - 1].z);
          // }
          
          subFaceColorData.push(face.color.r);
          subFaceColorData.push(face.color.g);
          subFaceColorData.push(face.color.b);
  
          subBarycentricCoords.push(barycentricValues[index][0]);
          subBarycentricCoords.push(barycentricValues[index][1]);
          subBarycentricCoords.push(barycentricValues[index][2]);
        }
        vertexData.push(subVertexData)
        textureData.push(subTextureData)
        normalData.push(subNormalData)
        faceColorData.push(subFaceColorData)
        barycentricCoords.push(subBarycentricCoords)
      });
  
      /* Calculating Vector For Scaling model */
      var maxXYZ = glMatrix.vec3.fromValues(bbox.max.x, bbox.max.y, bbox.max.z);
      var minXYZ = glMatrix.vec3.fromValues(bbox.min.x, bbox.min.y, bbox.min.z);
      var span = glMatrix.vec3.create();
      var unitSpan = glMatrix.vec3.create();
      glMatrix.vec3.subtract(span, maxXYZ, minXYZ);
      glMatrix.vec3.normalize(unitSpan, span);
      var scalingVector = glMatrix.vec3.fromValues(unitSpan[0] / span[0], unitSpan[1] / span[1], unitSpan[2] / span[2]);
  
      if (normalData.length < 1) console.warn("No normal data loaded for model.");
      if (vertexData.length < 1) console.warn("No vertex data loaded for model.");
      // if (textureData.length < 1) console.warn("No texture data loaded for model.");
      return {
        uvs: textureData,
        normals: normalData,
        vertices: vertexData,
        colors: faceColorData,
        barycentricCoords: barycentricCoords,
        scalingVector: scalingVector
      }
    }
    parseObject(lineItems) {
      const modelName = lineItems.length >= 2 ? lineItems[1] : this.defaultModelName;
      this.result.models.push({
        name: modelName,
        vertices: [],
        textureCoords: [],
        vertexNormals: [],
        faces: []
      });
      this.currentGroup = '';
      this.smoothingGroup = 0;
    }
  
    parseGroup(lineItems) {
      if (lineItems.length != 2) { throw 'Group statements must have exactly 1 argument (eg. g group_1)'; }
  
      this.currentGroup = lineItems[1];
    }
  
    parseVertexCoords(lineItems) {
      const x = lineItems.length >= 2 ? parseFloat(lineItems[1]) : 0.0;
      const y = lineItems.length >= 3 ? parseFloat(lineItems[2]) : 0.0;
      const z = lineItems.length >= 4 ? parseFloat(lineItems[3]) : 0.0;
  
      this.currentModel().vertices.push({ x, y, z });
    }
  
    parseTextureCoords(lineItems) {
      const u = lineItems.length >= 2 ? parseFloat(lineItems[1]) : 0.0;
      const v = lineItems.length >= 3 ? parseFloat(lineItems[2]) : 0.0;
      const w = lineItems.length >= 4 ? parseFloat(lineItems[3]) : 0.0;
  
      if (lineItems.length >= 4)
        this.currentModel().textureCoords.push({ u, v, w });
      else
        this.currentModel().textureCoords.push({ u, v });
    }
  
    parseVertexNormal(lineItems) {
      const x = lineItems.length >= 2 ? parseFloat(lineItems[1]) : 0.0;
      const y = lineItems.length >= 3 ? parseFloat(lineItems[2]) : 0.0;
      const z = lineItems.length >= 4 ? parseFloat(lineItems[3]) : 0.0;
  
      this.currentModel().vertexNormals.push({ x, y, z });
    }
  
    parsePolygon(lineItems) {
      const totalVertices = (lineItems.length - 1);
      if (totalVertices < 3) { throw (`Face statement has less than 3 vertices${this.filePath}${this.lineNumber}`); }
  
      const face = {
        material: this.currentMaterial,
        group: this.currentGroup,
        smoothingGroup: this.smoothingGroup,
        vertices: [],
        color: this.currentColor,
      };
  
      for (let i = 0; i < totalVertices; i += 1) {
        const vertexString = lineItems[i + 1];
        const vertexValues = vertexString.split('/');
  
        if (vertexValues.length < 1 || vertexValues.length > 3) { throw (`Too many values (separated by /) for a single vertex${this.filePath}${this.lineNumber}`); }
  
        let vertexIndex = 0;
        let textureCoordsIndex = 0;
        let vertexNormalIndex = 0;
        vertexIndex = parseInt(vertexValues[0]);
        if (vertexValues.length > 1 && (!vertexValues[1] == '')) { textureCoordsIndex = parseInt(vertexValues[1]); }
        if (vertexValues.length > 2) { vertexNormalIndex = parseInt(vertexValues[2]); }
  
        if (vertexIndex == 0) { throw 'Faces uses invalid vertex index of 0'; }
  
        // Negative vertex indices refer to the nth last defined vertex
        // convert these to postive indices for simplicity
        if (vertexIndex < 0) { vertexIndex = this.currentModel().vertices.length + 1 + vertexIndex; }
  
        face.vertices.push({
          vertexIndex,
          textureCoordsIndex,
          vertexNormalIndex
        });
      }
      this.currentModel().faces.push(face);
    }
  
    parseFaceColor(lineItems) {
      const r = lineItems.length >= 2 ? parseFloat(lineItems[1]) : 0.0;
      const g = lineItems.length >= 3 ? parseFloat(lineItems[2]) : 0.0;
      const b = lineItems.length >= 4 ? parseFloat(lineItems[3]) : 0.0;
      const a = lineItems.length >= 5 ? parseFloat(lineItems[4]) : 1.0;
  
      this.currentColor= {r, g, b, a};
    }
  
    parseMtlLib(lineItems) {
      if (lineItems.length >= 2) { this.result.materialLibraries.push(lineItems[1]); }
    }
  
    parseUseMtl(lineItems) {
      if (lineItems.length >= 2) { this.currentMaterial = lineItems[1]; }
    }
  
    parseSmoothShadingStatement(lineItems) {
      if (lineItems.length != 2) { throw 'Smoothing group statements must have exactly 1 argument (eg. s <number|off>)'; }
  
      const groupNumber = (lineItems[1].toLowerCase() == 'off') ? 0 : parseInt(lineItems[1]);
      this.smoothingGroup = groupNumber;
    }
  }
  
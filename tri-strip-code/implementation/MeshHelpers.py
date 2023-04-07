from typing import List, Tuple, Dict, Any, Optional
from dataclasses import dataclass, field
# from ObjFile import *
from ObjFile import Vertex, Face, Model, TextureCoords, Normals, FaceVertex, Result

@dataclass
class Color:
    r: float = 0.0
    g: float = 0.0
    b: float = 0.0
    a: float = 1.0

@dataclass
class AdjTriangle:
    # The triangle has the usual references to three vertices, and also three new references to possible adjacent triangles. My convention say that :
    # ATri[0] is the triangle adjacent to edge 0-1
    # ATri[1] is the triangle adjacent to edge 0-2
    # ATri[2] is the triangle adjacent to edge 1-2
    
    v_ref: List[int] = field(default_factory=list)
    a_tri: List[int] = field(default_factory=lambda: [None] * 3)
    color_enum: int = None
    color: Color = None
    
    def find_edge(self, vref0, vref1) -> Optional[int]:
        if self.v_ref[0] == vref0 and self.v_ref[1] == vref1:
            return 0 # edge 0-1
        elif self.v_ref[0] == vref1 and self.v_ref[1] == vref0:
            return 0 # edge 0-1
        elif self.v_ref[0] == vref0 and self.v_ref[2] == vref1:
            return 1 # edge 0-2
        elif self.v_ref[0] == vref1 and self.v_ref[2] == vref0:
            return 1 # edge 0-2
        elif self.v_ref[1] == vref0 and self.v_ref[2] == vref1:
            return 2 # edge 1-2
        elif self.v_ref[1] == vref1 and self.v_ref[2] == vref0:
            return 2 # edge 1-2
        else:
            return None
        
    def opposite_vertex(self, vref0, vref1) -> Optional[int]:
        if self.v_ref[0] == vref0 and self.v_ref[1] == vref1:
            return self.v_ref[2] 
        elif self.v_ref[0] == vref1 and self.v_ref[1] == vref0:
            return self.v_ref[2] 
        elif self.v_ref[0] == vref0 and self.v_ref[2] == vref1:
            return self.v_ref[1]
        elif self.v_ref[0] == vref1 and self.v_ref[2] == vref0:
            return self.v_ref[1] 
        elif self.v_ref[1] == vref0 and self.v_ref[2] == vref1:
            return self.v_ref[0]
        elif self.v_ref[1] == vref1 and self.v_ref[2] == vref0:
            return self.v_ref[0]
        else:
            return None
        
    # def __str__(self) -> str:
    #     return f"({self.v_ref[0]}, {self.v_ref[1]}, {self.v_ref[2]})==(0:{self.a_tri[0]}, 1:{self.a_tri[1]}, 2:{self.a_tri[2]}))"
    
@dataclass
class AdjEdge:
    ref0: int = -1 # index of vertex
    ref1: int = -1 # index of vertex
    face_nb: int = -1 # index of face
    
    # def __str__(self) -> str:
    #     return f"({self.face_nb}, {self.ref0}, {self.ref1})"
    
    
class AdjMesh:
    def __init__(self, model: Model) -> None:
        
        # get necessary info from model
        self.model: Model                           = model
        self.name: str                              = model.name
        self.vertices: List[Vertex]                 = model.vertices
        self.texture_coords: List[TextureCoords]    = model.texture_coords
        self.vertex_normals: List[Normals]          = model.vertex_normals
        self.faces: List[Face]                      = model.faces
        self.n_faces: int                           = len(self.faces)
        self.n_vertices: int                        = len(self.vertices)
        
        
        # 1. Create an edge object for each edge in each face
        #    and while we're at it, create a triangle object for each face
        print('[AdjMesh] Creating Edges And Triangles...')
        self.triangles: List[AdjTriangle]= []
        self.edges: List[AdjEdge] = []
        self.create_edges_and_triangles()
        
        # 2. Sort the edges by face number, then by vertex reference
        print('[AdjMesh] Sorting Edges...')
        self.sort_edges()
        
        # 3. Create links between adjacent faces
        print('[AdjMesh] Linking Adjacent Faces...')
        self.create_adjacency()
    
    
    def create_edges_and_triangles(self) -> None:
        # for each face in the mesh
        for i in range(self.n_faces):
            face_nb: int = i
            face: Face = self.faces[face_nb]
            tri: AdjTriangle = AdjTriangle()
            tri.v_ref = [
                face.vertices[0].vertex_idx, 
                face.vertices[1].vertex_idx, 
                face.vertices[2].vertex_idx
            ]
            
            # 3 edges in a triangle
            for j in range(3):
                edge = AdjEdge(
                    face_nb=face_nb,
                    ref0=face.vertices[j].vertex_idx,
                    ref1=face.vertices[(j + 1) % 3].vertex_idx
                )
                
                # vertex refences in ascending order
                if edge.ref0 > edge.ref1:
                    edge.ref0, edge.ref1 = edge.ref1, edge.ref0
                self.edges.append(edge)
            self.triangles.append(tri)
    
    def sort_edges(self) -> None:
        self.edges = list(sorted(self.edges, key=lambda edge: edge.face_nb))
        self.edges = list(sorted(self.edges, key=lambda edge: edge.ref0))
        self.edges = list(sorted(self.edges, key=lambda edge: edge.ref1))
        
    def update_link(self, firsttri: int, secondtri: int, ref0: int, ref1: int) -> bool:
            tri0:AdjTriangle = self.triangles[firsttri]
            tri1:AdjTriangle = self.triangles[secondtri]
            
            edge_nb0: Optional[int] = tri0.find_edge(ref0, ref1)
            edge_nb1: Optional[int] = tri1.find_edge(ref0, ref1)
            
            if edge_nb0 is None or edge_nb1 is None:
                return False
            
            self.triangles[firsttri].a_tri[edge_nb0] = secondtri
            self.triangles[secondtri].a_tri[edge_nb1] = firsttri
            return True
    
    def create_adjacency(self):
        last_ref0: int = self.edges[0].ref0
        last_ref1: int = self.edges[0].ref1
        count: int = 0
        tmp_buffer: List[int] = []
        n_edges: int = len(self.edges)
        
        for i in range(n_edges):
            face: int = self.edges[i].face_nb
            ref0: int = self.edges[i].ref0
            ref1: int = self.edges[i].ref1
            
            if ref0 == last_ref0 and ref1 == last_ref1:
                tmp_buffer.append(face)
                count += 1
                if count == 3:
                    raise Exception('More than 3 triangles share an edge')
            
            else:
                if count == 2:
                    status: bool = self.update_link(tmp_buffer[0], tmp_buffer[1], last_ref0, last_ref1)
                    if not status:
                        raise Exception('Something went wrong with the edge adjacency')
                count = 1
                tmp_buffer = [face]
                last_ref0 = ref0
                last_ref1 = ref1
                
        if count == 2:
            status: bool = self.update_link(tmp_buffer[0], tmp_buffer[1], last_ref0, last_ref1)
            if not status:
                raise Exception('Something went wrong with the edge adjacency')
            

    def to_obj_file(self, obj_fn: str) -> None:
        print(f"[ObjFile] Writing {obj_fn}...")
        model: Model = self.model  # adjMesh is of type AdjMesh
        name: str = model.name
        vertices: List[Vertex] = model.vertices
        texture_coords: List[TextureCoords] = model.texture_coords
        vertex_normals: List[Normals] = model.vertex_normals
        faces: List[Face] = model.faces
        triangles = self.triangles  # adjMesh.triangles is of type List[AdjTriangle]
        
        result: List[str] = [f"o {name}"]
        
        # write out vertices
        for v in self.vertices:
            result += [f"v {v.x} {v.y} {v.z}"]
        
        # write out texture coords
        for tc in self.texture_coords:
            if len(tc) == 2:
                result += [f"vt {tc.u} {tc.v}"]
            else:
                result += [f"vt {tc.u} {tc.v} {tc.w}"]
                
        # write out vertex normals
        for vn in self.vertex_normals:
            result += [f"vn {vn.x} {vn.y} {vn.z}"]
        
        # write out faces
        material: str = ""
        group: str = ""
        smoothing_group: int = 0
        
        for i,t in enumerate(triangles):
            f: Face = faces[i]
            verts: List[FaceVertex] = f.vertices
            v1: FaceVertex = verts[0]
            v2: FaceVertex = verts[1]
            v3: FaceVertex = verts[2]
            if f.material != material:
                material = f.material
                result += [f"usemtl {material}"]
            if f.group != group:
                group = f.group
                result += [f"g {group}"]
            if f.smoothingGroup != smoothing_group:
                smoothing_group = f.smoothingGroup
                result += [f"s {smoothing_group}"]
                
            c = t.color
            result += [f"fc {c.r} {c.g} {c.b} {c.a}"]
            # doing this now bc we set unkowns to 0 w
            # then reading in the obj file
            result += [
                f"f {v1.vertex_idx}/{v1.texture_idx}/{v1.normal_idx} " \
                    f"{v2.vertex_idx}/{v2.texture_idx}/{v2.normal_idx} " \
                    f"{v3.vertex_idx}/{v3.texture_idx}/{v3.normal_idx}",
            ]      


        # finally, write out the result
        with open(obj_fn, 'w') as f:
            print('\n'.join(result), file=f)

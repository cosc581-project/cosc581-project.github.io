from pprint import pprint
from dataclasses import dataclass, field
from typing import List, Tuple, Dict, Any, Optional
# from MeshHelpers import AdjMesh

sphere_fn = "../demos/shared/resources/models/sphere.obj"
cube_fn = "../demos/shared/resources/models/cube.obj"


################################################################################
# Data classes to maintain strong typing


@dataclass
class Vertex:
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0

@dataclass
class Normals:
    x: float = None
    y: float = None
    z: float = None

@dataclass
class TextureCoords:
    u: float = None
    v: float = None
    w: float = None

@dataclass
class FaceVertex:
    vertex_idx: int = None
    texture_idx: int = None
    normal_idx: int = None


@dataclass
class Face:
    material: str = None
    group: str = None
    smoothingGroup: int = None
    vertices: List[FaceVertex] = field(default_factory=list)


@dataclass
class Model:
    name: str = None
    vertices: List[Vertex] = field(default_factory=list)
    texture_coords: List[TextureCoords] = field(default_factory=list)
    vertex_normals: List[Normals] = field(default_factory=list)
    faces: List[Face] = field(default_factory=list)


@dataclass
class Result:
    models: List[Model] = field(default_factory=list)
    material_libraries: list = field(default_factory=list)
  
################################################################################
# ObjFile class

class ObjFile:
    def __init__(self, fn, default_model_name='model'):
        self.fn: str = fn
        self.default_model_name: str = default_model_name
        self.current_group: str = ''
        self.smoothing_group: int = 0
        self.current_material: str = ''
        self.line_number:int = 0
        self.result = Result()
        
        with open(fn, 'r') as f:
            lines: List[str] = f.readlines()
        self.parse(lines)
        
    def parse(self, lines: List[str]) -> None:
        def strip_comments(line)->str:
            return line.split('#')[0].strip()
        
        # remove empty lines and comments
        lines: List[str] = list(filter(lambda l: len(l) > 0, map(lambda l: strip_comments(l).strip(), lines)))
        
        for i, line in enumerate(lines):
            self.line_number = i
            line_items: List[str] = line.split()
            line_type: str= line_items[0].lower()
            
            line_dict: Dict[str, function] = {
                'o': self.parse_object,
                'g': self.parse_group,
                'v': self.parse_vertex_coords,
                'vt': self.parse_texture_coords,
                'vn': self.parse_vertex_normals,
                's': self.parse_smoothing_shading_statement,
                'f': self.parse_polygon,
                'mtllib': self.parse_mtllib,
                'usemtl': self.parse_use_mtl,
                '#': lambda x: None,
            }
            if line_type in line_dict:
                line_dict[line_type](line_items)
            else:
                print(f"Unhandled obj statement at line {i}: {line}")
    
    def current_model(self) -> Model:
        if len(self.result.models) == 0:
            self.result.models.append(Model())
            self.current_group = ''
            self.smoothingGroup = 0
        return self.result.models[-1]
                
    def parse_object(self, line_items: List[str]) -> None:
        model_name: str = line_items[1] if len(line_items) > 1 else self.default_model_name
        self.result.models.append(Model(name=model_name))
        self.current_group = ''
        self.smoothingGroup = 0
    
    def parse_group(self, line_items: List[str]) -> None:  # sourcery skip: raise-specific-error
        if len(line_items) != 2:
            raise Exception("Group statements must have exactly 1 argument (eg. g group_1)")
        
        self.current_group = line_items[1]
        
    def parse_vertex_coords(self, line_items: List[str]) -> None:
        length: int = len(line_items)
        x: float = float(line_items[1]) if length > 1 else 0
        y: float = float(line_items[2]) if length > 2 else 0
        z: float = float(line_items[3]) if length > 3 else 0
        self.current_model().vertices.append(Vertex(x=x, y=y, z=z))
    
    def parse_texture_coords(self, line_items: List[str]) -> None:
        length: int = len(line_items)
        u: float = float(line_items[1]) if length > 1 else 0
        v: float = float(line_items[2]) if length > 2 else 0
        w: float = float(line_items[3]) if length > 3 else 0
        if length >= 4:
            self.current_model().texture_coords.append(TextureCoords(u=u, v=v, w=w))
        else:
            self.current_model().texture_coords.append(TextureCoords(u=u, v=v))
    
    def parse_vertex_normals(self, line_items: List[str]) -> None:
        length: int = len(line_items)
        x: float = float(line_items[1]) if length > 1 else 0
        y: float = float(line_items[2]) if length > 2 else 0
        z: float = float(line_items[3]) if length > 3 else 0
        self.current_model().vertex_normals.append(Normals(x=x, y=y, z=z))
    
    def parse_polygon(self, line_items: List[str]) -> None:  # sourcery skip: raise-specific-error
        total_vertices: int = len(line_items) - 1
        if total_vertices < 3:
            raise Exception(f"Polygons must have at least 3 vertices {self.fn}:{self.line_number}")

        face = Face(
                material=self.current_material, 
                group=self.current_group, 
                smoothingGroup=self.smoothing_group
            )
        
        for i in range(1, total_vertices+1):
            v_str: str = line_items[i]
            v_vals: List[str] = v_str.split('/')
            
            if len(v_vals) < 1 or len(v_vals) > 3:
                raise Exception(f"Too many values (separated by /) for a single vertex {self.fn}:{self.line_number}")
            
            v_idx: int = int(v_vals[0])
            tex_idx: int = 0
            vn_idx: int = 0

            if len(v_vals) > 1 and (v_vals[1] != ''):
                tex_idx = int(v_vals[1])
            if len(v_vals) > 2:
                vn_idx = int(v_vals[2])
            
            if v_idx == 0:
                raise Exception(f"Faces uses invalid vertex index of 0 {self.fn}:{self.line_number}")
            
            # Negative vertex indices refer to the nth last defined vertex
            # convert these to postive indices for simplicity
            if v_idx < 0:
                v_idx = len(self.current_model().vertices) + v_idx + 1

            face.vertices.append(FaceVertex(vertex_idx=v_idx, texture_idx=tex_idx, normal_idx=vn_idx))
            
        self.current_model().faces.append(face)
        
    def parse_mtllib(self, line_items: List[str]) -> None:
        if len(line_items) >= 2:
            self.result.material_libraries.append(line_items[1])
            
    def parse_use_mtl(self, line_items: List[str]) -> None:
        if len(line_items) >= 2:
            self.current_material = line_items[1]
            
    def parse_smoothing_shading_statement(self, line_items: List[str]) -> None:
        # sourcery skip: raise-specific-error
        if len(line_items) != 2:
            raise Exception("Smoothing group statements must have exactly 1 argument (eg. s <number|off>)")
        
        group_number:int = 0 if line_items[1].lower() == 'off' else int(line_items[1])
        self.smoothing_group = group_number


################################################################################
if __name__ == "__main__":
    pprint(ObjFile(cube_fn).result)
    

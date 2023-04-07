from ObjFile import ObjFile
from MeshHelpers import AdjMesh, AdjTriangle, AdjEdge
from TriStrip import TriStrip
from pprint import pprint
from typing import List, Tuple, Dict, Any, Optional, Set
from GraphColoring import GraphColoring
# Load in obj file and get the model
sphere_fn = "../demos/shared/resources/models/sphere.obj"
bunny_fn  = "../demos/shared/resources/models/bunny.obj"
teapot_fn = "../demos/shared/resources/models/teapot.obj"
nefertiti = "../demos/shared/resources/models/Nefertiti.obj"

model = ObjFile(nefertiti).result.models[0]
adj_mesh = AdjMesh(model)
gc = GraphColoring(adjMesh=adj_mesh)
gc.set_colormap("Set2", resample=True)
gc.color_mesh()
gc.adjMesh.to_obj_file("gc.obj")



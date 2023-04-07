from ObjFile import ObjFile
from MeshHelpers import  AdjMesh
from TriStrip import TriStrip
from pprint import pprint

# Load in obj file and get the model
sphere_fn = "../demos/shared/resources/models/sphere.obj"
teapot_fn = "../demos/shared/resources/models/teapot.obj"
nefertiti = "../demos/shared/resources/models/Nefertiti.obj"

model = ObjFile(teapot_fn).result.models[0]
adj_mesh = AdjMesh(model)
tri_strip = TriStrip(adjMesh=adj_mesh)

tri_strip.color_mesh("Set2")
tri_strip.to_obj_file("ts.obj")

# print('-'*80)
# print('5 longest strips:')
# strip_lengths = [len(strip) for strip in tri_strip.strips]
# pprint(sorted(strip_lengths, reverse=True)[:5])


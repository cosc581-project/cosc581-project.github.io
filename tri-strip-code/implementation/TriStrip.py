from typing import List, Tuple, Dict, Any, Optional, Set
from dataclasses import dataclass, field
from ObjFile import *
from MeshHelpers import *
import numpy as np
import matplotlib.pyplot as plt
import matplotlib as mpl
from matplotlib.colors import ListedColormap, LinearSegmentedColormap

class TriStrip:
    def __init__(self, adjMesh: AdjMesh=None) -> None:
        self.model = adjMesh.model
        self.adjMesh: AdjMesh = adjMesh
        self.tags: List[bool] = [False] * self.adjMesh.n_faces
        self.strips: List[List[int]] = []
        self.faces: List[List[int]] = []
        self.cmap_name = "Set2" # just some random default
        
        # 1. Compute the connectivity of each triangle
        #    Each tuple in the list is (triangle index, number of adjacent triangles)
        print("[TriStrip] Computing Connectivity And Sorting...")
        self.connectivity: List[Tuple[int, int]] = self.get_connectivity(self.adjMesh.triangles)
        self.connectivity = list(sorted(self.connectivity, key=lambda x: x[1]))
        
        # 2. Create the strips
        print("[TriStrip] Create Triangle Strips...")
        self.strips,self.faces = self.create_strips(self.connectivity)

        # triangeself.greedy_coloring()
        # self.max_color_enum = max(map(lambda t: t.color_enum, self.adjMesh.triangles))
        # self.set_colormap(self.cmap_name)

    def get_connectivity(self, triangles: List[AdjTriangle]) -> List[Tuple[int, int]]:
        # Assumes len(tri.a_tri) == 3
        return [
            (i, sum(tri.a_tri[j] is not None for j in range(3)))
            for i, tri in enumerate(triangles)
        ]
    
    def create_strips(self, connectivity: List[Tuple[int, int]]):
        # choosing the first triangle
        # There are two standard ways of choosing the first triangle of a strip:
        # - The first method is the one from the SGI algorithm : pick the less connected faces first. Such faces, due to their lack of connections, are easily left isolated after some strips have been created. 
        #       The idea is to take those faces first, in order to reduce the number of isolated triangles in the final mesh. This is just a heuristic method, but it works well in practice.
        # - The second method is just to take the first free face, i.e. the first face which doesn’t belong to a strip yet. This is what Chow does and according to him it’s just as good as the SGI way.

        all_strips: List[int] = []
        all_faces: List[int] = []
        n_total_strip_faces: int = 0
        n_faces: int = self.adjMesh.n_faces
        idx: int = 0
        
        # while we haven't added all faces to a strip
        while n_total_strip_faces != n_faces:
            # search for a face that is not tagged as part of a strip
            while self.tags[connectivity[idx][0]]:
                idx += 1
            
            # compute the best strip starting with the first face
            first_face = connectivity[idx][0]
            n_strip_faces, strip, faces = self.compute_best_strip(first_face)
            n_total_strip_faces += n_strip_faces
            all_strips.append(strip)
            all_faces.append(faces)
            
        return all_strips, all_faces
    
    def walk_strip(self, face: int, oldest: int, middle: int, tags: List[bool]) -> Tuple[int, List[int], List[int], List[bool]]:
        
        length: int = 2
        strip: List[int] = [oldest, middle] # initial vertex indices of the strip
        faces: List[int] = [] # faces that are part of the strip
        walk: bool = True
        
        #  x--o
        #   \ | \
        #     m -x
        
        while walk:
            # get the third vertex of the triangle
            newest: int = self.adjMesh.triangles[face].opposite_vertex(oldest, middle) 
            strip.append(newest)
            length += 1
            faces.append(face) # keep track of the face
            tags[face] = True
            
            # get edge id
            cur_edge: int = self.adjMesh.triangles[face].find_edge(middle, newest) 
            link: int = self.adjMesh.triangles[face].a_tri[cur_edge] # get the adjacent face
            if link is None:
                walk = False
            else:
                face = link
                if tags[face]:
                    walk = False
            
            oldest = middle
            middle = newest
            
        return length, strip, faces, tags
    
    def compute_best_strip(self, face: int) -> Tuple[int, List[int], List[int]]:
        # histories of each possible strip
        strips_hist: List[List[int]] = []
        faces_hist: List[List[int]] = []
        length_hist: List[int] = []
        first_length: List[int] = []
        tags_hist: List[List[bool]] = []
        
        # starting vertices for each possible strip
        refs0: List[int] = [
            self.adjMesh.triangles[face].v_ref[0],
            self.adjMesh.triangles[face].v_ref[2],
            self.adjMesh.triangles[face].v_ref[1],
        ]
        refs1: List[int] = [
            self.adjMesh.triangles[face].v_ref[1],
            self.adjMesh.triangles[face].v_ref[0],
            self.adjMesh.triangles[face].v_ref[2],
        ]

        # compute 3 possible strips
        for i in range(3):
            # compute the intial strip and save the length
            length, strip, faces, tags = self.walk_strip(face, refs0[i], refs1[i], self.tags.copy())
            first_length.append(length)
            
            # reverse the first part of the strip
            strip.reverse()
            faces.reverse()
            
            # track the second part of the strip
            new_ref0: int = strip[-3] # TODO check this
            new_ref1: int = strip[-2] # TODO check this
            extra_length, new_strip, new_faces, tags = self.walk_strip(face, new_ref0, new_ref1, tags)
            
            # save the histories
            length_hist.append(length + extra_length - 3)
            tags_hist.append(tags)
            strips_hist.append(strip[:-3]+new_strip)  # TODO check this
            faces_hist.append(faces[:-2]+new_faces)   # TODO check this
    
        # get best strip from the 3
        longest: int = max(length_hist)
        best_idx: int = length_hist.index(longest)
        n_faces: int = longest - 2
        
        # update global tags
        self.tags = tags_hist[best_idx]
        strip: List[int] = strips_hist[best_idx]
        faces: List[int] = faces_hist[best_idx]
        # flip strip if needed
        # if the length of the first part of the strip is odd, then the strip is flipped
        mOneSided: bool = True # TODO make this a parameter and figure out what it does
        if mOneSided and first_length[best_idx] % 2:
            # special case for triangels and quads
            if longest == 3 or longest == 4:
                # find the isolated triangle or quad
                strip[1], strip[2] = strip[2], strip[1]
            else:
                #reverse the strip
                strip.reverse()
                
            
                # if the position of the original face in reversed strip is odd youre done
                new_pos = longest-first_length[best_idx]
                if new_pos % 2:
                    # else replicate first index
                    first_index = strip[0]
                    strip.insert(0, first_index)
                    longest += 1
        return n_faces, strip, faces

    def to_obj_file(self, obj_fn: str) -> None:
        print(f"[ObjFile] Writing {obj_fn}...")
        model: Model = self.model  
        adjMesh: AdjMesh = self.adjMesh
        name: str = model.name
        vertices: List[Vertex] = model.vertices
        texture_coords: List[TextureCoords] = model.texture_coords
        vertex_normals: List[Normals] = model.vertex_normals
        faces: List[Face] = model.faces
        triangles: List[AdjTriangle] = adjMesh.triangles  
        
        result: List[str] = [f"o {name}"]
        
        # write out vertices
        for v in vertices:
            result += [f"v {v.x} {v.y} {v.z}"]
        
        # write out texture coords
        for tc in texture_coords:
            if len(tc) == 2:
                result += [f"vt {tc.u} {tc.v}"]
            else:
                result += [f"vt {tc.u} {tc.v} {tc.w}"]
                
        # write out vertex normals
        for vn in vertex_normals:
            result += [f"vn {vn.x} {vn.y} {vn.z}"]
        
        # write out faces
        material: str = ""
        group: str = ""
        smoothing_group: int = 0
        for c, strip in zip(self.colors,self.strips):
            result += [f"fc {c.r} {c.g} {c.b} 1.0"]
            res = f"f "
            for v_idx in strip:
                # TODO: figure out how to retrieve normals and texture coords
                res += f"{v_idx} "
            result += [res]


        # finally, write out the result
        with open(obj_fn, 'w') as f:
            print('\n'.join(result), file=f)

    
    def compress_graph(self, adjMesh: AdjMesh) -> AdjMesh:
        triangles: List[AdjTriangle] = []
        
        tri_sets: List[Tuple[int, Set[int]]] = [(i, set(x)) for i, x in enumerate(self.faces)]
        
        def get_tri(tri_idx: int) -> AdjTriangle:
            for tri in tri_sets:
                if tri_idx in tri[1]:
                    return tri[0]
            return None
        
        for faces in self.faces:
            tri: AdjTriangle = AdjTriangle()
            tri.a_tri = set()
            faces_set = set(faces)
            
            # iterate through each face in the strip
            for face_idx in faces_set:
                # for each face adjacent to the current face, 
                # if it is not in the strip add it to the adjacency list
                for a_tri_idx in adjMesh.triangles[face_idx].a_tri:
                    if a_tri_idx not in faces_set:
                        tri.a_tri.add(get_tri(a_tri_idx))
                
            triangles.append(tri)
            
        return triangles
        
    def greedy_coloring(self) -> list:
        triangles = self.compress_graph(self.adjMesh)

        print("[GraphColoring] greedily coloring mesh...")
        # BFS

        # BFS queue and unvisited set
        unvisited_idx: Set[int] = set(range(len(triangles)))
        queue: List[int] = [0]

        # iterate while we have unvisited triangles
        while unvisited_idx:
            # if the queue is empty and we still have unvisited triangles
            # add one from the unvisited set to the queue
            if not queue:
                queue.append(unvisited_idx.pop())
                continue
            
            # pop the triangle from the queue 
            tri_idx: int = queue.pop(0)
            tri: AdjTriangle = triangles[tri_idx]

            # if the triangle has already been visited, skip it    
            if tri_idx not in unvisited_idx:
                continue
            
            # remove it from the unvisited set
            unvisited_idx.remove(tri_idx)

            # iterate through adjacent triangles
            # if color is None, add to queue
            # if color is not None, add to used_colors
            used_colors: Set[int] = set()
            for adj_idx in tri.a_tri:
                if adj_idx is None:
                    continue
                adj_tri: AdjTriangle = triangles[adj_idx]
                if adj_tri.color_enum is not None:
                    used_colors.add(adj_tri.color_enum)
                else:
                    queue.append(adj_idx)

            # find the first unused color
            if not used_colors:
                triangles[tri_idx].color_enum = 0
            else:
                max_color: int = max(used_colors)
                for i in range(max_color+2):
                    if i not in used_colors:
                        triangles[tri_idx].color_enum = i
                        break
        return triangles
    
    def color_mesh(self, cmap:str=None)-> None:    
        print("[GraphColoring] assinging colors to mesh...")
        triangles = self.greedy_coloring()
        self.max_color_enum = max(tri.color_enum for tri in triangles)
        if cmap is not None:
            self.set_colormap(cmap)
        self.colors = []
        for tri in triangles:
            self.colors.append(self.get_color(tri.color_enum))
        
    def set_colormap(self, cmap: str, resample=True) -> None:
        """
        https://matplotlib.org/stable/tutorials/colors/colormaps.html#classes-of-colormaps 
        Available: 'Pastel1', 'Pastel2', 'Paired', 'Accent', 'Dark2',
                      'Set1', 'Set2', 'Set3', 'tab10', 'tab20', 'tab20b',
                      'tab20c'
        """
        self.cmap_name = cmap
        self.cmap = mpl.colormaps[cmap]
        # if resample:
        #     self.cmap.resampled(self.max_color_enum+1)
        
    def get_color(self, color_enum: int) -> Color:
        c = self.cmap(color_enum)
        return Color(r=c[0], g=c[1], b=c[2],a=1.0)
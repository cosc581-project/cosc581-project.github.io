from ObjFile import ObjFile
from MeshHelpers import AdjMesh, AdjTriangle, AdjEdge, Color
from TriStrip import TriStrip
from pprint import pprint
from typing import List, Tuple, Dict, Any, Optional, Set
import numpy as np
import matplotlib as mpl
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap, LinearSegmentedColormap


class GraphColoring:
    def __init__(self, adjMesh: AdjMesh=None) -> None:
        self.adjMesh: AdjMesh = adjMesh
        self.n_triangles: int = len(adjMesh.triangles)
        self.cmap_name = "Set2" # just some random default

        
        self.greedy_coloring()
        print(len(self.adjMesh.triangles))
        
        print(sum(1 for t in self.adjMesh.triangles if t.color_enum is None))
        self.max_color_enum = max(map(lambda t: t.color_enum, self.adjMesh.triangles))
        
        self.set_colormap(self.cmap_name)

    def greedy_coloring(self) -> None:
        print("[GraphColoring] greedily coloring mesh...")
        # BFS

        # BFS queue and unvisited set
        unvisited_idx: Set[int] = set(range(self.n_triangles))
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
            tri: AdjTriangle = self.adjMesh.triangles[tri_idx]

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
                adj_tri: AdjTriangle = self.adjMesh.triangles[adj_idx]
                if adj_tri.color_enum is not None:
                    used_colors.add(adj_tri.color_enum)
                else:
                    queue.append(adj_idx)

            # find the first unused color
            if not used_colors:
                self.adjMesh.triangles[tri_idx].color_enum = 0
            else:
                max_color: int = max(used_colors)
                for i in range(max_color+2):
                    if i not in used_colors:
                        self.adjMesh.triangles[tri_idx].color_enum = i
                        break
                    
    def color_mesh(self, cmap:str=None)-> None:    
        print("[GraphColoring] assinging colors to mesh...")
                    
        if cmap is not None:
            self.set_colormap(cmap)
            
        for tri in self.adjMesh.triangles:
            tri.color = self.get_color(tri.color_enum)
            
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
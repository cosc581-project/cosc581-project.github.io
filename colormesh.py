import pyvista as pv
from tqdm import tqdm
import numpy as np
import matplotlib as mpl
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap, LinearSegmentedColormap

in_fname = 'bunny.obj'
out_fname = 'bunny-tristrip.obj'

strips = pv.read(in_fname)
print(strips)
print('-' * 80)
strips = strips.strip(
    progress_bar=True, 
    join=True,
    pass_cell_data=True,
    pass_cell_ids=True,
    pass_point_ids=True
    )
print(strips)
# print('points:')
# print(strips.n_points)
# print(strips.points)
# print('verts:')
# print(strips.n_verts)
# print(strips.verts)
# print('faces:')
# print(strips.n_faces)
# print(strips.faces)
# print('strips:')
# print(strips.n_strips)
# print(strips.strips)

cell = strips.cell[0]
color_enums = [None] * strips.n_cells
colors = [None] * strips.n_cells
cmap = mpl.colormaps['Set1']

def get_neighbor_cell_ids(grid, cell_idx):
    """Helper to get neighbor cell IDs."""
    cell = grid.GetCell(cell_idx)
    pids = pv.vtk_id_list_to_array(cell.GetPointIds())
    neighbors = set(grid.extract_points(pids)["vtkOriginalCellIds"])
    neighbors.discard(cell_idx)
    return np.array(list(neighbors))

p = pv.Plotter(notebook=0)

unvisited_idx = set(range(strips.n_cells))

queue = [0]
print('-'*80)
print('Coloring...')
while unvisited_idx:
    # print(queue)
    if not queue:
        # print('queue empty')
        queue.append(list(unvisited_idx)[0])
        continue
    cell_idx = queue.pop(0)
    # print(cell_idx, unvisited_idx)
    if cell_idx not in unvisited_idx:
        # print('already visited', cell_idx)
        continue
    unvisited_idx.remove(cell_idx)
    
    neighbors = get_neighbor_cell_ids(strips, cell_idx)
    # print('neighbors', neighbors)
    used_colors = set()
    for n in neighbors:
        if n not in unvisited_idx:
            used_colors.add(color_enums[n])
        else:
            queue.append(n)
    if not used_colors:
        color_enum = 0
    else:
        max_color = max(used_colors)
        for i in range(max_color+2):
            if i not in used_colors:
                color_enum = i
                break
    color_enums[cell_idx] = color_enum
    color = cmap(color_enum)
    colors[cell_idx] = color
    p.add_mesh(strips.extract_cells(cell_idx), color=color, opacity=1)
p.show()
strips.cell_data['colors'] = colors
tris = strips.triangulate()

colors = tris.cell_data['colors']

print('-'*80)
print('writing...')
f = open(out_fname, 'w')
ret_out = ['o model']
# ret_out.extend(
#     f'v {str(strips.points[i][0])} {str(strips.points[i][1])} {str(strips.points[i][2])}'
#     for i in range(strips.n_points)
# )
# for i in tqdm(range(len(strips.cell))):
#     c = colors[i][:-1]
#     ret_out.append('fc ' +  f"{c[0]} {c[1]}  {c[1]} ")
#     ret_out.append('f ' + ' '.join(map(lambda x: str(x+1), strips.cell[i].point_ids)))
n_points = tris.n_points
points = tris.points
cell = tris.cell
point_ids = list(map(lambda x: x.point_ids, cell))
ret_out.extend(
    f'v {str(points[i][0])} {str(points[i][1])} {str(points[i][2])}'
    for i in range(tris.n_points)
)
for i in tqdm(range(len(point_ids))):
    c = colors[i][:-1]
    ret_out.append('fc ' +  f"{c[0]} {c[1]}  {c[1]} ")
    ret_out.append('f ' + ' '.join(map(lambda x: str(x+1), point_ids[i])))
f.write('\n'.join(ret_out))
f.close()

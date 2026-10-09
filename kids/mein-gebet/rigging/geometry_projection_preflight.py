#!/usr/bin/env python3
"""Fail-closed GLB geometry preflight for research silhouette projection.

The legacy five-view IoU projects raw POSITION accessor vertices. It ignores
node transforms, scene weights and morphs. Reject any source that would make
these raw vertices differ from the visible bind/rest mesh. No art approval.
"""
import math


def assert_projection_safe(g):
    if not isinstance(g, dict) or not isinstance(g.get("meshes"), list) or not g["meshes"]:
        raise ValueError("Missing meshes for geometric five-view projection")
    nodes = g.get("nodes")
    if not isinstance(nodes, list) or not nodes:
        raise ValueError("Missing nodes for five-view mesh projection")
    counts = {i: 0 for i in range(len(g["meshes"]))}
    parents = {}
    for parent, node in enumerate(nodes):
        if not isinstance(node, dict):
            raise ValueError("Malformed node")
        for child in node.get("children", []):
            if not isinstance(child, int) or isinstance(child, bool) or child < 0 or child >= len(nodes):
                raise ValueError("Invalid child node")
            if child in parents:
                raise ValueError("Multiple parents in mesh hierarchy")
            parents[child] = parent
        if "mesh" in node:
            i = node["mesh"]
            if not isinstance(i, int) or isinstance(i, bool) or i not in counts:
                raise ValueError("Invalid mesh reference")
            counts[i] += 1
    if any(count != 1 for count in counts.values()):
        raise ValueError("Every mesh must have exactly one scene instance")
    # A glTF can contain inactive scenes. Raw POSITION comparison would
    # otherwise include hidden models in silhouette framing and inflate IoU.
    scenes = g.get("scenes")
    if scenes is not None:
        if not isinstance(scenes, list) or not scenes:
            raise ValueError("Missing active glTF scene declaration")
        scene_id = g.get("scene", 0)
        if (type(scene_id) is not int or scene_id < 0 or
                scene_id >= len(scenes)):
            raise ValueError("Invalid default glTF scene")
        roots = scenes[scene_id].get("nodes")
        if not isinstance(roots, list) or not roots:
            raise ValueError("Active glTF scene has no root nodes")
        reachable = set()
        pending = list(roots)
        while pending:
            i = pending.pop()
            if type(i) is not int or i < 0 or i >= len(nodes):
                raise ValueError("Invalid active scene node reference")
            if i in reachable:
                continue
            reachable.add(i)
            pending.extend(nodes[i].get("children", []))
        mesh_nodes = {i for i, node in enumerate(nodes) if "mesh" in node}
        if not mesh_nodes.issubset(reachable):
            raise ValueError("Inactive/unreachable mesh would corrupt five-view IoU")

    def identity_trs(node):
        for key, target in (
            ("translation", [0, 0, 0]),
            ("rotation", [0, 0, 0, 1]),
            ("scale", [1, 1, 1]),
            ("matrix", [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
        ):
            if key not in node:
                continue
            values = node[key]
            if (not isinstance(values, list) or len(values) != len(target) or
                any(not isinstance(a, (int, float)) or isinstance(a, bool) or
                    not math.isfinite(a) or abs(a - b) > 1e-6
                    for a, b in zip(values, target))):
                raise ValueError("Non-identity node " + key + " invalidates raw-mesh IoU")
        if "weights" in node:
            raise ValueError("Morph weights change projected mesh")

    for i, node in enumerate(nodes):
        if "mesh" not in node:
            continue
        seen = set()
        cursor = i
        while cursor is not None:
            if cursor in seen:
                raise ValueError("Cyclic mesh hierarchy")
            seen.add(cursor)
            identity_trs(nodes[cursor])
            cursor = parents.get(cursor)

    for mesh in g["meshes"]:
        if "weights" in mesh:
            raise ValueError("Mesh has unsupported morph weights")
        if not isinstance(mesh.get("primitives"), list) or not mesh["primitives"]:
            raise ValueError("Empty mesh primitives")
        for prim in mesh["primitives"]:
            if prim.get("mode", 4) != 4:
                raise ValueError("Nontriangular primitive")
            if prim.get("targets"):
                raise ValueError("Morph target unsupported by static raw-position IoU")
            if "POSITION" not in prim.get("attributes", {}):
                raise ValueError("Mesh primitive has no positions")
    return True

#!/usr/bin/env python3
"""Strict, read-only glTF 2.0 BIN accessor decoding for original-view geometry QA.

Handles byteStride and independent accessor byte offsets. Restricts input to
finite float32 POSITION vectors and unsigned triangle indices. Fails closed on
sparse/compressed/nonlocal buffers and malformed ranges; never grants release.
"""
import math
import struct

COMPONENTS = {5123: ("H", 2), 5125: ("I", 4), 5126: ("f", 4)}
MAX_ELEMENTS = 750_000
MAX_VERTICES = 750_000


def read_projection_accessor(g, blob, accessor_id, data_type, component_types):
    accessors = g.get("accessors")
    views = g.get("bufferViews")
    if not isinstance(accessors, list) or not isinstance(views, list):
        raise ValueError("Missing GLB accessor/bufferView tables")
    if (type(accessor_id) is not int or accessor_id < 0 or
            accessor_id >= len(accessors)):
        raise ValueError("Invalid projection accessor reference")
    a = accessors[accessor_id]
    if not isinstance(a, dict) or a.get("sparse") or a.get("normalized", False):
        raise ValueError("Unsupported sparse/normalized projection accessor")
    arity = {"VEC3": 3, "SCALAR": 1}.get(data_type)
    component_type = a.get("componentType")
    if (a.get("type") != data_type or arity is None or
            component_type not in component_types or
            component_type not in COMPONENTS):
        raise ValueError("Unsupported projection accessor type")
    count = a.get("count")
    view_id = a.get("bufferView")
    if (type(count) is not int or count < 1 or count > MAX_ELEMENTS or
            type(view_id) is not int or view_id < 0 or view_id >= len(views)):
        raise ValueError("Invalid or oversized projection accessor")
    view = views[view_id]
    if not isinstance(view, dict) or view.get("buffer") != 0:
        raise ValueError("Only the primary embedded GLB BIN buffer is supported")
    dtype, component_size = COMPONENTS[component_type]
    elem_size = component_size * arity
    off = view.get("byteOffset", 0)
    local = a.get("byteOffset", 0)
    length = view.get("byteLength")
    stride = view.get("byteStride", elem_size)
    if (any(type(value) is not int for value in (off, local, length, stride)) or
            off < 0 or local < 0 or length < 1 or
            stride < elem_size or stride % component_size != 0 or
            (off + local) % component_size != 0 or
            off + length > len(blob) or
            off + local + (count - 1) * stride + elem_size > off + length):
        raise ValueError("Projection accessor exceeds BIN view bounds or is misaligned")
    fmt = "<" + dtype * arity
    result = []
    for i in range(count):
        vals = struct.unpack_from(fmt, blob, off + local + i * stride)
        if component_type == 5126 and not all(math.isfinite(x) for x in vals):
            raise ValueError("Nonfinite projected 3D vertex")
        result.append(vals)
    return result


def decode_triangle_primitive(g, blob, primitive):
    if not isinstance(primitive, dict) or primitive.get("mode", 4) != 4:
        raise ValueError("Only triangle GLB primitives are supported")
    attributes = primitive.get("attributes", {})
    if not isinstance(attributes, dict) or "POSITION" not in attributes:
        raise ValueError("Missing POSITION primitive")
    if "indices" not in primitive:
        raise ValueError("Indexed triangle primitives required")
    verts = read_projection_accessor(g, blob, attributes["POSITION"], "VEC3", {5126})
    faces = read_projection_accessor(g, blob, primitive["indices"], "SCALAR", {5123, 5125})
    if len(faces) % 3 != 0:
        raise ValueError("Triangle index array must have a multiple of 3 elements")
    indices = [x[0] for x in faces]
    if any(i >= len(verts) for i in indices):
        raise ValueError("Projected GLB triangle index outside POSITION vertices")
    if not any(max(v[axis] for v in verts) - min(v[axis] for v in verts) > 0.01
               for axis in (0, 1, 2)):
        raise ValueError("Projected mesh has no meaningful geometric extent")
    return verts, [indices[i:i + 3] for i in range(0, len(indices), 3)]

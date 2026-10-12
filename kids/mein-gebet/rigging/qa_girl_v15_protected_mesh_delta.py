#!/usr/bin/env python3
"""Strict V14→V15 real-GLB delta gate; no visual/fiqh/release approval."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
from glb_projection_accessor import read_projection_accessor

SHA14='ec5df2b264ee87f20ff399446abbc89f344cd084d14133c64ebe38fba4a1b578'
SHA15='44e75d268426d36a5f6e040437c5874bfc81d9ff5e07adf15def49f845f20321'
EXPECTED={'face_original_front_only_surface','soft_round_nose'}|{
    f'{side}_eye_{part}' for side in ('-1','1')
    for part in ('sclera','iris','pupil','glint')}


def read(path, expected):
    data=Path(path).read_bytes()
    sha=hashlib.sha256(data).hexdigest()
    if sha!=expected or data[:4]!=b'glTF' or struct.unpack_from('<II',data,4)!=(2,len(data)):
        raise ValueError('Wrong SHA256 or GLB v2 header: '+str(path))
    pos=12; chunks={}
    while pos<len(data):
        n,t=struct.unpack_from('<II',data,pos);pos+=8
        if pos+n>len(data): raise ValueError('truncated chunk')
        chunks[t]=data[pos:pos+n];pos+=n
    g=json.loads(chunks[0x4e4f534a]); blob=chunks[0x004e4942]
    if g.get('skins') or g.get('animations'):
        raise ValueError('Unexpected rig or animation in unapproved baseline')
    meshes={}
    for m in g['meshes']:
        if len(m['primitives'])!=1: raise ValueError('Unsupported multiple primitives')
        p=m['primitives'][0]
        if p.get('mode',4)!=4: raise ValueError('Only triangles supported')
        v=read_projection_accessor(g,blob,p['attributes']['POSITION'],'VEC3',{5126})
        indices=read_projection_accessor(g,blob,p['indices'],'SCALAR',{5123,5125})
        ix=[i[0] for i in indices]
        if len(ix)%3 or any(i>=len(v) for i in ix): raise ValueError('Bad indices')
        attrs={k:read_projection_accessor(g,blob,idx,g['accessors'][idx]['type'],
                    {g['accessors'][idx]['componentType']}) if k=='POSITION' else
               hashlib.sha256(bytes(blob[g['bufferViews'][g['accessors'][idx]['bufferView']].get('byteOffset',0):
                   g['bufferViews'][g['accessors'][idx]['bufferView']].get('byteOffset',0)+
                   g['bufferViews'][g['accessors'][idx]['bufferView']]['byteLength']])).hexdigest()
               for k,idx in p['attributes'].items()}
        if m['name'] in meshes: raise ValueError('Duplicate mesh name')
        meshes[m['name']]={'vertices':v,'indices':ix,'attrs':attrs}
    return {'sha':sha,'bytes':len(data),'meshes':meshes}


def check(a,b):
    old,new=read(a,SHA14),read(b,SHA15)
    if set(old['meshes'])!=set(new['meshes']): raise ValueError('Mesh list changed')
    changed=[]; offsets={}; degenerate=0; tri=0
    for name,o in old['meshes'].items():
        n=new['meshes'][name]
        if len(o['vertices'])!=len(n['vertices']) or o['indices']!=n['indices']:
            raise ValueError('Mesh topology changed: '+name)
        d=max((max(abs(x-y) for x,y in zip(u,v)) for u,v in zip(o['vertices'],n['vertices'])),default=0)
        if d>0 or o['attrs']!=n['attrs']:
            changed.append(name);offsets[name]=round(d,9)
        tri+=len(n['indices'])//3
        if name in EXPECTED:
            v=n['vertices']; ix=n['indices']
            for i in range(0,len(ix),3):
                p,q,r=(v[ix[i+j]] for j in range(3))
                u=[q[j]-p[j] for j in range(3)];w=[r[j]-p[j] for j in range(3)]
                c=(u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0])
                degenerate+=sum(t*t for t in c)<1e-20
    passed=set(changed)==EXPECTED and len(new['meshes'])==213 and tri==195544 and degenerate==0
    return {'schemaVersion':1,'scope':'real V14/V15 GLB binary geometry regression only',
            'sourceSHA256':old['sha'],'candidateSHA256':new['sha'],
            'sourceBytes':old['bytes'],'candidateBytes':new['bytes'],
            'meshCount':len(new['meshes']),'triangleCount':tri,
            'changedMeshes':sorted(changed),'maxAxisVertexDisplacementModelUnits':offsets,
            'protectedMeshCount':len(new['meshes'])-len(changed),
            'degenerateTrianglesInChangedMeshes':degenerate,
            'technicalBinaryDeltaPassed':passed,
            'originalVisualIdentityApproved':False,'rigApproved':False,
            'fiqhApproved':False,'productionReady':False}


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--v14',required=True);parser.add_argument('--v15',required=True)
    parser.add_argument('--output');args=parser.parse_args()
    report=check(args.v14,args.v15)
    result=json.dumps(report,ensure_ascii=False,indent=2)+'\n'
    if args.output: Path(args.output).write_text(result,encoding='utf-8')
    else: print(result)
    if not report['technicalBinaryDeltaPassed']: raise SystemExit('3D binary QA failed')

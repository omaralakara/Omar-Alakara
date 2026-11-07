import { BufferAttribute, BufferGeometry } from "three";

// One deterministic correspondence across the Earth, cloud and satellite. Geometry is generated
// once from the self-hosted Earth asset, then all movement happens in the shader.
export function createShapeGeometry(data: ArrayBuffer) {
  const values = new Float32Array(data);
  const earthCount = values.length / 4;
  const count = earthCount + 12000;
  const positions = new Float32Array(count * 3);
  const cloud = new Float32Array(count * 3);
  const satellite = new Float32Array(count * 3);
  const meta = new Float32Array(count * 3);
  let seed = 817;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const noise = () => (random() + random() + random() - 1.5);
  for (let i = 0; i < count; i++) {
    let kind = 1;
    if (i < earthCount) {
      kind = values[i*4+3];
      const r = 1 + noise() * .012;
      positions.set([values[i*4]*r + noise()*.003,values[i*4+1]*r,values[i*4+2]*r],i*3);
    } else if (i < earthCount + 8500) {
      kind = 2;
      const a = random() * Math.PI * 2;
      const r = 1.14 + noise() * .13;
      const x = Math.cos(a)*r, y = Math.sin(a)*.24 + noise()*.045;
      positions.set([x*.95-y*.31, x*.31+y*.95, Math.sin(a)*r],i*3);
    } else {
      kind = 3;
      const a = random()*Math.PI*2, y = random()*2-1, r = 1.05 + random()**2*.65;
      positions.set([Math.sqrt(1-y*y)*Math.cos(a)*r, y*r, Math.sqrt(1-y*y)*Math.sin(a)*r],i*3);
    }
    // An open cloud spreads across the viewport between the two silhouettes.
    cloud.set([(random()-.5)*9,(random()-.5)*5.5,(random()-.5)*3],i*3);
    const part = random();
    let sx: number, sy: number, sz: number;
    if (part < .61) {
      const side = random()>.5 ? 1 : -1;
      sx = side*(.47+random()*1.05); sy=(random()-.5)*.85; sz=noise()*.009;
      // Brighter edges/grid lines keep the solar arrays readable as point clouds.
      if(random()<.3) sy=(Math.round((sy+.425)/.10625)*.10625)-.425;
    } else if(part < .88) {
      const face = Math.floor(random()*6), a=(random()-.5)*.64, b=(random()-.5)*.65;
      sx=face<2 ? (face===0 ? -.32 : .32) : a;
      sy=face>=2 && face<4 ? (face===2 ? -.36 : .36) : b;
      sz=face>=4 ? (face===4 ? -.3 : .3) : b;
    } else {
      const a=random()*Math.PI*2, r=Math.sqrt(random())*.36;
      sx=Math.cos(a)*r; sy=.58+r*r*.8; sz=Math.sin(a)*r;
    }
    // Tilt the whole satellite in 3D, exposing body depth and solar panel faces.
    const yy=sy*.86-sz*.5, zz=sy*.5+sz*.86;
    satellite.set([sx*.91-yy*.42,sx*.42+yy*.91,zz],i*3);
    meta.set([kind,random(),part],i*3);
  }
  // Shuffle all attributes together so lower draw counts retain land, trails and all parts.
  for(let i=count-1;i>0;i--) {
    const j=Math.floor(random()*(i+1));
    for(const array of [positions,cloud,satellite,meta]) for(let c=0;c<3;c++) { const tmp=array[i*3+c]; array[i*3+c]=array[j*3+c]; array[j*3+c]=tmp; }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position",new BufferAttribute(positions,3));
  geometry.setAttribute("aCloud",new BufferAttribute(cloud,3));
  geometry.setAttribute("aSatellite",new BufferAttribute(satellite,3));
  geometry.setAttribute("aMeta",new BufferAttribute(meta,3));
  // Include all future targets in the bounding sphere; no culling during a morph.
  geometry.computeBoundingSphere();
  if(geometry.boundingSphere) geometry.boundingSphere.radius=4;
  return geometry;
}

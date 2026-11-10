import { BufferAttribute, BufferGeometry } from "three";

// A three-armed spiral galaxy lying flat in the XZ plane (the shader tilts and spins it).
// Returns [x, y, z, part] with part 0 core · 1 arm · 2 halo dust.
function galaxyPoint(random: () => number, noise: () => number) {
  const k = random();
  if (k < .16) {
    const a = random() * Math.PI * 2, r = random() ** 2 * .32;
    return [Math.cos(a) * r, noise() * .1 * (1 - r / .32), Math.sin(a) * r, 0];
  }
  if (k < .9) {
    const arm = Math.floor(random() * 3), r = .18 + random() ** .7 * 1.15;
    const a = arm * Math.PI * 2 / 3 + r * 2.4 + noise() * .26 * (1 - r * .3);
    return [Math.cos(a) * r + noise() * .07 * (1 + r), noise() * .03, Math.sin(a) * r + noise() * .07 * (1 + r), 1];
  }
  const a = random() * Math.PI * 2, r = .3 + random() * 1.35;
  return [Math.cos(a) * r, noise() * .12, Math.sin(a) * r, 2];
}

// Robot joints, shared with the vertex shader (keep in sync with ROBOT_* in shaders.ts).
export const ROBOT_NECK = [0, .5, 0], ROBOT_SHOULDER = [.5, .36, 0], ROBOT_ELBOW = [.58, -.04, 0];

// Random point on a rounded box (superellipsoid, exponent 4) with half-sizes hx, hy, hz.
function roundedBox(random: () => number, hx: number, hy: number, hz: number) {
  let x = 0, y = 0, z = 0, length = 0;
  do { x = random() * 2 - 1; y = random() * 2 - 1; z = random() * 2 - 1; length = x * x + y * y + z * z; } while (length > 1 || length < .01);
  const s = Math.pow(x ** 4 + y ** 4 + z ** 4, .25);
  return [x / s * hx, y / s * hy, z / s * hz];
}
// Random point on a capsule-like limb between two joints.
function limb(random: () => number, a: number[], b: number[], radius: number) {
  const t = random(), angle = random() * Math.PI * 2;
  return [a[0] + (b[0] - a[0]) * t + Math.cos(angle) * radius, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t + Math.sin(angle) * radius];
}

/**
 * A friendly hovering robot. Returns [x, y, z, part] where part is
 * 0 body · 1 head · 2 waving upper arm · 3 waving forearm and hand; +.5 marks glowing details.
 */
function robotPoint(random: () => number, noise: () => number) {
  const r = random();
  if (r < .25) { const [x, y, z] = roundedBox(random, .31, .25, .25); return [x, y + .78, z, 1]; }
  if (r < .28) { // Eyes
    const side = random() > .5 ? 1 : -1, a = random() * Math.PI * 2, d = Math.sqrt(random()) * .055;
    return [side * .12 + Math.cos(a) * d, .8 + Math.sin(a) * d, .262, 1.5];
  }
  if (r < .31) { // Visor outline
    const t = random(), edge = Math.floor(random() * 4);
    const x = edge < 2 ? -.23 + t * .46 : (edge === 2 ? -.23 : .23), y = edge < 2 ? (edge === 0 ? .67 : .92) : .67 + t * .25;
    return [x, y, .258, 1];
  }
  if (r < .33) { const t = random(); return t < .7 ? [noise() * .006, 1.03 + t * .2, 0, 1] : [noise() * .03, 1.2 + noise() * .03, noise() * .03, 1.5]; } // Antenna
  if (r < .35) { const side = random() > .5 ? 1 : -1, a = random() * Math.PI * 2; return [side * (.32 + random() * .04), .78 + Math.cos(a) * .07, Math.sin(a) * .07, 1]; } // Ears
  if (r < .37) return [...limb(random, [0, .47, 0], [0, .55, 0], .08)].concat(0); // Neck
  if (r < .64) { const [x, y, z] = roundedBox(random, .44, .4, .25); return [x, y + .05, z, 0]; } // Torso
  if (r < .67) { const a = random() * Math.PI * 2, d = Math.sqrt(random()) * .1; return [Math.cos(a) * d, .14 + Math.sin(a) * d, .262, .5]; } // Chest core
  if (r < .76) { // Resting arm and hand
    const t = random();
    if (t < .8) return [...limb(random, [-.5, .36, 0], [-.6, -.42, 0], .075)].concat(0);
    const [x, y, z] = roundedBox(random, .09, .09, .09); return [x - .62, y - .52, z, 0];
  }
  if (r < .82) return [...limb(random, ROBOT_SHOULDER, ROBOT_ELBOW, .08)].concat(2); // Waving upper arm
  if (r < .9) { // Waving forearm and open hand
    if (random() < .6) return [...limb(random, ROBOT_ELBOW, [.62, -.42, 0], .07)].concat(3);
    const [x, y, z] = roundedBox(random, .1, .11, .06); return [x + .63, y - .54, z, 3];
  }
  if (r < .96) { const a = random() * Math.PI * 2, rr = .3 + noise() * .03; return [Math.cos(a) * rr, -.52 + noise() * .01, Math.sin(a) * rr * .5, .5]; } // Hover ring
  const a = random() * Math.PI * 2, rr = Math.sqrt(random()) * .26; return [Math.cos(a) * rr, -.6 - random() * .25, Math.sin(a) * rr * .5, .5]; // Thruster glow
}

// Stable particle correspondence lets every scene flow into the next on the GPU:
// Earth → satellite → galaxy → rocket → robot → Earth.
export function createShapeGeometry(data: ArrayBuffer) {
  const values = new Float32Array(data);
  const earthCount = values.length / 4;
  const count = earthCount + 12000;
  const positions = new Float32Array(count * 3);
  const robot = new Float32Array(count * 3);
  const robotPart = new Float32Array(count);
  const satellite = new Float32Array(count * 3);
  const rocket = new Float32Array(count * 3);
  const galaxy = new Float32Array(count * 3);
  const details = new Float32Array(count * 3);
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
    const [ox,oy,oz,piece]=robotPoint(random,noise);
    robot.set([ox,oy,oz],i*3);robotPart[i]=piece;
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
    const rocketPart=random(),angle=random()*Math.PI*2;
    let rx=0,ry=0,rz=0;
    if(rocketPart<.48) {
      ry=-.55+random()*1.35;
      rx=Math.cos(angle)*.215;rz=Math.sin(angle)*.215;
    } else if(rocketPart<.65) {
      const nose=random();ry=.8+nose*.57;
      rx=Math.cos(angle)*.215*(1-nose);rz=Math.sin(angle)*.215*(1-nose);
    } else if(rocketPart<.79) {
      const side=random()>.5 ? 1 : -1,t=random();
      rx=side*(.2+t*.36);ry=-.62+t*.04+random()*(1-t)*.55;rz=(random()-.5)*.035;
    } else if(rocketPart<.87) {
      rx=Math.cos(angle)*.108;ry=.36+Math.sin(angle)*.108;rz=.22;
    } else {
      const flame=random();ry=-.6-flame*.85;rx=noise()*.2*(1-flame);rz=noise()*.13*(1-flame);
    }
    rocket.set([rx*.95+ry*.31,-rx*.31+ry*.95,rz],i*3);
    const [gx,gy,gz,piece2]=galaxyPoint(random,noise);
    galaxy.set([gx,gy,gz],i*3);
    details.set([rocketPart,piece2,random()],i*3);
    meta.set([kind,random(),part],i*3);
  }
  // Shuffle all attributes together so lower draw counts retain land, trails and all parts.
  for(let i=count-1;i>0;i--) {
    const j=Math.floor(random()*(i+1));
    for(const array of [positions,robot,satellite,rocket,galaxy,details,meta]) for(let c=0;c<3;c++) { const tmp=array[i*3+c]; array[i*3+c]=array[j*3+c]; array[j*3+c]=tmp; }
    const tmp=robotPart[i];robotPart[i]=robotPart[j];robotPart[j]=tmp;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position",new BufferAttribute(positions,3));
  geometry.setAttribute("aRobot",new BufferAttribute(robot,3));
  geometry.setAttribute("aRobotPart",new BufferAttribute(robotPart,1));
  geometry.setAttribute("aSatellite",new BufferAttribute(satellite,3));
  geometry.setAttribute("aRocket",new BufferAttribute(rocket,3));
  geometry.setAttribute("aGalaxy",new BufferAttribute(galaxy,3));
  geometry.setAttribute("aDetails",new BufferAttribute(details,3));
  geometry.setAttribute("aMeta",new BufferAttribute(meta,3));
  // Include all future targets in the bounding sphere; no culling during a morph.
  geometry.computeBoundingSphere();
  if(geometry.boundingSphere) geometry.boundingSphere.radius=4;
  return geometry;
}

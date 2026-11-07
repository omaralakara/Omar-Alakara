// Natural Earth 1:110m land, distributed by world-atlas (public-domain geography).
// Precompute once; no geographic processing or third-party requests at runtime.
import fs from 'node:fs';
import { feature } from 'topojson-client';
const atlas = JSON.parse(fs.readFileSync('node_modules/world-atlas/land-110m.json', 'utf8'));
const land = feature(atlas, atlas.objects.land);
const features = land.type === 'FeatureCollection' ? land.features : [land];
const polygons = features.flatMap(f => f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates]);
const shapes = polygons.map(rings => ({ rings, minX: Math.min(...rings[0].map(p => p[0])), maxX: Math.max(...rings[0].map(p => p[0])), minY: Math.min(...rings[0].map(p => p[1])), maxY: Math.max(...rings[0].map(p => p[1])) }));
function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function isLand(lon, lat) {
  return shapes.some(s => lon >= s.minX && lon <= s.maxX && lat >= s.minY && lat <= s.maxY && inRing(lon, lat, s.rings[0]) && !s.rings.slice(1).some(r => inRing(lon, lat, r)));
}
const points = [];
const count = 68000;
const golden = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < count; i++) {
  const y = 1 - 2 * (i + .5) / count;
  const lat = Math.asin(y), lon = ((golden * i) % (2 * Math.PI)) - Math.PI;
  const onLand = isLand(lon * 180 / Math.PI, lat * 180 / Math.PI);
  if (!onLand && i % 9 !== 0) continue;
  points.push([Math.cos(lat) * Math.sin(lon), y, Math.cos(lat) * Math.cos(lon), onLand ? 1 : 0]);
}
// Deterministic shuffle: mobile draw ranges still cover the complete globe.
let seed = 42;
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
for (let i = points.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [points[i], points[j]] = [points[j], points[i]]; }
fs.mkdirSync('public/particles', { recursive: true });
fs.writeFileSync('public/particles/earth.bin', Buffer.from(new Float32Array(points.flat()).buffer));

function project(x,y,z) {
  const ry = -.24, rx = .13;
  const xx = x * Math.cos(ry) + z * Math.sin(ry), zz = -x * Math.sin(ry) + z * Math.cos(ry);
  return [xx, y * Math.cos(rx) - zz * Math.sin(rx), y * Math.sin(rx) + zz * Math.cos(rx)];
}
let dots = '';
for (let i = 0; i < points.length; i++) {
  const [x,y,z,l] = points[i], [xx,yy,zz] = project(x,y,z);
  if (zz < .03 || (l && i % 2)) continue;
  const color = xx < -.1 ? '#448bff' : '#a05bff';
  dots += `<circle cx="${(300 + xx*240).toFixed(2)}" cy="${(300-yy*240).toFixed(2)}" r="${l ? 1.05 : .55}" fill="${color}" opacity="${((l ? .95 : .1) * (.45 + .55*zz)).toFixed(2)}"/>`;
}
let halo = '';
for(let i=0;i<2600;i++) {
  const t=random()*Math.PI*2, r=270+(random()-.5)*25;
  const x=Math.cos(t)*r, y=Math.sin(t)*57+(random()-.5)*12;
  halo += `<circle cx="${(300+x*.95-y*.31).toFixed(1)}" cy="${(300-x*.31-y*.95).toFixed(1)}" r="${(.4+random()*.8).toFixed(1)}" fill="${random()>.7 ? '#e7b66d' : '#775bff'}" opacity="${(.2+random()*.4).toFixed(2)}"/>`;
}
const lat = 33.89*Math.PI/180, lon = 35.5*Math.PI/180;
const [lx,ly] = project(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><defs><radialGradient id="h"><stop offset=".55" stop-color="#35317d" stop-opacity="0"/><stop offset=".78" stop-color="#5540b4" stop-opacity=".1"/><stop offset="1" stop-color="#35317d" stop-opacity="0"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="1.2"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="300" cy="300" r="290" fill="url(#h)"/><g filter="url(#glow)">${dots}${halo}</g><g transform="translate(${300+lx*240} ${300-ly*240})" fill="none" stroke="#e5c38a"><circle r="5" opacity=".8"/><circle r="1.7" fill="#f0d7ac"/></g></svg>`;
fs.writeFileSync('public/particles/earth-fallback.svg', svg);
console.log(`Generated ${points.length} particles (${points.filter(p=>p[3]).length} land) and static SVG.`);

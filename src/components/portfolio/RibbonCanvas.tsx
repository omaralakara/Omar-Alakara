"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { BufferAttribute, BufferGeometry, DoubleSide, Group, MathUtils, ShaderMaterial, Vector3 } from "three";

export type RibbonMotion = { scroll: number; form: number };
type Props = { active: boolean; compact: boolean; motion: RefObject<RibbonMotion>; onReady: () => void; onError: () => void };

// A continuous flattened tube around a trefoil. A second surface provides the
// matching vertices/normals for the scroll-controlled open-loop transformation.
function createRibbon() {
  const segments = 420, sides = 20;
  const surfaces = [new Float32Array((segments + 1) * (sides + 1) * 3), new Float32Array((segments + 1) * (sides + 1) * 3)];
  const indices: number[] = [];
  const center = (t: number, mode: number) => mode === 0
    ? new Vector3((2 + .66 * Math.cos(3 * t)) * Math.cos(2 * t) * .85, (2 + .66 * Math.cos(3 * t)) * Math.sin(2 * t) * .85, .8 * Math.sin(3 * t))
    : new Vector3(2.1 * Math.cos(t), 1.7 * Math.sin(t), .3 * Math.sin(3 * t));
  for (let mode = 0; mode < 2; mode++) {
    for (let i = 0; i <= segments; i++) {
      const t = i / segments * Math.PI * 2;
      const c = center(t, mode);
      const tangent = center(t + .001, mode).sub(center(t - .001, mode)).normalize();
      const normal = new Vector3(0, 0, 1).cross(tangent).normalize();
      const binormal = tangent.clone().cross(normal).normalize();
      const twist = t * (mode === 0 ? 1 : 2) + .3;
      for (let j = 0; j <= sides; j++) {
        const v = j / sides * Math.PI * 2;
        const x = Math.cos(v) * .44, y = Math.sin(v) * .105;
        const a = x * Math.cos(twist) - y * Math.sin(twist);
        const b = x * Math.sin(twist) + y * Math.cos(twist);
        const point = c.clone().addScaledVector(normal, a).addScaledVector(binormal, b);
        point.toArray(surfaces[mode], (i * (sides + 1) + j) * 3);
      }
    }
  }
  for (let i = 0; i < segments; i++) for (let j = 0; j < sides; j++) {
    const a = i * (sides + 1) + j, b = a + sides + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(surfaces[0], 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const target = new BufferGeometry();
  target.setAttribute("position", new BufferAttribute(surfaces[1], 3));
  target.setIndex(indices); target.computeVertexNormals();
  geometry.setAttribute("aTarget", target.attributes.position.clone());
  geometry.setAttribute("aTargetNormal", target.attributes.normal.clone());
  target.dispose();
  return geometry;
}

const vertex = /* glsl */`
  uniform float uMorph;
  attribute vec3 aTarget;
  attribute vec3 aTargetNormal;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 p = mix(position, aTarget, uMorph);
    vNormal = normalize(normalMatrix * normalize(mix(normal, aTargetNormal, uMorph)));
    vec4 view = modelViewMatrix * vec4(p, 1.);
    vPosition = view.xyz;
    gl_Position = projectionMatrix * view;
  }
`;
const fragment = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 n = normalize(vNormal) * (gl_FrontFacing ? 1. : -1.);
    vec3 view = normalize(-vPosition);
    vec3 r = reflect(-view, n);
    float fresnel = pow(1. - max(dot(n, view), 0.), 2.8);
    float top = smoothstep(-.4, .85, r.y);
    vec3 color = mix(vec3(.022,.018,.042), vec3(.32,.25,.49), top);
    float strip = pow(max(0., 1. - abs(r.y - .48) * 2.7), 8.);
    float side = pow(max(0., 1. - abs(r.x + .58) * 2.3), 12.);
    float edge = pow(max(dot(n, normalize(vec3(-1., 2., 3.))), 0.), 18.);
    color += strip * vec3(1.6,1.43,1.95);
    color += side * vec3(.48,.25,.98);
    color += edge * vec3(.8,.7,1.);
    color += fresnel * vec3(.38,.33,.52);
    float lower = pow(max(0., dot(r, normalize(vec3(.5,-1.,.1)))), 18.);
    color += lower * vec3(.15,.18,.64);
    gl_FragColor = vec4(color, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function Sculpture({ active, compact, motion, onReady, onError }: Props) {
  const group = useRef<Group>(null);
  const material = useRef<ShaderMaterial>(null);
  const { gl, viewport, invalidate } = useThree();
  const geometry = useMemo(createRibbon, []);
  const uniforms = useMemo(() => ({ uMorph: { value: 0 } }), []);
  const pointer = useRef({ x: 0, y: 0 });
  const elapsed = useRef(0);
  const ready = useRef(false);
  const performance = useRef({ time: 0, count: 0, adjusted: false });
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onError(); };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const bounds = canvas.getBoundingClientRect();
      pointer.current.x = MathUtils.clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1);
      pointer.current.y = MathUtils.clamp((event.clientY - bounds.top) / bounds.height * 2 - 1, -1, 1);
    };
    const reset = () => { pointer.current = { x: 0, y: 0 }; };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", reset);
    canvas.addEventListener("webglcontextlost", lost);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("blur", reset); canvas.removeEventListener("webglcontextlost", lost); };
  }, [gl, onError]);
  useEffect(() => { invalidate(); }, [active, invalidate]);
  useFrame((_, delta) => {
    if (!group.current || !material.current) return;
    if (!ready.current) { ready.current = true; onReady(); }
    if (!active) return;
    const dt = Math.min(delta, .05);
    elapsed.current += dt;
    const scroll = motion.current.scroll;
    const morph = Math.max(motion.current.form, MathUtils.smoothstep(scroll, .06, .8));
    material.current.uniforms.uMorph.value = MathUtils.damp(material.current.uniforms.uMorph.value, morph, 3.5, dt);
    group.current.rotation.x = MathUtils.damp(group.current.rotation.x, .42 + pointer.current.y * .2 + scroll * .8, 3, dt);
    group.current.rotation.y = MathUtils.damp(group.current.rotation.y, -.34 + pointer.current.x * .3 + Math.sin(elapsed.current * .18) * .18, 3, dt);
    group.current.rotation.z = -.28 + elapsed.current * .045 + scroll * .85;
    group.current.position.y = Math.sin(elapsed.current * .65) * .065;
    const scale = Math.min(viewport.width / 5.9, viewport.height / 5.7) * (compact ? .94 : 1.03);
    group.current.scale.setScalar(scale * (1 - scroll * .12));
    const perf = performance.current;
    if (!perf.adjusted && elapsed.current > 2) {
      perf.time += delta; perf.count++;
      if (perf.time > 3) {
        if (perf.count / perf.time < 35) gl.setPixelRatio(1);
        perf.adjusted = true;
      }
    }
  });
  return <group ref={group} rotation={[.42, -.34, -.28]}>
    <mesh geometry={geometry} frustumCulled={false}>
      <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment} side={DoubleSide} />
    </mesh>
  </group>;
}

export default function RibbonCanvas(props: Props) {
  return <Canvas camera={{ position: [0, 0, 8], fov: 42 }} dpr={props.compact ? 1 : [1, 1.5]} frameloop={props.active ? "always" : "demand"} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} fallback={null}>
    <Sculpture {...props} />
  </Canvas>;
}

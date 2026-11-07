"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, DynamicDrawUsage, Group, MeshBasicMaterial, Quaternion, ShaderMaterial, Vector2, Vector3 } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import type { IntroMotion } from "../motion/useIntroScroll";
import { createShapeGeometry } from "./shape-buffers";
import { particleFragment, particleVertex, starVertex } from "./shaders";

type Props = { compact: boolean; active: boolean; motion: RefObject<IntroMotion>; onReady: () => void; onError: () => void; onProgress: (value: number) => void };
const lat=33.89*Math.PI/180,lon=35.5*Math.PI/180;
const lebanon=new Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));

function Glow({ compact }: { compact: boolean }) {
  const { gl, scene, camera, size }=useThree();
  const pipeline=useMemo(() => {
    const composer=new EffectComposer(gl);
    const render=new RenderPass(scene,camera);
    const bloom=new UnrealBloomPass(new Vector2(256,256),.65,.36,.55);
    const output=new OutputPass();
    composer.addPass(render); composer.addPass(bloom); composer.addPass(output);
    return {composer,bloom,render,output};
  },[gl,scene,camera]);
  useEffect(() => {
    pipeline.composer.setPixelRatio(compact ? 1 : Math.min(gl.getPixelRatio(),1.5));
    pipeline.composer.setSize(size.width,size.height);
  },[size,compact,gl,pipeline]);
  useEffect(() => () => { pipeline.bloom.dispose(); pipeline.render.dispose(); pipeline.output.dispose(); pipeline.composer.dispose(); },[pipeline]);
  useFrame((_,delta) => pipeline.composer.render(delta),1);
  return null;
}

function Sculpture({ data, ...props }: Props & { data: ArrayBuffer }) {
  const { compact, active, motion, onReady, onError }=props;
  const group=useRef<Group>(null),marker=useRef<Group>(null);
  const markerMaterial=useRef<MeshBasicMaterial>(null);
  const material=useRef<ShaderMaterial>(null),starMaterial=useRef<ShaderMaterial>(null);
  const {viewport,gl,invalidate,size}=useThree();
  const pointer=useRef(new Vector2(5,5)),tilt=useRef(new Vector2());
  const previousPointer=useRef(new Vector2(5,5)),pointerVelocity=useRef(new Vector2());
  const time=useRef(0),spin=useRef(-.24),progress=useRef(motion.current.progress),hover=useRef(0);
  const notified=useRef(false);
  const perf=useRef({frames:0,time:0,downgraded:false});
  const geometry=useMemo(() => createShapeGeometry(data),[data]);
  useEffect(() => { geometry.setDrawRange(0,Math.floor(geometry.attributes.position.count*(compact ? .57 : 1))); },[geometry,compact]);
  useEffect(() => () => geometry.dispose(),[geometry]);
  const stacked=compact && viewport.height>viewport.width*.8;
  const radius=stacked ? Math.min(viewport.width*.42,viewport.height*.21) : Math.min(viewport.width*.255,viewport.height*.36);
  const starGeometry=useMemo(() => {
    let seed=42;
    const random=() => { seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; };
    const count=compact ? 450 : 1200;
    const array=new Float32Array(count*3),seeds=new Float32Array(count);
    for(let i=0;i<count;i++) { array.set([(random()-.5)*viewport.width*1.1,(random()-.5)*viewport.height*1.1,-2-random()*5],i*3); seeds[i]=random(); }
    const geo=new BufferGeometry(); geo.setAttribute("position",new BufferAttribute(array,3).setUsage(DynamicDrawUsage)); geo.setAttribute("aSeed",new BufferAttribute(seeds,1)); return geo;
  },[compact,viewport.width,viewport.height]);
  useEffect(() => () => starGeometry.dispose(),[starGeometry]);
  const starFlow=useMemo(() => ({rest:Float32Array.from(starGeometry.attributes.position.array),velocity:new Float32Array(starGeometry.attributes.position.count*2)}),[starGeometry]);
  const uniforms=useMemo(() => ({uTime:{value:0},uProgress:{value:0},uReveal:{value:0},uDpr:{value:1},uSpin:{value:-.24},uPointer:{value:new Vector2(5,5)},uVelocity:{value:new Vector2()},uAspect:{value:1},uHover:{value:0}}),[]);
  const starUniforms=useMemo(() => ({uTime:{value:0},uDpr:{value:1}}),[]);
  const markerRotation=useMemo(() => new Quaternion().setFromUnitVectors(new Vector3(0,0,1),lebanon),[]);
  useEffect(() => {
    const canvas=gl.domElement;
    canvas.addEventListener("webglcontextlost",onError);
    return () => canvas.removeEventListener("webglcontextlost",onError);
  },[gl,onError]);
  useEffect(() => {
    const move=(event:PointerEvent) => {
      if(event.pointerType!=="mouse" || !active) return;
      if(event.target instanceof Element && event.target.closest("a, button, dialog, nav")) { reset(); return; }
      const rect=gl.domElement.getBoundingClientRect();
      const entering=pointer.current.x===5;
      pointer.current.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
      if(entering) previousPointer.current.copy(pointer.current);
      tilt.current.set(pointer.current.x*.35,pointer.current.y*.35);
    };
    const reset=() => {pointer.current.set(5,5);previousPointer.current.set(5,5);pointerVelocity.current.set(0,0);tilt.current.set(0,0);};
    window.addEventListener("pointermove",move,{passive:true});
    window.addEventListener("blur",reset);
    document.documentElement.addEventListener("pointerleave",reset);
    return () => {window.removeEventListener("pointermove",move);window.removeEventListener("blur",reset);document.documentElement.removeEventListener("pointerleave",reset);};
  },[active,gl]);
  useEffect(() => { invalidate(); },[active,size,invalidate]);
  useFrame((_,delta) => {
    if(!material.current || !group.current) return;
    if(!notified.current) { notified.current=true; onReady(); }
    const dt=Math.min(delta,.05),ease=1-Math.exp(-dt*4);
    if(active) { time.current+=dt; spin.current+=dt*.19*(1-hover.current*.78); }
    progress.current+=(motion.current.progress-progress.current)*ease;
    const p=progress.current;
    const travel=Math.min(1,Math.max(0,(p-.26)/.58));
    const crossing=travel*travel*(3-2*travel);
    group.current.scale.setScalar(radius*(1-crossing*.32));
    group.current.position.x=viewport.width*(stacked ? .02-crossing*.06 : .245-crossing*.49);
    const lowerSatellite=stacked ? crossing*(size.height<700 ? .08 : .025) : 0;
    group.current.position.y=viewport.height*(stacked ? -.2-lowerSatellite : 0)+Math.sin(time.current*.35)*radius*.018;
    // Only hovering a formed silhouette opens the small, local gravity well.
    // The dispersed middle chapter keeps its much quieter cursor response.
    const forming=1-Math.min(1,Math.max(0,(p-.06)/.22));
    const returning=Math.min(1,Math.max(0,(p-.77)/.17));
    const scale=group.current.scale.x;
    const hx=(pointer.current.x*viewport.width*.5-group.current.position.x)/(scale*(1.15+returning*.4));
    const hy=(pointer.current.y*viewport.height*.5-group.current.position.y)/(scale*(1.1-returning*.2));
    const hoverTarget=active && pointer.current.x!==5 ? Math.max(0,1-Math.max(0,Math.hypot(hx,hy)-.7)/.4)*Math.max(forming,returning) : 0;
    hover.current+=(hoverTarget-hover.current)*(1-Math.exp(-dt*6));
    group.current.rotation.x+=(.13-tilt.current.y*.025*(1-hover.current*.6)-group.current.rotation.x)*ease;
    group.current.rotation.y+=(tilt.current.x*.035*(1-hover.current*.6)-group.current.rotation.y)*ease;
    group.current.rotation.z=Math.sin(time.current*.15)*.018;
    const u=material.current.uniforms;
    u.uTime.value=time.current; u.uProgress.value=p; u.uReveal.value=Math.min(1,time.current/1.8);
    u.uDpr.value=gl.getPixelRatio(); u.uSpin.value=spin.current;
    if(pointer.current.x===5) u.uPointer.value.copy(pointer.current);
    else u.uPointer.value.lerp(pointer.current,1-Math.exp(-dt*7));
    u.uHover.value=hover.current;
    u.uAspect.value=viewport.width/viewport.height;
    if(active && dt>0) {
      const dx=(pointer.current.x-previousPointer.current.x)*viewport.width*.5;
      const dy=(pointer.current.y-previousPointer.current.y)*viewport.height*.5;
      const distanceSquared=dx*dx+dy*dy;
      const distance=Math.sqrt(distanceSquared);
      const speed=Math.min(5,distance/dt);
      const velocityEase=1-Math.exp(-dt*12);
      pointerVelocity.current.x+=(dx/(distance||1)*speed-pointerVelocity.current.x)*velocityEase;
      pointerVelocity.current.y+=(dy/(distance||1)*speed-pointerVelocity.current.y)*velocityEase;
      const px=previousPointer.current.x*viewport.width*.5,py=previousPointer.current.y*viewport.height*.5;
      const reach=Math.max(.55,Math.min(1.1,viewport.width*.075));
      const positions=starGeometry.attributes.position;
      const damping=Math.exp(-dt*3.8);
      // A light wake follows the stroke, with a faster return to the resting field.
      for(let i=0;i<positions.count;i++) {
        const offset=i*3,velocity=i*2;
        const x=positions.array[offset],y=positions.array[offset+1];
        const along=distanceSquared>0 ? Math.max(0,Math.min(1,((x-px)*dx+(y-py)*dy)/distanceSquared)) : 0;
        const awayX=x-px-dx*along,awayY=y-py-dy*along;
        const influence=Math.exp(-(awayX*awayX+awayY*awayY)/(reach*reach));
        const force=influence*speed*.5;
        starFlow.velocity[velocity]+=((starFlow.rest[offset]-x)*2.2+(dx/(distance||1)*.35-awayY/reach*.45)*force)*dt;
        starFlow.velocity[velocity+1]+=((starFlow.rest[offset+1]-y)*2.2+(dy/(distance||1)*.35+awayX/reach*.45)*force)*dt;
        starFlow.velocity[velocity]*=damping;
        starFlow.velocity[velocity+1]*=damping;
        positions.array[offset]+=starFlow.velocity[velocity]*dt;
        positions.array[offset+1]+=starFlow.velocity[velocity+1]*dt;
      }
      positions.needsUpdate=true;
      previousPointer.current.copy(pointer.current);
    }
    u.uVelocity.value.copy(pointerVelocity.current);
    if(starMaterial.current) {starMaterial.current.uniforms.uTime.value=time.current;starMaterial.current.uniforms.uDpr.value=gl.getPixelRatio();}
    if(marker.current) {
      marker.current.rotation.y=spin.current;
      marker.current.visible=p<.1;
      if(markerMaterial.current) markerMaterial.current.opacity=(1-Math.min(1,p*10))*Math.min(1,time.current/1.8);
    }
    const stats=perf.current;
    if(active && time.current>4 && delta<.15) {
      stats.frames++;stats.time+=delta;
      if(stats.frames===180) {
        if(stats.time/stats.frames>.055) {
          if(stats.downgraded) onError();
          else {geometry.setDrawRange(0,Math.floor(geometry.attributes.position.count*.35));stats.downgraded=true;}
        }
        stats.frames=0;stats.time=0;
      }
    }
  });
  return <>
    <points geometry={starGeometry} frustumCulled={false}><shaderMaterial ref={starMaterial} vertexShader={starVertex} fragmentShader={particleFragment} uniforms={starUniforms} transparent depthWrite={false} blending={AdditiveBlending} /></points>
    <group ref={group} rotation={[.13,0,0]}>
      <points geometry={geometry} frustumCulled={false}><shaderMaterial ref={material} vertexShader={particleVertex} fragmentShader={particleFragment} uniforms={uniforms} transparent depthWrite={false} depthTest={false} blending={AdditiveBlending} /></points>
      <group ref={marker}><group position={lebanon.clone().multiplyScalar(1.025)} quaternion={markerRotation}>
        <mesh><ringGeometry args={[.019,.023,32]} /><meshBasicMaterial ref={markerMaterial} color={[2,1.2,.35]} transparent opacity={0} /></mesh>
        <mesh><circleGeometry args={[.008,16]} /><meshBasicMaterial color={[2,1.3,.5]} /></mesh>
      </group></group>
    </group>
    <Glow compact={compact} />
  </>;
}

export default function SharedCanvas(props:Props) {
  const [data,setData]=useState<ArrayBuffer|null>(null);
  useEffect(() => {
    const abort=new AbortController();
    async function load() {
      props.onProgress(12);
      const response=await fetch("/particles/earth.bin",{signal:abort.signal});
      if(!response.ok) throw new Error("Earth asset unavailable");
      const total=Number(response.headers.get("content-length"));
      let buffer:ArrayBuffer;
      if(response.body && total>0) {
        const reader=response.body.getReader(),chunks:Uint8Array[]=[];
        let loaded=0;
        while(true) {const result=await reader.read();if(result.done) break;chunks.push(result.value);loaded+=result.value.length;props.onProgress(12+Math.min(1,loaded/total)*68);}
        const bytes=new Uint8Array(loaded);let offset=0;
        for(const chunk of chunks) {bytes.set(chunk,offset);offset+=chunk.length;}
        buffer=bytes.buffer;
      } else buffer=await response.arrayBuffer();
      if(!buffer.byteLength || buffer.byteLength%16) throw new Error("Invalid Earth asset");
      props.onProgress(90);setData(buffer);
    }
    load().catch(error => {if(error.name!=="AbortError") props.onError();});
    return () => abort.abort();
  },[props.onError,props.onProgress]);
  if(!data) return null;
  return <Canvas orthographic camera={{position:[0,0,12],zoom:100,near:.1,far:100}} dpr={props.compact ? 1 : [1,1.5]} frameloop={props.active ? "always" : "demand"} gl={{alpha:true,antialias:false,powerPreference:"high-performance"}} fallback={null} onCreated={({gl}) => {gl.setClearColor(0x000000,1);}}><Sculpture {...props} data={data} /></Canvas>;
}

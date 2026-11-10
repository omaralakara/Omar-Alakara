"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Group, MeshBasicMaterial, Quaternion, ShaderMaterial, Vector2, Vector3, MathUtils } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import RocketExhaust from "./RocketExhaust";
import type { StoryMotion } from "../story/useStoryScroll";
import { createShapeGeometry } from "./shape-buffers";
import { particleFragment, particleVertex, starVertex } from "./shaders";

type Props = { compact: boolean; active: boolean; motion: RefObject<StoryMotion>; onReady: () => void; onError: () => void; onProgress: (value: number) => void };
const lat=33.89*Math.PI/180,lon=35.5*Math.PI/180;
const lebanon=new Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));
const smooth=(a:number,b:number,x:number)=>MathUtils.smoothstep(x,a,b);
// Per-scene placement: Earth · satellite · open cloud · rocket · ribbon · small Earth.
// x and y are fractions of the viewport; scale multiplies the base radius.
// Every scene sits centred in the right-hand column at the same visual size as the opening Earth.
const wide={x:[.24,.24,.24,.24,.24,.24],y:[0,0,0,0,-.06,0],scale:[1.13,.8,1,.85,1.05,1.13]};
const stackedLayout={x:[0,0,0,0,0,0],y:[-.22,.17,.17,.15,.13,.17],scale:[1.13,.95,1.05,.8,.95,1.13]};

function Glow({ compact }: { compact: boolean }) {
  const { gl, scene, camera, size }=useThree();
  const pipeline=useMemo(() => {
    const composer=new EffectComposer(gl);
    const render=new RenderPass(scene,camera);
    const bloom=new UnrealBloomPass(new Vector2(256,256),.55,.36,.6);
    const output=new OutputPass();
    composer.addPass(render);composer.addPass(bloom);composer.addPass(output);
    return {composer,bloom,render,output};
  },[gl,scene,camera]);
  useEffect(() => {
    pipeline.composer.setPixelRatio(compact ? 1 : Math.min(gl.getPixelRatio(),1.5));
    pipeline.composer.setSize(size.width,size.height);
  },[size,compact,gl,pipeline]);
  useEffect(() => () => {pipeline.bloom.dispose();pipeline.render.dispose();pipeline.output.dispose();pipeline.composer.dispose();},[pipeline]);
  useFrame((_,delta) => pipeline.composer.render(delta),1);
  return null;
}

function Sculpture({ data, ...props }: Props & { data: ArrayBuffer }) {
  const {compact,active,motion,onReady,onError}=props;
  const group=useRef<Group>(null),marker=useRef<Group>(null),markerMaterial=useRef<MeshBasicMaterial>(null);
  const material=useRef<ShaderMaterial>(null),starMaterial=useRef<ShaderMaterial>(null);
  const {viewport,gl,invalidate,size}=useThree();
  const pointer=useRef(new Vector2(5,5)),previousPointer=useRef(new Vector2(5,5)),pointerVelocity=useRef(new Vector2());
  const burst=useRef({x:5,y:5,time:-10});
  const time=useRef(0),spin=useRef(-.24),notified=useRef(false);
  // The scene eases toward the scroll position, so fast scrolls still morph smoothly.
  const view=useRef({story:-1});
  const head=useRef(new Vector2());
  const placement=useMemo(()=>({x:[0,0,0,0,0,0],y:[0,0,0,0,0,0]}),[]);
  const perf=useRef({frames:0,time:0,downgraded:false});
  const geometry=useMemo(()=>createShapeGeometry(data),[data]);
  useEffect(()=>{geometry.setDrawRange(0,Math.floor(geometry.attributes.position.count*(compact?.55:1)));},[geometry,compact]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  const stacked=compact&&viewport.height>viewport.width*.8;
  const radius=stacked?Math.min(viewport.width*.36,viewport.height*(size.height<700?.145:.165)):Math.min(viewport.width*.2,viewport.height*(size.height<500?.27:.3));
  // Flying starfield: each star has a fixed direction and a depth phase; the GPU moves it toward
  // the viewer, so no per-star work happens on the CPU.
  const starGeometry=useMemo(()=>{
    let seed=42;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const count=compact?700:1800,array=new Float32Array(count*3),seeds=new Float32Array(count);
    for(let i=0;i<count;i++){const a=random()*Math.PI*2,r=.04+Math.sqrt(random())*1.1;array.set([Math.cos(a)*r,Math.sin(a)*r,random()],i*3);seeds[i]=random();}
    const geo=new BufferGeometry();geo.setAttribute("position",new BufferAttribute(array,3));geo.setAttribute("aSeed",new BufferAttribute(seeds,1));return geo;
  },[compact]);
  useEffect(()=>()=>starGeometry.dispose(),[starGeometry]);
  const travel=useRef(0),warp=useRef(0);
  const uniforms=useMemo(()=>({uTime:{value:0},uStory:{value:0},uOrbit:{value:0},uWave:{value:0},uHead:{value:new Vector2()},uReveal:{value:0},uDpr:{value:1},uSpin:{value:-.24},uPointer:{value:new Vector2(5,5)},uVelocity:{value:new Vector2()},uAspect:{value:1},uBurst:{value:new Vector3(5,5,10)}}),[]);
  const starUniforms=useMemo(()=>({uTime:{value:0},uDpr:{value:1},uVisibility:{value:1},uTravel:{value:0},uWarp:{value:0},uView:{value:new Vector2(1,1)},uPointer:{value:new Vector2(5,5)}}),[]);
  const markerRotation=useMemo(()=>new Quaternion().setFromUnitVectors(new Vector3(0,0,1),lebanon),[]);
  useEffect(()=>{
    const canvas=gl.domElement;canvas.addEventListener("webglcontextlost",onError);
    return()=>canvas.removeEventListener("webglcontextlost",onError);
  },[gl,onError]);
  useEffect(()=>{
    const reset=()=>{pointer.current.set(5,5);previousPointer.current.set(5,5);pointerVelocity.current.set(0,0);};
    const move=(event:PointerEvent)=>{
      if(event.pointerType!=="mouse"||!active)return;
      if(event.target instanceof Element&&event.target.closest("a,button,nav")){reset();return;}
      const rect=gl.domElement.getBoundingClientRect();
      if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom){reset();return;}
      const entering=pointer.current.x===5;
      pointer.current.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
      if(entering)previousPointer.current.copy(pointer.current);
    };
    const explode=(event:Event)=>{
      if(!active)return;
      const {x,y}=(event as CustomEvent<{x:number;y:number}>).detail,rect=gl.domElement.getBoundingClientRect();
      burst.current={x:(x-rect.left)/rect.width*2-1,y:-(y-rect.top)/rect.height*2+1,time:time.current};
    };
    window.addEventListener("pointermove",move,{passive:true});window.addEventListener("portfolio:burst",explode);
    window.addEventListener("blur",reset);document.documentElement.addEventListener("pointerleave",reset);reset();
    return()=>{window.removeEventListener("pointermove",move);window.removeEventListener("portfolio:burst",explode);window.removeEventListener("blur",reset);document.documentElement.removeEventListener("pointerleave",reset);};
  },[active,gl,viewport.width,viewport.height]);
  useEffect(()=>{invalidate();},[active,size,invalidate]);
  useFrame((_,delta)=>{
    if(!material.current||!group.current)return;
    if(!notified.current){notified.current=true;onReady();}
    const dt=Math.min(delta,.05),ease=1-Math.exp(-dt*5);
    if(active){time.current+=dt;spin.current+=dt*.12;}
    const target=motion.current.story;
    view.current.story=view.current.story<0||!active?target:MathUtils.damp(view.current.story,target,2.6,dt);
    const t=view.current.story,chapter=Math.min(4,Math.floor(t)),phase=t-chapter;
    const crossing=smooth(.18,.9,phase),energy=Math.sin(crossing*Math.PI);
    const base=stacked?stackedLayout:wide,m=motion.current;
    // On single-column layouts the opening Earth sits in its slot and scrolls with it.
    const anchored=m.anchor>=0;
    for(let i=0;i<6;i++){placement.x[i]=base.x[i];placement.y[i]=base.y[i];}
    if(anchored){placement.x[0]=0;placement.y[0]=MathUtils.clamp(.5-(m.anchor-window.scrollY)/size.height,-.9,.6);}
    const at=(table:number[])=>MathUtils.lerp(table[chapter],table[chapter+1],crossing);
    // The rocket climbs through the projects section as it scrolls past.
    const rocketWeight=Math.max(0,1-Math.abs(t-3)),lift=(m.rise-.5)*.3*rocketWeight;
    const robotWeight=Math.max(0,1-Math.abs(t-4));
    group.current.scale.setScalar(radius*at(base.scale)*(1+energy*.05));
    group.current.position.x=viewport.width*(at(placement.x)+lift*.25);
    group.current.position.y=viewport.height*(at(placement.y)+lift)+Math.sin(time.current*.35)*radius*.012;
    const tiltX=pointer.current.x===5?0:pointer.current.x*.025,tiltY=pointer.current.x===5?0:pointer.current.y*.025;

    group.current.rotation.x+=(.08*(1-robotWeight)-tiltY-group.current.rotation.x)*ease;group.current.rotation.y+=(tiltX*(1-robotWeight)-group.current.rotation.y)*ease;
    group.current.rotation.z=Math.sin(time.current*.15)*.012+energy*.09;
    // Robot head: look at the cursor, or glance around when there is no pointer.
    if(robotWeight>0){
      const scale=group.current.scale.x,headX=group.current.position.x,headY=group.current.position.y+.8*scale;
      let yaw=Math.sin(time.current*.5)*.3,pitch=Math.sin(time.current*.37)*.08;
      if(pointer.current.x!==5){
        yaw=MathUtils.clamp((pointer.current.x*viewport.width*.5-headX)/(viewport.width*.35),-1,1)*.8;
        pitch=-MathUtils.clamp((pointer.current.y*viewport.height*.5-headY)/(viewport.height*.4),-1,1)*.45;
      }
      head.current.x=MathUtils.damp(head.current.x,yaw,6,dt);head.current.y=MathUtils.damp(head.current.y,pitch,6,dt);
      if(robotWeight>.5)gl.domElement.dataset.robotYaw=head.current.x.toFixed(2);
    }
    const u=material.current.uniforms;
    u.uTime.value=time.current;u.uStory.value=t;u.uReveal.value=Math.min(1,time.current/1.8);
    u.uOrbit.value=m.orbit;u.uWave.value=m.wave;u.uHead.value.copy(head.current);
    u.uDpr.value=gl.getPixelRatio();u.uSpin.value=spin.current;u.uAspect.value=viewport.width/viewport.height;
    u.uBurst.value.set(burst.current.x,burst.current.y,time.current-burst.current.time);
    if(pointer.current.x===5||u.uPointer.value.x===5)u.uPointer.value.copy(pointer.current);
    else u.uPointer.value.lerp(pointer.current,1-Math.exp(-dt*14));
    if(active&&dt>0){
      const present=pointer.current.x!==5;
      const dx=present?(pointer.current.x-previousPointer.current.x)*viewport.width*.5:0;
      const dy=present?(pointer.current.y-previousPointer.current.y)*viewport.height*.5:0;
      const distance=Math.hypot(dx,dy),speed=Math.min(9,distance/dt),velocityEase=1-Math.exp(-dt*12);
      pointerVelocity.current.x+=(dx/(distance||1)*speed-pointerVelocity.current.x)*velocityEase;
      pointerVelocity.current.y+=(dy/(distance||1)*speed-pointerVelocity.current.y)*velocityEase;
      previousPointer.current.copy(pointer.current);
      // Calm drift by default; scrolling and shape transitions push the flight forward.
      warp.current=MathUtils.damp(warp.current,Math.min(1,m.speed*.35+energy*.6),3,dt);
      travel.current+=dt*(.012+warp.current*.11);
    }
    u.uVelocity.value.copy(pointerVelocity.current);
    if(starMaterial.current){
      const s=starMaterial.current.uniforms;
      s.uTime.value=time.current;s.uDpr.value=gl.getPixelRatio();s.uVisibility.value=Math.min(1,time.current/1.8);
      s.uTravel.value=travel.current;s.uWarp.value=warp.current;s.uView.value.set(viewport.width*.5,viewport.height*.5);s.uPointer.value.copy(u.uPointer.value);
    }
    // Lebanon glows on the opening Earth and again on the Earth that closes the story.
    const homeVisible=Math.max(1-smooth(.08,.19,t),smooth(4.81,4.92,t));
    if(marker.current){marker.current.rotation.y=spin.current;marker.current.visible=homeVisible>.001;if(markerMaterial.current)markerMaterial.current.opacity=homeVisible*Math.min(1,time.current/1.8);}
    const stats=perf.current;
    if(active&&time.current>4&&delta<.15){
      stats.frames++;stats.time+=delta;
      if(stats.frames===180){if(stats.time/stats.frames>.075){if(stats.downgraded)onError();else{geometry.setDrawRange(0,Math.floor(geometry.attributes.position.count*.32));stats.downgraded=true;}}stats.frames=0;stats.time=0;}
    }
  });
  return <>
    <ambientLight intensity={.65} color="#a1b8d8"/>
    <directionalLight position={[-4,7,6]} intensity={4.2} color="#e1efff"/>
    <directionalLight position={[5,-3,-2]} intensity={3.4} color="#3679ff"/>
    <pointLight position={[2,-4,3]} intensity={22} color="#ff6c25" distance={18}/>
    <points geometry={starGeometry} frustumCulled={false}><shaderMaterial ref={starMaterial} vertexShader={starVertex} fragmentShader={particleFragment} uniforms={starUniforms} transparent depthWrite={false} blending={AdditiveBlending}/></points>
    <group ref={group} rotation={[.08,0,0]}>
      <points geometry={geometry} frustumCulled={false}><shaderMaterial ref={material} vertexShader={particleVertex} fragmentShader={particleFragment} uniforms={uniforms} transparent depthWrite={false} depthTest={false} blending={AdditiveBlending}/></points>
      <RocketExhaust view={view}/>
      <group ref={marker}><group position={lebanon.clone().multiplyScalar(1.025)} quaternion={markerRotation}><mesh><ringGeometry args={[.019,.023,32]}/><meshBasicMaterial ref={markerMaterial} color={[2,1.2,.35]} transparent opacity={0}/></mesh></group></group>
    </group>
    <Glow compact={compact}/>
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
  return <Canvas orthographic camera={{position:[0,0,12],zoom:100,near:.1,far:100}} dpr={props.compact ? 1 : [1,1.5]} frameloop={props.active ? "always" : "demand"} gl={{alpha:true,antialias:false,powerPreference:"high-performance"}} fallback={null} onCreated={({gl}) => {gl.setClearColor(0x030409,1);}}><Sculpture {...props} data={data} /></Canvas>;
}

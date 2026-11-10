"use client";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, MathUtils, Points, ShaderMaterial } from "three";

// A particle exhaust plume that trails the particle rocket (scene 3). Pure points, no meshes.
const vertex=`attribute float aSeed;uniform float uTime;uniform float uOpacity;uniform float uDpr;varying float vAlpha;varying vec3 vColor;
void main(){
 float life=fract(aSeed+uTime*(.34+fract(aSeed*81.0)*.3));
 float a=aSeed*1497.0;
 float spread=.04+life*.42;
 float nozzle=floor(fract(aSeed*53.0)*3.0)-1.0;
 vec3 p=vec3(nozzle*.29*(1.0-life*.6)+cos(a)*spread*fract(aSeed*79.0),-.67-life*2.6,sin(a)*spread*fract(aSeed*79.0));
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
 gl_PointSize=(1.0+fract(aSeed*37.0)*3.0)*(1.0-life*.6)*uDpr;
 vAlpha=pow(1.0-life,1.8)*uOpacity*.7;
 vColor=mix(vec3(.2,.55,1.0),vec3(1.0,.32,.05),smoothstep(.05,.5,life));
}`;
const fragment=`varying float vAlpha;varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5)*2.0;if(d>1.0)discard;gl_FragColor=vec4(vColor*2.0,exp(-d*d*4.0)*vAlpha);}`;

export default function RocketExhaust({view}:{view:RefObject<{story:number}>}) {
  const points=useRef<Points>(null),time=useRef(0);
  const {geometry,material}=useMemo(()=>{
    const geometry=new BufferGeometry(),seeds=new Float32Array(2400);
    for(let i=0;i<seeds.length;i++) seeds[i]=i/seeds.length;
    geometry.setAttribute("position",new BufferAttribute(new Float32Array(seeds.length*3),3));
    geometry.setAttribute("aSeed",new BufferAttribute(seeds,1));
    const material=new ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{uTime:{value:0},uOpacity:{value:0},uDpr:{value:1}},transparent:true,depthWrite:false,blending:AdditiveBlending});
    return {geometry,material};
  },[]);
  useEffect(()=>()=>{geometry.dispose();material.dispose();},[geometry,material]);
  useFrame(({gl},delta)=>{
    if(!points.current)return;
    time.current+=Math.min(delta,.05);
    const t=view.current.story;
    // Ignites once the particles have gathered into the rocket; cuts out as it becomes the ribbon.
    const opacity=MathUtils.smoothstep(t,2.7,2.97)*(1-MathUtils.smoothstep(t,3.05,3.4));
    points.current.visible=opacity>.001;
    material.uniforms.uTime.value=time.current;material.uniforms.uOpacity.value=opacity;material.uniforms.uDpr.value=gl.getPixelRatio();
  });
  return <points ref={points} geometry={geometry} material={material} rotation={[0,0,-.315]} frustumCulled={false} visible={false}/>;
}

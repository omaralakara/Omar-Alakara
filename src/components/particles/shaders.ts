export const particleVertex = /* glsl */ `
  attribute vec3 aSatellite;
  attribute vec3 aRocket;
  attribute vec3 aGalaxy;
  attribute vec3 aRobot;
  attribute float aRobotPart; // 0 body · 1 head · 2 upper arm · 3 forearm/hand; +.5 = glowing detail
  attribute vec3 aDetails; // x: rocket part · y: galaxy part (0 core, 1 arm, 2 halo) · z: random
  attribute vec3 aMeta;    // x: Earth kind (land/trail/mist) · y: seed · z: satellite part
  uniform float uTime,uStory,uReveal,uDpr,uSpin,uAspect,uOrbit,uWave;
  uniform vec2 uPointer,uVelocity,uHead;
  uniform vec3 uBurst;
  varying vec3 vColor;
  varying float vAlpha;
  const vec3 ROBOT_NECK=vec3(0.0,.5,0.0),ROBOT_SHOULDER=vec3(.5,.36,0.0),ROBOT_ELBOW=vec3(.58,-.04,0.0);
  const vec2 ROCKET_AXIS=vec2(-.31,-.95); // exhaust direction of the tilted rocket
  vec3 rotateX(vec3 p,float a){return vec3(p.x,cos(a)*p.y-sin(a)*p.z,sin(a)*p.y+cos(a)*p.z);}
  vec3 rotateY(vec3 p,float a){return vec3(cos(a)*p.x+sin(a)*p.z,p.y,-sin(a)*p.x+cos(a)*p.z);}
  vec3 rotateZ(vec3 p,float a){return vec3(cos(a)*p.x-sin(a)*p.y,sin(a)*p.x+cos(a)*p.y,p.z);}
  float flame(){return step(.87,aDetails.x);}
  vec3 robot(){
    vec3 p=aRobot;
    float part=floor(aRobotPart+.01);
    // The head turns toward the visitor's cursor around the neck joint.
    if(part>.5&&part<1.5)p=rotateY(rotateX(p-ROBOT_NECK,uHead.y),uHead.x)+ROBOT_NECK;
    if(part>1.5){
      // Wave: GSAP raises the arm (uWave 0–1); the forearm swings from the elbow.
      if(part>2.5)p=rotateZ(p-ROBOT_ELBOW,sin(uTime*9.0)*.5*uWave)+ROBOT_ELBOW;
      p=rotateZ(p-ROBOT_SHOULDER,uWave*2.5)+ROBOT_SHOULDER;
    }
    p.y+=sin(uTime*1.7)*.018;
    if(fract(aRobotPart)>.25&&p.y<-.5)p.y-=fract(aMeta.y*13.0+uTime*1.4)*.12;
    return p;
  }
  // Galaxy: inner stars orbit faster than outer ones; tilted toward the viewer.
  vec3 galaxy(){
    vec3 p=aGalaxy;
    float r=length(p.xz);
    p=rotateY(p,uTime*.16/(.35+r));
    return rotateZ(rotateX(p,1.05),.32);
  }
  // Scenes: 0 Earth · 1 satellite · 2 galaxy · 3 rocket · 4 robot · 5 Earth again.
  vec3 shape(float index){
    if(index<.5||index>4.5)return rotateY(position,uSpin);
    if(index<1.5)return rotateY(aSatellite,sin(uTime*.2)*.25+uOrbit*6.2832);
    if(index<2.5)return galaxy();
    if(index<3.5){
      // Flame particles stream continuously out of the nozzles.
      float life=fract(aMeta.y*7.0+uTime*1.8);
      return aRocket+vec3(ROCKET_AXIS*life*.55,0.0)*flame();
    }
    return robot();
  }
  vec3 colorFor(float index){
    vec3 blue=vec3(.025,.25,1.0),violet=vec3(.29,.08,.8),gold=vec3(1.0,.4,.10);
    float seed=aMeta.y;
    if(index<.5||index>4.5){
      float tint=sin(position.x*1.8+position.y*2.4+uTime*.07)*.5+.5;
      return mix(mix(blue,violet,tint),gold,step(1.5,aMeta.x)*smoothstep(.7,.92,seed)*.8);
    }
    if(index<1.5)return aMeta.z<.61?mix(blue,vec3(.12,.55,1.0),seed):mix(gold,vec3(.95,.7,.4),seed);
    if(index<2.5){
      float r=length(aGalaxy.xz);
      vec3 arm=mix(mix(vec3(.45,.6,1.0),blue,smoothstep(.2,.8,r)),violet*1.4,smoothstep(.7,1.3,r));
      arm=mix(arm,vec3(1.0,.45,.75),step(.94,aDetails.z));
      vec3 core=mix(vec3(1.0,.86,.62),gold,seed*.6);
      return aDetails.y<.5?core:(aDetails.y<1.5?arm:vec3(.25,.35,.9));
    }
    if(index<3.5){
      float life=fract(aMeta.y*7.0+uTime*1.8);
      vec3 hull=mix(vec3(.3,.55,1.0),vec3(.62,.72,1.0),seed);
      hull=mix(hull,violet*1.6,step(.65,aDetails.x)*(1.0-step(.79,aDetails.x)));
      hull=mix(hull,gold*1.3,step(.79,aDetails.x)*(1.0-step(.87,aDetails.x)));
      return mix(hull,mix(vec3(.75,.85,1.0),gold,smoothstep(.05,.6,life)),flame());
    }
    vec3 shell=mix(blue,violet,smoothstep(-.4,1.1,aRobot.y)*.8+seed*.2);
    return mix(shell,mix(gold,vec3(.3,.8,1.0),step(.5,aRobot.y)*step(-.3,-aRobot.y+.6)),step(.25,fract(aRobotPart)));
  }
  float alphaFor(float index){
    if(index<.5||index>4.5){
      vec3 earth=rotateY(position,uSpin);
      float land=step(.5,aMeta.x)*(1.0-step(1.5,aMeta.x));
      float trail=step(1.5,aMeta.x)*(1.0-step(2.5,aMeta.x));
      float mist=step(2.5,aMeta.x);
      return (.025+land*.8)*mix(.035,1.0,smoothstep(-.15,.65,earth.z))+trail*.2+mist*.055;
    }
    if(index<1.5)return .34;
    if(index<2.5)return aDetails.y<.5?.55:(aDetails.y<1.5?.32*(1.0-smoothstep(1.0,1.4,length(aGalaxy.xz))*.6):.07);
    if(index<3.5)return mix(.3,.62*(1.0-fract(aMeta.y*7.0+uTime*1.8)),flame());
    return mix(.3,.75,step(.25,fract(aRobotPart)));
  }
  void main(){
    float seed=aMeta.y,story=clamp(uStory,0.0,5.0);
    float chapter=min(floor(story),4.0),phase=story-chapter;
    float morph=smoothstep(.15+seed*.06,.84+seed*.1,phase);
    float energy=sin(morph*3.14159265);
    vec3 from=shape(chapter),to=shape(chapter+1.0);
    vec3 flow=vec3(sin(seed*91.0+uTime*.4),cos(seed*67.0+uTime*.35),sin(seed*47.0+uTime*.3));
    // Continuous corkscrew trajectories keep the camera inside the same universe.
    vec3 p=mix(from,to,morph);
    p+=vec3(-p.y,p.x,0.0)*energy*(.45+seed*.3);
    p+=flow*energy*(.3+seed*.65);
    p.z+=energy*sin(seed*31.0)*1.2;
    p+=flow*(1.0-uReveal)*(1.3+seed);
    p+=flow*.003;
    vec4 clip=projectionMatrix*modelViewMatrix*vec4(p,1.0);
    vec2 delta=clip.xy/clip.w-uPointer;delta.x*=uAspect;
    float distance=length(delta),influence=exp(-24.0*distance*distance);
    float speed=min(length(uVelocity),7.0);
    vec2 radial=delta/max(distance,.02);
    // The cursor gently parts the particles; a click sends a soft, widening ripple.
    p.xy+=(radial*.016+uVelocity*.007)*influence*speed;
    vec2 burstDelta=clip.xy/clip.w-uBurst.xy;burstDelta.x*=uAspect;
    float burstDistance=length(burstDelta),age=uBurst.z;
    float blast=exp(-pow((burstDistance-age*.6)*9.0,2.0))*exp(-age*2.2)*step(0.0,age);
    p.xy+=burstDelta/max(burstDistance,.02)*blast*.11;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
    vColor=mix(colorFor(chapter),colorFor(chapter+1.0),morph);
    vColor=mix(vColor,vec3(.65,.85,1.0),min(.5,blast*.45+influence*speed*.025));
    vAlpha=mix(alphaFor(chapter),alphaFor(chapter+1.0),morph);
    vAlpha=mix(vAlpha,.16,energy*.7)*smoothstep(0.0,.55,uReveal);
    vAlpha*=.9+.1*sin(seed*124.0+uTime*.7);
    vAlpha*=1.0+blast*.8;
    gl_PointSize=(mix(1.25,2.6,seed)+step(.997,seed)*1.5)*(1.0+energy*.5+blast*.2)*uDpr;
  }
`;
export const particleFragment = /* glsl */ `
  varying vec3 vColor;varying float vAlpha;
  void main(){float r=length(gl_PointCoord-.5)*2.0;if(r>1.0||vAlpha<=0.0)discard;gl_FragColor=vec4(vColor*2.0,exp(-r*r*5.5)*vAlpha);}
`;
// Flying through space: position.xy is a star's direction, position.z its depth phase.
// Depth runs from far (1) to near (0); projecting by 1/depth carries each star outward and
// toward the viewer, growing and brightening, then it wraps back into the distance.
export const starVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime,uDpr,uVisibility,uTravel,uWarp;
  uniform vec2 uView,uPointer;
  varying float vAlpha;varying vec3 vColor;
  void main(){
    float depth=fract(position.z-uTravel*(.75+aSeed*.5));
    float z=mix(.14,1.0,depth),near=1.0-depth;
    vec2 p=position.xy/z;
    // Depth parallax: nearer stars drift further from the cursor.
    if(uPointer.x<4.0)p-=uPointer*near*near*.07;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p*uView,-6.0,1.0);
    gl_PointSize=(.55+aSeed*1.1+near*near*(2.2+uWarp*1.6))*uDpr;
    float fade=smoothstep(0.0,.18,near)*(1.0-smoothstep(.9,1.0,near));
    vAlpha=(.05+near*.42+uWarp*near*.2)*fade*(.8+.2*sin(uTime*.6+aSeed*60.0))*uVisibility;
    vColor=mix(mix(vec3(.38,.52,1.0),vec3(.62,.45,1.0),step(.7,aSeed)),vec3(1.0,.66,.36),step(.93,aSeed));
  }
`;

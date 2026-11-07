export const particleVertex = /* glsl */ `
  attribute vec3 aCloud;
  attribute vec3 aSatellite;
  attribute vec3 aMeta;
  uniform float uTime;
  uniform float uProgress;
  uniform float uReveal;
  uniform float uDpr;
  uniform float uSpin;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform float uAspect;
  uniform float uHover;
  varying vec3 vColor;
  varying float vAlpha;
  vec3 rotateY(vec3 p,float a) { return vec3(cos(a)*p.x+sin(a)*p.z,p.y,-sin(a)*p.x+cos(a)*p.z); }
  void main() {
    float seed=aMeta.y;
    float land=step(.5,aMeta.x)*(1.0-step(1.5,aMeta.x));
    float trail=step(1.5,aMeta.x)*(1.0-step(2.5,aMeta.x));
    float mist=step(2.5,aMeta.x);
    float first=smoothstep(.04,.36,uProgress);
    float second=smoothstep(.58,.91,uProgress);
    float drifting=first*(1.0-second);
    float burst=sin(first*3.14159)*(1.0-second)+sin(second*3.14159)*.65;
    vec3 earth=rotateY(position,uSpin);
    vec3 flow=vec3(sin(seed*91.0+uTime*.35),cos(seed*67.0+uTime*.3),sin(seed*47.0+uTime*.25));
    vec3 cloud=aCloud+flow*.12;
    vec3 p=mix(earth,cloud,first);
    // A wide arc gives the returning cloud a flowing, orbital motion.
    p=mix(p,aSatellite,second);
    p.xy+=vec2(-aCloud.y,aCloud.x)*sin(second*3.14159)*.24;
    p+=normalize(position)*sin(first*3.14159)*.88*(1.0-second);
    p+=flow*(1.0-uReveal)*(1.8+seed*2.5);
    // Breathing particles preserve the silhouette without sitting on a rigid shell.
    p+=flow*(.004+trail*.014+mist*.025);
    p.y+=sin(uTime*.35+seed*2.0)*.009;
    vec4 mv=modelViewMatrix*vec4(p,1.0);
    vec4 clip=projectionMatrix*mv;
    vec2 delta=clip.xy/clip.w-uPointer;
    delta.x*=uAspect;
    float influence=exp(-9.0*dot(delta,delta));
    p.xy+=(delta*.025+vec2(-delta.y,delta.x)*.035+uVelocity*.004)*influence*(.15+drifting*.45);
    // A soft dark core with a restrained outward, orbiting rim on shape hover.
    // Fade at the exact center keeps the displacement continuous across the cursor.
    float gravity=exp(-70.0*dot(delta,delta))*uHover;
    vec2 radial=delta/max(length(delta),.018);
    vec2 tangent=vec2(-radial.y,radial.x);
    p.xy+=(radial*.075+tangent*(.065+sin(uTime*.65+seed*6.28)*.012))*gravity;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
    float tint=sin(position.x*1.8+position.y*2.4+uTime*.07)*.5+.5;
    vec3 blue=vec3(.015,.12,1.0), violet=vec3(.32,.018,.85), gold=vec3(1.0,.42,.065);
    vColor=mix(blue,violet,smoothstep(.2,.85,tint));
    float warm=trail*smoothstep(.48,.76,seed)+mist*step(.87,seed);
    vColor=mix(vColor,gold,warm*.92);
    vec3 cloudColor=mix(blue,violet,seed);
    cloudColor=mix(cloudColor,gold,step(.94,seed)*.75);
    vColor=mix(vColor,cloudColor,first);
    vec3 satelliteColor=aMeta.z<.61 ? mix(blue,vec3(.08,.3,1.0),seed) : mix(gold,vec3(.85,.5,.12),seed*.5);
    vColor=mix(vColor,satelliteColor,second);
    vColor=mix(vColor,vec3(.65,.75,1.0),step(.997,seed)*.3);
    float front=mix(.05,1.0,smoothstep(-.15,.65,earth.z));
    float earthAlpha=(.05+land*.84)*front+trail*mix(.08,.36,smoothstep(-.7,.7,earth.z))+mist*.12;
    vAlpha=mix(mix(earthAlpha,.19,first),.55,second);
    vAlpha*=smoothstep(0.0,.55,uReveal);
    vAlpha*=.86+.14*sin(seed*124.0+uTime*.7);
    vAlpha*=1.0-uHover*exp(-650.0*dot(delta,delta))*.88;
    // Depth and brighter hero flecks make the expansion feel substantial.
    // Point sizes settle back to the original fine detail on either silhouette.
    float depth=mix(.85,1.28,smoothstep(-1.5,1.5,p.z));
    float fleck=smoothstep(.94,.995,seed);
    float pointSize=(mix(1.5,3.0,seed)+step(.997,seed)*2.5)*(1.0+drifting*.65+burst*.35);
    pointSize+=fleck*(drifting*3.0+burst*2.0);
    gl_PointSize=pointSize*mix(1.0,depth,drifting)*uDpr;
  }
`;
export const particleFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float r=length(gl_PointCoord-.5)*2.0;
    if(r>1.0) discard;
    float core=exp(-r*r*5.5);
    gl_FragColor=vec4(vColor*2.0,core*vAlpha);
  }
`;
export const starVertex = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uDpr;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec3 p=position;
    p.x+=sin(uTime*.045+aSeed*24.0)*.13;
    p.y+=cos(uTime*.04+aSeed*18.0)*.1;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
    gl_PointSize=(1.0+aSeed*2.0+step(.96,aSeed)*2.5)*uDpr;
    vAlpha=(.18+aSeed*.25)*(.8+.2*sin(uTime*.35+aSeed*60.0));
    vColor=mix(vec3(.3,.4,.85),vec3(1.0,.64,.28),step(.79,aSeed));
  }
`;

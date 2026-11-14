/* Crystal Hologram: genuine WebGL perspective scene, no external dependencies. */
(()=>{
'use strict';
const VS='attribute vec3 position;uniform mat4 projection;uniform mat4 view;uniform float pointSize;void main(){vec4 p=projection*view*vec4(position,1.);gl_Position=p;gl_PointSize=pointSize*min(2.5,3.5/max(1.,-p.z));}';
const FS='precision mediump float;uniform vec3 tint;uniform float alpha;uniform float dots;void main(){float a=alpha;if(dots>.5){float r=length(gl_PointCoord-.5);a*=smoothstep(.5,.08,r);}gl_FragColor=vec4(tint,a);}';
const compile=(gl,type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
const mat=(fov,aspect,near,far)=>{const f=1/Math.tan(fov/2),q=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*q,-1,0,0,2*far*near*q,0])};
function build(){
 const target=document.querySelector('#vHome .hq-orbit');if(!target||target.querySelector('.cb-hologram-3d'))return;
 const canvas=document.createElement('canvas');canvas.className='cb-hologram-3d';canvas.setAttribute('aria-hidden','true');target.prepend(canvas);
 const gl=canvas.getContext('webgl',{alpha:true,antialias:false,powerPreference:'low-power',depth:true});if(!gl){canvas.remove();return;}
 let program;try{program=gl.createProgram();gl.attachShader(program,compile(gl,gl.VERTEX_SHADER,VS));gl.attachShader(program,compile(gl,gl.FRAGMENT_SHADER,FS));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('WebGL link')}catch(e){canvas.remove();return;}
 gl.useProgram(program);const loc={pos:gl.getAttribLocation(program,'position'),projection:gl.getUniformLocation(program,'projection'),view:gl.getUniformLocation(program,'view'),tint:gl.getUniformLocation(program,'tint'),alpha:gl.getUniformLocation(program,'alpha'),dots:gl.getUniformLocation(program,'dots'),pointSize:gl.getUniformLocation(program,'pointSize')};
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(loc.pos);gl.vertexAttribPointer(loc.pos,3,gl.FLOAT,false,0,0);
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);
 const rings=[],stars=[],latitudes=13,longitudes=24;
 for(let a=0;a<latitudes;a++){const latitude=(a/(latitudes-1)-.5)*Math.PI;const ring=[];for(let b=0;b<=longitudes*4;b++){const theta=b/(longitudes*4)*Math.PI*2;ring.push([Math.cos(latitude)*Math.cos(theta),Math.sin(latitude),Math.cos(latitude)*Math.sin(theta)])}rings.push(ring)}
 for(let a=0;a<18;a++){const longitude=a/18*Math.PI*2,ring=[];for(let b=0;b<=80;b++){const phi=b/80*Math.PI;ring.push([Math.sin(phi)*Math.cos(longitude),Math.cos(phi),Math.sin(phi)*Math.sin(longitude)])}rings.push(ring)}
 for(let i=0;i<280;i++){const z=1-2*(i+.5)/280,r=Math.sqrt(1-z*z),theta=i*2.399963;stars.push([r*Math.cos(theta),z,r*Math.sin(theta)])}
 const orbit=[];for(let k=0;k<4;k++){const ring=[];for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;ring.push([1.35*Math.cos(a),1.35*Math.sin(a),0])}orbit.push(ring)}
 let raf=0,visible=true,active=true,frame=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const obs=new IntersectionObserver(e=>{visible=!!e[0]?.isIntersecting;if(visible)request()});obs.observe(target);
 const resize=()=>{const r=canvas.getBoundingClientRect();const w=Math.min(800,Math.round(r.width*Math.min(devicePixelRatio||1,1.5))),h=Math.min(800,Math.round(r.height*Math.min(devicePixelRatio||1,1.5)));if(w&&h&&(w!==canvas.width||h!==canvas.height)){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}};
 const draw=(vertices,color,opacity,mode,pointSize=2)=>{const data=new Float32Array(vertices.flat());gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);gl.uniform3fv(loc.tint,color);gl.uniform1f(loc.alpha,opacity);gl.uniform1f(loc.dots,mode===gl.POINTS?1:0);gl.uniform1f(loc.pointSize,pointSize);gl.drawArrays(mode,0,vertices.length)};
 const render=()=>{raf=0;if(!visible||!active||document.hidden)return;resize();if(!canvas.width)return;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniformMatrix4fv(loc.projection,false,mat(.85,canvas.width/canvas.height,.1,50));
 const t=reduced.matches?0:performance.now()*.00019,ca=Math.cos(t),sa=Math.sin(t),tilt=.26,ct=Math.cos(tilt),st=Math.sin(tilt);
 const view=new Float32Array([ca*1.1,sa*st,sa*ct,0,0,ct,-st,0,-sa*1.1,ca*st,ca*ct,0,0,0,-4.5,1]);gl.uniformMatrix4fv(loc.view,false,view);
 rings.forEach((ring,i)=>draw(ring,i%3===0?[.98,.64,.23]:[.17,.47,1],i%3===0?.35:.22,gl.LINE_STRIP));
 draw(stars,[.32,.62,1],.65,gl.POINTS,3.6);
 orbit.forEach((ring,i)=>{const a=t*(i%2?-.9:1.2)+i*.73,c=Math.cos(a),s=Math.sin(a);draw(ring.map(p=>[p[0]*c-p[2]*s,p[1]*Math.cos(i*.38)-p[2]*Math.sin(i*.38),p[0]*s+p[2]*c]),i%2?[1,.68,.25]:[.23,.54,1],.43,gl.LINE_STRIP)});
 frame++;if(!reduced.matches)raf=requestAnimationFrame(render);
 };
 const request=()=>{if(!raf&&visible&&active&&!document.hidden)raf=requestAnimationFrame(render)};
 const mo=new MutationObserver(request);mo.observe(document.getElementById('vHome'),{attributes:true,attributeFilter:['class','style']});
 document.addEventListener('visibilitychange',request);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;if(raf)cancelAnimationFrame(raf)});
 request();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
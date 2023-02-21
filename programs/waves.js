const fs = /*glsl*/`#version 300 es
    precision mediump float;
    out vec4 fragColor;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_time;
    #define glf gl_FragCoord
	#define PI 3.14159265
	#define _b 1.6
	uniform float aa;
	uniform float bb;

	vec2 b(float t, vec2 v){
	   return abs(fract(t*v)-.5)*2.;
	}

	float ff(float n, float n2, float n3, float amp){
 		return ((sin(n)+1.)*(sin(n2)*(sin(n3))+1.)+log(((sin(PI+n)+1.)*(sin(PI+n2)+1.))+1.))*amp; 
	}

	vec3 cc(float a, float b){
		return sin(a+vec3(.2, .6, .9)*b)*.5+.5;
	}

	void main(){
	    vec2 uv = glf.xy/u_resolution.xy;

	    //vec3 col = 0.5 + 0.5*cos(time+uv.xyx+vec3(0,2,4));
	    
	    float a = 10.;
	    float amp = 0.5;
	    float d = .2;
	    
	    float t = 3.+u_time*0.01;

	    float n = a*(t+distance(uv, _b*b(t,vec2(3.1,1.7))));
	    float n2 = a*(t+distance(uv, _b*b(t,vec2(2.4,3.15))));
	    float n3 = a*(t+distance(uv, _b*b(t,vec2(1.45,2.65))));
	    
	    float f = ff(n, n2, n3, amp);
	    float f2 = ff(n+d, n2+d, n3+d, amp);
	    
	    n = a*(t+distance(uv, b(t,vec2(1.5,3.7))));
	    n2 = a*(t+distance(uv, b(t,vec2(3.4,1.15))));
	    n3 = a*(t+distance(uv, b(t,vec2(2.45,1.65))));
	    
	    f += ff(n, n2, n3, amp);
	    f2 += ff(n+d, n2+d, n3+d, amp);
	    
	    float v = (f2-f)/d;
	    // vec3 c = (1.-vec3(v*v))*vec3(0.,0.3,1.);
	    vec3 c = (1.-vec3(v))*cc(aa, bb);
	    float alpha = smoothstep(clamp(v*.7,-2.,0.), 1., -.05);
	    fragColor = vec4(c, alpha);
	}

`;

const gui = {
    name: 'wave',
    open: true,
    switch: true,
    updateFame: true,
    fields:[
        {
            hue: 3.1,
            min: 0.,
            max: 8.,
            step: 0.01,
            onChange : (v)=>{prog.uniforms.aa = v;}
        },
        {
            sep: 4.,
            min: 0.,
            max: 8.,
            step: 0.01,
            onChange : (v)=>{prog.uniforms.bb = v;}
        }
    ]
}

const prog = {
	fs: fs,
	gui: gui,
	uniforms: {
		aa: 3.1,
		bb: 4
	}
};

export default prog;
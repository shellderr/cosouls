const fs = /*glsl*/`#version 300 es
    precision mediump float;
    out vec4 fragColor;
    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float time;
    #define glf gl_FragCoord
	#define PI 3.14159265
	#define _b 1.6
	// uniform float hue;
	// uniform float sep;
	uniform float ch;
	uniform float cs;
	uniform float cv;
	uniform float alpha;

	vec2 b(float t, vec2 v){
	   return abs(fract(t*v)-.5)*2.;
	}

	float ff(float n, float n2, float n3, float amp){
 		return ((sin(n)+1.)*(sin(n2)*(sin(n3))+1.)+log(((sin(PI+n)+1.)*(sin(PI+n2)+1.))+1.))*amp; 
	}

	vec3 rgb(float a){
		return sin(a+vec3(.5,1.5,3))*.5+.5;
	}

    vec3 hsv2rgb(vec3 c){
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

	void main(){
	    vec2 uv = glf.xy/resolution.xy;
	    
	    float a = 10.;
	    float amp = 0.5;
	    float d = .2;
	    
	    float t = 3.+time*0.001;

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
	    // vec3 c = (1.-vec3(v))*rgb(hue);
	    vec3 c = hsv2rgb(vec3(ch, cs, cv));
	    float fade = min(.2, max(alpha, .01))*5.;
	    float alpha = smoothstep(clamp(v*fade, -2., 0.), .6, alpha*.6);
	    fragColor = vec4(c, alpha);
	}

`;

const gui = {
    name: 'wave',
    open: false,
    switch: true,
    updateFrame: true,
    fields:[
    	{
    		h: [.75,0,1,.01],
    		onChange: v=> {prog.uniforms.ch = v;}
    	},
    	{
    		s: [1,0,1,.01],
    		onChange: v=> {prog.uniforms.cs = v;}
    	},
    	{
    		v: [.6,0,1,.01],
    		onChange: v=> {prog.uniforms.cv = v;}
    	},
        // {
        //     hue: [3.77, 0, 5, .01],
        //     onChange : (v)=>{prog.uniforms.hue = v;}
        // },
        // {
        //     sep: [1, 0, 2, .01],
        //     onChange : (v)=>{prog.uniforms.sep = v;}
        // },
        {
            alpha: [.04, 0, .5, .01],
            onChange : (v)=>{prog.uniforms.alpha = v;}
        }
    ]
}

const prog = {
	fs: fs,
	gui: gui,
	uniforms: {
		// hue: 3.77,
		// sep: 1 
		ch: .75,
		cs: 1.,
		cv: .6,
		alpha: .04,
	}
};

export default prog;
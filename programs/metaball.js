const shader = /*glsl*/`#version 300 es
	precision highp float;

	uniform float offset;
	uniform float gradient;
	uniform float alpha;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;    

	#define fcoord gl_FragCoord
	#define res u_resolution
	#define dst(v,a) (a/dot(uv-v,uv-v))
    out vec4 fragColor; 

	float balls(vec2 uv, float t){
		float f = 0.;
		for(float i = 1.; i < 15.; i++){
			vec2 a = vec2(cos(i*1.1),sin(i*1.2));
			vec2 v = vec2(cos(t*a.x)*sin(t*a.y),
			cos(t*1.2)*cos(t*a.x));
			f += dst(v*.8, .01);
		}
		return f;
	}

	vec3 rgb(float a){
		return cos(a+vec3(1.,2.5,3.3))*.5+.5;
	}

	void main(){
		vec2 uv = (2.*fcoord.xy-res)/res.y;
		float time = u_time+offset;
		float f = balls(uv, time);
		vec2 mouse = u_mouse/u_resolution.y;
		f = 1.-smoothstep(f, gradient, .54);
		f = 1.-abs(.5-f);
		f *=f*f;
		vec3 fc = rgb(3.*f+0.);
		fragColor = vec4(fc, mix(1., f, alpha));
	} 
`;

const gui = {
    name: 'metaball',
    open: true,
    switch: true,
    updateFame: true,
    fields:[
        {
            offset: 0.,
            min: 0.,
            max: 10.,
            step: 0.01,
            onChange : (v)=>{
            	prog.uniforms.offset = v;
            }
        },
        {
            gradient: 0.,
            min: 0.,
            max: 1.,
            step: 0.01,
            onChange : (v)=>{
            	prog.uniforms.gradient = v;
            }
        },
        {
            alpha: 1.,
            min: 0.,
            max: 1.,
            step: 0.01,
            onChange : (v)=>{
            	prog.uniforms.alpha = v;
            }
        }
    ]
}

const prog = {
	fs: shader,
	uniforms: {
		offset: 0, 
		gradient: 0,
		alpha: 1
	},
	gui: gui,
	// on: false
	// res: {width: 800, height: 700},
	// clearcolor: [0.2, 0.8, 0.0, 1],
};

export default prog;
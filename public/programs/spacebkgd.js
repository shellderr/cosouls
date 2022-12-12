const shader = /*glsl*/ `#version 300 es

    precision mediump float;

    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float v1;
    uniform float v2;
    uniform float v3;
    
    out vec4 fragColor; 

    void main(){
        // vec2 uv = (2.*gl_FragCoord.xy/u_resolution.xy)*u_resolution.y/u_resolution.x - 1.0;
        vec2 uv = (2.*gl_FragCoord.xy - u_resolution.xy)/u_resolution.y;
        uv *= vec2(1., -1.);
        float c = v1/distance(uv, vec2(0.,1.-v2));

        fragColor = vec4(c, c*(0.3-min(v3, 0.3)), c*max(0.,(v3-0.5)*2.0), c);

    }

`;

const gui = {
    name: 'space',
    open: false,
    switch: true,
    fields:[
    	// {
     //        idx: idx,
     //        min: 0,
     //        max: 4,
     //        step: 1,   		
    	// },

        {
            v1: 0.0,
            min: -1.0,
            max: 1.0,
            step: 0.01,
            onChange : (v)=>{prog.uniforms.v2 = v;}
        },
        {
            v2: 0.5,
            min: 0.1,
            max: 2.0,
            step: 0.01,
            onChange : (v)=>{prog.uniforms.v1 = v;}
        },
        {
            v3: 1.0,
            min: 0.0,
            max: 1.0,
            step: 0.01,
            onChange : (v)=>{prog.uniforms.v3 = v;}
        }
    ]
}

const prog = {
	 res: {width: 800, height: 700},
	 fs: shader,
	 uniforms: {
        v1: 0.5, 
        v2: 0.0, 
        v3: 1.0
	 },
	 // rendercb : rendercb,
	  // setupcb : setupcb,
	  gui: gui,
	 // clearcolor: [0.2, 0.8, 0.0, 1],
};

export default prog;
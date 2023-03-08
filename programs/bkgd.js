const shader = /*glsl*/ `#version 300 es

    precision mediump float;
    uniform float time;
    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float v1;
    uniform float v2;
    uniform float v3;
    uniform float v4;
    
    out vec4 fragColor; 

    #define ff(x) (x*0.5+0.5)

    void main(){

        vec2 uv = gl_FragCoord.xy/resolution.xy;

        vec2 col = ff(cos(/*u_time+*/uv.xy*vec2(0.,4.*v2)));
        float x = 6.2*v1;
        float th = 1.;
        fragColor = vec4(v3*vec3(ff(cos(x)),ff(cos(x+th)),ff(cos(x+2.*th)))*col.xyy,v4);

        // vec2 rg = (gl_FragCoord.xy-u_mouse*vec2(1, -1))/u_resolution;
        // fragColor = vec4(rg.x, 1.0-rg.y, rg.y, 1);

    }

`;

const gui = {
    name: 'bkgd',
    open: true,
    switch: true,
    updateFrame: true,
    fields:[
        {
            hue: 0.47,
            min: 0.0,
            max: 1.0,
            step: 0.01,
            onChange : (v)=>{prog.uniforms.v1 = v;}
        },
        {
            grad: 0.57,
            min: 0.0,
            max: 1.0,
            step: 0.01,
            onChange : (v)=>{prog.uniforms.v2 = v;}
        },
        {
            lev: 0.7,
            min: 0.0,
            max: 1.0,
            step: 0.01,
            onChange : (v)=>{prog.uniforms.v3 = v;}
        },
        {
            alpha: 1.0,
            min: 0.0,
            max: 1.0,
            step: 0.01,
            onChange : (v)=>{prog.uniforms.v4 = v;}
        },
    ]
}

const prog = {
     // res: {width: 800, height: 700},
     fs: shader,
     uniforms: {
        v1: 0.47, 
        v2: 0.57, 
        v3: 0.7,
        v4: 1.0
     },
     // rendercb : rendercb,
      // setupcb : setupcb,
      gui: gui,
      on: true
     // clearcolor: [0.2, 0.8, 0.0, 1],
};

export default prog;
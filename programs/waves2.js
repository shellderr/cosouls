const fs = /*glsl*/`#version 300 es
    precision mediump float;
    out vec4 fragColor;
    uniform vec2 resolution;
    uniform vec2 vmouse;
    uniform float alpha;
    uniform float time;
    uniform float tscale;
    uniform float amp;
    uniform float dir;
    uniform bool w2;
    uniform float s_hue;
    uniform float d_hue;
    uniform float alev;
    uniform float cv;
    uniform float cs;

    vec2 ball(float t){
        return vec2(sin(t*1.2)*cos(5.+t*.82), cos(6.+t*.9));
    }

    vec2 pw(float i, vec2 uv, vec2 d, float t, float a){
        t *= 4.;
        i = (1.+i)*22.;
        d += ball(.1*t+i)*1.;
        a = mix(a, sin(i)*.3+.5,.5)*2.;
        float dx = d.x*cos(dot(d,uv)*a+t);
        float dy = d.y*cos(dot(d,uv)*a+t);
        return vec2(dx, dy);
    }

    vec2 _pw(float i, vec2 uv, vec2 d, float t, float a){
        t *= .4;
        a*=1.5;
        i = (1.+i)*5000.;
        d += ball(i*9.+t*.0)*.6;
        float m =  mix(.1, 1., sin(i)*.5+.5);
        t *= 5.+a*.4;
        a = mix(a*.1, a*1.5, sin(i)*.5+.5);
        float dx = m*d.x*cos(length(d)*a+t+a);
        float dy = m*d.y*cos(length(d)*a+t+a);
        return vec2(dx, dy);
    }

    vec3 wave(vec2 uv, vec2 d, float t, float a){
        vec2 p = pw(0., uv, d, t, a) +
        pw(1., uv, d, t, a) +
        pw(2., uv, d, t, a) +
        pw(3., uv, d, t, a);
        return normalize(cross(vec3(1, 0, p.x), vec3(0, 1, p.y)));
    }

    vec3 wave2(vec2 uv, vec2 d, float t, float a){
        vec2 p = _pw(0., uv, d, t, a) +
        _pw(1., uv, d, t, a) +
        _pw(2., uv, d, t, a) +
        _pw(3., uv, d, t, a);
        return normalize(cross(vec3(1, 0, p.x), vec3(0, 1, p.y)));
    }

    vec3 hsv2rgb(vec3 c){
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    vec3 light(vec2 uv, float t, float a){
    	// vec3 c1 = vec3(0,.6,1)*1.;
        vec3 c1 = hsv2rgb(vec3(s_hue,.8*cs,cv));
        vec3 c3 = hsv2rgb(vec3(d_hue,.9*cs,cv));
        vec3 c2 = hsv2rgb(vec3(d_hue,.9*cs,cv));
    	// vec3 c3 = vec3(.6,.0,1)*0.;
        vec3 l1 = normalize(vec3(vmouse*2.-1., 1));
        vec3 l2 = normalize(vec3(-1., -1.5, 2.5));
        vec3 w = w2 ? wave2(uv, uv, t, a) : wave(uv, uv, t, a);
        float ld = clamp(dot(l1, w),0.,1.);
        float ld2 = clamp(dot(l2, w),0.,1.);
        float lf = clamp(pow(.5-dot(l2, w),5.),0.,1.);
        float ls = clamp(pow(dot(l1, w),90.),0.,1.);
        float ls2 = clamp(pow(dot(l2, w),55.),0.,1.);
        vec3 l = .2*c3+c1*.6*ld + c2*.2*ld2+ c1*.7*ls +.4*ls2*c3 +lf*c1*.2;
        // return pow(l,vec3(1.5))*1.5;
        return l;
    }

    vec3 _light(vec2 uv, float t, float a){
        vec3 w = wave(uv, uv, t, a);
        vec3 lv = normalize(vec3(vmouse*2.-1., 1));
        float ld = clamp(dot(lv, w),0.,1.);
        float ls = clamp(pow(dot(lv, w),90.),0.,1.);
        float l = .2 + .5*ld + .5*ls;
        return vec3(l)*vec3(0,.6,1);
    }

    void main(){
        vec2 uv = (2.*gl_FragCoord.xy-resolution)/resolution;
        vec3 l = light(uv, time*dir*.1*tscale, amp);
        fragColor = vec4(l, smoothstep( dot(l.xyz,vec3(.4)), 0., alpha) );
    }
`;

const gui = {
    name: 'waveb',
    open: false,
    switch: true,
    updateFrame: true,
    fields: [
        {
            lightx: [.2,0,1,.1],
            onChange: v => {prog.uniforms.vmouse[0] = v;}
        },
        {
            lighty: [.5,0,1,.1],
            onChange: v => {prog.uniforms.vmouse[1] = v;}
        },
        {
            spec_hue: [.77, 0, 1, .01],
            onChange: v => {prog.uniforms.s_hue = v;}
        },
        {
            dif_hue: [.66, 0, 1, .01],
            onChange: v => {prog.uniforms.d_hue = v;}
        },
        {
            lev: [.75, 0, 1, .01],
            onChange: v => {prog.uniforms.cv = v;}
        },
        {
            sat: [.96, 0, 1, .01],
            onChange: v => {prog.uniforms.cs = v;}
        },
        {
            scale: [3.7, 1, 10, .01],
            onChange: v => {prog.uniforms.amp = v;}
        }, 
        {
            time: [.18,.1, 1,.01],
            onChange: v => {prog.uniforms.tscale = v;}
        },
        {
            dir: [1,0,1,1],
            onChange: v => {prog.uniforms.dir = v ? -1: 1;}
        },
        {
            patt: [1, 0, 1, 1],
            onChange: v => {prog.uniforms.w2 = v;}
        },
        {
            alpha: [.64,0,1,.01],
            onChange: v => {prog.uniforms.alpha = 1.-v;}
        }
    ]
}

const prog = {
	fs: fs,
    uniforms: {
        vmouse: [.2,.5],
        amp: 3.7,
        w2 : true,
        tscale: .18,
        alpha: .36,
        dir: -1,
        s_hue: .77,
        d_hue: .66,
        cv: .75,
        cs: .96
    },
    gui: gui
};

export default prog;
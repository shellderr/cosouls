const fs = /*glsl*/`#version 300 es
	precision highp float;

	uniform float time;
	uniform vec2 mouse;
	uniform vec2 resolution;
	out vec4 fragColor;
	#define res resolution
	#define max_steps 28
	#define min_step .01
	#define epsilon .02
	#define dist_margin 1.

	mat3 rot(float t){
		return mat3(cos(t), 0, sin(t), 0, 1, 0, -sin(t), 0, cos(t));
	}

	vec3 bkg(vec2 v, float t){
		return v.xyx*cos(t+vec3(1,2,3))*.5+.5;
	}

	float sdf(vec3 v){
		return length(v)-.4*(1.+length(log(2.+.966*cos(time+12.*(v+mouse.xyy+time*.2))*.5+.6)));
	}

	float map(vec3 v){
		return sdf(v*rot(time*.3));
	}

	// iquilezles.org/articles/normalsSDF
	vec3 normal(vec3 p){
		const float h = 0.0001;
		const vec2 k = vec2(1,-1);
		return normalize(
			k.xyy*map(p + k.xyy*h)+
			k.yyx*map(p + k.yyx*h)+
			k.yxy*map(p + k.yxy*h)+
			k.xxx*map(p + k.xxx*h));
	}

	float light(vec3 p, vec3 lt, float a){
		return pow(clamp(dot(normalize(lt),normal(p)),.0,1.), a);
	}

	float fresnel(vec3 r, vec3 l){
		return pow(1.-clamp(dot(normalize(l),normal(r)),0.,3.),2.);
	}

	vec3 lights(vec3 r){
		vec3 lv = vec3(.2, cos(4.+time*.6),-.7);
		vec3 lv2 = vec3(-.2, cos(time*.6),-.7);
		vec3 lv3 = vec3(-.1, -.01,-.1);
		vec3 l = light(r,lv, 22.)*vec3(0, .5,.4);
		vec3 l2 = light(r,lv2, 22.)*vec3(.7,.7,0.);
		vec3 l3 = light(r,lv2, 7.)*vec3(.9,.0,.6);
		vec3 lf = vec3(.0,.0,-1.);
		vec3 f = fresnel(r,lf)*vec3(.9,.6,0);
		vec3 ll = vec3(.3,.0,.7)*.2+.6*(l+l2+l3);
		return ll+f;
	}

	vec3 trace(vec3 o, vec3 d, vec2 uv){
		float t = .5;
		float alpha = 0.;
		for(int i = 0; i < max_steps; i++){
			vec3 r = o+d*t;
			float dist = map(r);
			if(dist < epsilon){
				return lights(r);
			}
			t+= dist*dist_margin;
		}
		return bkg(uv,time)*.6;
	}

	void main(void){
		vec2 uv = .7*(2.*gl_FragCoord.xy-res)/res.y;
		vec3 dir = normalize(vec3(uv, 1));
		vec3 pos = vec3((mouse-.5)*0.,-2.2);
		vec3 c = trace(pos, dir, uv);
		fragColor = vec4(1.22*c,1);
	} 
`;

const prog = {
	fs: fs
};

export default prog;
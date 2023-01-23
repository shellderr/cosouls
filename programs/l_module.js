const {cos, sin, sqrt, min, max, floor, round, random, PI} = Math;
var ctx, ctl, ww, wh;

import lsystem from '../resource/l-system.js';
import * as g from '../resource/render.js';
import rules from '../resource/selectrules.js';

var model;
var lev = 1;
var rule =  1;
var n_i = 0; //use default n
var rot_n = 4;
var theta = 0;
var draw_mod = repeat_rot; //null
var recenter = false;
var seed = 0; //0=random
var mirrorx = true;
var mirrory = false;
var sep = 0;
var amp = 1;
var yofs = 0;
var stroke_a = {h:0,s:0,l:0,a:1,str:'rgba(0,0,0,1)'};
var stroke_b = {h:0,s:0,l:0,a:.1,str:'rgba(0,0,0,.1)'};
var stroke_c = {h:0,s:0,l:0,a:1,str:'rgba(0,0,0,1)'};
var shadowblur = 0;
var ghost = false;

const l_rot = g.create_rot(-.04,.05,-.03);
const g_rot = g.create_rot(-.08,.1,-.07);

function setup(_ctx, _w, _h, _ctl){
    ctx = _ctx; ww = _w; wh = _h; ctl = _ctl;
    model = buildModel();
}

function draw(){
	ctx.shadowColor = stroke_c.str;
	ctx.shadowBlur = shadowblur;
	display(ctx, model, lev, draw_mod);
	if(ghost)display_blur(ctx, model, lev, draw_mod);
}

function loop(time){
	model.v = g.mat_mul_4(model.v, l_rot);
	display(ctx, model, lev, draw_mod);
}

function unloop(){
	model = buildModel();
}

function buildModel(){
	return lsystem(rules[rule], n_i, recenter, seed);
}

function hsl2rgb(h,s,l) { // https://stackoverflow.com/a/64090995
   let a=s*Math.min(l,1-l);
   let f= (n,k=(n+h/30)%12) => l - a*Math.max(Math.min(k-3,9-k,1),-1);
   return [f(0),f(8),f(4)];
} 

function hslstr(o){
    let v = hsl2rgb(o.h*360, o.s, o.l);
    o.str = `rgba(${v[0]*255}, ${v[1]*255}, ${v[2]*255}, ${o.a})`;
}

function _line(a, b){
	line_m(a, b, mirrorx, mirrory)	
}

function line_m(a, b, x, y){
	if(!(x||y)){
		 line(ctx, ww, wh, a[0], a[1], b[0], b[1]);
		 return;
	}
	if(x){
		let m = [-1,1,1,1];
		line(ctx, ww, wh, a[0]-sep, a[1], b[0]-sep, b[1]);	
		let aa = multv(a, m), bb = multv(b, m)
		line(ctx, ww, wh, aa[0]+sep, aa[1], bb[0]+sep, bb[1]);		
	}
	if(y){
		let m = [1,-1,1,1];
		line(ctx, ww, wh, a[0], a[1]-sep, b[0], b[1]-sep);	
		let aa = multv(a, m), bb = multv(b, m)
		line(ctx, ww, wh, aa[0], aa[1]+sep, bb[0], bb[1]+sep);
	}
}

function display(ctx, model, f, cb){
	ctx.strokeStyle = stroke_a.str;
	const n = max(floor(model.i.length*f),1);
	for(let i = 0; i < n; i++){
		let a = model.v[model.i[i][0]];
		let b = model.v[model.i[i][1]];
		if(cb){cb(a, b)}
		else _line(a, b);		
	}
}

function display_blur(ctx, model, f, cb){
	ctx.strokeStyle = stroke_b.str;
	const n = max(floor(model.i.length*f),1);
	let m = g.mat_mul_4(model.v, g.idmat);	
	for(let j = 0; j < 8; j++){
		m = g.mat_mul_4(m, g_rot);
		for(let i = 0; i < n; i++){
			let a = m[model.i[i][0]];
			let b = m[model.i[i][1]];
			if(cb){cb(a, b)}
			else _line(a, b);		
		}
	}		
}

function repeat_rot(a, b){
	let d = 2*PI/rot_n;
	for(let t = 0; t < 2*PI; t+= d){
	let rot = create_rot(t+theta);
		let aa = vec_mul(a, rot);
		let bb = vec_mul(b, rot);
		_line(aa, bb);		
	}
}

function mirror(a, b){
	let m = [1,-1,1,1];
	line(ctx, ww, wh, a[0]-sep, a[1], b[0]-sep, b[1]);	
	let aa = multv(a, m), bb = multv(b, m)
	line(ctx, ww, wh, aa[0]+sep, aa[1], bb[0]+sep, bb[1]);	
}

function line(ctx, w, h, ax, ay, bx, by){
    ctx.beginPath();
    ctx.moveTo(amp*ax*w*.5 +w*.5, amp*(ay+yofs)*h*.5+h*.5);
    ctx.lineTo(amp*bx*w*.5 +w*.5, amp*(by+yofs)*h*.5+h*.5);
    ctx.closePath();
    ctx.stroke();
}

function vec_mul(v, t){
	return [
	    v[0]*t[0][0] + v[1]*t[1][0] + v[2]*t[2][0] + v[3]*t[3][0],
	    v[0]*t[0][1] + v[1]*t[1][1] + v[2]*t[2][1] + v[3]*t[3][1],
	    v[0]*t[0][2] + v[1]*t[1][2] + v[2]*t[2][2] + v[3]*t[3][2],
	    v[0]*t[0][3] + v[1]*t[1][3] + v[2]*t[2][3] + v[3]*t[3][3]
    ];
}

function create_rot(t){
    return [[cos(t), -sin(t), 0, 0],
            [sin(t), cos(t), 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1]];
}

function multv(a, b){
    return [a[0]*b[0], a[1]*b[1], a[2]*b[2], 1];
}
function mults(v, s){
    return [v[0]*s, v[1]*s, v[2]*s, 1];
}
function addv(a, b){
    return [a[0]+b[0], a[1]+b[1], a[2]+b[2], 1];
}
function adds(v, s){
    return [v[0]+s, v[1]+s, v[2]+s, 1];
}

function ease(x){
	// return (2**(2*x)-1)/3;
	return min((2**(3.46*x)-1)/10,1);
}

const gui = {
    name: 'l-system',
    open: true,
    switch: true,
    // updateFame: true,
    folders:[
    	{
    	name: 'color',
    	fields:[
    		{
    			h: stroke_a.h,
    			min: 0,
    			max: 1,
    			step: .1,
    			onChange: (v)=>{
    				stroke_a.h = v;
    				hslstr(stroke_a);
    				ctl.frame();
    			}
    		},
    		{
    			s: stroke_a.s,
    			min: 0,
    			max: 1,
    			step: .1,
    			onChange: (v)=>{
    				stroke_a.s = v;
    				hslstr(stroke_a);
    				ctl.frame();
    			}
    		},
    		{
    			l: stroke_a.l,
    			min: 0,
    			max: 1,
    			step: .1,
    			onChange: (v)=>{
    				stroke_a.l = v;
    				hslstr(stroke_a);
    				ctl.frame();
    			}
    		},
    		{
    			a: stroke_a.a,
    			min: 0,
    			max: 1,
    			step: .1,
    			onChange: (v)=>{
    				stroke_a.a = v;
    				hslstr(stroke_a);
    				ctl.frame();
    			}
    		}
    	]
    	},
    	{
    	name: 'ghost-color',
    	fields:[
    		{
    			h: stroke_b.h,
    			min: 0,
    			max: 1,
    			step: .1,
    			onChange: (v)=>{
    				stroke_b.h = v;
    				hslstr(stroke_b);
    				ctl.frame();
    			}
    		},
    		{
    			s: stroke_b.s,
    			min: 0,
    			max: 1,
    			step: .1,
    			onChange: (v)=>{
    				stroke_b.s = v;
    				hslstr(stroke_b);
    				ctl.frame();
    			}
    		},
    		{
    			l: stroke_b.l,
    			min: 0,
    			max: 1,
    			step: .1,
    			onChange: (v)=>{
    				stroke_b.l = v;
    				hslstr(stroke_b);
    				ctl.frame();
    			}
    		},
    		{
    			a: stroke_b.a,
    			min: 0,
    			max: .5,
    			step: .01,
    			onChange: (v)=>{
    				stroke_b.a = v;
    				hslstr(stroke_b);
    				ctl.frame();
    			}
    		}
    	]
    	},
    	{
    	name: 'shadow-color',
    	fields:[
    		{
    			h: stroke_c.h,
    			min: 0,
    			max: 1,
    			step: .1,
    			onChange: (v)=>{
    				stroke_c.h = v;
    				hslstr(stroke_c);
    				ctl.frame();
    			}
    		},
    		{
    			s: stroke_c.s,
    			min: 0,
    			max: 1,
    			step: .1,
    			onChange: (v)=>{
    				stroke_c.s = v;
    				hslstr(stroke_c);
    				ctl.frame();
    			}
    		},
    		{
    			l: stroke_c.l,
    			min: 0,
    			max: 1,
    			step: .1,
    			onChange: (v)=>{
    				stroke_c.l = v;
    				hslstr(stroke_c);
    				ctl.frame();
    			}
    		},
    		{
    			a: stroke_c.a,
    			min: 0,
    			max: .5,
    			step: .01,
    			onChange: (v)=>{
    				stroke_c.a = v;
    				hslstr(stroke_c);
    				ctl.frame();
    			}
    		}
    	]
    	}
    ],
    fields:[
    	{
    		rule: rule,
    		min: 0,
    		max: rules.length-1,
    		step: 1,
    		onChange: (v)=>{
    			rule = v;
    			model = buildModel();
    			ctl.frame();
    		}

    	},
	    {
	        n: n_i,
	        min: 0,
	        max: 6,
	        step: 1,
	        onChange : (v)=>{
	            n_i = v;
	            model = buildModel();
	            ctl.frame();
	        }
	    },
	    {
	        level: 1,
	        min: .0,
	        max: 1,
	        step: 0.01,
	        onChange : (v)=>{
	            lev = ease(v);
	            ctl.frame();
	        }
	    },
	    {
	        amp: amp,
	        min: .5,
	        max: 2,
	        step: 0.01,
	        onChange : (v)=>{
	            amp = v;
	            ctl.frame();
	        }
	    },
	    {
	    	seed: seed,
	    	onChange: (v)=>{
	    		seed = v ? v : Math.random()*99+1;
	    		model = buildModel();
	    		ctl.frame();
	    	}
	    },
	    {
    		randomize: ()=>{
    			prog.gui.fields[4].ref.setValue(0);
    		}
	    },
{
	    	repeat_rot: (draw_mod? true:false),
	    	onChange: (v)=>{
	    		draw_mod = v? repeat_rot:null;
	    		ctl.frame();
	    	}
	    },
	    {
	    	rot_n: rot_n,
	    	min: 1,
	    	max: 9,
	    	step: 1,
	    	onChange: (v)=>{
	    		rot_n = v;
	    		ctl.frame();
	    	}
	    },
	    {
	    	theta: theta,
	    	min: 0,
	    	max: 2*PI,
	    	step: floor(PI*250)/1000,
	    	onChange: (v)=>{
	    		theta = v;
	    		ctl.frame();
	    	}
	    },
	    {
	    	recenter: recenter,
	    	onChange: (v)=>{
	    		recenter = v;
	    		model = buildModel();
	    		ctl.frame();
	    	}
	    },
	    {
	    	mirrorx: mirrorx,
	    	onChange: (v)=>{mirrorx = v; ctl.frame();}
	    },
	    {
	    	mirrory: mirrory,
	    	onChange: (v)=>{mirrory = v; ctl.frame();}
	    },
	    {
	    	seperation: sep,
	    	min: 0,
	    	max: 1,
	    	step: .01,
	    	onChange: (v)=>{sep = v; ctl.frame();}
	    },
	    // {
	    // 	y_offset: yofs,
	    // 	min: -1,
	    // 	max: 1,
	    // 	step: .01,
	    // 	onChange: (v)=>{yofs = v; ctl.frame();}
	    // },
	    {
	    	shadow_blur: shadowblur,
	    	min: 0,
	    	max: 30,
	    	step: 1,
	    	onChange: (v)=>{
	    		shadowblur = v;
	    		ctl.frame();
	    	}

	    },
	    {
	    	ghost_blur: ghost, onChange: (v)=>{
	    		ghost = v;
	    		ctl.frame();
	    	}
	    },
		{
			ghost_blur_alpha: stroke_b.a,
			min: 0,
			max: .5,
			step: .01,
			onChange: (v)=>{
				stroke_b.a = v;
				hslstr(stroke_b);
				ctl.frame();
			}
		}
    ]
}

const prog = {
    setup: setup,
    draw: draw,
    loop: loop,
    unloop: unloop,
    gui: gui,
    // on: false
};

export default prog;
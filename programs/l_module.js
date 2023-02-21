const {cos, sin, sqrt, min, max, floor, round, random, PI} = Math;
var ctx, ww, wh;

import lsystem from '../resource/l-system.js';
import * as g from '../resource/render.js';
import rules from '../resource/selectrules.js';

var model;
var _lev = .6;
var lev =  ease(_lev);
var rule =  1;
var n_i = 0; //use default n
var rot_n = 5;
var theta = 0;
var draw_mod = repeat_rot; //null
var recenter = false;
var seed = 0;//22; //0=random
var mirrorx = true;
var mirrory = false;
var dbl = 0;//.4;
var amp = .7;
var yofs = 0;

const l_rot = g.create_rot(-.04,.05,-.03);

function setup(_ctx, _w, _h){
    ctx = _ctx; ww = _w; wh = _h;
    ctx.lineWidth = 2;
    model = buildModel();
}

function draw(){
	display(ctx, model, lev, draw_mod);
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
		line(ctx, ww, wh, a[0]-dbl, a[1], b[0]-dbl, b[1]);	
		let aa = multv(a, m), bb = multv(b, m)
		line(ctx, ww, wh, aa[0]+dbl, aa[1], bb[0]+dbl, bb[1]);		
	}
	if(y){
		let m = [1,-1,1,1];
		line(ctx, ww, wh, a[0], a[1]-dbl, b[0], b[1]-dbl);	
		let aa = multv(a, m), bb = multv(b, m)
		line(ctx, ww, wh, aa[0], aa[1]+dbl, bb[0], bb[1]+dbl);
	}
}

function display(ctx, model, f, cb){
	const n = max(floor(model.i.length*f),1);
	for(let i = 0; i < n; i++){
		let a = model.v[model.i[i][0]];
		let b = model.v[model.i[i][1]];
		if(cb){cb(a, b)}
		else _line(a, b);		
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
	line(ctx, ww, wh, a[0]-dbl, a[1], b[0]-dbl, b[1]);	
	let aa = multv(a, m), bb = multv(b, m)
	line(ctx, ww, wh, aa[0]+dbl, aa[1], bb[0]+dbl, bb[1]);	
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
    fields:[
    	{
    		rule: rule,
    		min: 0,
    		max: rules.length-1,
    		step: 1,
    		onChange: (v)=>{
    			rule = v;
    			model = buildModel();
    			prog.ctl.frame();
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
	            prog.ctl.frame();
	        }
	    },
	    {
	        level: _lev,
	        min: .0,
	        max: 1,
	        step: 0.01,
	        onChange : (v)=>{
	            lev = ease(v);
	            prog.ctl.frame();
	        }
	    },
	    {
	        amp: amp,
	        min: .5,
	        max: 2,
	        step: 0.01,
	        onChange : (v)=>{
	            amp = v;
	            prog.ctl.frame();
	        }
	    },
	    {
	    	seed: seed,
	    	onChange: (v)=>{
	    		seed = v ? v : Math.random()*99+1;
	    		model = buildModel();
	    		prog.ctl.frame();
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
	    		prog.ctl.frame();
	    	}
	    },
	    {
	    	rot_n: rot_n,
	    	min: 1,
	    	max: 9,
	    	step: 1,
	    	onChange: (v)=>{
	    		rot_n = v;
	    		prog.ctl.frame();
	    	}
	    },
	    {
	    	theta: theta,
	    	min: 0,
	    	max: 2*PI,
	    	step: floor(PI*250)/1000,
	    	onChange: (v)=>{
	    		theta = v;
	    		prog.ctl.frame();
	    	}
	    },
	    {
	    	recenter: recenter,
	    	onChange: (v)=>{
	    		recenter = v;
	    		model = buildModel();
	    		prog.ctl.frame();
	    	}
	    },
	    {
	    	mirrorx: mirrorx,
	    	onChange: (v)=>{mirrorx = v; prog.ctl.frame();}
	    },
	    {
	    	mirrory: mirrory,
	    	onChange: (v)=>{mirrory = v; prog.ctl.frame();}
	    },
	    {
	    	seperation: dbl,
	    	min: 0,
	    	max: 1,
	    	step: .01,
	    	onChange: (v)=>{dbl = v; prog.ctl.frame();}
	    },
	    {
	    	y_offset: yofs,
	    	min: -1,
	    	max: 1,
	    	step: .01,
	    	onChange: (v)=>{yofs = v; prog.ctl.frame();}
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
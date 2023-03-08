const {cos, sin, pow, sqrt, abs, sign, min, max, floor, round, random, PI} = Math;

import lsystem from './l-system.js';
import * as g from './render.js';
import rules from './selectrules.js';
import Quaternion from './quaternion.js';

var ctx, ww, wh;

var model;
var _lev = .7;
var lev = ease(_lev);
var rule =  0;
var n_i = 0; 
var rot_n = 6;
var theta = 0;
var draw_mod = repeat_rot; 
var recenter = false;
var seed = 0;
var mirror = true;
var amp = .7;
var yofs = 0;
var yrot = false;
var a_mode = 1;
var hold = 10;

var mouse = [0,0];
var _time = 0;
const r_mat = g.create_rot(-.04,.05,-.03);
const idmat = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
var qr, qi, qs;

var _h = .14, _s = 1, _l = .5, _a = 1; 
var stroke =  hlsaStr(_h, _s, _l, _a);
var useStroke = true;

function setup(_ctx, _w, _h){
    ctx = _ctx; ww = _w; wh = _h;
    model = buildModel();
    qr = new Quaternion.fromEuler(-.03, -.04, .05);
    qi = new Quaternion();
    qs = new Quaternion();
}

function draw(){
	if(useStroke) ctx.strokeStyle = stroke;
	display(ctx, model, lev, draw_mod);
}

var vz = [0,0,1, 1];
var az = 0, azlast = 1;
var lerp = 0;

function loop(time, ctl){
	_time += .01;
	mouse = ctl.mouse;
	if(useStroke) ctx.strokeStyle = stroke;

	if(a_mode == 1){
		vz = qs.rotateVector(vz);
		az = vz[2];
	    if((az-azlast > 0 && az > .7) || az-azlast == 0){ lerp += .04;}
		if(lerp > hold) lerp = 0;
		qs = qr.slerp(qi)(min(lerp,1));
		qrot(model, qs);
		azlast = az;
	}
	else if(a_mode == 2){
		model.v = g.mat_mul_4(model.v, r_mat);
	}
	display(ctx, model, lev, draw_mod);	
}

function unloop(){
	model = buildModel();
}

function buildModel(){
	return lsystem(rules[rule], n_i, recenter, seed);
}

function qrot(model, q){
	for(let i = 0; i < model.i.length; i++){
		model.v[model.i[i][0]] = homv(q.rotateVector(model.v[model.i[i][0]]));
		model.v[model.i[i][1]] = homv(q.rotateVector(model.v[model.i[i][1]]));
	}
}

function line_m(a, b, mirror){
	if(yrot){
		a[2] = 0, b[2] = 0;
		let q = Quaternion.fromEuler(0,0,min(lerp*.7, 3.1));
		a = q.rotateVector(a); b = q.rotateVector(b);
	}
	line(ctx, ww, wh, a[0], a[1], b[0], b[1]);
	if(mirror) line(ctx, ww, wh, -a[0], a[1], -b[0], b[1]);	
}

function display(ctx, model, f, cb){
	const n = max(floor(model.i.length*f),1);
	for(let i = 0; i < n; i++){		
		let a = model.v[model.i[i][0]]; 
		let b = model.v[model.i[i][1]];
		if(cb){cb(a, b)}
		else line_m(a, b, mirror);		
	}
}

function repeat_rot(a, b){
	let d = 2*PI/rot_n;
	for(let t = 0; t < 2*PI; t+= d){
	let rot = create_rot(t+theta);
		let aa = vec_mul(a, rot);
		let bb = vec_mul(b, rot);
		line_m(aa, bb, mirror);		
	}
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
    return [[cos(t), -sin(t), 0, 0], [sin(t), cos(t), 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
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
function dot(a, b){
	return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
}
function homv(v){
	return[v[0], v[1], v[2], 1];
}
function mat16(arr){
	return [arr.slice(0,4),arr.slice(4,8),arr.slice(8,12),arr.slice(12,16)];
}
function ease(x){
	return min((2**(3.46*x)-1)/10,1);
}

const gui = {
    name: 'l-system',
    open: true,
    switch: true,
    updateFrame: true,
    fields:[
    	{
    		rule: [rule, 0, rules.length-1, 1],
    		onChange: (v)=>{
    			rule = v;
    			model = buildModel();
    		}

    	},
	    {
	        level: [_lev, 0, 1, .01],
	        onChange : v => {lev = ease(v)}
	    },
	    {
	        amp: [amp, .3, 1.3, .01],
	        onChange : v => {amp = v}
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
    			prog.gui.fields[3].ref.setValue(0);
    		}
	    },
	    {
	    	amode: [a_mode, 0, 2, 1],
	    	onChange: v => {a_mode = v;}
	    },
	    {
	    	mode1_hold: [hold, 1, 20, .1],
	    	onChange: v => {hold = v;}
	    },
	    {
	    	yrot: false,
	    	onChange: v => {yrot = v;}
	    },
	    {
	    	rot_n: [rot_n, 1, 9, 1],
	    	onChange: v => {rot_n = v}
	    },
    {
            name: 'color',
            open: false,
            updateFrame: true,
            fields: [
                {
                    usecolor: useStroke,
                    onChange: (v)=>{ useStroke = v;}
                },
                {
                    h: [_h, 0, 1, .01],
                    onChange: (v)=>{
                        _h = v; stroke = hlsaStr(_h, _s, _l, _a);
                    }
                },
                {
                    s: [_s, 0, 1, .01],
                    onChange: (v)=>{
                        _s = v; stroke = hlsaStr(_h, _s, _l, _a);
                    }
                },
                {
                    l: [_l, 0, 1, .01],
                    onChange: (v)=>{
                        _l = v; stroke = hlsaStr(_h, _s, _l, _a);
                    }
                },
                {
                    a: [_a, 0, 1, .01],
                    onChange: (v)=>{
                        _a = v; stroke = hlsaStr(_h, _s, _l, _a);
                    }
                }
            ]
        }
    ]
}

function hsl2rgb(h,s,l) { // https://stackoverflow.com/a/64090995
   let a=s*Math.min(l,1-l);
   let f= (n,k=(n+h/30)%12) => l - a*Math.max(Math.min(k-3,9-k,1),-1);
   return [f(0),f(8),f(4)];
}
function hlsaStr(h, s, l, a){
    let v = hsl2rgb(h*360, s, l);
    return`rgba(${v[0]*255}, ${v[1]*255}, ${v[2]*255}, ${a})`;
}

const prog = {
    setup: setup,
    draw: draw,
    loop: loop,
    unloop: unloop,
    gui: gui
};

export default prog;
import lsystem from '../resource/l-system.js';
import * as g from '../resource/render.js';
import rules from '../resource/selectrules.js';

const {cos, sin, sqrt, log, min, max, floor, round, random, PI} = Math;
var ctx, ctl, ww, wh;

var model, modelb;
var lev = 1;
var n_i = 0; 
var rot_n = 4;
var theta = 0;
var draw_mod = repeat_rot; 
var recenter = false;
var seed = 0; 
var mirrorx = true;
var sep = 0;
var amp = 1;
var ghost = true;
var overlay = true;

var stroke_a = 'rgba(200, 230, 133,1)'
var stroke_b = 'rgba(200, 230, 133,.1)'
var stroke_c = 'rgba(200,110,0,1)'
var stroke_d = 'rgba(200,110,0,.1)'

const l_rot = g.create_rot(-.04,.05,-.03);
const g_rot = g.create_rot(.1,-.02, -.08);

function setup(_ctx, _w, _h, _ctl){
    ctx = _ctx; ww = _w; wh = _h; ctl = _ctl;
    const params = _ctl.params;
    ctx.lineWidth = .5;
    if(params){
    	if(params.id)
    		seed = hashCode(String(params.id));
    	if(params.level)
    		lev = ease((+params.level)*.001);
    }
    model = buildModel(1);
    if(overlay) modelb = buildModel(9);
    amp += 1-lev;
}

function draw(){
	ctx.strokeStyle = stroke_a;
	display(ctx, model, lev, draw_mod);
	ctx.strokeStyle = stroke_b;
	if(ghost)display_blur(ctx, model, lev, draw_mod);
	ctx.strokeStyle = stroke_c;
	if(overlay) display(ctx, modelb, lev*2, draw_mod);
}

function loop(time){
	model.v = g.mat_mul_4(model.v, l_rot);
	display(ctx, model, lev, draw_mod);
}

function unloop(){
	model = buildModel();
}

function buildModel(rule){
	return lsystem(rules[rule], n_i, recenter, seed);
}

function _line(a, b){
	line_m(a, b, mirrorx);
}

function line_m(a, b, _mirror){
	if(_mirror){
		let m = [-1,1,1,1];
		line(ctx, ww, wh, a[0]-sep, a[1], b[0]-sep, b[1]);	
		let aa = multv(a, m), bb = multv(b, m)
		line(ctx, ww, wh, aa[0]+sep, aa[1], bb[0]+sep, bb[1]);		
	}
	else line(ctx, ww, wh, a[0], a[1], b[0], b[1]);
}

function display(ctx, model, f, cb){
	const n = max(min(floor(model.i.length*f),model.i.length-1),1);
	for(let i = 0; i < n; i++){
		let a = model.v[model.i[i][0]];
		let b = model.v[model.i[i][1]];
		if(cb){cb(a, b)}
		else _line(a, b);		
	}
}

function display_blur(ctx, model, f, cb){
	const n = max(min(floor(model.i.length*f),model.i.length-1),1);
	let m = g.mat_mul_4(model.v, g.idmat);	
	for(let j = 0; j < 6; j++){
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

function line(ctx, w, h, ax, ay, bx, by){
    ctx.beginPath();
    ctx.moveTo(amp*ax*w*.5 +w*.5, amp*ay*h*.5+h*.5);
    ctx.lineTo(amp*bx*w*.5 +w*.5, amp*by*h*.5+h*.5);
    ctx.closePath();
    ctx.stroke();
}

//https://stackoverflow.com/a/8831937
function hashCode(str){
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; 
    }
    return hash;
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
	return min((2**(3.46*x)-1)/10,1);
}

const prog = {
    setup: setup,
    draw: draw,
    loop: loop,
    unloop: unloop,
    // gui: gui,
    // on: false
};

export default prog;
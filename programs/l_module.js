const {cos, sin, pow, sqrt, abs, sign, min, max, floor, round, random, PI} = Math;

import lsystem from './l-system.js';
import * as g from './render.js';
import rules from './seedrules.js';
import Quaternion from './quaternion.js';

var ctx, ww, wh, params;

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
var mainamp = 1;
var yofs = 0;
var yrot = false;
var hold = 10;

const r_mat = g.create_rot(-.04,.05,-.03);
const idmat = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
var qr, qi, qs;

var _h = .2, _s = .77, _l = .72, _a = 1; 
var stroke =  hlsaStr(_h, _s, _l, _a);
var useStroke = true;
var update = {id: null, level: null};

function setup(ctl){
    ctx = ctl.ctx; 
    ww = ctl.w; 
    wh = ctl.h;
    params = ctl.params;
    seed = params.seed;
    lev = params.ease_level;
    seed = params.seed;
    
    if(!updateParams(ctl)) 
    	model = buildModel();

    qr = new Quaternion.fromEuler(-.03, -.04, .05);
    qi = new Quaternion();
    qs = new Quaternion();
}

function updateParams(ctl){
	if(!ctl.params) return false;
	if(update.level != ctl.params.level){
		update.level = ctl.params.level;

	}
	if(update.id != ctl.params.id){
		update.id = ctl.params.id;
		seed = ctl.params.seed;
		if(ctl.params.map_callbacks.lsys_rule){
			rule = ctl.params.map_callbacks.lsys_rule(ctl.params);
			model = buildModel();
		}
	}
	if(ctl.params.map_callbacks.lsys_rot)
		rot_n = ctl.params.map_callbacks.lsys_rot(ctl.params);

	lev = ctl.params.ease_level;
	let lin = ctl.params.norm_level;
	let b = getBounds(model,lev);
	//lev->radius scaling forumlas
	// amp = .64*smstep(lin, .1, .66, .4)/b;
	// amp = .7*(.4*max(1.-min(lev,.5), .5) + .6/b);
	// amp = .8*(.5*smstep(lin, .6, .0, .4) + .5/b);
	amp = .7*(.33*smstep(lev, .6, .0, .4) + .66*smstep(lin, .1, .66, .4)/b);

	return true;
}

function smstep(x, start=0, end=1, _floor=0){
	let a = max(min((x-start)/(end-start),1),0);
	return (1-_floor)*(3*a**2-2*a**3)+_floor;
}

function getBounds(model, f){
	let v = .1; // start threshold
	let n = max(floor(model.i.length*f),1);
	for(let i = n-1; i > 0; i--){		
		let p = model.v[model.i[i][1]];
		v = max(v, p[0]**2+p[1]**2);
	}
	return sqrt(v);
}

function draw(ctl){
	if(useStroke) ctx.strokeStyle = stroke;
	updateParams(ctl);
	display(ctx, model, lev, draw_mod);
}

var vz = [0,0,1, 1];
var az = 0, azlast = 1;
var lerp = 0;

function loop(time, ctl){
	if(useStroke) ctx.strokeStyle = stroke;
	az = vz[2];
    if((az-azlast > 0 && az >= .7) || az-azlast == 0){ lerp += .04;}
	if(lerp > hold) lerp = 0;
	vz = qs.rotateVector(vz);
	qs = qr.slerp(qi)(min(lerp,1));
	qrot(model, qs);
	azlast = az;
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
	let v = amp*mainamp;
    ctx.beginPath();
    ctx.moveTo(v*ax*w*.5 +w*.5, v*(ay+yofs)*h*.5+h*.5);
    ctx.lineTo(v*bx*w*.5 +w*.5, v*(by+yofs)*h*.5+h*.5);
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
    open: false,
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
    	/*
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
	    */
	    {
    		randomize: ()=>{
    			prog.gui.fields[3].ref.setValue(0);
    		}
	    },
    	{
    		amp: [mainamp, .5, 1.5, .1],
    		onChange: v => {mainamp = v;}	
	    },
	    {
	    	animation_hold: [hold, 1, 20, .1],
	    	onChange: v => {hold = v;}
	    },
	    {
	    	yrot: false,
	    	onChange: v => {yrot = v;}
	    },
	    // {
	    // 	rot_n: [rot_n, 1, 9, 1],
	    // 	onChange: v => {rot_n = v;}
	    // },
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
    gui: gui,
    // on: false
};

export default prog;
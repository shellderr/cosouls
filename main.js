const {cos, sin, sqrt, min, max, floor, round, random, PI} = Math;

import lsystem from './l-system.js';
import rules from './rules.js';
import rules2 from './rules2.js';
import * as g from './render.js';

const ww = 500, wh = 500;
const canvas = document.getElementById('canv');
const ctx = canvas.getContext('2d');
canvas.width = ww; 
canvas.height = wh;
canvas.style.backgroundColor = '#909090';
ctx.lineWidth = 2
// ctx.shadowBlur = 4
// ctx.shadowColor = "purple";
// ctx.shadowOffsetX = 2;
// ctx.strokeStyle = '#eeaaff'

const rule = {
	axiom: 'F',
	theta: 50,
	delta: 5,
	F: 'FF-[XY]+[XY]',
	X: '+FY',
	Y: '-FX'
}

// const model = lsystem(rules[10], 5, 1, 20);
const model = lsystem(rules2[5], 3, 1, 0);
// model.v.forEach((v)=>{v[0]*=1.4; v[1]*=1.4;});
// radialSort(model);
// yshift_bound(model, .7);

display(ctx, model, 1);

// npoly(ctx, ww, wh, 6, .1);

function display(ctx, model, f){
	const n = floor(model.i.length*(f||1));
	for(let i = 0; i < n; i++){
		let a = model.v[model.i[i][0]];
		let b = model.v[model.i[i][1]];
		line(ctx, ww, wh, a[0], a[1], b[0], b[1]);		
	}
}

function yshift_base(model, target){
	let y = target-model.v[model.i[0][0]][1];
	model.v = g.mat_mul_4(model.v, g.create_translate(0,y,0));
}

function yshift_bound(model, target){
	let max = 0;
	for(let v of model.v)
		if(v[1] > max) max = v[1];
	model.v = g.mat_mul_4(model.v, g.create_translate(0,target-max,0));
}

function radialSort(model){
	let list = [];
	for(let el of model.i){
		let v1 = model.v[el[0]];
		let v2 = model.v[el[1]];
		let d1 = sqrt(v1[0]*v1[0]+v1[1]*v1[1]);
		let d2 = sqrt(v2[0]*v2[0]+v2[1]*v2[1]);
		list.push({el: el, dist: min(d1, d2)});
	}
	list.sort((a, b)=>{return (a.dist >= b.dist)});
	model.i = list.map(e=>e.el);
}

function npoly(ctx, ww, wh, n=6, r=1){
	const a = 2*PI/n;
    ctx.beginPath();
	for(let i = 0; i < 2*PI; i +=a){
		ctx.lineTo(ww*(r*cos(i)*.5+.5), wh*(r*sin(i)*.5+.5));
	}
	ctx.closePath();
    ctx.stroke();
}

function line(ctx, w, h, ax, ay, bx, by){
    ctx.beginPath();
    ctx.moveTo(ax*w*.5 +w*.5, ay*h*.5+h*.5);
    ctx.lineTo(bx*w*.5 +w*.5, by*h*.5+h*.5);
    ctx.closePath();
    ctx.stroke();
}

// let i = 0;
// // const rotate = g.create_rot(.1,.1,.1);
// const rotate = g.create_rot(-.08,.1,-.06);
// setInterval(()=>{
// 	// model.v = g.mat_mul_4(model.v, rotate);
// 	ctx.clearRect(0,0,ww,wh);
// 	// npoly(ctx, ww, wh, 3+i*4, .1+i)
// 	i += 0.005;
// 	i -= floor(i);	
// 	display(ctx, model, i)
// },30);

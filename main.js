import lsystem from './l-system.js';
import rules from './rules.js';
import * as g from './render.js';

const ww = 500, wh = 500;
const canvas = document.getElementById('canv');
const ctx = canvas.getContext('2d');
canvas.width = ww; 
canvas.height = wh;
canvas.style.backgroundColor = '#909090';

const rule = {
	axiom: 'F',
	theta: 50,
	delta: 5,
	F: 'FF-[XY]+[XY]',
	X: '+FY',
	Y: '-FX'
}

const model = lsystem(rules[6], 5);
// radialSort(model);
// yshift_bound(model, .7);

display(ctx, model, 1);

function display(ctx, model, f){
	const n = Math.floor(model.i.length*(f||1));
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
		let d1 = Math.sqrt(v1[0]*v1[0]+v1[1]*v1[1]);
		let d2 = Math.sqrt(v2[0]*v2[0]+v2[1]*v2[1]);
		list.push({el: el, dist: Math.min(d1, d2)});
	}
	list.sort((a, b)=>{return (a.dist >= b.dist)});
	model.i = list.map(e=>e.el);
}

function line(ctx, w, h, ax, ay, bx, by){
    ctx.beginPath();
    ctx.moveTo(ax*w*.5 +w*.5, ay*h*.5+h*.5);
    ctx.lineTo(bx*w*.5 +w*.5, by*h*.5+h*.5);
    ctx.closePath();
    ctx.stroke();
}

// let i = 0;
// const rotate = g.create_rot(.1,.1,.1);
// setInterval(()=>{
// 	// model.v = g.mat_mul_4(model.v, rotate);
// 	ctx.clearRect(0,0,ww,wh);
// 	i += 0.0022;
// 	i -= Math.floor(i);	
// 	display(ctx, model, i)
// },30);

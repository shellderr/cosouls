const {cos, sin, sqrt, min, max, floor, round, random, PI} = Math;

import {solids, polyhedra, models} from './model.js';
import {loadObj, edgeList} from './loader.js';
import * as g from './render.js';

var ctx, ww, wh;
var obj, obj2, rot, rot2, proj, translate, view, colors, model, gmodels, scene;
var p_i = 0;
var viewx = 0, viewy = 0;
var translatex = 0, translatey = 0, translatez = -.55;
var rotx = -.2;
var roty = -.15;
var rotz = -.12;
var rr = PI;
var scale = 1.4;
var idx = 8;
const atable = [2.5,3,3,2.5,1.2,1,3,2,1.5,2,1.1,1.1,1.1,1.1];

var _h = .58, _s = 1, _l = .5, _a = 1; 
var stroke =  hlsaStr(_h, _s, _l, _a);
var useStroke = true;

function setup(_ctx, _w, _h){
    ctx = _ctx;  ww = _w; wh = _h;
    obj = load(polyhedra, idx)
    rot = g.create_rot(rotx*rr, roty*rr, rotz*rr);
    translate = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
    translate[3][2] = translatez;
    proj = g.create_proj(scale,.5,.3);
    view = g.lookAt([viewx*1, viewy*1, -1.], [0,0, .1], .0);
    model = g.create_model(0, obj.v, obj.i, rot, translate, view);
    scene = g.create_canvas_scene(ctx, ww, wh, model, null, proj);
    scene.z_clip = 5;
}

function load(set, idx, amp=.5){
    let _obj = loadObj(Object.values(set)[idx], 1/atable[idx]);
    let o = {v: _obj.vertices.v, i: _obj.indices.v};
    o.i = edgeList(o.i);
    return o;
}

function draw(){
    if(useStroke) ctx.strokeStyle = stroke;
    g.canvasrender(scene);
}

function loop(time){
    if(useStroke) ctx.strokeStyle = stroke;
    let m = scene.models[0];
    let rot = g.create_rot(rotx*.04, roty*.04, rotz*.04);
    m.vertices = g.mat_mul_4(m.vertices, rot);
    g.canvasrender(scene);
}

function unloop(){

}

const gui = {
    name: 'geom',
    open: true,
    switch: true,
    updateFame: true,
    fields:[
        {
            idx: idx,
            min: 0,
            max: Object.values(polyhedra).length-1,
            step: 1,
            onChange: (v)=>{
                obj = load(polyhedra, v);
                model = g.create_model(idx, obj.v, obj.i, rot, translate, view);
                scene.models[0] = model;
            }
        },
        {
            scale: scale,
            min: .1,
            max: 1.9,
            step: .1,
            onChange: (v)=>{
                scene.p_mat = g.create_proj(v,.5,.3);
            }
        },
        {
            rot_x: rotx,
            min: -1,
            max: 1,
            step: .01,
            onChange: (v)=>{
                rotx = v;
                scene.models[0].r_mat = g.create_rot(rotx*rr, roty*rr, rotz*rr);
            }
        },
        {
            rot_y: roty,
            min: -1,
            max: 1,
            step: .01,
            onChange: (v)=>{
                roty = v;
                scene.models[0].r_mat = g.create_rot(rotx*rr, roty*rr, rotz*rr);
            }
        },
        {
            rot_z: rotz,
            min: -1,
            max: 1,
            step: .01,
            onChange: (v)=>{
                rotz = v;
                scene.models[0].r_mat = g.create_rot(rotx*rr, roty*rr, rotz*rr);
            }
        },
        {
            translate_z: translatez,
            min:-1,
            max:1,
            step:.01,
            onChange: (v)=>{
                translatez = v;
                translate[3][2] = v;
            }
        },
        {
            zclip: [5, -2, 5, .01],
            onChange: (v)=>{
                scene.z_clip = v;
            }
        },
        {
            reset: ()=>{
                prog.gui.fields[1].ref.setValue(1);
                prog.gui.fields[2].ref.setValue(0);
                prog.gui.fields[3].ref.setValue(0);
                prog.gui.fields[4].ref.setValue(0);
                prog.gui.fields[5].ref.setValue(0);

            }
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
    gui: gui,
    // on: false
};

export default prog;
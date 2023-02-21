const {cos, sin, sqrt, min, max, floor, round, random, PI} = Math;

import {solids, polyhedra, models} from '../resource/model.js';
import {loadObj, edgeList} from '../resource/loader.js';
import * as g from '../resource/render.js';

var ctx, ww, wh;
var obj, obj2, rot, rot2, proj, translate, view, colors, model, gmodels, scene;
var p_i = 0;
var viewx = 0, viewy = 0;
var translatex = 0, translatey = 0, translatez = -.5;
var rotx = -.11;
var roty = -.11;
var rotz = .1;
var rr = PI;
var scale = 1.5;
var idx = 8;

function setup(_ctx, _w, _h){
    ctx = _ctx;  ww = _w; wh = _h;
    ctx.lineWidth = 2;
    obj = load(polyhedra, idx)
    rot = g.create_rot(rotx*rr, roty*rr, rotz*rr);
    translate = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
    translate[3][2] = translatez;
    proj = g.create_proj(scale,.5,.3);
    view = g.lookAt([viewx*1, viewy*1, -1.], [0,0, .1], .0);
    model = g.create_model(0, obj.v, obj.i, rot, translate, view);
    scene = g.create_canvas_scene(ctx, ww, wh, model, null, proj);
}

function load(set, idx, amp=.5){
    let _obj = loadObj(Object.values(set)[idx], amp);
    let o = {v: _obj.vertices.v, i: _obj.indices.v};
    o.i = edgeList(o.i);
    return o;
}

function draw(){
    g.canvasrender(scene);
}

function loop(time){
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
        // {
        //     translate_x: translatex,
        //     min:-1,
        //     max:1,
        //     step:.01,
        //     onChange: (v)=>{
        //         translatex = v;
        //         translate[3][0] = v;
        //     }
        // },
        // {
        //     translate_y: translatey,
        //     min:-1,
        //     max:1,
        //     step:.01,
        //     onChange: (v)=>{
        //         translatey = v;
        //         translate[3][1] = v;
        //     }
        // },
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
            reset: ()=>{
                prog.gui.fields[1].ref.setValue(1);
                prog.gui.fields[2].ref.setValue(0);
                prog.gui.fields[3].ref.setValue(0);
                prog.gui.fields[4].ref.setValue(0);
                prog.gui.fields[5].ref.setValue(0);
                prog.gui.fields[6].ref.setValue(0);
                prog.gui.fields[7].ref.setValue(0);
                prog.gui.fields[8].ref.setValue(0);
                prog.gui.fields[9].ref.setValue(0);
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
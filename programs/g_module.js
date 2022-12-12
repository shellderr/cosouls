const {cos, sin, sqrt, min, max, floor, round, random, PI} = Math;

import {solids, polyhedra, models} from '../resource/model.js';
import {loadObj, edgeList} from '../resource/loader.js';
import * as g from '../resource/render.js';

var ctx, ww, wh;
var obj, obj2, rot, rot2, proj, translate, view, colors, model, gmodels, scene;
var p_i = 0;
var viewx = 0, viewy = 0;
var translatex = 0, translatey = 0, translatez = 0;
var rotx = 0, roty = 0, rotz = 0, rr = PI;

function setup(_ctx, _w, _h){
    ctx = _ctx;  ww = _w; wh = _h;
    ctx.lineWidth = 2;
    obj = load(polyhedra, 0)
    rot = g.create_rot(0,0,0);
    translate = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
    proj = g.create_proj(.7,.5,.3);
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
            idx: 0,
            min: 0,
            max: Object.values(polyhedra).length-1,
            step: 1,
            onChange: (v)=>{
                obj = load(polyhedra, v);
                model = g.create_model(0, obj.v, obj.i, rot, translate, view);
                scene.models[0] = model;
            }
        },
        {
            rotx: 0,
            min: -1,
            max: 1,
            step: .01,
            onChange: (v)=>{
                rotx = v;
                scene.models[0].r_mat = g.create_rot(rotx*rr, roty*rr, rotz*rr);
            }
        },
        {
            roty: 0,
            min: -1,
            max: 1,
            step: .01,
            onChange: (v)=>{
                roty = v;
                scene.models[0].r_mat = g.create_rot(rotx*rr, roty*rr, rotz*rr);
            }
        },
        {
            roty: 0,
            min: -1,
            max: 1,
            step: .01,
            onChange: (v)=>{
                rotz = v;
                scene.models[0].r_mat = g.create_rot(rotx*rr, roty*rr, rotz*rr);
            }
        },
        {
            view_x: viewx,
            min:-1,
            max:1,
            step:.01,
            onChange: (v)=>{
                viewx = v*4;
                scene.models[0].v_mat = g.lookAt([viewx, viewy, -1.], [0,0, .2], .08);
            }
        },
        {
            view_y: viewy,
            min:-1,
            max:1,
            step:.01,
            onChange: (v)=>{
                viewy = v*4;
                scene.models[0].v_mat = g.lookAt( [viewx, viewy, -1.], [0,0, .2], .08);
            }
        },
        {
            translate_x: translatex,
            min:-1,
            max:1,
            step:.01,
            onChange: (v)=>{
                translatex = v;
                translate[3][0] = v;
            }
        },
        {
            translate_y: translatey,
            min:-1,
            max:1,
            step:.01,
            onChange: (v)=>{
                translatey = v;
                translate[3][1] = v;
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
        }
    ]
}

const prog = {
    setup: setup,
    draw: draw,
    loop: loop,
    unloop: unloop,
    gui: gui,
    on: false
};

export default prog;
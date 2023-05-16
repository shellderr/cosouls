const {cos, sin, sqrt, min, max, floor, round, random, PI} = Math;

import {solids, polyhedra, models} from './model.js';
import {loadObj, edgeList} from './loader.js';
import * as g from './render.js';

var ctx, ww, wh, params;
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
const scenevals = [
{scale: 1.3, z: -.9, clip: 2.5}, // 0
{scale: 1.2, z: -.78, clip: .5}, // 1
{scale: 1.8, z: -.42, clip: -1.2}, // 2
{scale: 1.4, z: -.69, clip: -.12}, // 3
{scale: 1.5, z: -.667, clip: -.58}, // 4
{scale: 1.3, z: -.57, clip: 5}, // 5
{scale: 1.2, z: -.59, clip: -.35}, // 6
// {scale: 1.4, z: -.4, clip: -1.12}, // 7
{scale: 1.4, z: -.34, clip: -1.12}, // 7
{scale: 1.4, z: -.68, clip: 1}, // 8
{scale: 1.1, z: -.8, clip: .73}, // 9
{scale: 1., z: -.66, clip: .5}, // 10
{scale: 1.1, z: -.72, clip: -.12}, // 11
{scale: 1, z: -.9, clip: .8}, // 12
{scale: 1.1, z: -.69, clip: -.2}, // 13
{scale: .9, z: -.97, clip: 2.5}];// 14

var _h = .7, _s = .8, _l = .56, _a = 1; 
var stroke =  hlsaStr(_h, _s, _l, _a);
var useStroke = true;
var update = {id: null, level: null};

function setup(ctl){
    ctx = ctl.ctx; 
    ww = ctl.w; 
    wh = ctl.h;
    params = ctl.params;
    setModel(params);
}

function load(set, idx, amp=1){
    let _obj = loadObj(Object.values(set)[idx], amp/atable[idx]);
    let o = {v: _obj.vertices.v, i: _obj.indices.v};
    o.i = edgeList(o.i);
    return o;
}

function setModel(params){ 
    if(update.id != params.id){
        update.id = params.id;
        if(params && params.map_callbacks.geom_poly)
            idx = params.map_callbacks.geom_poly(params);
        obj = load(polyhedra, idx);
        let s = scenevals[idx];
        rot = g.create_rot(rotx*rr, roty*rr, rotz*rr);
        translate = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
        translate[3][2] = s.z;
        proj = g.create_proj(s.scale,.5,.3);
        view = g.lookAt([viewx*1, viewy*1, -1.], [0,0, .1], .0);
        model = g.create_model(0, obj.v, obj.i, rot, translate, view);
        scene = g.create_canvas_scene(ctx, ww, wh, model, null, proj);
        scene.z_clip = s.clip;
        console.log('poly', idx);
    }
}

function setScene(idx){
    let s = scenevals[idx];
    if(!s) return;
    scene.p_mat = g.create_proj(s.scale,.5,.3);
    translate[3][2] = s.z;
    scene.z_clip = s.clip;
}

function draw(){
    if(useStroke) ctx.strokeStyle = stroke;
    setModel(params);
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
    open: false,
    switch: true,
    updateFrame: true,
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
                setScene(v);
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
            max:.1,
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
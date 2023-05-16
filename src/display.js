/*(c) shellderr 2023 BSD-1*/

import Glview from './lib/glview.js';
import Lineview from "./lib/lineview.js";
/// #if GUI
import * as dat from "./lib/dat.gui.module.min.js";
/// #endif

import waves from './programs/waves.js';
import waves2 from './programs/waves2.js';
import gmod from './programs/g_module.js';
import lmod from "./programs/l_module.js";

const canvas = document.querySelector('#disp');
const canvas2 = document.querySelector('#disp2');
const res = [600, 600];

var linewidth = .5, animate = true;
var lineview = null, glview = null, levelUpdate = null, idUpdate = null, params = null;

/// #if GUI
animate = false;
const maingui = {
    fields: [{
                animate: animate,
                onChange: (v)=>{
                    if(v) maingui.ctl.start(); else maingui.ctl.stop();
                }
            },
            {
                pgive: [0, 0, 20000, 10],
                onChange: (v)=>{
                    if(levelUpdate) levelUpdate(v, glview);
                }
            },
            {
                id: (v)=>{
                    if(idUpdate) idUpdate(null, glview);
                }

            },
            {
            name: 'line',
            open: false,
            updateFrame: true,
            fields:[
                {
                    name: 'l_color',
                    open: false,
                    updateFrame: true,
                    fields: [
                        {
                            h: [.2, 0, 1, .01],
                            onChange: (v)=>{
                                params.line_l.h = v;
                                setStroke(params.line_l);
                            }
                        },
                        {
                            s: [.77, 0, 1, .01],
                            onChange: (v)=>{
                                params.line_l.s = v;
                                setStroke(params.line_l);
                            }
                        },
                        {
                            l: [.72, 0, 1, .01],
                            onChange: (v)=>{
                                params.line_l.l = v;
                                setStroke(params.line_l);
                            }
                        },
                        {
                            a: [1, 0, 1, .01],
                            onChange: (v)=>{
                                params.line_l.a = v;
                                setStroke(params.line_l);
                            }
                        }                                       
                    ]
                },
                {
                    name: 'g_color',
                    open: false,
                    updateFrame: true,
                    fields: [
                        {
                            h: [.7, 0, 1, .01],
                            onChange: (v)=>{
                                params.line_g.h = v;
                                setStroke(params.line_g);
                            }
                        },
                        {
                            s: [.8, 0, 1, .01],
                            onChange: (v)=>{
                                params.line_g.s = v;
                                setStroke(params.line_g);
                            }
                        },
                        {
                            l: [.56, 0, 1, .01],
                            onChange: (v)=>{
                                params.line_g.l = v;
                                setStroke(params.line_g);
                            }
                        },
                        {
                            a: [1, 0, 1, .01],
                            onChange: (v)=>{
                                params.line_g.a = v;
                                setStroke(params.line_g);
                            }
                        }                                       
                    ]
                },
                {
                    width: [linewidth, .01, 2, .01],
                    onChange: v => lineview.lineWidth(v)
                },
            ]
        },
    ]
};

function hsl(h,s,l,a=1) { // (0,1) stackoverflow.com/a/64090995
   let v = s*Math.min(l,1-l);
   let f = (n,k=(n+h*12)%12) => l-v*Math.max(Math.min(k-3,9-k,1),-1);
   f = [f(0)*255, f(8)*255, f(4)*255, a].map(v=>v.toFixed(2));
   return `rgb(${f[0]}, ${f[1]}, ${f[2]}, ${f[3]})`;
}

function setStroke(s){
    s.stroke = hsl(s.h,s.s,s.l,s.a);
}
/// #endif

export default function start(userparams, _levelfunc, _idfunc){
    levelUpdate = _levelfunc;
    idUpdate = _idfunc;
    params = userparams;
    lineview = new Lineview(canvas, [gmod, lmod], res);
    lineview.lineWidth(linewidth);
    const cb = {
        init: lineview.init.bind(lineview),
        frame: lineview.frame.bind(lineview),
        start: lineview.start.bind(lineview),
        stop: lineview.stop.bind(lineview),
        pgms: lineview.pgms
    };
    const pgm = {chain:[waves, waves2]};
    /// #if GUI
    glview = new Glview(canvas2, pgm, res, 0, new dat.GUI(), maingui, cb, userparams);
    /// #else
    glview = new Glview(canvas2, pgm, res, 0, null, null, cb, userparams);
    /// #endif
    if(animate) glview.start(); else glview.frame();
}
import Glview from './glview.js';
import Lineview from "./lineview.js";
import * as dat from "./lib/dat.gui.module.min.js";

import bkgd from './programs/bkgd.js';
import waves from './programs/waves.js';
import waves2 from './programs/waves2.js';
import gmod from './programs/g_module.js';
import lmod from "./programs/l_module.js";

const canvas = document.querySelector('#disp');
const canvas2 = document.querySelector('#disp2');
canvas.style.border = '1px solid black';
canvas2.style.border = '1px solid black';

const res = [500, 500];
const lineview = new Lineview(canvas, [gmod, lmod], res);
const stroke = { w:.5, h: .24, s: .7, l: .5, a: 1 };
lineview.setStroke(stroke.h, stroke.s, stroke.l, stroke.a);
lineview.lineWidth(stroke.w);

let animate = true;
const maingui = {
    fields: [{
            animate: animate,
            onChange: (v)=>{
                if(v) maingui.ctl.start();
                else maingui.ctl.stop();
            }
        },
        {
            name: 'line',
            open: false,
            updateFrame: true,
            fields:[
                {
                    width: [stroke.w, .01, 2, .01],
                    onChange: v => lineview.lineWidth(v)
                    
                },
                {
                    h: [stroke.h, 0, 1, .01],
                    onChange: (v)=>{
                        stroke.h = v;
                        lineview.setStroke(stroke.h, stroke.s, stroke.l, stroke.a);
                    }
                },
                {
                    s: [stroke.s, 0, 1, .01],
                    onChange: (v)=>{
                        stroke.s = v;
                        lineview.setStroke(stroke.h, stroke.s, stroke.l, stroke.a);
                    }
                },
                {
                    l: [stroke.l, 0, 1, .01],
                    onChange: (v)=>{
                        stroke.l = v;
                        lineview.setStroke(stroke.h, stroke.s, stroke.l, stroke.a);
                    }
                }
            ]
        },
    ]
}

const cb = {
    init: lineview.init.bind(lineview),
    frame: lineview.frame.bind(lineview),
    start: lineview.start.bind(lineview),
    stop: lineview.stop.bind(lineview),
    pgms: lineview.pgms
};

const pgm = {};
pgm.chain = [waves, waves2];
// waves2.on = false;
const glview = new Glview(canvas2, pgm, res, 0, new dat.GUI(), maingui, cb);
if(animate)glview.start(); else glview.frame();
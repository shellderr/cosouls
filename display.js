import Glview from './lib/glview.js';
import Lineview from "./lib/lineview.js";
import * as dat from "./lib/dat.gui.module.min.js";

// import bkgd from './programs/bkgd.js';
import waves from './programs/waves.js';
import waves2 from './programs/waves2.js';
import gmod from './programs/g_module.js';
import lmod from "./programs/l_module.js";

const canvas = document.querySelector('#disp');
const canvas2 = document.querySelector('#disp2');
// canvas.style.border = '1px solid black';
// canvas2.style.border = '1px solid black';

const res = [500, 500];
const stroke = { w:.5, h: .24, s: .7, l: .5, a: 1 };
const animate = true;
var lineview = null, glview = null, levelUpdate = null, idUpdate = null;

const maingui = {
    fields: [{
                animate: animate,
                onChange: (v)=>{
                    if(v) maingui.ctl.start(); else maingui.ctl.stop();
                }
            },
            {
                lev: [0, 0, 2000, 10],
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

export default function start(userparams, _levelfunc, _idfunc){
    levelUpdate = _levelfunc;
    idUpdate = _idfunc;
    lineview = new Lineview(canvas, [gmod, lmod], res);
    lineview.setStroke(stroke.h, stroke.s, stroke.l, stroke.a);
    lineview.lineWidth(stroke.w);
    const cb = {
        init: lineview.init.bind(lineview),
        frame: lineview.frame.bind(lineview),
        start: lineview.start.bind(lineview),
        stop: lineview.stop.bind(lineview),
        pgms: lineview.pgms
    };
    const pgm = {chain:[waves, waves2]};
    glview = new Glview(canvas2, pgm, res, 0, new dat.GUI(), maingui, cb, userparams);
    if(animate) glview.start(); else glview.frame();
    // maingui.fields[1].ref.setValue(userparams.level);
}
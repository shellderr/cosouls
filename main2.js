import Lineview from "./modules/lineview.js";
import * as dat from "./modules/dat.gui.module.min.js";
import linemod from "./programs/p_module.js";
import lsys from "./programs/l_module.js";
import geom from "./programs/g_module.js";

import { Glview } from "./modules/glview.js";

import bkgd from "./programs/bkgd.js";
import waves from "./programs/waves.js";
import meta from "./programs/metaball.js";

const wpgm = bkgd;
wpgm.chain = [waves];

const disp1 = document.querySelector('#disp');
const disp2 = document.querySelector('#disp2')

const _gui = new dat.GUI();

const glview = new Glview(disp1, wpgm, [500,500],0,0,0);
glview.initGui(_gui);
glview.start(1)

const pgm = [ geom, lsys];
const lineview = new Lineview(disp2, pgm, 500, 500);
var _v = 0;
var _lw = .5;
var _h = 0, _s = 0, _l = .9, _a = 0;
var _sh = .24, _ss = .7, _sl = .5, _sa = 1;
const guiprog = {
    name: 'line',
    open: false,
        fields: [
                   {
                    animate: true,
                    onChange : (v)=>{ 
                        if(v) {lineview.start(); glview.start();}
                        else {lineview.stop(); glview.stop();}
                    }
                },
                {
                    strokewidth: _lw, min: .1, max: 3, step: .1,
                    onChange: (v)=>{ lineview.lineWidth(v); lineview.frame(); }
                },
                {
                    h: _sh, min: 0, max: 1, step: .01,
                    onChange: (v)=>{
                        _sh = v;
                        lineview.setStroke(_sh, _ss, _sl, _sa);
                        lineview.frame();
                    }
                },
                {
                    s: _ss, min: 0, max: 1, step: .01,
                    onChange: (v)=>{
                        _ss = v;
                        lineview.setStroke(_sh, _ss, _sl, _sa);
                        lineview.frame();
                    }
                },
                {
                    l: _sl, min: 0, max: 1, step: .01,
                    onChange: (v)=>{
                        _sl = v;
                        lineview.setStroke(_sh, _ss, _sl, _sa);
                        lineview.frame();
                    }
                }
            ]
}
lineview.canvasStyle({
    border: '1px solid black', 
    backgroundColor: `rgba(${_v},${_v},${_v},${_a})`,
    // width: '50vw',
    // height: '50vw'
});
lineview.lineWidth(_lw);
lineview.setStroke(_sh, _ss, _sl, _sa);
lineview.start();
lineview.initGui(_gui, guiprog);
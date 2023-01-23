import Lineview from "./modules/lineview.js";
import * as dat from "./modules/dat.gui.module.min.js";
import linemod from "./programs/p_module.js";
import lsys from "./programs/l_module.js";
import geom from "./programs/g_module.js";

const pgm = [linemod, geom, lsys];
const lineview = new Lineview(document.querySelector('#disp'), pgm, 500, 500);
var _v = 230;
var _lw = 1.4;
var _h = 0, _s = 0, _l = .9, _a = 1;
var _sh = 0, _ss = 0, _sl = 0, _sa = 1;
const guiprog = {
    name: 'main',
    fields:[
    {
        animate: false,
        onChange : (v)=>{ 
        	if(v) lineview.start(); 
        	else lineview.stop();
        }
    },
    {
        strokewidth: _lw, min: .1, max: 3, step: .1,
        onChange: (v)=>{ lineview.setLineWidth(v); lineview.frame(); }
    }
    ],
    folders:[
        {
            name: 'bkgd',
            fields: [
                {
                    h: _h, min: 0, max: 1, step: .01,
                    onChange: (v)=>{
                        _h = v;
                        lineview.setBkgd(_h, _s, _l, _a);
                        lineview.frame();
                    }
                },
                {
                    s: _s, min: 0, max: 1, step: .01,
                    onChange: (v)=>{
                        _s = v;
                        lineview.setBkgd(_h, _s, _l, _a);
                        lineview.frame();
                    }
                },
                {
                    l: _l, min: 0, max: 1, step: .01,
                    onChange: (v)=>{
                        _l = v;
                        lineview.setBkgd(_h, _s, _l, _a);
                        lineview.frame();
                    }
                },
                {
                    a: _a, min: 0, max: 1, step: .01,
                    onChange: (v)=>{
                        _a = v;
                        lineview.setBkgd(_h, _s, _l, _a);
                        lineview.frame();
                    }
                }
            ]
        },
        {
            name: 'stroke',
            fields: [
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
    ]
}
lineview.canvasStyle({
    border: '1px solid black', 
    backgroundColor: `rgba(${_v},${_v},${_v},${_a})`,
    // width: '50vw',
    // height: '50vw'
});
// lineview.setFill(_h, _s, _l, _a);
lineview.setLineWidth(_lw)
lineview.frame();
lineview.initGui(new dat.GUI(), guiprog);
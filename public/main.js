import { Glview } from "./modules/glview.js";
import * as dat from "./modules/dat.gui.module.min.js";
// import * as line from "./lineimg.js";

import spacebkgd from "./programs/spacebkgd.js";
import bkgd from "./programs/bkgd.js";
import meta from "./programs/metaball.js";

const pgm = bkgd;
pgm.chain = [meta];

const glview = new Glview(document.querySelector('#disp'), pgm, [550,550],0,0,0);
const gui = new dat.GUI();

let _v = 0, _a = 0;
const guiprog = {
    name: 'main',
    fields:[
    {
        animate: false,
        onChange : (v)=>{ 
        	if(v){ if(!guiprog.ctl.running) guiprog.ctl.start(true);
        	}else guiprog.ctl.stop();
        }
    },
    {
        v: 0,
        min: 0,
        max: 255,
        step: 1,
        onChange: (v)=>{
            _v = v;
            let str = `rgba(${_v}, ${_v}, ${_v}, ${_a})`;
            glview.canvas.style.backgroundColor = str;
        }
    },
    {
        a: 0,
        min: 0.,
        max: 1.,
        step: 0.02,
        onChange: (v)=>{
            _a = Math.floor(v*100)/100;
            let str = `rgba(${_v}, ${_v}, ${_v}, ${_a})`;
            glview.canvas.style.backgroundColor = str;
        }
    }
    ]
}

glview.initGui(gui, guiprog);
// line.init(document.querySelector('#disp2'), 550, 550);
// line.draw();
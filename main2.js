import Lineview from "./modules/lineview.js";
import * as dat from "./modules/dat.gui.module.min.js";
import linemod from "./programs/p_module.js";
import lsys from "./programs/l_module.js";
import geom from "./programs/g_module.js";

const pgm = [linemod, geom, lsys];
const lineview = new Lineview(document.querySelector('#disp'), pgm, 500,500);
lineview.canvas.style.border = '1px solid black';

const guiprog = {
    name: 'main',
    fields:[
    {
        animate: false,
        onChange : (v)=>{ 
        	if(v) lineview.start(); 
        	else lineview.stop();
        }
    }]
}

lineview.initGui(new dat.GUI(), guiprog);
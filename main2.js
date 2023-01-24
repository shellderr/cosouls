import Lineview from "./modules/lineview.js";
import * as dat from "./modules/dat.gui.module.min.js";
import linemod from "./programs/p_module.js";
import lsys from "./programs/l_module2.js";
import geom from "./programs/g_module.js";

const pgm = [linemod, geom, lsys];
const lineview = new Lineview(document.querySelector('#disp'), pgm, 500, 500);

function getParams(lv){
    const params = new URLSearchParams(window.location.href);
    lv.params = {id:params.get('id'), level:params.get('level')};
}

// lineview.canvasStyle({
//     border: '1px solid black', 
//     backgroundColor: 'rgb(10,0,30)'
// });

lineview.init(null, getParams);
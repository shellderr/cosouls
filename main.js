import start from './display.js';

const LEVEL_MAX = 2000;
const OVERFLOW = false;

const glob_params = {
    // id derived values
    id: '',
    seed: 0,
    randf: 0,
    // pgive derived level values
    abs_level: 0,
    level: 0,
    norm_level: 0,
    ease_level: 0,
    level_max: LEVEL_MAX,
    use_overflow: OVERFLOW,
    overflow_num: 0,
    // mapping callbacks
    map_callbacks: {
        lsys_rot : params => lsys_rot(params),
        lsys_rule : params => lsys_rule(params),
        geom_poly : params => geom_poly(params)
    }
};

// lsys rule selection weights [index, weight] P_i = w_i/sum(weights)
const lsysweights = accumulateWeights( 
    [[0,1],[1,.6],[2,.7],[3,.5],[4,0],[5,.5],[6,.5],[7,.8],[8,.18],[9,.7],[10,.3],[11,.5],[12,.5],[13,0]]);

// polyhedron selection weights
const polyweights = accumulateWeights(
[[0,0],[1,0],[2,0],[3,1],[4,0],[5,1],[6,0],[7,1],[8,1],[9,1],[10,0],[11,1],[12,0],[13,0],[14,0]]);

// start program
(()=>{
    let p = urlParams();
    setParams(glob_params, p.level||500, p.id||randID());
    start(glob_params, guiLevelUpdate, guiIdUpdate);
})();


// lsys-rotation callback
function lsys_rot(p){
    return (p.randf < .5 ? 3 : 4) + Math.round(p.ease_level*2);
}

// lsys-rule callback
function lsys_rule(p){
    let rule =  weightedChoice(lsysweights.arr, lsysweights.sum, p.randf);
    console.log('rule', rule);
    return rule;
}

// polyedron callback
function geom_poly(p){
    return weightedChoice(polyweights.arr, polyweights.sum, p.randf);
}

// gui pgive update
function guiLevelUpdate(l, glv){
    setParams(glob_params, l, null);
    glv.params = glob_params;
    glv.frame();
}

// gui id update
function guiIdUpdate(v, glv){
    v = v||randID();
    setParams(glob_params, null, v);
    glv.params = glob_params;
    glv.frame();
    console.log('id',glob_params.id);
}

function randID(){
    let s = Array.from('111',v=>String.fromCharCode(Math.random()*93+33));
    return encodeURIComponent(s.join('')).replace(/%/g,'');
}

// set global params object
function setParams(params, level=null, id=null){
    if(level != null){
        let lev = +level;
        params.abs_level = lev;
        params.level = OVERFLOW? lev%LEVEL_MAX : Math.min(lev, LEVEL_MAX);
        params.norm_level = params.level / LEVEL_MAX;
        params.ease_level = ease(params.norm_level);
        params.overflow_num = OVERFLOW? Math.floor(lev/LEVEL_MAX) : 0;
    }
    if(id != null){
        params.id = id;
        params.seed = strHashVal(id);
        params.randf = params.seed ?  mulberry32(params.seed)() : Math.random();
    }
}

function ease(x){ 
    return Math.min((2**(3.46*x)-1)/10,1);
    // return Math.min((2**(3*x)-1)/7,1);
}

function urlParams(){
    const params = new URLSearchParams(window.location.href);
    return {
        id: params.get('id'), 
        level: params.get('level'),
        gui: params.get('gui')
    };
}

// weights array -> cdf
function accumulateWeights(arr){
    arr.sort((a, b) => a[1]-b[1]);
    let sum = 0;
    for(let i = 0; i < arr.length; i++){
        sum += arr[i][1];
        if(i > 0) arr[i][1] += arr[i-1][1]
    }
    return {arr: arr, sum: sum};
}

// get weighted choice
function weightedChoice(arr, sum=1, rand){
    let r = rand*sum;
    for(let el of arr){
        if(r <= el[1]) return el[0];
    }
    return arr.length-1;
}

// id -> integer seed
function strHashVal(_str){
    let str = String(_str);
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; 
    }
    return hash;
}

// seed -> random float generator
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}
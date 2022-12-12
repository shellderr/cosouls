const {cos, sin, sqrt, min, max, floor, round, random, PI} = Math;
var ctx, ww, wh;

var p_n = 3, p_r = .2, p_t = 0;
var p_n2 = 3, p_r2 = .2, p_t2 = 0;
var pa = true, pb = false;
var xa = 0, ya = 0, xb = 0, yb = 0;

function setup(_ctx, _w, _h){
    ctx = _ctx; 
    ww = _w; 
    wh = _h;
    ctx.lineWidth = 2;
}

function draw(){
    if(pa) npoly(ctx, ww, wh, p_n, p_r, p_t, xa, ya);
    if(pb) npoly(ctx, ww, wh, p_n2, p_r2, p_t2, xb, yb);
}

function loop(time){
    if(pa) npoly(ctx, ww, wh, p_n, p_r, p_t, xa, ya);
    if(pb) npoly(ctx, ww, wh, p_n2, p_r2, p_t2, xb, yb);
}

function npoly(ctx, ww, wh, n=6, r=1, t=0, x=0, y=0){
    const a = 2*PI/n;
    ctx.beginPath();
    for(let i = 0; i < 2*PI; i +=a){
        ctx.lineTo(ww*(x+(r*cos(t+i))*.5+.5), wh*(y+(r*sin(t+i))*.5+.5));
    }
    ctx.closePath();
    ctx.stroke();
}

function line(ctx, w, h, ax, ay, bx, by){
    ctx.beginPath();
    ctx.moveTo(ax*w*.5+w*.5, ay*h*.5+h*.5);
    ctx.lineTo(bx*w*.5+w*.5, by*h*.5+h*.5);
    ctx.closePath();
    ctx.stroke();
}

const gui = {
    name: 'poly',
    open: true,
    switch: true,
    folders: [
        {
        name: 'pa',
        // open: pa,
        on: pa,
        updateFame: true,
        fields:[
            {
                n: p_n,
                min: 3.,
                max: 12.,
                step: 0.01,
                onChange : (v)=>{p_n = v;}
            },
            {
                r: p_r,
                min: 0.1,
                max: 1.,
                step: 0.01,
                onChange : (v)=>{p_r = v;}
            },
            {
                t: p_t,
                min: 0.,
                max: 6,
                step: 0.01,
                onChange : (v)=>{
                    p_t = (PI/(2*p_n))*floor(v*p_n*.5);
                }
            },
            {
                x: xa,
                min: -1,
                max: 1,
                step: .01,
                onChange: (v)=>{xa = v;}

            },
            {
                y: ya,
                min: -1,
                max: 1,
                step: .01,
                onChange: (v)=>{ya = v;}

            },
            {
                on: pa,
                onChange: (v)=>{
                    pa = v;
                    prog.gui.folders[0].oncb(v);
                    // prog.gui.switchfield.setValue(pa||pb);
                }
            }
        ]        
        },
       {
        name: 'pb',
        // open: pb,
        on: pb,
        updateFame: true,
        fields:[
            {
                n: p_n2,
                min: 3.,
                max: 12.,
                step: 0.01,
                onChange : (v)=>{p_n2 = v;}
            },
            {
                r: p_r2,
                min: 0.1,
                max: 1.,
                step: 0.01,
                onChange : (v)=>{p_r2 = v;}
            },
            {
                t: p_t2,
                min: 0.,
                max: 6,
                step: 0.01,
                onChange : (v)=>{
                    p_t2 = (PI/(2*p_n2))*floor(v*p_n2*.5);
                }
            },
            {
                x: xb,
                min: -1,
                max: 1,
                step: .01,
                onChange: (v)=>{xb = v;}

            },
            {
                y: yb,
                min: -1,
                max: 1,
                step: .01,
                onChange: (v)=>{yb = v;}

            },
            {
                on: pb,
                onChange: (v)=>{
                    pb = v;
                    prog.gui.folders[1].oncb(v);
                    // prog.gui.switchfield.setValue(pa||pb);
                }
            }
        ]        
        }
    ]
}

const prog = {
    setup: setup,
    draw: draw,
    loop: loop,
    gui: gui,
    on: false
};

export default prog;
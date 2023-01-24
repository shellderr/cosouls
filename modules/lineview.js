class Lineview{

    constructor(canvas, pgms, w=400, h=400, gui){
        if(!canvas){console.log('null canvas'); return;}
        canvas.width = w;
        canvas.height = h;
        this.w = w;
        this.h = h;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.pgms = (pgms instanceof Array)? pgms : [pgms];
        this.loop = this.loop.bind(this);
        this.running = false;   
        this.fill = {r:0,g:0,b:0,a:1};
        this.stroke = {r:0,g:0,b:0,a:1};
        window.lineview = this;
    }

    init(gui, cb){
        if(cb)cb(this);
        this.setup();
        this.initGui(gui);
        this.draw();
    }

    setup(){
        for(let p of this.pgms){
            p.setup(this.ctx, this.w, this.h, this);
            p.on = p.on == undefined ? true : p.on;
        } 
    }

    draw(){
        this.ctx.clearRect(0, 0, this.w, this.h);
        // this.ctx.fillRect(0, 0, this.w, this.h);
        for(let p of this.pgms) if(p.on) p.draw();
    }

    frame(){
        if(!this.running) this.draw();
    }

    start(){
        this.running = true;
        this.loopid = requestAnimationFrame(this.loop);
    }

    stop(){
        this.running = false;
        cancelAnimationFrame(this.loopid);
        for(let p of this.pgms) if(p.on && p.unloop) p.unloop();
        // this.frame();
    }

    loop(time){
        this.ctx.clearRect(0, 0, this.w, this.h);
        // this.ctx.fillRect(0, 0, this.w, this.h);
        for(let p of this.pgms) if(p.on && p.loop) p.loop(time);
        if(this.running)
            this.loopid = requestAnimationFrame(this.loop);
    }

    canvasStyle(css){
        for(let key in css||{}) this.canvas.style[key] = css[key]; 
    }
    setBkgd(h=0, s=0, l=0, a=1){
        if(typeof h == 'string')
            this.canvas.style.backgroundColor = h;
        else this.canvas.style.backgroundColor = hlsaStr(h, s, l, a);
    }
    setStroke(h=0, s=0, l=0, a=1){
        if(typeof h == 'string')
            this.ctx.strokeStyle = h;
        else {
            this.stroke = hlsa(h, s, l, a);
            this.ctx.strokeStyle = rgbStr(this.stroke);
        }
    }
    setFill(h=0, s=0, l=0, a=1){
        if(typeof h == 'string')
            this.ctx.fillStyle = h;
        else {
            this.fill = hlsa(h, s, l, a);
            this.ctx.fillStyle = rgbStr(this.fill);        
        }
    }

    setLineWidth(w){
        this.ctx.lineWidth = w; 
    }

    initGui(gui, mainObj){
        if(!gui) return;
        gui.__closeButton.style.visibility = "hidden";
        if(mainObj){
            mainObj.ctl = this;
            let p_gui = gui;
            if(mainObj.name){
                let _gui = gui.addFolder(mainObj.name);
                p_gui = _gui;
                _gui.title = _gui.__ul.firstChild;
                _gui.title.style.color = "springgreen";
                if(mainObj.open) _gui.open(); 
                addGuiObj(_gui, mainObj, this);
            }
            else addGuiObj(gui, mainObj, this);  
            for(let folder of mainObj.folders||[]){
                let _gui = p_gui.addFolder(folder.name || '');
                addGuiObj(_gui, folder, lineview); 
                if(folder.open) _gui.open();
                _gui.title = _gui.__ul.firstChild;   
                _gui.title.style.color = folder.on ? "springgreen" : "white";
                folder.oncb = (v)=>{_gui.title.style.color = v ? "springgreen" : "white";}
                folder.oncb(folder.on);                
            }   
        }
        for(let p of this.pgms) initSubGui(gui, p, this);
    }

}
function hlsa(h, s, l, a){
    let v = hsl2rgb(h*360, s, l);
    let o = {r: v[0], g: v[1], b: v[2], a: a};
    o.str = `rgba(${v[0]*255}, ${v[1]*255}, ${v[2]*255}, ${a})`;
    return o;
}

function rgbStr(o) {
    return`rgba(${o.r*255}, ${o.g*255}, ${o.b*255}, ${o.a})`;
}

function hlsaStr(h, s, l, a){
    let v = hsl2rgb(h*360, s, l);
    return`rgba(${v[0]*255}, ${v[1]*255}, ${v[2]*255}, ${a})`;
}

function hsl2rgb(h,s,l) { // https://stackoverflow.com/a/64090995
   let a=s*Math.min(l,1-l);
   let f= (n,k=(n+h/30)%12) => l - a*Math.max(Math.min(k-3,9-k,1),-1);
   return [f(0),f(8),f(4)];
}  

function initSubGui(gui, p, lineview){
    if(p.gui){
        let p_gui = gui.addFolder(p.gui.name);
        p.ctl = lineview;
        if(p.gui.open && p.on) p_gui.open();         
        addGuiObj(p_gui, p.gui, lineview); 
        for(let folder of p.gui.folders||[]){
            let _gui = p_gui.addFolder(folder.name || '');
            addGuiObj(_gui, folder, lineview); 
            if(folder.open) _gui.open();
            _gui.title = _gui.__ul.firstChild;   
            _gui.title.style.color = folder.on ? "springgreen" : "white";
            folder.oncb = (v)=>{_gui.title.style.color = v ? "springgreen" : "white";}
            folder.oncb(folder.on);
        } 
        p_gui.title = p_gui.__ul.firstChild;
        p_gui.title.style.color = p.on ? "springgreen" : "white";
        if(p.gui.switch){
           let _p = p_gui.add({'' : p.on}, '', p.on);
               _p.onChange((val)=>{
                p.on = val;
                p_gui.title.style.color = p.on ? "springgreen" : "white";
                lineview.frame();
            });
           p.gui.switchfield = _p;
        }
    }
}

function addGuiObj(guiTarget, guiObj, lineview){
    let i = 0;
    for(let o of guiObj.fields||[]){
        let f;
        if(f = o.onChange){ delete o.onChange; }
        let params = [o, Object.keys(o)[0], ...Object.values(o).slice(1)];
        let g = guiTarget.add(...params);
        if(f){
            if(guiObj.updateFame)
                g.onChange((v)=>{f(v); lineview.frame();}); 
            else g.onChange(f);
        }
        guiObj.fields[i++].ref = g;
    }       
}

export default Lineview;



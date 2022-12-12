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
        this.init();
        this.initGui(gui);
        this.draw();
    }

    init(){
        for(let p of this.pgms){
            p.setup(this.ctx, this.w, this.h);
            p.on = p.on == undefined ? true : p.on;
        } 
    }

    draw(){
        this.ctx.clearRect(0, 0, this.w, this.h);
        for(let p of this.pgms) if(p.on) p.draw();
    }

    frame(){
        if(!this.running) this.draw();
    }

    initGui(gui, mainObj){
        if(!gui) return;
        gui.__closeButton.style.visibility = "hidden";
        if(mainObj){
            mainObj.ctl = this;
            if(mainObj.name){
                let _gui = gui.addFolder(mainObj.name);
                _gui.title = _gui.__ul.firstChild;
                _gui.title.style.color = "springgreen";
                if(mainObj.open) _gui.open(); 
                addGuiObj(_gui, mainObj, this);
            }
            else addGuiObj(gui, mainObj, this);     
        }
        for(let p of this.pgms) initSubGui(gui, p, this);
    }

    start(){
        this.running = true;
        this.loopid = requestAnimationFrame(this.loop);
    }

    stop(){
        this.running = false;
        cancelAnimationFrame(this.loopid);
        for(let p of this.pgms) if(p.on && p.unloop) p.unloop();
        this.frame();
    }

    loop(time){
        this.ctx.clearRect(0, 0, this.w, this.h);
        for(let p of this.pgms) if(p.on && p.loop) p.loop(time);
        if(this.running)
            this.loopid = requestAnimationFrame(this.loop);
    }

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



//// gl-view - by shellderr ////

import 
{setUniforms,
drawBufferInfo,
setBuffersAndAttributes,
createTexture,
createProgramInfo,
createBufferInfoFromArrays,
resizeCanvasToDisplaySize}
from "./twgl-full.module.min.js";

const def_vs = /*glsl*/`#version 300 es                                           
    in vec4 position;
    in vec2 texcoord;
    out vec2 v_texcoord;
        void main() {
            v_texcoord = texcoord;
            gl_Position = position;
        }
`;
const def_fs = /*glsl*/`#version 300 es
    precision mediump float;                      
    uniform vec2 u_resolution;  
    uniform vec2 u_mouse;             
    out vec4 fragColor;
        void main(){
            vec2 rg = (gl_FragCoord.xy-u_mouse*vec2(1, -1))/u_resolution;
            fragColor = vec4(rg.x, 1.0-rg.y, rg.y, 1);
        }
`;

/*webgl_1 fallback*/
const def_vs_1 = /*glsl*/`                                           
    attribute vec4 position;
    attribute vec2 texcoord;
    varying vec2 v_texcoord;
        void main() {
            v_texcoord = texcoord;
            gl_Position = position;
        }
`;
const def_fs_1 = /*glsl*/`
    precision mediump float;                      
    uniform vec2 u_resolution;  
    uniform vec2 u_mouse;                
        void main(){
            vec2 rg = (gl_FragCoord.xy-u_mouse*vec2(1, -1))/u_resolution;
            gl_FragColor = vec4(rg.x, 1.0-rg.y, rg.y, 1);
        }
`;

/*
const frag_prog_proto = {
    fs: fs || null (default.fs),
    fs: fs1 || null (default.fs1), //webgl1 fallback
    vs: vs || null (default.vs),
    res: res || null (width: 600, height: 600),
    arrays: arrays || null, 
    uniforms: uniforms || null,
    rendercb: rendercb || null,
    setupcb: setupcb || null,
    textures: {u_name : twgl-texoptions, ...} || null,
    drawtype: drawtype || null (gl_triangle_strip),
    clearcolor: clearcolor || null (0,0,0,0),
    gui: guioptions || null
}
*/

// defaults
const prog_default = {
    gl : undefined,
    res : {width: 600, height: 600},
    arrays : {
        position: { numComponents: 3, data: [-1, -1, 0,  -1, 1, 0,  1, -1, 0,  1, 1, 0] },
        texcoord: { numComponents: 2, data: [0, 1,  0, 0, 1, 1,  1, 0] }
    },
    vs : def_vs,
    fs : def_fs,
    version: 2,
    uniforms : {
        u_time : 0,
        u_resolution: [600, 600],
        u_mouse: [0,0]
    },
    clearcolor: [0.0, 0.0, 0.0, 0.0],
    drawtype : 5,
    textures : null,
    rendercb : ()=>{},
    setupcb : ()=>{},
    chain : null,
    ctl: undefined,
    on: true
};

function pgm_render(time=0){ 
    this.gl.useProgram(this.programInfo.program);
    setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo); 
    this.uniforms.u_time = time * 0.001;
    this.uniforms.u_resolution = [this.gl.canvas.width, this.gl.canvas.height];
    this.prog.rendercb(this.pgm);
    setUniforms(this.programInfo, this.uniforms);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    if(this.prog.on)drawBufferInfo(this.gl, this.bufferInfo, this.drawtype);
    for(let p of this.chain){
        if(p.prog.on) chain_render(p, this.uniforms);
    }
    if(this.loop)
        this.req = requestAnimationFrame(this.render);
}

function chain_render(prog, uniforms){
    prog.gl.useProgram(prog.programInfo.program);
    setBuffersAndAttributes(prog.gl, prog.programInfo, prog.bufferInfo); 
    prog.uniforms.u_time = uniforms.u_time;
    prog.uniforms.u_resolution = uniforms.u_resolution;
    prog.uniforms.u_mouse = uniforms.u_mouse;
    prog.prog.rendercb(prog.pgm);
    setUniforms(prog.programInfo, prog.uniforms);
    drawBufferInfo(prog.gl, prog.bufferInfo, prog.drawtype);
}

function merge(dest, template){
    for(let prop in template){
        if(dest[prop] == null) dest[prop] = template[prop];
        else if(typeof dest[prop] === 'object'){
            if(!(dest[prop] instanceof Array))
            for(let p in template[prop]){
                if(dest[prop][p] == null) dest[prop][p] = template[prop][p];
            }
        }
    }
}

function gl_fields(gl, prog){
    for(let v in prog){
        if(gl[[prog[v]]])
            prog[v] = gl[[prog[v]]];   
    }
    return prog;
}


class GlProg{

    constructor(prog){
        this.gl = prog.gl;
        this.prog = prog;
        this.drawtype = prog.drawtype;
        this.programInfo = null;
        this.bufferInfo = null;
        this.uniforms = prog.uniforms;
        this.req = null;
        this.chain = [];
        this.render = pgm_render.bind(this);
        prog.glprog = this;
        this.pgm = {
            uniforms : this.uniforms,
            arrays : this.prog.arrays,
            res : this.prog.res
        };
    }

    init(node){
        let p_tex = this.prog.textures;
        if (!(p_tex instanceof Array)) p_tex = [p_tex];
        for(let tex of p_tex){
            for(let key in tex)
                this.uniforms[key] = createTexture(this.gl, gl_fields(this.gl, tex[key]));           
        }
        let prog_fs = (this.prog.version == 1 && this.prog.fs1) ? this.prog.fs1 /*webgl1 fallback*/: this.prog.fs;
        if(prog_fs instanceof Array){
            this.fsprogs = [];
            for(let fs of prog_fs)
                this.fsprogs.push(createProgramInfo(this.gl, [this.prog.vs, fs]));        
            this.programInfo = this.fsprogs[0];
        }else{
            this.programInfo = createProgramInfo(this.gl, [this.prog.vs, prog_fs]);
        }
        this.bufferInfo = createBufferInfoFromArrays(this.gl, this.prog.arrays);
        this.gl.canvas.onpointermove = node ? null : (e)=>{
            this.uniforms.u_mouse[0] = e.offsetX; this.uniforms.u_mouse[1] = e.offsetY;
        }    
        setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo);
        this.prog.setupcb(this.pgm);
        if(this.prog.chain && this.prog.chain.length > 0){ 
            for(let i = 0; i < this.prog.chain.length; i++){
                this.prog.ctl.addProgram(this.prog.chain[i], this.chain); 
                this.chain[i].init();
            }
        }            
    }

    start(loop=1){
        this.gl.canvas.width = this.prog.res.width;
        this.gl.canvas.height = this.prog.res.height;
        resizeCanvasToDisplaySize(this.gl.canvas);
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.useProgram(this.programInfo.program);
        setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo); 
        this.gl.clearColor(...this.prog.clearcolor);
        this.loop = loop;
        if(loop)
            this.req = requestAnimationFrame(this.render);
        else this.render();
    }

    stop(){
        cancelAnimationFrame(this.req);
        this.loop = 0;
    }
}


class Glview{

    constructor(canvas, progs, _res, _bkgd, _idx, _loop=true) {
        this.fsprogs = (progs instanceof Array)? progs : [progs];
        this.programs = [];
        this.programs.length = 0, this.active = _idx || 0;
        if(!canvas){ console.log('null canvas'); return; }
        canvas.style.backgroundColor = _bkgd || "";
        canvas.style.touchAction = "none";
        this.canvas = canvas;
        let opts = {premultipliedAlpha: false, antialias: true};
        let gl = canvas.getContext("webgl2", opts);
        if(!gl){
        	gl = canvas.getContext("webgl", opts);
        	this.prog.version = 1;
        }
        if(!gl){console.log('null gl context'); return;}
        this.prog = prog_default;
        this.prog.gl = gl;
        if(_res instanceof Array) _res = {width: _res[0], height: _res[1]};
        this.prog.res = _res || this.prog.res;
        this.prog.drawtype = gl.TRIANGLE_STRIP;
        this.prog.ctl = this; 
        this.frag_limit = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
        this.prog.vstring = gl.getParameter(gl.VERSION);
        this.loop = _loop;
        this.running = false;
        if(this.prog.version == 1){
        	this.prog.fs = def_fs_1;
        	this.prog.vs = def_vs_1;
    	}
        this.gui_ctl = {
            pgm : this.active
        };
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        for(let i = 0; i < this.fsprogs.length; i++){
            this.addProgram(this.fsprogs[i], this.programs);
            this.programs[i].init();
        }
        this.start();
    }

    start(loop){
        if(loop != undefined) this.loop = loop;
        this.switchProgram(this.active);
    }

    stop(){
        this.switchProgram(-1);
    }

    frame(){ 
        if(!this.running)
            this.programs[this.active].render();
    }

    switchProgram(index){ 
        this.programs[this.active].stop();
        this.running = false;
        if(index >= 0 && this.active != index)
            if(this.programs[this.active].gui)this.programs[this.active].gui.hide();
        if(index >= 0 && this.programs[index]){
        	this.active = index;
            this.programs[index].start(this.loop);
            this.running = this.loop;
            if(this.programs[this.active].gui)this.programs[this.active].gui.show();
        }  
    }

    addProgram(fsprog, arr){
        fsprog = fsprog || {};
        merge(fsprog, this.prog);
        arr.push(new GlProg(fsprog));
    }

    initGui(gui, mainObj){ 
        gui.__closeButton.style.visibility = "hidden";
        if(this.programs.length > 1)
        gui.add(this.gui_ctl, 'pgm', 0, this.programs.length-1, 1).onChange((val)=>{
            if(this.active != val){
                this.switchProgram(val);
            }
        });
        if(mainObj){
            mainObj.ctl = this;
            if(mainObj.name){
                let _gui = gui.addFolder(mainObj.name);
                _gui.title = _gui.__ul.firstChild;
                _gui.title.style.color = "springgreen";
                if(mainObj.open) _gui.open(); 
                this.addGuiObj(_gui, mainObj);
            }
            else this.addGuiObj(gui, mainObj);     
        }
        for(let i = 0; i < this.programs.length; i++){
            let p = this.programs[i];
            this.initSubGui(gui, p, (i !== this.active));
            for(let _p of p.chain || []){
                this.initSubGui(gui, _p, false);
            }
        }           
    }

    addGuiObj(guiTarget, guiObj){
        let i = 0;
        for(let o of guiObj.fields||[]){
            let f;
            if(f = o.onChange){ delete o.onChange; }
            let params = [o, Object.keys(o)[0], ...Object.values(o).slice(1)];
            let g = guiTarget.add(...params);
            if(f){
                if(guiObj.updateFame)
                    g.onChange((v)=>{f(v); this.frame();}); 
                else g.onChange(f);
            }
            guiObj.fields[i++].ref = g;
        }        
    }

    initSubGui(gui, p, hide){
        if(p.prog.gui){
            p.gui = gui.addFolder(p.prog.gui.name);
            p.gui.title = p.gui.__ul.firstChild;
            if(p.prog.gui.open) p.gui.open();         
            if(hide){ p.gui.hide(); } 
            this.addGuiObj(p.gui, p.prog.gui);
            p.gui.title.style.color = p.prog.on ? "springgreen" : "white";
            if(p.prog.gui.switch){
               let _p = p.gui.add({'' : p.prog.on}, '', p.prog.on);
               _p.onChange((val)=>{
                p.prog.on = val;
                p.gui.title.style.color = p.prog.on ? "springgreen" : "white";
                this.frame();
            });
            }
        }
    }

}

export {Glview};
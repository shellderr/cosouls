(function () {
	'use strict';

	function createShaderProgram(gl, obj){
		let vs = gl.createShader(gl.VERTEX_SHADER);
		let fs = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(vs, obj.vs);
		gl.shaderSource(fs, obj.fs);
		gl.compileShader(fs);
		gl.compileShader(vs);
		let compiled = [vs, fs].every((shader, i)=>{
			if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
				console.log('error compiling', i? 'fragment':'vertex', 'shader:');
				console.log(gl.getShaderInfoLog(shader));
				gl.deleteShader(shader);
				return false; 
			}	return true;
		});
		if(!compiled) return null;
		let pgm = gl.createProgram();
		gl.attachShader(pgm, vs);
		gl.attachShader(pgm, fs);
		gl.linkProgram(pgm);
		obj.shaderProgram = pgm;
		obj.uniformSetters = uniformSetters(gl, pgm);
		attribSetup(gl, obj);
		return 1;
	}

	function attribSetup(gl, obj){
		for(let key in obj.arrays)
			obj.arrays[key].location = gl.getAttribLocation(obj.shaderProgram, key); 
		if(typeof obj.drawMode === 'string') obj.drawMode = gl[obj.drawMode];
		else if (typeof obj.drawMode !== 'number') obj.drawMode = gl.TRIANGLES;
	}

	function setBuffers(gl, obj, arrays){
		let attribs =  arrays || obj.arrays;
		for(let key in attribs){ 
			let attr = attribs[key];
			if(attr.location < 0) continue;
			let dataStr = typeof attr.data === 'string';
			if(dataStr) attr.buffer = attribs[attr.data].buffer;
			else if(!attr.buffer) attr.buffer = gl.createBuffer();
			if(key=='position' && !obj.vao){
				obj.vao = gl.createVertexArray(); 
				gl.bindVertexArray(obj.vao);		
			}
			if(key=='indices'){ 
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, attr.buffer);
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(attr.data), gl.STATIC_DRAW);	
			}else { 
				gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
				if(!dataStr)
					gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attr.data), gl.STATIC_DRAW);
				let stride = attr.stride || 0, offset = attr.offset || 0;
				gl.vertexAttribPointer(attr.location, attr.components, gl.FLOAT, 0, stride*4, offset*4);
				gl.enableVertexAttribArray(attr.location);
			}
		}
		gl.bindVertexArray(null);
		setCount(obj);
	}

	function enableAttributes(gl, obj){
		if(obj.vao) gl.bindVertexArray(obj.vao);
		else for(let key in obj.arrays){ 
			let attr = obj.arrays[key];
			if(key === 'indices'){
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, attr.buffer);
			}else {
				gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
				let stride = attr.stride||0, offset = attr.offset||0;
				gl.vertexAttribPointer(attr.location, attr.components, gl.FLOAT, 0, stride*4, offset*4);
				gl.enableVertexAttribArray(attr.location);
			}
		} 
		gl.useProgram(obj.shaderProgram);
	}

	function setUniforms(gl, obj){
		for(let u in obj.uniforms)
			if(obj.uniformSetters[u])obj.uniformSetters[u](gl, obj.uniforms[u]);
	}

	function drawObj(gl, obj){
		if(obj.arrays.indices)
			gl.drawElements(obj.drawMode, obj.count, gl.UNSIGNED_SHORT, 0);
		else gl.drawArrays(obj.drawMode, 0, obj.count);
	}

	function setCount(obj){
		if(obj.arrays.position){
			let count = obj.arrays.indices ? obj.arrays.indices.data.length : 
			obj.arrays.position.data.length/(obj.arrays.position.stride||obj.arrays.position.components);
			obj.count = count;			
		}
	}

	function uniformSetters(gl, program){ 
		let setters = {};
		let count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
		for(let i = 0; i < count; i++){
			let info = gl.getActiveUniform(program, i);
			let loc = gl.getUniformLocation(program, info.name);
			let name = info.name.replace('[0]', '');
			setters[name] = utypes(gl, info.type, info.size, loc);
		}
		return setters;
	}

	function utypes(gl, type, size, loc){
		let v = (size > 1);
		switch(type){
			case gl.FLOAT : return v ? (gl,v)=>{gl.uniform1fv(loc, v);} : (gl,v)=>{gl.uniform1f(loc, v);};
			case gl.FLOAT_VEC2 : return v ? (gl,v)=>{gl.uniform2fv(loc, v);} : (gl,v)=>{gl.uniform2f(loc, ...v);};
			case gl.FLOAT_VEC3 : return v ? (gl,v)=>{gl.uniform3fv(loc, v);} : (gl,v)=>{gl.uniform3f(loc, ...v);};
			case gl.FLOAT_VEC4 : return v ? (gl,v)=>{gl.uniform4fv(loc, v);} : (gl,v)=>{gl.uniform4f(loc, ...v);};
			case gl.FLOAT_MAT2 : return (gl,v)=>{gl.uniformMatrix2fv(loc, false, v);};
			case gl.FLOAT_MAT3 : return (gl,v)=>{gl.uniformMatrix3fv(loc, false, v);};
			case gl.FLOAT_MAT4 : return (gl,v)=>{gl.uniformMatrix4fv(loc, false, v);};
			case gl.SAMPLER_2D :		case gl.SAMPLER_3D :		case gl.SAMPLER_2D_ARRAY :		case gl.SAMPLER_CUBE :		case gl.BOOL : return v ? (gl,v)=>{gl.uniform1iv(loc, v);} : (gl,v)=>{gl.uniform1i(loc, v);};
			case gl.INT : return v ? (gl,v)=>{gl.uniform1iv(loc, v);} : (gl,v)=>{gl.uniform1i(loc, v);};
			case gl.INT_VEC2 : return v ? (gl,v)=>{gl.uniform2iv(loc, v);} : (gl,v)=>{gl.uniform2i(loc, ...v);};
			case gl.INT_VEC3 : return v ? (gl,v)=>{gl.uniform3iv(loc, v);} : (gl,v)=>{gl.uniform3i(loc, ...v);};
			case gl.INT_VEC4 : return v ? (gl,v)=>{gl.uniform4iv(loc, v);} : (gl,v)=>{gl.uniform4i(loc, ...v);};
		}
	}

	var mgl = /*#__PURE__*/Object.freeze({
		__proto__: null,
		createShaderProgram: createShaderProgram,
		setBuffers: setBuffers,
		enableAttributes: enableAttributes,
		setUniforms: setUniforms,
		drawObj: drawObj
	});

	// createShaderProgram, setBuffers, enableAttributes, setUniforms, drawObj

	const def_vs =/*glsl*/`#version 300 es
	in vec3 position;
	in vec3 color;
	out vec3 vcolor;
    
    void main() {
    	vcolor = color;
        gl_Position = vec4(position, 1.);
    }
`;

	const def_fs = /*glsl*/`#version 300 es
    precision mediump float;
    in vec3 vcolor;
    out vec4 fragColor;
    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float time;

    void main(){
        // vec2 uv = (2.*gl_FragCoord.xy-resolution)/resolution;
    	// fragColor = vec4(uv.xyx*cos(time+vec3(0,1,3))*.5+.5, 1);
        fragColor = vec4(0,0,0,1);
    }
`;

	const def_prog = {
		arrays: {
			position: {
				components: 3,
				data: [-1,-1,0, 1,-1,0,  -1,1,0,  1,1,0]
			},
	        color: {
	            components: 3,
	            data: [0,1,0, 0,0,1, 0,0,1, 1,0,0]
	        }
		},
	    clearcolor: [0,0,0,0],
		uniforms: {
	        resolution: [500,500],
	        mouse: [0,0],
	        time: 0
	    },
		vs: def_vs,
		fs: def_fs,
		drawMode: 'TRIANGLE_STRIP',
	    textures : null,
	    rendercb : ()=>{},
	    setupcb : ()=>{},
	    chain : [],
		shaderProgram: null,
		on: true
	};

	class Glview{

	    constructor(canvas, pgms, res, fps, gui, guiobj, cbobj){
	    	this.pgms = (pgms instanceof Array)? pgms : [pgms];
	        this.prog = this.pgms[0];
	        this.gl = canvas.getContext("webgl2", {premultipliedAlpha: true, antialias: true});
	        if(!this.gl){console.log('no gl context'); return;}
	        this.res = res || [500, 500];
	        initCanvas(canvas, this.res);
	        this.render = this.render.bind(this);
	        this.fpsloop = this.fpsloop.bind(this);
	        this.req = null;
	        this.loop = false;
	        this.mgl = mgl;
	        this.ms = fps ? 1000/fps : 0;
	        this.mouse = [0,0];
	        this.time = 0;
	        canvas.onmousemove = (e)=>{
	        	this.mouse[0] = e.offsetX/this.res[0];
	        	this.mouse[1] = 1.-e.offsetY/this.res[1];
	        };
	        this.gl.disable(this.gl.DEPTH_TEST);
	        this.gl.enable(this.gl.BLEND);
	        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
	        this.gl.viewport(0, 0, this.res[0], this.res[1]);

	        let nf = ()=>{};
	        this.cbobj = cbobj || {init: nf, start:nf, stop: nf, frame:nf, pgms: []};
	        cbobj.init(this);

	        if(!this.init(this.gl, this.pgms)){this.start = this.frame = ()=>{}; return;}
	        if(gui) initGui(gui, this, guiobj);
	        this.gl.clearColor(...this.prog.clearcolor);
	    }

	    start(){
	        if(this.loop) return;
	        this.loop = true;
	        const f = (time)=>{
	            this.render(time); 
	            this.req = requestAnimationFrame(f);
	        }; 
	        if(this.ms) this.fpsloop(this.ms); else f(0);
	        this.cbobj.start();
	    }

	    stop(){
	        this.loop = false;
	        cancelAnimationFrame(this.req);
	        this.cbobj.stop();
	    }

	    switchProgram(idx){      
	        if(this.pgms[idx]){
	            if(this.prog._gui) this.prog._gui.hide();
	            this.prog = this.pgms[idx];
	            this.gl.clearColor(...this.prog.clearcolor);
	            this.frame();
	            if(this.prog._gui) this.prog._gui.show();
	        }
	    }

	    frame(time=0){
	        if(!this.loop){
	            this.cbobj.frame(time);
	            this.render(time);
	        }
	    }

	    render(time){
	        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	        this.prog.uniforms.time = time*.001;
	        this.prog.uniforms.mouse = this.mouse;
	        enableAttributes(this.gl, this.prog);
	        this.prog.rendercb(this.prog);
	        setUniforms(this.gl, this.prog);
	        this.prog.draw(this.prog);
	        for(let p of this.prog.chain) if(p.on){
	            p.uniforms.time = time*.01;
	            p.uniforms.mouse = this.mouse;
	            enableAttributes(this.gl, p);
	            p.rendercb(p);
	            setUniforms(this.gl, p);
	            drawObj(this.gl, p);            
	        }
	    }

	    fpsloop(ms){
	        let last = performance.now();
	        const _loop = (time)=>{
	            this.req = requestAnimationFrame(_loop);
	            let delta = time-last;
	            if(delta > ms){
	                last = time - (delta%ms);
	                this.render(time);
	            }
	        }; _loop(0);
	    }

	    init(gl, pgms){
	    	for(let pgm of pgms){
	    		merge(pgm, def_prog, this);
	            pgm.uniforms.resolution = this.res;
	            pgm.uniforms.time = 0;
	    		if(!createShaderProgram(gl, pgm)) return null; 
	            pgm.setupcb(pgm);
	            if(!pgm.draw) pgm.draw = ()=>{drawObj(this.gl, pgm);};
	    		setBuffers(gl, pgm);
	    		for(let p of pgm.chain||[]){
	    			merge(p, {...def_prog, count: pgm.count});
	                p.uniforms.resolution = this.res;
	                p.uniforms.time = 0;
		    		if(!createShaderProgram(gl, p)) return null;
	                p.setupcb(p);
	    			setBuffers(gl, p);
	    		}
	    	} return 1;
	    }
	}

	function initCanvas(canvas, res){
	    canvas.width = res[0];
	    canvas.height = res[1];
	    canvas.style.width = res[0]+'px';
	    canvas.style.height = res[1]+'px';    
	}

	function merge(dest, template, ctl){
	    for(let prop in template) 
	    	if(dest[prop] == null) dest[prop] = template[prop];
	    dest.ctl = ctl;
	}

	function initGui(gui, ctl, mainobj){
	    gui.__closeButton.style.visibility = "hidden";
	    if(ctl.pgms.length > 1)
	        gui.add({pgm: 0}, 'pgm', 0, ctl.pgms.length-1, 1).onChange((val)=>{
	            ctl.switchProgram(val);   
	        });
	    if(mainobj){ 
	        if(mainobj.name) guiSubFolder(gui, mainobj, ctl);
	        else addGuiObj(gui, mainobj, ctl); 
	    }
	    for(let p of ctl.pgms){
	        if(p.gui) initSubGui(gui, p, ctl, p!==ctl.prog);
	        for(let _p of p.chain || [])
	            if(_p.gui) initSubGui(gui, _p, ctl);
	    }
	    // remove
	    for(let p of ctl.cbobj.pgms){
	        if(p.gui) initSubGui(gui, p, ctl);
	    }
	}

	function initSubGui(gui, p, ctl, hide){
	    if(p.gui.name === null){addGuiObj(gui, p.gui, ctl); return;}
	    p._gui = gui.addFolder(p.gui.name||'');
	    if(hide) p._gui.hide();
	    if(p.gui.open && p.on) p._gui.open(); 
	    p.ctl = ctl;        
	    addGuiObj(p._gui, p.gui, ctl); 
	    p._gui.title = p._gui.__ul.firstChild;
	    p._gui.title.style.color = p.on ? "springgreen" : "white";
	    if(p.gui.switch){
	       let _p = p._gui.add({'' : p.on}, '', p.on);
	           _p.onChange((val)=>{
	            p.on = val;
	            p._gui.title.style.color = p.on ? "springgreen" : "white";
	            ctl.frame();
	        });
	    }
	}

	function guiSubFolder(gui, obj, ctl){
	    let g = gui.addFolder(obj.name||'');
	    if(obj.open) g.open();
	    addGuiObj(g, obj, ctl);
	    g.title = g.__ul.firstChild;
	    g.title.style.color = "springgreen";
	}

	function addGuiObj(gui, obj, ctl){
	    let i = 0;
	    for(let o of obj.fields||[]){
	        if(o.fields){guiSubFolder(gui, o, ctl); continue;}
	        let f;
	        if(f = o.onChange) delete o.onChange;
	        o = getArrayParams(o);
	        let params = [o, Object.keys(o)[0], ...Object.values(o).slice(1)];
	        let g = gui.add(...params);
	        if(f){
	            if(obj.updateFrame) g.onChange((v)=>{f(v); ctl.frame();}); 
	            else g.onChange(f);
	        }
	        obj.fields[i++].ref = g;
	    }   obj.ctl = ctl;    
	}

	function getArrayParams(o){
	    let e = Object.entries(o)[0];
	    if(e[1] instanceof Array){
	        o[e[0]]= e[1][0];
	        o.min = e[1][1];
	        o.max = e[1][2];
	        o.step = e[1][3];
	    }return o;
	}

	class Lineview{

	    constructor(canvas, pgms, res=[500,500], gui){
	        if(!canvas){console.log('null canvas'); return;}
	        canvas.width = res[0];
	        canvas.height = res[1];
	        this.w = res[0];
	        this.h = res[1];
	        this.canvas = canvas;
	        this.mouse = [0,0];
	        this.canvas.onmousemove = (e)=>{
	            this.mouse[0] = e.offsetX/this.w;
	            this.mouse[1] = 1.-e.offsetY/this.h;
	        };
	        this.ctx = canvas.getContext('2d');
	        this.pgms = (pgms instanceof Array)? pgms : [pgms];
	        this.loop = this.loop.bind(this);
	        this.running = false;   
	        this.fill = this.canvas.style.backgroundColor;
	        this.stroke = "#000000";
	    }

	    init(ctl){ 
	        for(let p of this.pgms){
	            p.setup(this.ctx, this.w, this.h);
	            p.on = p.on == undefined ? true : p.on;
	        } 
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
	        for(let p of this.pgms) if(p.on && p.loop) p.loop(time, this);
	        if(this.running)
	            this.loopid = requestAnimationFrame(this.loop);
	    }

	    draw(){
	        this.ctx.clearRect(0, 0, this.w, this.h);
	        for(let p of this.pgms) if(p.on) p.draw();
	    }

	    frame(){
	        if(!this.running) this.draw();
	    }

	    lineWidth(w){
	        this.ctx.lineWidth = w; 
	    }

	    setStroke(h=0, s=0, l=0, a=1){
	        if(typeof h == 'string')
	            this.ctx.strokeStyle = h;
	        else this.ctx.strokeStyle = hlsaStr$2(h, s, l, a);
	    }

	    setBkgd(h=0, s=0, l=0, a=1){
	        if(typeof h == 'string')
	            this.canvas.style.backgroundColor = h;
	        else this.canvas.style.backgroundColor = hlsaStr$2(h, s, l, a);
	    }

	    canvasStyle(css){
	        for(let key in css||{}) this.canvas.style[key] = css[key]; 
	    }

	}

	function hlsaStr$2(h, s, l, a){
	    let v = hsl2rgb$2(h*360, s, l);
	    return `rgba(${v[0]*255}, ${v[1]*255}, ${v[2]*255}, ${a})`;
	}

	function hsl2rgb$2(h,s,l) { // https://stackoverflow.com/a/64090995
	   let a=s*Math.min(l,1-l);
	   let f= (n,k=(n+h/30)%12) => l - a*Math.max(Math.min(k-3,9-k,1),-1);
	   return [f(0),f(8),f(4)];
	}

	function ___$insertStyle(e){if(e&&"undefined"!=typeof window){var t=document.createElement("style");return t.setAttribute("type","text/css"),t.innerHTML=e,document.head.appendChild(t),e}}function colorToString(e,t){var o=e.__state.conversionName.toString(),n=Math.round(e.r),l=Math.round(e.g),i=Math.round(e.b),r=e.a,a=Math.round(e.h),d=e.s.toFixed(1),s=e.v.toFixed(1);if(t||"THREE_CHAR_HEX"===o||"SIX_CHAR_HEX"===o){for(var _=e.hex.toString(16);6>_.length;)_="0"+_;return "#"+_}return "CSS_RGB"===o?"rgb("+n+","+l+","+i+")":"CSS_RGBA"===o?"rgba("+n+","+l+","+i+","+r+")":"HEX"===o?"0x"+e.hex.toString(16):"RGB_ARRAY"===o?"["+n+","+l+","+i+"]":"RGBA_ARRAY"===o?"["+n+","+l+","+i+","+r+"]":"RGB_OBJ"===o?"{r:"+n+",g:"+l+",b:"+i+"}":"RGBA_OBJ"===o?"{r:"+n+",g:"+l+",b:"+i+",a:"+r+"}":"HSV_OBJ"===o?"{h:"+a+",s:"+d+",v:"+s+"}":"HSVA_OBJ"===o?"{h:"+a+",s:"+d+",v:"+s+",a:"+r+"}":"unknown format"}var ARR_EACH=Array.prototype.forEach,ARR_SLICE=Array.prototype.slice,Common={BREAK:{},extend:function(e){return this.each(ARR_SLICE.call(arguments,1),function(t){var o=this.isObject(t)?Object.keys(t):[];o.forEach(function(o){this.isUndefined(t[o])||(e[o]=t[o]);}.bind(this));},this),e},defaults:function(e){return this.each(ARR_SLICE.call(arguments,1),function(t){var o=this.isObject(t)?Object.keys(t):[];o.forEach(function(o){this.isUndefined(e[o])&&(e[o]=t[o]);}.bind(this));},this),e},compose:function(){var e=ARR_SLICE.call(arguments);return function(){for(var t=ARR_SLICE.call(arguments),o=e.length-1;0<=o;o--)t=[e[o].apply(this,t)];return t[0]}},each:function(e,t,o){if(e)if(ARR_EACH&&e.forEach&&e.forEach===ARR_EACH)e.forEach(t,o);else if(e.length===e.length+0){var n=void 0,a=void 0;for(n=0,a=e.length;n<a;n++)if(n in e&&t.call(o,e[n],n)===this.BREAK)return}else for(var i in e)if(t.call(o,e[i],i)===this.BREAK)return},defer:function(e){setTimeout(e,0);},debounce:function(e,t,o){var n;return function(){var a=this,l=arguments,i=o||!n;clearTimeout(n),n=setTimeout(function(){n=null,o||e.apply(a,l);},t),i&&e.apply(a,l);}},toArray:function(e){return e.toArray?e.toArray():ARR_SLICE.call(e)},isUndefined:function(e){return e===void 0},isNull:function(e){return null===e},isNaN:function(e){function t(){return e.apply(this,arguments)}return t.toString=function(){return e.toString()},t}(function(e){return isNaN(e)}),isArray:Array.isArray||function(e){return e.constructor===Array},isObject:function(e){return e===Object(e)},isNumber:function(e){return e===e+0},isString:function(e){return e===e+""},isBoolean:function(e){return !1===e||!0===e},isFunction:function(e){return e instanceof Function}},INTERPRETATIONS=[{litmus:Common.isString,conversions:{THREE_CHAR_HEX:{read:function(e){var t=e.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);return null!==t&&{space:"HEX",hex:parseInt("0x"+t[1].toString()+t[1].toString()+t[2].toString()+t[2].toString()+t[3].toString()+t[3].toString(),0)}},write:colorToString},SIX_CHAR_HEX:{read:function(e){var t=e.match(/^#([A-F0-9]{6})$/i);return null!==t&&{space:"HEX",hex:parseInt("0x"+t[1].toString(),0)}},write:colorToString},CSS_RGB:{read:function(e){var t=e.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);return null!==t&&{space:"RGB",r:parseFloat(t[1]),g:parseFloat(t[2]),b:parseFloat(t[3])}},write:colorToString},CSS_RGBA:{read:function(e){var t=e.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);return null!==t&&{space:"RGB",r:parseFloat(t[1]),g:parseFloat(t[2]),b:parseFloat(t[3]),a:parseFloat(t[4])}},write:colorToString}}},{litmus:Common.isNumber,conversions:{HEX:{read:function(e){return {space:"HEX",hex:e,conversionName:"HEX"}},write:function(e){return e.hex}}}},{litmus:Common.isArray,conversions:{RGB_ARRAY:{read:function(e){return !(3!==e.length)&&{space:"RGB",r:e[0],g:e[1],b:e[2]}},write:function(e){return [e.r,e.g,e.b]}},RGBA_ARRAY:{read:function(e){return !(4!==e.length)&&{space:"RGB",r:e[0],g:e[1],b:e[2],a:e[3]}},write:function(e){return [e.r,e.g,e.b,e.a]}}}},{litmus:Common.isObject,conversions:{RGBA_OBJ:{read:function(e){return !!(Common.isNumber(e.r)&&Common.isNumber(e.g)&&Common.isNumber(e.b)&&Common.isNumber(e.a))&&{space:"RGB",r:e.r,g:e.g,b:e.b,a:e.a}},write:function(e){return {r:e.r,g:e.g,b:e.b,a:e.a}}},RGB_OBJ:{read:function(e){return !!(Common.isNumber(e.r)&&Common.isNumber(e.g)&&Common.isNumber(e.b))&&{space:"RGB",r:e.r,g:e.g,b:e.b}},write:function(e){return {r:e.r,g:e.g,b:e.b}}},HSVA_OBJ:{read:function(e){return !!(Common.isNumber(e.h)&&Common.isNumber(e.s)&&Common.isNumber(e.v)&&Common.isNumber(e.a))&&{space:"HSV",h:e.h,s:e.s,v:e.v,a:e.a}},write:function(e){return {h:e.h,s:e.s,v:e.v,a:e.a}}},HSV_OBJ:{read:function(e){return !!(Common.isNumber(e.h)&&Common.isNumber(e.s)&&Common.isNumber(e.v))&&{space:"HSV",h:e.h,s:e.s,v:e.v}},write:function(e){return {h:e.h,s:e.s,v:e.v}}}}}],result=void 0,toReturn=void 0,interpret=function(){toReturn=!1;var e=1<arguments.length?Common.toArray(arguments):arguments[0];return Common.each(INTERPRETATIONS,function(t){if(t.litmus(e))return Common.each(t.conversions,function(t,o){if(result=t.read(e),!1===toReturn&&!1!==result)return toReturn=result,result.conversionName=o,result.conversion=t,Common.BREAK}),Common.BREAK}),toReturn},tmpComponent=void 0,ColorMath={hsv_to_rgb:function(e,o,n){var a=Math.floor(e/60)%6,l=e/60-Math.floor(e/60),i=n*(1-o),r=n*(1-l*o),d=n*(1-(1-l)*o),t=[[n,d,i],[r,n,i],[i,n,d],[i,r,n],[d,i,n],[n,i,r]][a];return {r:255*t[0],g:255*t[1],b:255*t[2]}},rgb_to_hsv:function(e,t,o){var n=Math.min(e,t,o),a=Math.max(e,t,o),l=a-n,i=void 0,r=void 0;if(0!==a)r=l/a;else return {h:NaN,s:0,v:0};return i=e===a?(t-o)/l:t===a?2+(o-e)/l:4+(e-t)/l,i/=6,0>i&&(i+=1),{h:360*i,s:r,v:a/255}},rgb_to_hex:function(e,t,o){var n=this.hex_with_component(0,2,e);return n=this.hex_with_component(n,1,t),n=this.hex_with_component(n,0,o),n},component_from_hex:function(e,t){return 255&e>>8*t},hex_with_component:function(e,t,o){return o<<(tmpComponent=8*t)|e&~(255<<tmpComponent)}},_typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},classCallCheck=function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")},createClass=function(){function e(e,t){for(var o,n=0;n<t.length;n++)o=t[n],o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,o.key,o);}return function(t,o,n){return o&&e(t.prototype,o),n&&e(t,n),t}}(),get=function e(t,o,n){null===t&&(t=Function.prototype);var a=Object.getOwnPropertyDescriptor(t,o);if(a===void 0){var l=Object.getPrototypeOf(t);return null===l?void 0:e(l,o,n)}if("value"in a)return a.value;var i=a.get;return void 0===i?void 0:i.call(n)},inherits=function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);},possibleConstructorReturn=function(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t&&("object"==typeof t||"function"==typeof t)?t:e},Color=function(){function e(){if(classCallCheck(this,e),this.__state=interpret.apply(this,arguments),!1===this.__state)throw new Error("Failed to interpret color arguments");this.__state.a=this.__state.a||1;}return createClass(e,[{key:"toString",value:function(){return colorToString(this)}},{key:"toHexString",value:function(){return colorToString(this,!0)}},{key:"toOriginal",value:function(){return this.__state.conversion.write(this)}}]),e}();function defineRGBComponent(e,t,o){Object.defineProperty(e,t,{get:function(){return "RGB"===this.__state.space?this.__state[t]:(Color.recalculateRGB(this,t,o),this.__state[t])},set:function(e){"RGB"!==this.__state.space&&(Color.recalculateRGB(this,t,o),this.__state.space="RGB"),this.__state[t]=e;}});}function defineHSVComponent(e,t){Object.defineProperty(e,t,{get:function(){return "HSV"===this.__state.space?this.__state[t]:(Color.recalculateHSV(this),this.__state[t])},set:function(e){"HSV"!==this.__state.space&&(Color.recalculateHSV(this),this.__state.space="HSV"),this.__state[t]=e;}});}Color.recalculateRGB=function(e,t,o){if("HEX"===e.__state.space)e.__state[t]=ColorMath.component_from_hex(e.__state.hex,o);else if("HSV"===e.__state.space)Common.extend(e.__state,ColorMath.hsv_to_rgb(e.__state.h,e.__state.s,e.__state.v));else throw new Error("Corrupted color state")},Color.recalculateHSV=function(e){var t=ColorMath.rgb_to_hsv(e.r,e.g,e.b);Common.extend(e.__state,{s:t.s,v:t.v}),Common.isNaN(t.h)?Common.isUndefined(e.__state.h)&&(e.__state.h=0):e.__state.h=t.h;},Color.COMPONENTS=["r","g","b","h","s","v","hex","a"],defineRGBComponent(Color.prototype,"r",2),defineRGBComponent(Color.prototype,"g",1),defineRGBComponent(Color.prototype,"b",0),defineHSVComponent(Color.prototype,"h"),defineHSVComponent(Color.prototype,"s"),defineHSVComponent(Color.prototype,"v"),Object.defineProperty(Color.prototype,"a",{get:function(){return this.__state.a},set:function(e){this.__state.a=e;}}),Object.defineProperty(Color.prototype,"hex",{get:function(){return "HEX"!==this.__state.space&&(this.__state.hex=ColorMath.rgb_to_hex(this.r,this.g,this.b),this.__state.space="HEX"),this.__state.hex},set:function(e){this.__state.space="HEX",this.__state.hex=e;}});var Controller=function(){function e(t,o){classCallCheck(this,e),this.initialValue=t[o],this.domElement=document.createElement("div"),this.object=t,this.property=o,this.__onChange=void 0,this.__onFinishChange=void 0;}return createClass(e,[{key:"onChange",value:function(e){return this.__onChange=e,this}},{key:"onFinishChange",value:function(e){return this.__onFinishChange=e,this}},{key:"setValue",value:function(e){return this.object[this.property]=e,this.__onChange&&this.__onChange.call(this,e),this.updateDisplay(),this}},{key:"getValue",value:function(){return this.object[this.property]}},{key:"updateDisplay",value:function(){return this}},{key:"isModified",value:function(){return this.initialValue!==this.getValue()}}]),e}(),EVENT_MAP={HTMLEvents:["change"],MouseEvents:["click","mousemove","mousedown","mouseup","mouseover"],KeyboardEvents:["keydown"]},EVENT_MAP_INV={};Common.each(EVENT_MAP,function(e,t){Common.each(e,function(o){EVENT_MAP_INV[o]=t;});});var CSS_VALUE_PIXELS=/(\d+(\.\d+)?)px/;function cssValueToPixels(e){if("0"===e||Common.isUndefined(e))return 0;var t=e.match(CSS_VALUE_PIXELS);return Common.isNull(t)?0:parseFloat(t[1])}var dom={makeSelectable:function(e,t){void 0===e||void 0===e.style||(e.onselectstart=t?function(){return !1}:function(){},e.style.MozUserSelect=t?"auto":"none",e.style.KhtmlUserSelect=t?"auto":"none",e.unselectable=t?"on":"off");},makeFullscreen:function(e,t,o){var n=o,a=t;Common.isUndefined(a)&&(a=!0),Common.isUndefined(n)&&(n=!0),e.style.position="absolute",a&&(e.style.left=0,e.style.right=0),n&&(e.style.top=0,e.style.bottom=0);},fakeEvent:function(e,t,o,n){var a=o||{},l=EVENT_MAP_INV[t];if(!l)throw new Error("Event type "+t+" not supported.");var i=document.createEvent(l);switch(l){case"MouseEvents":{var r=a.x||a.clientX||0,d=a.y||a.clientY||0;i.initMouseEvent(t,a.bubbles||!1,a.cancelable||!0,window,a.clickCount||1,0,0,r,d,!1,!1,!1,!1,0,null);break}case"KeyboardEvents":{var s=i.initKeyboardEvent||i.initKeyEvent;Common.defaults(a,{cancelable:!0,ctrlKey:!1,altKey:!1,shiftKey:!1,metaKey:!1,keyCode:void 0,charCode:void 0}),s(t,a.bubbles||!1,a.cancelable,window,a.ctrlKey,a.altKey,a.shiftKey,a.metaKey,a.keyCode,a.charCode);break}default:{i.initEvent(t,a.bubbles||!1,a.cancelable||!0);break}}Common.defaults(i,n),e.dispatchEvent(i);},bind:function(e,t,o,n){return e.addEventListener?e.addEventListener(t,o,n||!1):e.attachEvent&&e.attachEvent("on"+t,o),dom},unbind:function(e,t,o,n){return e.removeEventListener?e.removeEventListener(t,o,n||!1):e.detachEvent&&e.detachEvent("on"+t,o),dom},addClass:function(e,t){if(e.className===void 0)e.className=t;else if(e.className!==t){var o=e.className.split(/ +/);-1===o.indexOf(t)&&(o.push(t),e.className=o.join(" ").replace(/^\s+/,"").replace(/\s+$/,""));}return dom},removeClass:function(e,t){if(!t)e.className=void 0;else if(e.className===t)e.removeAttribute("class");else {var o=e.className.split(/ +/),n=o.indexOf(t);-1!==n&&(o.splice(n,1),e.className=o.join(" "));}return dom},hasClass:function(e,t){return new RegExp("(?:^|\\s+)"+t+"(?:\\s+|$)").test(e.className)||!1},getWidth:function(e){var t=getComputedStyle(e);return cssValueToPixels(t["border-left-width"])+cssValueToPixels(t["border-right-width"])+cssValueToPixels(t["padding-left"])+cssValueToPixels(t["padding-right"])+cssValueToPixels(t.width)},getHeight:function(e){var t=getComputedStyle(e);return cssValueToPixels(t["border-top-width"])+cssValueToPixels(t["border-bottom-width"])+cssValueToPixels(t["padding-top"])+cssValueToPixels(t["padding-bottom"])+cssValueToPixels(t.height)},getOffset:function(e){var t=e,o={left:0,top:0};if(t.offsetParent)do o.left+=t.offsetLeft,o.top+=t.offsetTop,t=t.offsetParent;while(t);return o},isActive:function(e){return e===document.activeElement&&(e.type||e.href)}},BooleanController=function(e){function t(e,o){classCallCheck(this,t);var n=possibleConstructorReturn(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o)),a=n;return n.__prev=n.getValue(),n.__checkbox=document.createElement("input"),n.__checkbox.setAttribute("type","checkbox"),dom.bind(n.__checkbox,"change",function(){a.setValue(!a.__prev);},!1),n.domElement.appendChild(n.__checkbox),n.updateDisplay(),n}return inherits(t,e),createClass(t,[{key:"setValue",value:function(e){var o=get(t.prototype.__proto__||Object.getPrototypeOf(t.prototype),"setValue",this).call(this,e);return this.__onFinishChange&&this.__onFinishChange.call(this,this.getValue()),this.__prev=this.getValue(),o}},{key:"updateDisplay",value:function(){return !0===this.getValue()?(this.__checkbox.setAttribute("checked","checked"),this.__checkbox.checked=!0,this.__prev=!0):(this.__checkbox.checked=!1,this.__prev=!1),get(t.prototype.__proto__||Object.getPrototypeOf(t.prototype),"updateDisplay",this).call(this)}}]),t}(Controller),OptionController=function(e){function t(e,o,n){classCallCheck(this,t);var a=possibleConstructorReturn(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o)),l=n,i=a;if(a.__select=document.createElement("select"),Common.isArray(l)){var r={};Common.each(l,function(e){r[e]=e;}),l=r;}return Common.each(l,function(e,t){var o=document.createElement("option");o.innerHTML=t,o.setAttribute("value",e),i.__select.appendChild(o);}),a.updateDisplay(),dom.bind(a.__select,"change",function(){var e=this.options[this.selectedIndex].value;i.setValue(e);}),a.domElement.appendChild(a.__select),a}return inherits(t,e),createClass(t,[{key:"setValue",value:function(e){var o=get(t.prototype.__proto__||Object.getPrototypeOf(t.prototype),"setValue",this).call(this,e);return this.__onFinishChange&&this.__onFinishChange.call(this,this.getValue()),o}},{key:"updateDisplay",value:function(){return dom.isActive(this.__select)?this:(this.__select.value=this.getValue(),get(t.prototype.__proto__||Object.getPrototypeOf(t.prototype),"updateDisplay",this).call(this))}}]),t}(Controller),StringController=function(e){function t(e,o){function n(){l.setValue(l.__input.value);}classCallCheck(this,t);var a=possibleConstructorReturn(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o)),l=a;return a.__input=document.createElement("input"),a.__input.setAttribute("type","text"),dom.bind(a.__input,"keyup",n),dom.bind(a.__input,"change",n),dom.bind(a.__input,"blur",function(){l.__onFinishChange&&l.__onFinishChange.call(l,l.getValue());}),dom.bind(a.__input,"keydown",function(t){13===t.keyCode&&this.blur();}),a.updateDisplay(),a.domElement.appendChild(a.__input),a}return inherits(t,e),createClass(t,[{key:"updateDisplay",value:function(){return dom.isActive(this.__input)||(this.__input.value=this.getValue()),get(t.prototype.__proto__||Object.getPrototypeOf(t.prototype),"updateDisplay",this).call(this)}}]),t}(Controller);function numDecimals(e){var t=e.toString();return -1<t.indexOf(".")?t.length-t.indexOf(".")-1:0}var NumberController=function(e){function t(e,o,n){classCallCheck(this,t);var a=possibleConstructorReturn(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o)),l=n||{};return a.__min=l.min,a.__max=l.max,a.__step=l.step,a.__impliedStep=Common.isUndefined(a.__step)?0===a.initialValue?1:Math.pow(10,Math.floor(Math.log(Math.abs(a.initialValue))/Math.LN10))/10:a.__step,a.__precision=numDecimals(a.__impliedStep),a}return inherits(t,e),createClass(t,[{key:"setValue",value:function(e){var o=e;return void 0!==this.__min&&o<this.__min?o=this.__min:void 0!==this.__max&&o>this.__max&&(o=this.__max),void 0!==this.__step&&0!=o%this.__step&&(o=Math.round(o/this.__step)*this.__step),get(t.prototype.__proto__||Object.getPrototypeOf(t.prototype),"setValue",this).call(this,o)}},{key:"min",value:function(e){return this.__min=e,this}},{key:"max",value:function(e){return this.__max=e,this}},{key:"step",value:function(e){return this.__step=e,this.__impliedStep=e,this.__precision=numDecimals(e),this}}]),t}(Controller);function roundToDecimal(e,t){var o=Math.pow(10,t);return Math.round(e*o)/o}var NumberControllerBox=function(e){function t(e,o,n){function a(){d.__onFinishChange&&d.__onFinishChange.call(d,d.getValue());}function l(t){var e=s-t.clientY;d.setValue(d.getValue()+e*d.__impliedStep),s=t.clientY;}function i(){dom.unbind(window,"mousemove",l),dom.unbind(window,"mouseup",i),a();}classCallCheck(this,t);var r=possibleConstructorReturn(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o,n));r.__truncationSuspended=!1;var d=r,s=void 0;return r.__input=document.createElement("input"),r.__input.setAttribute("type","text"),dom.bind(r.__input,"change",function(){var e=parseFloat(d.__input.value);Common.isNaN(e)||d.setValue(e);}),dom.bind(r.__input,"blur",function(){a();}),dom.bind(r.__input,"mousedown",function(t){dom.bind(window,"mousemove",l),dom.bind(window,"mouseup",i),s=t.clientY;}),dom.bind(r.__input,"keydown",function(t){13===t.keyCode&&(d.__truncationSuspended=!0,this.blur(),d.__truncationSuspended=!1,a());}),r.updateDisplay(),r.domElement.appendChild(r.__input),r}return inherits(t,e),createClass(t,[{key:"updateDisplay",value:function(){return this.__input.value=this.__truncationSuspended?this.getValue():roundToDecimal(this.getValue(),this.__precision),get(t.prototype.__proto__||Object.getPrototypeOf(t.prototype),"updateDisplay",this).call(this)}}]),t}(NumberController);function map(e,t,o,n,a){return n+(a-n)*((e-t)/(o-t))}var NumberControllerSlider=function(e){function t(e,o,n,a,l){function i(t){t.preventDefault();var e=c.__background.getBoundingClientRect();return c.setValue(map(t.clientX,e.left,e.right,c.__min,c.__max)),!1}function r(){dom.unbind(window,"mousemove",i),dom.unbind(window,"mouseup",r),c.__onFinishChange&&c.__onFinishChange.call(c,c.getValue());}function d(t){var e=t.touches[0].clientX,o=c.__background.getBoundingClientRect();c.setValue(map(e,o.left,o.right,c.__min,c.__max));}function s(){dom.unbind(window,"touchmove",d),dom.unbind(window,"touchend",s),c.__onFinishChange&&c.__onFinishChange.call(c,c.getValue());}classCallCheck(this,t);var _=possibleConstructorReturn(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o,{min:n,max:a,step:l})),c=_;return _.__background=document.createElement("div"),_.__foreground=document.createElement("div"),dom.bind(_.__background,"mousedown",function(t){document.activeElement.blur(),dom.bind(window,"mousemove",i),dom.bind(window,"mouseup",r),i(t);}),dom.bind(_.__background,"touchstart",function(t){1!==t.touches.length||(dom.bind(window,"touchmove",d),dom.bind(window,"touchend",s),d(t));}),dom.addClass(_.__background,"slider"),dom.addClass(_.__foreground,"slider-fg"),_.updateDisplay(),_.__background.appendChild(_.__foreground),_.domElement.appendChild(_.__background),_}return inherits(t,e),createClass(t,[{key:"updateDisplay",value:function(){var e=(this.getValue()-this.__min)/(this.__max-this.__min);return this.__foreground.style.width=100*e+"%",get(t.prototype.__proto__||Object.getPrototypeOf(t.prototype),"updateDisplay",this).call(this)}}]),t}(NumberController),FunctionController=function(e){function t(e,o,n){classCallCheck(this,t);var a=possibleConstructorReturn(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o));return a.__button=document.createElement("div"),a.__button.innerHTML=void 0===n?"Fire":n,dom.bind(a.__button,"click",function(t){return t.preventDefault(),a.fire(),!1}),dom.addClass(a.__button,"button"),a.domElement.appendChild(a.__button),a}return inherits(t,e),createClass(t,[{key:"fire",value:function(){this.__onChange&&this.__onChange.call(this),this.getValue().call(this.object),this.__onFinishChange&&this.__onFinishChange.call(this,this.getValue());}}]),t}(Controller),ColorController=function(e){function t(e,o){function n(t){s(t),dom.bind(window,"mousemove",s),dom.bind(window,"touchmove",s),dom.bind(window,"mouseup",l),dom.bind(window,"touchend",l);}function a(t){_(t),dom.bind(window,"mousemove",_),dom.bind(window,"touchmove",_),dom.bind(window,"mouseup",i),dom.bind(window,"touchend",i);}function l(){dom.unbind(window,"mousemove",s),dom.unbind(window,"touchmove",s),dom.unbind(window,"mouseup",l),dom.unbind(window,"touchend",l),d();}function i(){dom.unbind(window,"mousemove",_),dom.unbind(window,"touchmove",_),dom.unbind(window,"mouseup",i),dom.unbind(window,"touchend",i),d();}function r(){var e=interpret(this.value);!1===e?this.value=p.__color.toString():(p.__color.__state=e,p.setValue(p.__color.toOriginal()));}function d(){p.__onFinishChange&&p.__onFinishChange.call(p,p.__color.toOriginal());}function s(t){-1===t.type.indexOf("touch")&&t.preventDefault();var e=p.__saturation_field.getBoundingClientRect(),o=t.touches&&t.touches[0]||t,n=o.clientX,a=o.clientY,l=(n-e.left)/(e.right-e.left),i=1-(a-e.top)/(e.bottom-e.top);return 1<i?i=1:0>i&&(i=0),1<l?l=1:0>l&&(l=0),p.__color.v=i,p.__color.s=l,p.setValue(p.__color.toOriginal()),!1}function _(t){-1===t.type.indexOf("touch")&&t.preventDefault();var e=p.__hue_field.getBoundingClientRect(),o=t.touches&&t.touches[0]||t,n=o.clientY,a=1-(n-e.top)/(e.bottom-e.top);return 1<a?a=1:0>a&&(a=0),p.__color.h=360*a,p.setValue(p.__color.toOriginal()),!1}classCallCheck(this,t);var c=possibleConstructorReturn(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e,o));c.__color=new Color(c.getValue()),c.__temp=new Color(0);var p=c;c.domElement=document.createElement("div"),dom.makeSelectable(c.domElement,!1),c.__selector=document.createElement("div"),c.__selector.className="selector",c.__saturation_field=document.createElement("div"),c.__saturation_field.className="saturation-field",c.__field_knob=document.createElement("div"),c.__field_knob.className="field-knob",c.__field_knob_border="2px solid ",c.__hue_knob=document.createElement("div"),c.__hue_knob.className="hue-knob",c.__hue_field=document.createElement("div"),c.__hue_field.className="hue-field",c.__input=document.createElement("input"),c.__input.type="text",c.__input_textShadow="0 1px 1px ",dom.bind(c.__input,"keydown",function(t){13===t.keyCode&&r.call(this);}),dom.bind(c.__input,"blur",r),dom.bind(c.__selector,"mousedown",function(){dom.addClass(this,"drag").bind(window,"mouseup",function(){dom.removeClass(p.__selector,"drag");});}),dom.bind(c.__selector,"touchstart",function(){dom.addClass(this,"drag").bind(window,"touchend",function(){dom.removeClass(p.__selector,"drag");});});var u=document.createElement("div");return Common.extend(c.__selector.style,{width:"122px",height:"102px",padding:"3px",backgroundColor:"#222",boxShadow:"0px 1px 3px rgba(0,0,0,0.3)"}),Common.extend(c.__field_knob.style,{position:"absolute",width:"12px",height:"12px",border:c.__field_knob_border+(.5>c.__color.v?"#fff":"#000"),boxShadow:"0px 1px 3px rgba(0,0,0,0.5)",borderRadius:"12px",zIndex:1}),Common.extend(c.__hue_knob.style,{position:"absolute",width:"15px",height:"2px",borderRight:"4px solid #fff",zIndex:1}),Common.extend(c.__saturation_field.style,{width:"100px",height:"100px",border:"1px solid #555",marginRight:"3px",display:"inline-block",cursor:"pointer"}),Common.extend(u.style,{width:"100%",height:"100%",background:"none"}),linearGradient(u,"top","rgba(0,0,0,0)","#000"),Common.extend(c.__hue_field.style,{width:"15px",height:"100px",border:"1px solid #555",cursor:"ns-resize",position:"absolute",top:"3px",right:"3px"}),hueGradient(c.__hue_field),Common.extend(c.__input.style,{outline:"none",textAlign:"center",color:"#fff",border:0,fontWeight:"bold",textShadow:c.__input_textShadow+"rgba(0,0,0,0.7)"}),dom.bind(c.__saturation_field,"mousedown",n),dom.bind(c.__saturation_field,"touchstart",n),dom.bind(c.__field_knob,"mousedown",n),dom.bind(c.__field_knob,"touchstart",n),dom.bind(c.__hue_field,"mousedown",a),dom.bind(c.__hue_field,"touchstart",a),c.__saturation_field.appendChild(u),c.__selector.appendChild(c.__field_knob),c.__selector.appendChild(c.__saturation_field),c.__selector.appendChild(c.__hue_field),c.__hue_field.appendChild(c.__hue_knob),c.domElement.appendChild(c.__input),c.domElement.appendChild(c.__selector),c.updateDisplay(),c}return inherits(t,e),createClass(t,[{key:"updateDisplay",value:function(){var e=interpret(this.getValue());if(!1!==e){var t=!1;Common.each(Color.COMPONENTS,function(o){if(!Common.isUndefined(e[o])&&!Common.isUndefined(this.__color.__state[o])&&e[o]!==this.__color.__state[o])return t=!0,{}},this),t&&Common.extend(this.__color.__state,e);}Common.extend(this.__temp.__state,this.__color.__state),this.__temp.a=1;var o=.5>this.__color.v||.5<this.__color.s?255:0,n=255-o;Common.extend(this.__field_knob.style,{marginLeft:100*this.__color.s-7+"px",marginTop:100*(1-this.__color.v)-7+"px",backgroundColor:this.__temp.toHexString(),border:this.__field_knob_border+"rgb("+o+","+o+","+o+")"}),this.__hue_knob.style.marginTop=100*(1-this.__color.h/360)+"px",this.__temp.s=1,this.__temp.v=1,linearGradient(this.__saturation_field,"left","#fff",this.__temp.toHexString()),this.__input.value=this.__color.toString(),Common.extend(this.__input.style,{backgroundColor:this.__color.toHexString(),color:"rgb("+o+","+o+","+o+")",textShadow:this.__input_textShadow+"rgba("+n+","+n+","+n+",.7)"});}}]),t}(Controller),vendors=["-moz-","-o-","-webkit-","-ms-",""];function linearGradient(e,t,o,n){e.style.background="",Common.each(vendors,function(a){e.style.cssText+="background: "+a+"linear-gradient("+t+", "+o+" 0%, "+n+" 100%); ";});}function hueGradient(e){e.style.background="",e.style.cssText+="background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);",e.style.cssText+="background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);",e.style.cssText+="background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);",e.style.cssText+="background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);",e.style.cssText+="background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);";}var css={load:function(e,t){var o=t||document,n=o.createElement("link");n.type="text/css",n.rel="stylesheet",n.href=e,o.getElementsByTagName("head")[0].appendChild(n);},inject:function(e,t){var o=t||document,n=document.createElement("style");n.type="text/css",n.innerHTML=e;var a=o.getElementsByTagName("head")[0];try{a.appendChild(n);}catch(t){}}},saveDialogContents="<div id=\"dg-save\" class=\"dg dialogue\">\n\n  Here's the new load parameter for your <code>GUI</code>'s constructor:\n\n  <textarea id=\"dg-new-constructor\"></textarea>\n\n  <div id=\"dg-save-locally\">\n\n    <input id=\"dg-local-storage\" type=\"checkbox\"/> Automatically save\n    values to <code>localStorage</code> on exit.\n\n    <div id=\"dg-local-explain\">The values saved to <code>localStorage</code> will\n      override those passed to <code>dat.GUI</code>'s constructor. This makes it\n      easier to work incrementally, but <code>localStorage</code> is fragile,\n      and your friends may not see the same values you do.\n\n    </div>\n\n  </div>\n\n</div>",ControllerFactory=function(e,t){var o=e[t];return Common.isArray(arguments[2])||Common.isObject(arguments[2])?new OptionController(e,t,arguments[2]):Common.isNumber(o)?Common.isNumber(arguments[2])&&Common.isNumber(arguments[3])?Common.isNumber(arguments[4])?new NumberControllerSlider(e,t,arguments[2],arguments[3],arguments[4]):new NumberControllerSlider(e,t,arguments[2],arguments[3]):Common.isNumber(arguments[4])?new NumberControllerBox(e,t,{min:arguments[2],max:arguments[3],step:arguments[4]}):new NumberControllerBox(e,t,{min:arguments[2],max:arguments[3]}):Common.isString(o)?new StringController(e,t):Common.isFunction(o)?new FunctionController(e,t,""):Common.isBoolean(o)?new BooleanController(e,t):null};function requestAnimationFrame$1(e){setTimeout(e,1e3/60);}var requestAnimationFrame$1$1=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||requestAnimationFrame$1,CenteredDiv=function(){function e(){classCallCheck(this,e),this.backgroundElement=document.createElement("div"),Common.extend(this.backgroundElement.style,{backgroundColor:"rgba(0,0,0,0.8)",top:0,left:0,display:"none",zIndex:"1000",opacity:0,WebkitTransition:"opacity 0.2s linear",transition:"opacity 0.2s linear"}),dom.makeFullscreen(this.backgroundElement),this.backgroundElement.style.position="fixed",this.domElement=document.createElement("div"),Common.extend(this.domElement.style,{position:"fixed",display:"none",zIndex:"1001",opacity:0,WebkitTransition:"-webkit-transform 0.2s ease-out, opacity 0.2s linear",transition:"transform 0.2s ease-out, opacity 0.2s linear"}),document.body.appendChild(this.backgroundElement),document.body.appendChild(this.domElement);var t=this;dom.bind(this.backgroundElement,"click",function(){t.hide();});}return createClass(e,[{key:"show",value:function(){var e=this;this.backgroundElement.style.display="block",this.domElement.style.display="block",this.domElement.style.opacity=0,this.domElement.style.webkitTransform="scale(1.1)",this.layout(),Common.defer(function(){e.backgroundElement.style.opacity=1,e.domElement.style.opacity=1,e.domElement.style.webkitTransform="scale(1)";});}},{key:"hide",value:function e(){var t=this,e=function e(){t.domElement.style.display="none",t.backgroundElement.style.display="none",dom.unbind(t.domElement,"webkitTransitionEnd",e),dom.unbind(t.domElement,"transitionend",e),dom.unbind(t.domElement,"oTransitionEnd",e);};dom.bind(this.domElement,"webkitTransitionEnd",e),dom.bind(this.domElement,"transitionend",e),dom.bind(this.domElement,"oTransitionEnd",e),this.backgroundElement.style.opacity=0,this.domElement.style.opacity=0,this.domElement.style.webkitTransform="scale(1.1)";}},{key:"layout",value:function(){this.domElement.style.left=window.innerWidth/2-dom.getWidth(this.domElement)/2+"px",this.domElement.style.top=window.innerHeight/2-dom.getHeight(this.domElement)/2+"px";}}]),e}(),styleSheet=___$insertStyle(".dg ul{list-style:none;margin:0;padding:0;width:100%;clear:both}.dg.ac{position:fixed;top:0;left:0;right:0;height:0;z-index:0}.dg:not(.ac) .main{overflow:hidden}.dg.main{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear}.dg.main.taller-than-window{overflow-y:auto}.dg.main.taller-than-window .close-button{opacity:1;margin-top:-1px;border-top:1px solid #2c2c2c}.dg.main ul.closed .close-button{opacity:1 !important}.dg.main:hover .close-button,.dg.main .close-button.drag{opacity:1}.dg.main .close-button{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear;border:0;line-height:19px;height:20px;cursor:pointer;text-align:center;background-color:#000}.dg.main .close-button.close-top{position:relative}.dg.main .close-button.close-bottom{position:absolute}.dg.main .close-button:hover{background-color:#111}.dg.a{float:right;margin-right:15px;overflow-y:visible}.dg.a.has-save>ul.close-top{margin-top:0}.dg.a.has-save>ul.close-bottom{margin-top:27px}.dg.a.has-save>ul.closed{margin-top:0}.dg.a .save-row{top:0;z-index:1002}.dg.a .save-row.close-top{position:relative}.dg.a .save-row.close-bottom{position:fixed}.dg li{-webkit-transition:height .1s ease-out;-o-transition:height .1s ease-out;-moz-transition:height .1s ease-out;transition:height .1s ease-out;-webkit-transition:overflow .1s linear;-o-transition:overflow .1s linear;-moz-transition:overflow .1s linear;transition:overflow .1s linear}.dg li:not(.folder){cursor:auto;height:27px;line-height:27px;padding:0 4px 0 5px}.dg li.folder{padding:0;border-left:4px solid rgba(0,0,0,0)}.dg li.title{cursor:pointer;margin-left:-4px}.dg .closed li:not(.title),.dg .closed ul li,.dg .closed ul li>*{height:0;overflow:hidden;border:0}.dg .cr{clear:both;padding-left:3px;height:27px;overflow:hidden}.dg .property-name{cursor:default;float:left;clear:left;width:40%;overflow:hidden;text-overflow:ellipsis}.dg .c{float:left;width:60%;position:relative}.dg .c input[type=text]{border:0;margin-top:4px;padding:3px;width:100%;float:right}.dg .has-slider input[type=text]{width:30%;margin-left:0}.dg .slider{float:left;width:66%;margin-left:-5px;margin-right:0;height:19px;margin-top:4px}.dg .slider-fg{height:100%}.dg .c input[type=checkbox]{margin-top:7px}.dg .c select{margin-top:5px}.dg .cr.function,.dg .cr.function .property-name,.dg .cr.function *,.dg .cr.boolean,.dg .cr.boolean *{cursor:pointer}.dg .cr.color{overflow:visible}.dg .selector{display:none;position:absolute;margin-left:-9px;margin-top:23px;z-index:10}.dg .c:hover .selector,.dg .selector.drag{display:block}.dg li.save-row{padding:0}.dg li.save-row .button{display:inline-block;padding:0px 6px}.dg.dialogue{background-color:#222;width:460px;padding:15px;font-size:13px;line-height:15px}#dg-new-constructor{padding:10px;color:#222;font-family:Monaco, monospace;font-size:10px;border:0;resize:none;box-shadow:inset 1px 1px 1px #888;word-wrap:break-word;margin:12px 0;display:block;width:440px;overflow-y:scroll;height:100px;position:relative}#dg-local-explain{display:none;font-size:11px;line-height:17px;border-radius:3px;background-color:#333;padding:8px;margin-top:10px}#dg-local-explain code{font-size:10px}#dat-gui-save-locally{display:none}.dg{color:#eee;font:11px 'Lucida Grande', sans-serif;text-shadow:0 -1px 0 #111}.dg.main::-webkit-scrollbar{width:5px;background:#1a1a1a}.dg.main::-webkit-scrollbar-corner{height:0;display:none}.dg.main::-webkit-scrollbar-thumb{border-radius:5px;background:#676767}.dg li:not(.folder){background:#1a1a1a;border-bottom:1px solid #2c2c2c}.dg li.save-row{line-height:25px;background:#dad5cb;border:0}.dg li.save-row select{margin-left:5px;width:108px}.dg li.save-row .button{margin-left:5px;margin-top:1px;border-radius:2px;font-size:9px;line-height:7px;padding:4px 4px 5px 4px;background:#c5bdad;color:#fff;text-shadow:0 1px 0 #b0a58f;box-shadow:0 -1px 0 #b0a58f;cursor:pointer}.dg li.save-row .button.gears{background:#c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;height:7px;width:8px}.dg li.save-row .button:hover{background-color:#bab19e;box-shadow:0 -1px 0 #b0a58f}.dg li.folder{border-bottom:0}.dg li.title{padding-left:16px;background:#000 url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.2)}.dg .closed li.title{background-image:url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==)}.dg .cr.boolean{border-left:3px solid #806787}.dg .cr.color{border-left:3px solid}.dg .cr.function{border-left:3px solid #e61d5f}.dg .cr.number{border-left:3px solid #2FA1D6}.dg .cr.number input[type=text]{color:#2FA1D6}.dg .cr.string{border-left:3px solid #1ed36f}.dg .cr.string input[type=text]{color:#1ed36f}.dg .cr.function:hover,.dg .cr.boolean:hover{background:#111}.dg .c input[type=text]{background:#303030;outline:none}.dg .c input[type=text]:hover{background:#3c3c3c}.dg .c input[type=text]:focus{background:#494949;color:#fff}.dg .c .slider{background:#303030;cursor:ew-resize}.dg .c .slider-fg{background:#2FA1D6;max-width:100%}.dg .c .slider:hover{background:#3c3c3c}.dg .c .slider:hover .slider-fg{background:#44abda}\n");css.inject(styleSheet);var CSS_NAMESPACE="dg",HIDE_KEY_CODE=72,CLOSE_BUTTON_HEIGHT=20,DEFAULT_DEFAULT_PRESET_NAME="Default",SUPPORTS_LOCAL_STORAGE=function(){try{return !!window.localStorage}catch(t){return !1}}(),SAVE_DIALOGUE=void 0,autoPlaceVirgin=!0,autoPlaceContainer=void 0,hide=!1,hideableGuis=[],GUI=function e(t){var o=this,n=t||{};this.domElement=document.createElement("div"),this.__ul=document.createElement("ul"),this.domElement.appendChild(this.__ul),dom.addClass(this.domElement,CSS_NAMESPACE),this.__folders={},this.__controllers=[],this.__rememberedObjects=[],this.__rememberedObjectIndecesToControllers=[],this.__listening=[],n=Common.defaults(n,{closeOnTop:!1,autoPlace:!0,width:e.DEFAULT_WIDTH}),n=Common.defaults(n,{resizable:n.autoPlace,hideable:n.autoPlace}),Common.isUndefined(n.load)?n.load={preset:DEFAULT_DEFAULT_PRESET_NAME}:n.preset&&(n.load.preset=n.preset),Common.isUndefined(n.parent)&&n.hideable&&hideableGuis.push(this),n.resizable=Common.isUndefined(n.parent)&&n.resizable,n.autoPlace&&Common.isUndefined(n.scrollable)&&(n.scrollable=!0);var a=SUPPORTS_LOCAL_STORAGE&&"true"===localStorage.getItem(getLocalStorageHash(this,"isLocal")),l=void 0,i=void 0;if(Object.defineProperties(this,{parent:{get:function(){return n.parent}},scrollable:{get:function(){return n.scrollable}},autoPlace:{get:function(){return n.autoPlace}},closeOnTop:{get:function(){return n.closeOnTop}},preset:{get:function(){return o.parent?o.getRoot().preset:n.load.preset},set:function(e){o.parent?o.getRoot().preset=e:n.load.preset=e,setPresetSelectIndex(this),o.revert();}},width:{get:function(){return n.width},set:function(e){n.width=e,setWidth(o,e);}},name:{get:function(){return n.name},set:function(e){n.name=e,i&&(i.innerHTML=n.name);}},closed:{get:function(){return n.closed},set:function(t){n.closed=t,n.closed?dom.addClass(o.__ul,e.CLASS_CLOSED):dom.removeClass(o.__ul,e.CLASS_CLOSED),this.onResize(),o.__closeButton&&(o.__closeButton.innerHTML=t?e.TEXT_OPEN:e.TEXT_CLOSED);}},load:{get:function(){return n.load}},useLocalStorage:{get:function(){return a},set:function(e){SUPPORTS_LOCAL_STORAGE&&(a=e,e?dom.bind(window,"unload",l):dom.unbind(window,"unload",l),localStorage.setItem(getLocalStorageHash(o,"isLocal"),e));}}}),Common.isUndefined(n.parent)){if(this.closed=n.closed||!1,dom.addClass(this.domElement,e.CLASS_MAIN),dom.makeSelectable(this.domElement,!1),SUPPORTS_LOCAL_STORAGE&&a){o.useLocalStorage=!0;var r=localStorage.getItem(getLocalStorageHash(this,"gui"));r&&(n.load=JSON.parse(r));}this.__closeButton=document.createElement("div"),this.__closeButton.innerHTML=e.TEXT_CLOSED,dom.addClass(this.__closeButton,e.CLASS_CLOSE_BUTTON),n.closeOnTop?(dom.addClass(this.__closeButton,e.CLASS_CLOSE_TOP),this.domElement.insertBefore(this.__closeButton,this.domElement.childNodes[0])):(dom.addClass(this.__closeButton,e.CLASS_CLOSE_BOTTOM),this.domElement.appendChild(this.__closeButton)),dom.bind(this.__closeButton,"click",function(){o.closed=!o.closed;});}else {void 0===n.closed&&(n.closed=!0);var d=document.createTextNode(n.name);dom.addClass(d,"controller-name"),i=addRow(o,d);var s=function(t){return t.preventDefault(),o.closed=!o.closed,!1};dom.addClass(this.__ul,e.CLASS_CLOSED),dom.addClass(i,"title"),dom.bind(i,"click",s),n.closed||(this.closed=!1);}n.autoPlace&&(Common.isUndefined(n.parent)&&(autoPlaceVirgin&&(autoPlaceContainer=document.createElement("div"),dom.addClass(autoPlaceContainer,CSS_NAMESPACE),dom.addClass(autoPlaceContainer,e.CLASS_AUTO_PLACE_CONTAINER),document.body.appendChild(autoPlaceContainer),autoPlaceVirgin=!1),autoPlaceContainer.appendChild(this.domElement),dom.addClass(this.domElement,e.CLASS_AUTO_PLACE)),!this.parent&&setWidth(o,n.width)),this.__resizeHandler=function(){o.onResizeDebounced();},dom.bind(window,"resize",this.__resizeHandler),dom.bind(this.__ul,"webkitTransitionEnd",this.__resizeHandler),dom.bind(this.__ul,"transitionend",this.__resizeHandler),dom.bind(this.__ul,"oTransitionEnd",this.__resizeHandler),this.onResize(),n.resizable&&addResizeHandle(this),l=function(){SUPPORTS_LOCAL_STORAGE&&"true"===localStorage.getItem(getLocalStorageHash(o,"isLocal"))&&localStorage.setItem(getLocalStorageHash(o,"gui"),JSON.stringify(o.getSaveObject()));},this.saveToLocalStorageIfPossible=l,n.parent||function(){var e=o.getRoot();e.width+=1,Common.defer(function(){e.width-=1;});}();};GUI.toggleHide=function(){hide=!hide,Common.each(hideableGuis,function(e){e.domElement.style.display=hide?"none":"";});},GUI.CLASS_AUTO_PLACE="a",GUI.CLASS_AUTO_PLACE_CONTAINER="ac",GUI.CLASS_MAIN="main",GUI.CLASS_CONTROLLER_ROW="cr",GUI.CLASS_TOO_TALL="taller-than-window",GUI.CLASS_CLOSED="closed",GUI.CLASS_CLOSE_BUTTON="close-button",GUI.CLASS_CLOSE_TOP="close-top",GUI.CLASS_CLOSE_BOTTOM="close-bottom",GUI.CLASS_DRAG="drag",GUI.DEFAULT_WIDTH=245,GUI.TEXT_CLOSED="Close Controls",GUI.TEXT_OPEN="Open Controls",GUI._keydownHandler=function(t){"text"!==document.activeElement.type&&(t.which===HIDE_KEY_CODE||t.keyCode===HIDE_KEY_CODE)&&GUI.toggleHide();},dom.bind(window,"keydown",GUI._keydownHandler,!1),Common.extend(GUI.prototype,{add:function(e,t){return _add(this,e,t,{factoryArgs:Array.prototype.slice.call(arguments,2)})},addColor:function(e,t){return _add(this,e,t,{color:!0})},remove:function(e){this.__ul.removeChild(e.__li),this.__controllers.splice(this.__controllers.indexOf(e),1);var t=this;Common.defer(function(){t.onResize();});},destroy:function(){if(this.parent)throw new Error("Only the root GUI should be removed with .destroy(). For subfolders, use gui.removeFolder(folder) instead.");this.autoPlace&&autoPlaceContainer.removeChild(this.domElement);var e=this;Common.each(this.__folders,function(t){e.removeFolder(t);}),dom.unbind(window,"keydown",GUI._keydownHandler,!1),removeListeners(this);},addFolder:function(e){if(void 0!==this.__folders[e])throw new Error("You already have a folder in this GUI by the name \""+e+"\"");var t={name:e,parent:this};t.autoPlace=this.autoPlace,this.load&&this.load.folders&&this.load.folders[e]&&(t.closed=this.load.folders[e].closed,t.load=this.load.folders[e]);var o=new GUI(t);this.__folders[e]=o;var n=addRow(this,o.domElement);return dom.addClass(n,"folder"),o},removeFolder:function(e){this.__ul.removeChild(e.domElement.parentElement),delete this.__folders[e.name],this.load&&this.load.folders&&this.load.folders[e.name]&&delete this.load.folders[e.name],removeListeners(e);var t=this;Common.each(e.__folders,function(t){e.removeFolder(t);}),Common.defer(function(){t.onResize();});},open:function(){this.closed=!1;},close:function(){this.closed=!0;},hide:function(){this.domElement.style.display="none";},show:function(){this.domElement.style.display="";},onResize:function(){var e=this.getRoot();if(e.scrollable){var t=dom.getOffset(e.__ul).top,o=0;Common.each(e.__ul.childNodes,function(t){e.autoPlace&&t===e.__save_row||(o+=dom.getHeight(t));}),window.innerHeight-t-CLOSE_BUTTON_HEIGHT<o?(dom.addClass(e.domElement,GUI.CLASS_TOO_TALL),e.__ul.style.height=window.innerHeight-t-CLOSE_BUTTON_HEIGHT+"px"):(dom.removeClass(e.domElement,GUI.CLASS_TOO_TALL),e.__ul.style.height="auto");}e.__resize_handle&&Common.defer(function(){e.__resize_handle.style.height=e.__ul.offsetHeight+"px";}),e.__closeButton&&(e.__closeButton.style.width=e.width+"px");},onResizeDebounced:Common.debounce(function(){this.onResize();},50),remember:function(){if(Common.isUndefined(SAVE_DIALOGUE)&&(SAVE_DIALOGUE=new CenteredDiv,SAVE_DIALOGUE.domElement.innerHTML=saveDialogContents),this.parent)throw new Error("You can only call remember on a top level GUI.");var e=this;Common.each(Array.prototype.slice.call(arguments),function(t){0===e.__rememberedObjects.length&&addSaveMenu(e),-1===e.__rememberedObjects.indexOf(t)&&e.__rememberedObjects.push(t);}),this.autoPlace&&setWidth(this,this.width);},getRoot:function(){for(var e=this;e.parent;)e=e.parent;return e},getSaveObject:function(){var e=this.load;return e.closed=this.closed,0<this.__rememberedObjects.length&&(e.preset=this.preset,!e.remembered&&(e.remembered={}),e.remembered[this.preset]=getCurrentPreset(this)),e.folders={},Common.each(this.__folders,function(t,o){e.folders[o]=t.getSaveObject();}),e},save:function(){this.load.remembered||(this.load.remembered={}),this.load.remembered[this.preset]=getCurrentPreset(this),markPresetModified(this,!1),this.saveToLocalStorageIfPossible();},saveAs:function(e){this.load.remembered||(this.load.remembered={},this.load.remembered[DEFAULT_DEFAULT_PRESET_NAME]=getCurrentPreset(this,!0)),this.load.remembered[e]=getCurrentPreset(this),this.preset=e,addPresetOption(this,e,!0),this.saveToLocalStorageIfPossible();},revert:function(e){Common.each(this.__controllers,function(t){this.getRoot().load.remembered?recallSavedValue(e||this.getRoot(),t):t.setValue(t.initialValue),t.__onFinishChange&&t.__onFinishChange.call(t,t.getValue());},this),Common.each(this.__folders,function(e){e.revert(e);}),e||markPresetModified(this.getRoot(),!1);},listen:function(e){var t=0===this.__listening.length;this.__listening.push(e),t&&updateDisplays(this.__listening);},updateDisplay:function(){Common.each(this.__controllers,function(e){e.updateDisplay();}),Common.each(this.__folders,function(e){e.updateDisplay();});}});function addRow(e,t,o){var n=document.createElement("li");return t&&n.appendChild(t),o?e.__ul.insertBefore(n,o):e.__ul.appendChild(n),e.onResize(),n}function removeListeners(e){dom.unbind(window,"resize",e.__resizeHandler),e.saveToLocalStorageIfPossible&&dom.unbind(window,"unload",e.saveToLocalStorageIfPossible);}function markPresetModified(e,t){var o=e.__preset_select[e.__preset_select.selectedIndex];o.innerHTML=t?o.value+"*":o.value;}function augmentController(e,t,o){if(o.__li=t,o.__gui=e,Common.extend(o,{options:function(t){if(1<arguments.length){var n=o.__li.nextElementSibling;return o.remove(),_add(e,o.object,o.property,{before:n,factoryArgs:[Common.toArray(arguments)]})}if(Common.isArray(t)||Common.isObject(t)){var a=o.__li.nextElementSibling;return o.remove(),_add(e,o.object,o.property,{before:a,factoryArgs:[t]})}},name:function(e){return o.__li.firstElementChild.firstElementChild.innerHTML=e,o},listen:function(){return o.__gui.listen(o),o},remove:function(){return o.__gui.remove(o),o}}),o instanceof NumberControllerSlider){var n=new NumberControllerBox(o.object,o.property,{min:o.__min,max:o.__max,step:o.__step});Common.each(["updateDisplay","onChange","onFinishChange","step","min","max"],function(e){var t=o[e],a=n[e];o[e]=n[e]=function(){var e=Array.prototype.slice.call(arguments);return a.apply(n,e),t.apply(o,e)};}),dom.addClass(t,"has-slider"),o.domElement.insertBefore(n.domElement,o.domElement.firstElementChild);}else if(o instanceof NumberControllerBox){var a=function(t){if(Common.isNumber(o.__min)&&Common.isNumber(o.__max)){var n=o.__li.firstElementChild.firstElementChild.innerHTML,a=-1<o.__gui.__listening.indexOf(o);o.remove();var l=_add(e,o.object,o.property,{before:o.__li.nextElementSibling,factoryArgs:[o.__min,o.__max,o.__step]});return l.name(n),a&&l.listen(),l}return t};o.min=Common.compose(a,o.min),o.max=Common.compose(a,o.max);}else o instanceof BooleanController?(dom.bind(t,"click",function(){dom.fakeEvent(o.__checkbox,"click");}),dom.bind(o.__checkbox,"click",function(t){t.stopPropagation();})):o instanceof FunctionController?(dom.bind(t,"click",function(){dom.fakeEvent(o.__button,"click");}),dom.bind(t,"mouseover",function(){dom.addClass(o.__button,"hover");}),dom.bind(t,"mouseout",function(){dom.removeClass(o.__button,"hover");})):o instanceof ColorController&&(dom.addClass(t,"color"),o.updateDisplay=Common.compose(function(e){return t.style.borderLeftColor=o.__color.toString(),e},o.updateDisplay),o.updateDisplay());o.setValue=Common.compose(function(t){return e.getRoot().__preset_select&&o.isModified()&&markPresetModified(e.getRoot(),!0),t},o.setValue);}function recallSavedValue(e,t){var o=e.getRoot(),n=o.__rememberedObjects.indexOf(t.object);if(-1!==n){var a=o.__rememberedObjectIndecesToControllers[n];if(void 0===a&&(a={},o.__rememberedObjectIndecesToControllers[n]=a),a[t.property]=t,o.load&&o.load.remembered){var l=o.load.remembered,i=void 0;if(l[e.preset])i=l[e.preset];else if(l[DEFAULT_DEFAULT_PRESET_NAME])i=l[DEFAULT_DEFAULT_PRESET_NAME];else return;if(i[n]&&void 0!==i[n][t.property]){var r=i[n][t.property];t.initialValue=r,t.setValue(r);}}}}function _add(e,t,o,n){if(void 0===t[o])throw new Error("Object \""+t+"\" has no property \""+o+"\"");var a;if(n.color)a=new ColorController(t,o);else {var l=[t,o].concat(n.factoryArgs);a=ControllerFactory.apply(e,l);}n.before instanceof Controller&&(n.before=n.before.__li),recallSavedValue(e,a),dom.addClass(a.domElement,"c");var i=document.createElement("span");dom.addClass(i,"property-name"),i.innerHTML=a.property;var r=document.createElement("div");r.appendChild(i),r.appendChild(a.domElement);var d=addRow(e,r,n.before);return dom.addClass(d,GUI.CLASS_CONTROLLER_ROW),a instanceof ColorController?dom.addClass(d,"color"):dom.addClass(d,_typeof(a.getValue())),augmentController(e,d,a),e.__controllers.push(a),a}function getLocalStorageHash(e,t){return document.location.href+"."+t}function addPresetOption(e,t,o){var n=document.createElement("option");n.innerHTML=t,n.value=t,e.__preset_select.appendChild(n),o&&(e.__preset_select.selectedIndex=e.__preset_select.length-1);}function showHideExplain(e,t){t.style.display=e.useLocalStorage?"block":"none";}function addSaveMenu(e){var t=e.__save_row=document.createElement("li");dom.addClass(e.domElement,"has-save"),e.__ul.insertBefore(t,e.__ul.firstChild),dom.addClass(t,"save-row");var o=document.createElement("span");o.innerHTML="&nbsp;",dom.addClass(o,"button gears");var n=document.createElement("span");n.innerHTML="Save",dom.addClass(n,"button"),dom.addClass(n,"save");var a=document.createElement("span");a.innerHTML="New",dom.addClass(a,"button"),dom.addClass(a,"save-as");var l=document.createElement("span");l.innerHTML="Revert",dom.addClass(l,"button"),dom.addClass(l,"revert");var i=e.__preset_select=document.createElement("select");if(e.load&&e.load.remembered?Common.each(e.load.remembered,function(t,o){addPresetOption(e,o,o===e.preset);}):addPresetOption(e,DEFAULT_DEFAULT_PRESET_NAME,!1),dom.bind(i,"change",function(){for(var t=0;t<e.__preset_select.length;t++)e.__preset_select[t].innerHTML=e.__preset_select[t].value;e.preset=this.value;}),t.appendChild(i),t.appendChild(o),t.appendChild(n),t.appendChild(a),t.appendChild(l),SUPPORTS_LOCAL_STORAGE){var r=document.getElementById("dg-local-explain"),d=document.getElementById("dg-local-storage"),s=document.getElementById("dg-save-locally");s.style.display="block","true"===localStorage.getItem(getLocalStorageHash(e,"isLocal"))&&d.setAttribute("checked","checked"),showHideExplain(e,r),dom.bind(d,"change",function(){e.useLocalStorage=!e.useLocalStorage,showHideExplain(e,r);});}var _=document.getElementById("dg-new-constructor");dom.bind(_,"keydown",function(t){t.metaKey&&(67===t.which||67===t.keyCode)&&SAVE_DIALOGUE.hide();}),dom.bind(o,"click",function(){_.innerHTML=JSON.stringify(e.getSaveObject(),void 0,2),SAVE_DIALOGUE.show(),_.focus(),_.select();}),dom.bind(n,"click",function(){e.save();}),dom.bind(a,"click",function(){var t=prompt("Enter a new preset name.");t&&e.saveAs(t);}),dom.bind(l,"click",function(){e.revert();});}function addResizeHandle(t){function o(o){return o.preventDefault(),t.width+=l-o.clientX,t.onResize(),l=o.clientX,!1}function n(){dom.removeClass(t.__closeButton,GUI.CLASS_DRAG),dom.unbind(window,"mousemove",o),dom.unbind(window,"mouseup",n);}function a(a){return a.preventDefault(),l=a.clientX,dom.addClass(t.__closeButton,GUI.CLASS_DRAG),dom.bind(window,"mousemove",o),dom.bind(window,"mouseup",n),!1}var l;t.__resize_handle=document.createElement("div"),Common.extend(t.__resize_handle.style,{width:"6px",marginLeft:"-3px",height:"200px",cursor:"ew-resize",position:"absolute"}),dom.bind(t.__resize_handle,"mousedown",a),dom.bind(t.__closeButton,"mousedown",a),t.domElement.insertBefore(t.__resize_handle,t.domElement.firstElementChild);}function setWidth(e,t){e.domElement.style.width=t+"px",e.__save_row&&e.autoPlace&&(e.__save_row.style.width=t+"px"),e.__closeButton&&(e.__closeButton.style.width=t+"px");}function getCurrentPreset(e,t){var o={};return Common.each(e.__rememberedObjects,function(n,a){var l={},i=e.__rememberedObjectIndecesToControllers[a];Common.each(i,function(e,o){l[o]=t?e.initialValue:e.getValue();}),o[a]=l;}),o}function setPresetSelectIndex(e){for(var t=0;t<e.__preset_select.length;t++)e.__preset_select[t].value===e.preset&&(e.__preset_select.selectedIndex=t);}function updateDisplays(e){0!==e.length&&requestAnimationFrame$1$1.call(window,function(){updateDisplays(e);}),Common.each(e,function(e){e.updateDisplay();});}var GUI$1=GUI;

	const fs$1 = /*glsl*/`#version 300 es
    precision mediump float;
    out vec4 fragColor;
    uniform vec2 resolution;
    uniform vec2 mouse;
    uniform float time;
    #define glf gl_FragCoord
	#define PI 3.14159265
	#define _b 1.6
	uniform float hue;
	uniform float alpha;
	uniform float sep;

	vec2 b(float t, vec2 v){
	   return abs(fract(t*v)-.5)*2.;
	}

	float ff(float n, float n2, float n3, float amp){
 		return ((sin(n)+1.)*(sin(n2)*(sin(n3))+1.)+log(((sin(PI+n)+1.)*(sin(PI+n2)+1.))+1.))*amp; 
	}

	vec3 rgb(float a){
		return sin(a+vec3(.5,1.5,3)*sep)*.5+.5;
	}

	void main(){
	    vec2 uv = glf.xy/resolution.xy;
	    
	    float a = 10.;
	    float amp = 0.5;
	    float d = .2;
	    
	    float t = 3.+time*0.001;

	    float n = a*(t+distance(uv, _b*b(t,vec2(3.1,1.7))));
	    float n2 = a*(t+distance(uv, _b*b(t,vec2(2.4,3.15))));
	    float n3 = a*(t+distance(uv, _b*b(t,vec2(1.45,2.65))));
	    
	    float f = ff(n, n2, n3, amp);
	    float f2 = ff(n+d, n2+d, n3+d, amp);
	    
	    n = a*(t+distance(uv, b(t,vec2(1.5,3.7))));
	    n2 = a*(t+distance(uv, b(t,vec2(3.4,1.15))));
	    n3 = a*(t+distance(uv, b(t,vec2(2.45,1.65))));
	    
	    f += ff(n, n2, n3, amp);
	    f2 += ff(n+d, n2+d, n3+d, amp);
	    
	    float v = (f2-f)/d;
	    vec3 c = (1.-vec3(v))*rgb(hue);
	    float fade = min(.2, max(alpha, .01))*5.;
	    float alpha = smoothstep(clamp(v*fade, -2., 0.), .6, alpha*.6);
	    fragColor = vec4(c, alpha);
	}

`;

	const gui$3 = {
	    name: 'wave',
	    // open: true,
	    switch: true,
	    updateFrame: true,
	    fields:[
	        {
	            hue: [3.77, 0, 5, .01],
	            onChange : (v)=>{prog$3.uniforms.hue = v;}
	        },
	        {
	            sep: [1, 0, 2, .01],
	            onChange : (v)=>{prog$3.uniforms.sep = v;}
	        },
	        {
	            alpha: [.08, 0, 1, .01],
	            onChange : (v)=>{prog$3.uniforms.alpha = v;}
	        }
	    ]
	};

	const prog$3 = {
		fs: fs$1,
		gui: gui$3,
		uniforms: {
			hue: 3.77,
			alpha: .08,
			sep: 1 
		}
	};

	const fs = /*glsl*/`#version 300 es
    precision mediump float;
    out vec4 fragColor;
    uniform vec2 resolution;
    uniform vec2 vmouse;
    uniform float alpha;
    uniform float time;
    uniform float tscale;
    uniform float amp;
    uniform float dir;
    uniform bool w2;

    vec2 ball(float t){
        return vec2(sin(t*1.2)*cos(5.+t*.82), cos(6.+t*.9));
    }

    vec2 pw(float i, vec2 uv, vec2 d, float t, float a){
        t *= 4.;
        i = (1.+i)*22.;
        d += ball(.1*t+i)*1.;
        a = mix(a, sin(i)*.3+.5,.5)*2.;
        float dx = d.x*cos(dot(d,uv)*a+t);
        float dy = d.y*cos(dot(d,uv)*a+t);
        return vec2(dx, dy);
    }

    vec2 _pw(float i, vec2 uv, vec2 d, float t, float a){
        t *= .4;
        a*=1.5;
        i = (1.+i)*5000.;
        d += ball(i*9.+t*.0)*.6;
        float m =  mix(.1, 1., sin(i)*.5+.5);
        t *= 5.+a*.4;
        a = mix(a*.1, a*1.5, sin(i)*.5+.5);
        float dx = m*d.x*cos(length(d)*a+t+a);
        float dy = m*d.y*cos(length(d)*a+t+a);
        return vec2(dx, dy);
    }

    vec3 wave(vec2 uv, vec2 d, float t, float a){
        vec2 p = pw(0., uv, d, t, a) +
        pw(1., uv, d, t, a) +
        pw(2., uv, d, t, a) +
        pw(3., uv, d, t, a);
        return normalize(cross(vec3(1, 0, p.x), vec3(0, 1, p.y)));
    }

    vec3 wave2(vec2 uv, vec2 d, float t, float a){
        vec2 p = _pw(0., uv, d, t, a) +
        _pw(1., uv, d, t, a) +
        _pw(2., uv, d, t, a) +
        _pw(3., uv, d, t, a);
        return normalize(cross(vec3(1, 0, p.x), vec3(0, 1, p.y)));
    }

    vec3 light(vec2 uv, float t, float a){
    	vec3 c1 = vec3(0,.6,1);
    	vec3 c2 = vec3(0,.0,1);
    	vec3 c3 = vec3(.6,.0,1);
        vec3 l1 = normalize(vec3(vmouse*2.-1., 1));
        vec3 l2 = normalize(vec3(-1., -1.5, 2.5));
        vec3 w = w2 ? wave2(uv, uv, t, a) : wave(uv, uv, t, a);
        float ld = clamp(dot(l1, w),0.,1.);
        float ld2 = clamp(dot(l2, w),0.,1.);
        float lf = clamp(pow(.5-dot(l2, w),5.),0.,1.);
        float ls = clamp(pow(dot(l1, w),90.),0.,1.);
        float ls2 = clamp(pow(dot(l2, w),55.),0.,1.);
        vec3 l = .2*c3+c1*.6*ld + c2*.2*ld2+ c1*.7*ls +.4*ls2*c3 +lf*c1*.2;
        // return pow(l,vec3(1.5))*1.5;
        return l;
    }

    vec3 _light(vec2 uv, float t, float a){
        vec3 w = wave(uv, uv, t, a);
        vec3 lv = normalize(vec3(vmouse*2.-1., 1));
        float ld = clamp(dot(lv, w),0.,1.);
        float ls = clamp(pow(dot(lv, w),90.),0.,1.);
        float l = .2 + .5*ld + .5*ls;
        return vec3(l)*vec3(0,.6,1);
    }

    void main(){
        vec2 uv = (2.*gl_FragCoord.xy-resolution)/resolution;
        vec3 l = light(uv, time*dir*.1*tscale, amp);
        fragColor = vec4(l, smoothstep( dot(l.xyz,vec3(.4)), 0., alpha) );
    }
`;

	const gui$2 = {
	    name: 'waveb',
	    // open: true,
	    switch: true,
	    updateFrame: true,
	    fields: [
	        {
	            lightx: [.2,0,1,.1],
	            onChange: v => {prog$2.uniforms.vmouse[0] = v;}
	        },
	        {
	            lighty: [.5,0,1,.1],
	            onChange: v => {prog$2.uniforms.vmouse[1] = v;}
	        },
	        {
	            scale: [3.7, 1, 10, .01],
	            onChange: v => {prog$2.uniforms.amp = v;}
	        }, 
	        {
	            time: [.18,.1, 1,.01],
	            onChange: v => {prog$2.uniforms.tscale = v;}
	        },
	        {
	            dir: [1,0,1,1],
	            onChange: v => {prog$2.uniforms.dir = v ? -1: 1;}
	        },
	        {
	            patt: [1, 0, 1, 1],
	            onChange: v => {prog$2.uniforms.w2 = v;}
	        },
	        {
	            alpha: [.64,0,1,.01],
	            onChange: v => {prog$2.uniforms.alpha = 1.-v;}
	        }
	    ]
	};

	const prog$2 = {
		fs: fs,
	    uniforms: {
	        vmouse: [.2,.5],
	        amp: 3.7,
	        w2 : true,
	        tscale: .18,
	        alpha: .36,
	        dir: -1
	    },
	    gui: gui$2
	};

	//https://github.com/cjhoward/platonic-solids

	var snubcube = `# Blender v2.93.1 OBJ File: ''
# www.blender.org
mtllib snubcube1.mtl
o snub_cubeFusionCopy
v 0.784198 0.282835 -0.436931
v 0.517531 -0.250499 -0.703598
v 0.250865 0.549502 -0.703598
v -0.282469 -0.517165 -0.703598
v -0.549135 0.282835 -0.703598
v 0.517531 0.816168 -0.170264
v -0.815802 -0.250498 -0.436932
v -0.549135 -0.783832 -0.170265
v 0.784198 -0.517166 -0.170264
v 0.517531 -0.783832 0.363068
v 0.250864 -0.783832 -0.436932
v -0.015802 -0.650499 -0.570265
v -0.282469 0.816168 -0.436931
v 0.784198 0.549501 0.363069
v 0.250865 -0.517166 0.896402
v 0.517531 0.282835 0.896402
v -0.282469 0.549501 0.896402
v -0.549135 -0.250499 0.896402
v -0.549136 0.816168 0.363069
v -0.815802 0.549501 -0.170264
v 0.250864 0.816168 0.629736
v -0.282469 -0.783832 0.629735
v 0.784198 -0.250499 0.629736
v -0.815802 -0.517166 0.363068
v -0.815802 0.282834 0.629736
vn 0.5770 0.5528 -0.6013
vn 0.5071 0.1690 -0.8452
vn 0.5132 0.1892 -0.8371
vn -0.0000 0.0000 -1.0000
vn 0.5774 0.5774 -0.5774
vn -0.5770 -0.5528 -0.6013
vn -0.5071 -0.1690 -0.8452
vn -0.5132 -0.1892 -0.8371
vn -0.5774 -0.5774 -0.5774
vn 0.5071 -0.8452 -0.1690
vn -0.1146 -0.6825 -0.7218
vn 0.0771 -0.8758 -0.4764
vn 0.1690 -0.5071 -0.8452
vn -0.1690 -0.8452 -0.5071
vn 0.0211 -0.9978 0.0634
vn -0.3897 0.4284 -0.8152
vn -0.1462 0.5378 -0.8303
vn -0.1892 0.5132 -0.8371
vn 0.8215 0.5543 -0.1336
vn 0.8452 0.5071 -0.1690
vn 0.5543 0.8215 0.1336
vn 0.1690 0.8452 -0.5071
vn 0.0000 -0.0000 1.0000
vn -0.5543 0.8215 -0.1336
vn -0.5071 0.8452 -0.1690
vn -0.8215 0.5543 0.1336
vn -0.1690 0.8452 0.5071
vn 0.1690 -0.8452 0.5071
vn 0.5774 -0.5774 0.5773
vn -0.5071 -0.8452 0.1690
vn -0.0000 1.0000 0.0000
vn -0.8452 -0.5071 -0.1690
vn -0.8452 0.1690 -0.5071
vn -0.5774 0.5774 -0.5774
vn -1.0000 -0.0000 -0.0000
vn -0.8452 -0.1690 0.5071
vn -0.1690 -0.5071 0.8452
vn -0.5774 -0.5774 0.5773
vn -0.5071 0.1690 0.8452
vn -0.5774 0.5774 0.5774
vn 0.1690 0.5071 0.8452
vn 0.5774 0.5774 0.5774
vn 0.5071 -0.1690 0.8452
vn -0.8452 0.5071 0.1690
vn 0.6013 -0.5528 -0.5770
vn 0.8452 -0.1690 -0.5071
vn 0.8371 -0.1892 -0.5132
vn 0.5774 -0.5774 -0.5774
vn 0.8452 -0.5071 0.1690
vn 0.8452 0.1690 0.5071
vn 0.5071 0.8452 0.1690
vn 1.0000 0.0000 0.0000
vn 0.0000 -1.0000 -0.0000
usemtl None
s 1
f 1//1 2//2 3//3
f 3//4 2//4 4//4 5//4
f 6//5 1//1 3//3
f 7//6 5//7 4//8
f 8//9 7//6 4//8
f 9//10 10//10 11//10
f 11//11 12//12 4//13 2//13
f 4//14 12//12 11//11 8//15
f 13//16 3//17 5//18
f 14//19 1//20 6//21
f 6//22 3//17 13//16
f 15//23 16//23 17//23 18//23
f 19//24 13//25 20//26
f 19//27 17//27 21//27
f 10//28 15//28 22//28
f 15//29 10//29 23//29
f 8//30 22//30 24//30
f 13//31 19//31 21//31 6//31
f 8//32 24//32 7//32
f 5//33 7//33 20//33
f 20//34 13//16 5//18
f 24//35 25//35 20//35 7//35
f 24//36 18//36 25//36
f 15//37 18//37 22//37
f 18//38 24//38 22//38
f 17//39 25//39 18//39
f 19//40 25//40 17//40
f 16//41 21//41 17//41
f 14//42 21//42 16//42
f 16//43 15//43 23//43
f 20//26 25//44 19//24
f 2//45 1//46 9//47
f 9//47 11//48 2//45
f 9//49 23//49 10//49
f 14//50 16//50 23//50
f 6//21 21//51 14//19
f 14//52 23//52 9//52 1//52
f 11//11 10//53 22//53 8//15
`;

	var smallstellateddodecahedron = `# Blender v2.93.1 OBJ File: ''
# www.blender.org
mtllib small_stellated_octahedron.mtl
o Small_stellated_dodecahedron
v 0.236068 0.618034 0.000000
v 1.000000 0.618034 0.000000
v 0.381966 0.381966 -0.381966
v 0.236068 -0.618034 0.000000
v 1.000000 -0.618034 0.000000
v 0.381966 -0.381966 0.381966
v -0.236068 -0.618034 0.000000
v -1.000000 -0.618034 0.000000
v -0.381966 -0.381966 -0.381966
v -0.236068 0.618034 0.000000
v -1.000000 0.618034 0.000000
v -0.381966 0.381966 0.381966
v 0.000000 0.236068 -0.618034
v 0.000000 1.000000 -0.618034
v 0.000000 -0.236068 0.618034
v 0.000000 -1.000000 0.618034
v 0.000000 -0.236068 -0.618034
v 0.000000 -1.000000 -0.618034
v 0.000000 0.236068 0.618034
v 0.000000 1.000000 0.618034
v 0.618034 0.000000 -0.236068
v 0.618034 0.000000 -1.000000
v 0.618034 0.000000 0.236068
v 0.618034 0.000000 1.000000
v -0.618034 0.000000 -0.236068
v -0.618034 0.000000 -1.000000
v -0.618034 0.000000 0.236068
v -0.618034 0.000000 1.000000
v 0.381966 0.381966 0.381966
v 0.381966 -0.381966 -0.381966
v -0.381966 -0.381966 0.381966
v -0.381966 0.381966 -0.381966
vn 0.0000 0.8507 -0.5257
vn 0.0000 -0.8507 0.5257
vn 0.0000 -0.8507 -0.5257
vn 0.0000 0.8507 0.5257
vn 0.5257 0.0000 -0.8507
vn 0.5257 0.0000 0.8507
vn -0.5257 0.0000 -0.8507
vn -0.5257 0.0000 0.8507
vn 0.8507 0.5257 0.0000
vn 0.8507 -0.5257 0.0000
vn -0.8507 -0.5257 0.0000
vn -0.8507 0.5257 0.0000
usemtl None
s off
f 1//1 2//1 3//1
f 4//2 5//2 6//2
f 7//3 8//3 9//3
f 10//4 11//4 12//4
f 13//5 14//5 3//5
f 15//6 16//6 6//6
f 17//7 18//7 9//7
f 19//8 20//8 12//8
f 21//9 22//9 3//9
f 23//10 24//10 6//10
f 25//11 26//11 9//11
f 27//12 28//12 12//12
f 29//4 2//4 1//4
f 30//3 5//3 4//3
f 31//2 8//2 7//2
f 32//1 11//1 10//1
f 32//7 14//7 13//7
f 31//8 16//8 15//8
f 30//5 18//5 17//5
f 29//6 20//6 19//6
f 30//10 22//10 21//10
f 29//9 24//9 23//9
f 32//12 26//12 25//12
f 31//11 28//11 27//11
f 23//6 2//6 29//6
f 21//5 5//5 30//5
f 27//8 8//8 31//8
f 25//7 11//7 32//7
f 10//1 20//1 1//1
f 7//2 18//2 4//2
f 4//3 16//3 7//3
f 1//4 14//4 10//4
f 17//5 26//5 13//5
f 19//6 28//6 15//6
f 13//7 22//7 17//7
f 15//8 24//8 19//8
f 23//9 5//9 21//9
f 21//10 2//10 23//10
f 27//11 11//11 25//11
f 25//12 8//12 27//12
f 19//4 24//4 29//4
f 17//3 22//3 30//3
f 15//2 28//2 31//2
f 13//1 26//1 32//1
f 3//9 14//9 1//9
f 6//10 16//10 4//10
f 9//11 18//11 7//11
f 12//12 20//12 10//12
f 3//1 22//1 13//1
f 6//2 24//2 15//2
f 9//3 26//3 17//3
f 12//4 28//4 19//4
f 3//5 2//5 21//5
f 6//6 5//6 23//6
f 9//7 8//7 25//7
f 12//8 11//8 27//8
f 1//9 20//9 29//9
f 4//10 18//10 30//10
f 7//11 16//11 31//11
f 10//12 14//12 32//12
`;

	var pentakisdodecahedron = `# Blender v2.93.1 OBJ File: ''
# www.blender.org
mtllib pentakis_dodecahedron.mtl
o Pentakis_dodecahedron
v -0.631013 0.631013 0.631013
v 0.000000 0.905686 0.559745
v -0.389987 1.021000 0.000000
v -0.559745 0.000000 0.905686
v 0.000000 0.389987 1.021000
v 0.559745 0.000000 -0.905686
v 0.000000 -0.389987 -1.021000
v 0.000000 0.389987 -1.021000
v 0.000000 -0.389987 1.021000
v 0.559745 0.000000 0.905686
v 0.631013 0.631013 -0.631013
v 0.000000 0.905686 -0.559745
v 0.389987 1.021000 0.000000
v 1.021000 0.000000 -0.389987
v 0.905686 0.559745 0.000000
v 0.631013 -0.631013 -0.631013
v 0.000000 -0.905686 -0.559745
v 0.631013 0.631013 0.631013
v -0.559745 0.000000 -0.905686
v -0.631013 0.631013 -0.631013
v -1.021000 0.000000 -0.389987
v 0.389987 -1.021000 0.000000
v 0.905686 -0.559745 0.000000
v -0.631013 -0.631013 -0.631013
v 0.631013 -0.631013 0.631013
v 0.000000 -0.905686 0.559745
v -0.905686 0.559745 0.000000
v 1.021000 0.000000 0.389987
v -1.021000 0.000000 0.389987
v -0.389987 -1.021000 0.000000
v -0.905686 -0.559745 0.000000
v -0.631013 -0.631013 0.631013
vn -0.3265 0.8547 0.4035
vn -0.4035 0.3265 0.8547
vn -0.2018 0.6530 0.7300
vn 0.2018 0.0000 -0.9794
vn 0.2018 0.0000 0.9794
vn -0.2018 0.0000 0.9794
vn 0.2018 0.6530 -0.7300
vn 0.4035 0.3265 -0.8547
vn 0.0000 0.9794 -0.2018
vn 0.0000 0.9794 0.2018
vn 0.3265 0.8547 -0.4035
vn 0.7300 0.2018 -0.6530
vn 0.6530 0.7300 -0.2018
vn 0.8547 0.4035 -0.3265
vn 0.4035 -0.3265 -0.8547
vn 0.2018 -0.6530 -0.7300
vn 0.7300 -0.2018 -0.6530
vn 0.6530 0.7300 0.2018
vn 0.4035 0.3265 0.8547
vn 0.2018 0.6530 0.7300
vn 0.3265 0.8547 0.4035
vn -0.2018 0.0000 -0.9794
vn -0.7300 0.2018 -0.6530
vn -0.3265 0.8547 -0.4035
vn -0.2018 0.6530 -0.7300
vn -0.4035 0.3265 -0.8547
vn 0.3265 -0.8547 -0.4035
vn 0.8547 -0.4035 -0.3265
vn 0.6530 -0.7300 -0.2018
vn -0.4035 -0.3265 -0.8547
vn -0.7300 -0.2018 -0.6530
vn -0.2018 -0.6530 -0.7300
vn 0.4035 -0.3265 0.8547
vn 0.2018 -0.6530 0.7300
vn 0.3265 -0.8547 0.4035
vn 0.6530 -0.7300 0.2018
vn -0.6530 0.7300 0.2018
vn -0.6530 0.7300 -0.2018
vn -0.8547 0.4035 -0.3265
vn 0.8547 0.4035 0.3265
vn 0.7300 0.2018 0.6530
vn 0.7300 -0.2018 0.6530
vn 0.9794 0.2018 0.0000
vn 0.9794 -0.2018 0.0000
vn 0.8547 -0.4035 0.3265
vn -0.9794 0.2018 0.0000
vn -0.8547 0.4035 0.3265
vn -0.7300 0.2018 0.6530
vn 0.0000 -0.9794 -0.2018
vn 0.0000 -0.9794 0.2018
vn -0.3265 -0.8547 -0.4035
vn -0.8547 -0.4035 -0.3265
vn -0.6530 -0.7300 -0.2018
vn -0.9794 -0.2018 0.0000
vn -0.6530 -0.7300 0.2018
vn -0.4035 -0.3265 0.8547
vn -0.8547 -0.4035 0.3265
vn -0.2018 -0.6530 0.7300
vn -0.7300 -0.2018 0.6530
vn -0.3265 -0.8547 0.4035
usemtl None
s off
f 1//1 2//1 3//1
f 1//2 4//2 5//2
f 1//3 5//3 2//3
f 6//4 7//4 8//4
f 9//5 10//5 5//5
f 9//6 5//6 4//6
f 11//7 8//7 12//7
f 11//8 6//8 8//8
f 13//9 12//9 3//9
f 13//10 3//10 2//10
f 13//11 11//11 12//11
f 14//12 6//12 11//12
f 15//13 11//13 13//13
f 15//14 14//14 11//14
f 16//15 7//15 6//15
f 16//16 17//16 7//16
f 16//17 6//17 14//17
f 18//18 15//18 13//18
f 18//19 5//19 10//19
f 18//20 2//20 5//20
f 18//21 13//21 2//21
f 19//22 8//22 7//22
f 20//23 19//23 21//23
f 20//24 3//24 12//24
f 20//25 12//25 8//25
f 20//26 8//26 19//26
f 22//27 17//27 16//27
f 23//28 16//28 14//28
f 23//29 22//29 16//29
f 24//30 19//30 7//30
f 24//31 21//31 19//31
f 24//32 7//32 17//32
f 25//33 10//33 9//33
f 25//34 9//34 26//34
f 25//35 26//35 22//35
f 25//36 22//36 23//36
f 27//37 1//37 3//37
f 27//38 3//38 20//38
f 27//39 20//39 21//39
f 28//40 15//40 18//40
f 28//41 18//41 10//41
f 28//42 10//42 25//42
f 28//43 14//43 15//43
f 28//44 23//44 14//44
f 28//45 25//45 23//45
f 29//46 27//46 21//46
f 29//47 1//47 27//47
f 29//48 4//48 1//48
f 30//49 17//49 22//49
f 30//50 22//50 26//50
f 30//51 24//51 17//51
f 31//52 21//52 24//52
f 31//53 24//53 30//53
f 31//54 29//54 21//54
f 32//55 31//55 30//55
f 32//56 9//56 4//56
f 32//57 29//57 31//57
f 32//58 26//58 9//58
f 32//59 4//59 29//59
f 32//60 30//60 26//60
`;

	var triakistetrahedron = `# Blender v2.93.1 OBJ File: ''
# www.blender.org
mtllib triakis_tetrahedron.mtl
o Triakis_tetrahedron
v 1.105542 1.105542 1.105542
v 0.663325 -0.663325 0.663325
v 1.105542 -1.105542 -1.105542
v 0.663325 0.663325 -0.663325
v -1.105542 1.105542 -1.105542
v -1.105542 -1.105542 1.105542
v -0.663325 -0.663325 -0.663325
v -0.663325 0.663325 0.663325
vn 0.9045 -0.3015 0.3015
vn 0.3015 0.9045 -0.3015
vn 0.9045 0.3015 -0.3015
vn 0.3015 0.3015 -0.9045
vn 0.3015 -0.3015 0.9045
vn 0.3015 -0.9045 0.3015
vn -0.3015 -0.3015 -0.9045
vn -0.3015 -0.9045 -0.3015
vn -0.9045 -0.3015 -0.3015
vn -0.3015 0.9045 0.3015
vn -0.9045 0.3015 0.3015
vn -0.3015 0.3015 0.9045
usemtl None
s off
f 1//1 2//1 3//1
f 4//2 5//2 1//2
f 4//3 1//3 3//3
f 4//4 3//4 5//4
f 6//5 2//5 1//5
f 6//6 3//6 2//6
f 7//7 5//7 3//7
f 7//8 3//8 6//8
f 7//9 6//9 5//9
f 8//10 1//10 5//10
f 8//11 5//11 6//11
f 8//12 6//12 1//12
`;

	var triakisoctahedron = `# Blender v2.93.1 OBJ File: ''
# www.blender.org
mtllib triakis_octahedron.mtl
o Triakis_octahedron
v -0.610396 0.610396 0.610396
v -1.473626 0.000000 0.000000
v 0.000000 0.000000 1.473626
v 0.000000 1.473626 0.000000
v 0.610396 0.610396 0.610396
v 0.000000 -1.473626 0.000000
v 0.000000 0.000000 -1.473626
v 0.610396 -0.610396 -0.610396
v 0.610396 0.610396 -0.610396
v 1.473626 0.000000 0.000000
v -0.610396 0.610396 -0.610396
v 0.610396 -0.610396 0.610396
v -0.610396 -0.610396 -0.610396
v -0.610396 -0.610396 0.610396
vn -0.6786 0.2811 0.6786
vn -0.6786 0.6786 0.2811
vn 0.2811 0.6786 0.6786
vn -0.2811 0.6786 0.6786
vn 0.2811 -0.6786 -0.6786
vn 0.2811 0.6786 -0.6786
vn 0.6786 -0.2811 -0.6786
vn 0.6786 0.2811 0.6786
vn 0.6786 0.2811 -0.6786
vn 0.6786 0.6786 -0.2811
vn 0.6786 -0.6786 -0.2811
vn 0.6786 0.6786 0.2811
vn -0.6786 0.6786 -0.2811
vn -0.2811 0.6786 -0.6786
vn -0.6786 0.2811 -0.6786
vn 0.2811 -0.6786 0.6786
vn 0.6786 -0.6786 0.2811
vn 0.6786 -0.2811 0.6786
vn -0.6786 -0.2811 -0.6786
vn -0.2811 -0.6786 -0.6786
vn -0.6786 -0.6786 -0.2811
vn -0.6786 -0.2811 0.6786
vn -0.6786 -0.6786 0.2811
vn -0.2811 -0.6786 0.6786
usemtl None
s off
f 1//1 2//1 3//1
f 4//2 2//2 1//2
f 4//3 3//3 5//3
f 4//4 1//4 3//4
f 6//5 7//5 8//5
f 9//6 7//6 4//6
f 10//7 8//7 7//7
f 10//8 5//8 3//8
f 10//9 7//9 9//9
f 10//10 9//10 4//10
f 10//11 6//11 8//11
f 10//12 4//12 5//12
f 11//13 2//13 4//13
f 11//14 4//14 7//14
f 11//15 7//15 2//15
f 12//16 3//16 6//16
f 12//17 6//17 10//17
f 12//18 10//18 3//18
f 13//19 2//19 7//19
f 13//20 7//20 6//20
f 13//21 6//21 2//21
f 14//22 3//22 2//22
f 14//23 2//23 6//23
f 14//24 6//24 3//24
`;

	var triakisicosahedron = `# Blender v2.93.1 OBJ File: ''
# www.blender.org
mtllib triakis_icosahedron.mtl
o Triakis_icosahedron
v 0.000000 0.952347 -0.363764
v 0.626986 1.014485 0.000000
v 0.000000 0.626986 -1.014485
v -0.626986 1.014485 0.000000
v 0.000000 0.626986 1.014485
v 0.588583 0.588583 0.588583
v -0.588583 0.588583 0.588583
v 0.000000 0.952347 0.363764
v 0.000000 -0.952347 -0.363764
v 0.000000 -0.626986 -1.014485
v 0.626986 -1.014485 0.000000
v -0.626986 -1.014485 0.000000
v 0.000000 -0.952347 0.363764
v 0.000000 -0.626986 1.014485
v 0.588583 -0.588583 0.588583
v 0.588583 0.588583 -0.588583
v 1.014485 0.000000 -0.626986
v 0.363764 0.000000 -0.952347
v 0.952347 0.363764 0.000000
v 1.014485 0.000000 0.626986
v 0.588583 -0.588583 -0.588583
v -0.363764 0.000000 -0.952347
v -1.014485 0.000000 -0.626986
v 0.952347 -0.363764 0.000000
v -1.014485 0.000000 0.626986
v -0.588583 0.588583 -0.588583
v 0.363764 0.000000 0.952347
v -0.952347 0.363764 0.000000
v -0.588583 -0.588583 -0.588583
v -0.363764 0.000000 0.952347
v -0.952347 -0.363764 0.000000
v -0.588583 -0.588583 0.588583
vn 0.1684 0.8817 -0.4408
vn -0.1684 0.8817 -0.4408
vn 0.0000 0.9857 -0.1684
vn 0.4408 0.7133 0.5449
vn -0.4408 0.7133 0.5449
vn 0.0000 0.9857 0.1684
vn -0.1684 0.8817 0.4408
vn 0.1684 0.8817 0.4408
vn 0.1684 -0.8817 -0.4408
vn 0.0000 -0.9857 -0.1684
vn -0.1684 -0.8817 -0.4408
vn 0.0000 -0.9857 0.1684
vn -0.1684 -0.8817 0.4408
vn 0.1684 -0.8817 0.4408
vn 0.4408 -0.7133 0.5449
vn 0.4408 0.7133 -0.5449
vn 0.7133 0.5449 -0.4408
vn 0.5449 0.4408 -0.7133
vn 0.1684 0.0000 -0.9857
vn 0.4408 0.1684 -0.8817
vn 0.4408 -0.1684 -0.8817
vn 0.8817 0.4408 -0.1684
vn 0.7133 -0.5449 0.4408
vn 0.5449 0.4408 0.7133
vn 0.5449 -0.4408 0.7133
vn 0.7133 0.5449 0.4408
vn 0.8817 0.4408 0.1684
vn 0.9857 0.1684 0.0000
vn 0.4408 -0.7133 -0.5449
vn 0.5449 -0.4408 -0.7133
vn 0.7133 -0.5449 -0.4408
vn -0.4408 0.1684 -0.8817
vn -0.4408 -0.1684 -0.8817
vn -0.1684 0.0000 -0.9857
vn 0.8817 -0.4408 -0.1684
vn 0.9857 -0.1684 0.0000
vn 0.8817 -0.4408 0.1684
vn -0.7133 0.5449 0.4408
vn -0.5449 0.4408 0.7133
vn -0.5449 0.4408 -0.7133
vn -0.4408 0.7133 -0.5449
vn -0.7133 0.5449 -0.4408
vn 0.1684 0.0000 0.9857
vn 0.4408 -0.1684 0.8817
vn 0.4408 0.1684 0.8817
vn -0.8817 0.4408 -0.1684
vn -0.9857 0.1684 0.0000
vn -0.8817 0.4408 0.1684
vn -0.4408 -0.7133 -0.5449
vn -0.5449 -0.4408 -0.7133
vn -0.7133 -0.5449 -0.4408
vn -0.1684 0.0000 0.9857
vn -0.4408 0.1684 0.8817
vn -0.4408 -0.1684 0.8817
vn -0.8817 -0.4408 -0.1684
vn -0.9857 -0.1684 0.0000
vn -0.8817 -0.4408 0.1684
vn -0.4408 -0.7133 0.5449
vn -0.5449 -0.4408 0.7133
vn -0.7133 -0.5449 0.4408
usemtl None
s off
f 1//1 2//1 3//1
f 4//2 1//2 3//2
f 4//3 2//3 1//3
f 5//4 6//4 2//4
f 5//5 4//5 7//5
f 8//6 2//6 4//6
f 8//7 4//7 5//7
f 8//8 5//8 2//8
f 9//9 10//9 11//9
f 12//10 9//10 11//10
f 12//11 10//11 9//11
f 13//12 12//12 11//12
f 14//13 12//13 13//13
f 14//14 13//14 11//14
f 14//15 11//15 15//15
f 16//16 3//16 2//16
f 16//17 2//17 17//17
f 16//18 17//18 3//18
f 18//19 10//19 3//19
f 18//20 3//20 17//20
f 18//21 17//21 10//21
f 19//22 17//22 2//22
f 20//23 15//23 11//23
f 20//24 6//24 5//24
f 20//25 14//25 15//25
f 20//26 2//26 6//26
f 20//27 19//27 2//27
f 20//28 17//28 19//28
f 21//29 11//29 10//29
f 21//30 10//30 17//30
f 21//31 17//31 11//31
f 22//32 23//32 3//32
f 22//33 10//33 23//33
f 22//34 3//34 10//34
f 24//35 11//35 17//35
f 24//36 17//36 20//36
f 24//37 20//37 11//37
f 25//38 7//38 4//38
f 25//39 5//39 7//39
f 26//40 3//40 23//40
f 26//41 4//41 3//41
f 26//42 23//42 4//42
f 27//43 5//43 14//43
f 27//44 14//44 20//44
f 27//45 20//45 5//45
f 28//46 4//46 23//46
f 28//47 23//47 25//47
f 28//48 25//48 4//48
f 29//49 10//49 12//49
f 29//50 23//50 10//50
f 29//51 12//51 23//51
f 30//52 14//52 5//52
f 30//53 5//53 25//53
f 30//54 25//54 14//54
f 31//55 23//55 12//55
f 31//56 25//56 23//56
f 31//57 12//57 25//57
f 32//58 12//58 14//58
f 32//59 14//59 25//59
f 32//60 25//60 12//60
`;

	var greatdodecahedron = `# Blender v2.93.1 OBJ File: ''
# www.blender.org
mtllib great_dodecahedron.mtl
o Great_dodecahedron_(full)
v 0.000000 -0.500094 -0.308994
v 0.000000 0.500094 -0.308994
v 0.308994 0.000000 -0.500094
v -0.500094 0.308994 0.000000
v -0.500094 -0.308994 0.000000
v -0.308994 0.000000 0.500094
v 0.500094 -0.308994 0.000000
v 0.000000 -0.500094 0.308994
v 0.500094 0.308994 0.000000
v 0.000000 0.500094 0.308994
v 0.308994 0.000000 0.500094
v -0.308994 0.000000 -0.500094
vn -0.5260 0.0000 -0.8505
vn -0.5256 0.0000 -0.8507
vn -0.5257 0.0002 -0.8507
vn -0.5258 0.0000 -0.8506
vn -0.5257 -0.0002 -0.8507
vn 0.0000 0.8505 0.5260
vn 0.0000 0.8507 0.5256
vn 0.5256 0.0000 -0.8507
vn 0.5258 0.0002 -0.8506
vn 0.5257 -0.0002 -0.8507
vn -0.8507 0.5256 0.0000
vn -0.8506 0.5258 0.0002
vn -0.8507 0.5257 -0.0002
vn 0.8507 -0.5256 0.0000
vn 0.8505 -0.5260 0.0000
vn 0.8507 0.5257 0.0002
vn 0.8506 0.5258 -0.0002
vn 0.8507 0.5256 0.0000
vn 0.0002 -0.8507 0.5257
vn 0.0000 -0.8506 0.5258
vn -0.0002 -0.8507 0.5257
vn 0.5257 0.0002 -0.8507
vn 0.5258 -0.0002 -0.8506
vn 0.0002 0.8507 0.5257
vn -0.0002 0.8506 0.5258
vn 0.8505 0.5260 0.0000
vn 0.0000 -0.8505 0.5260
vn 0.0000 -0.8507 0.5256
usemtl None
s off
f 1//1 2//1 3//1
f 1//2 4//2 2//2
f 1//2 5//2 4//2
f 6//3 7//3 8//3
f 6//4 9//4 7//4
f 6//5 10//5 9//5
f 4//6 9//6 2//6
f 4//7 11//7 9//7
f 4//7 6//7 11//7
f 7//8 2//8 9//8
f 7//9 12//9 2//9
f 7//10 1//10 12//10
f 2//11 6//11 10//11
f 2//12 5//12 6//12
f 2//13 12//13 5//13
f 11//14 8//14 1//14
f 11//14 1//14 3//14
f 11//15 3//15 9//15
f 10//16 11//16 7//16
f 10//17 7//17 3//17
f 10//18 3//18 2//18
f 10//19 4//19 12//19
f 10//20 12//20 3//20
f 10//21 3//21 9//21
f 5//22 11//22 8//22
f 5//23 10//23 11//23
f 5//8 4//8 10//8
f 12//24 5//24 8//24
f 12//25 8//25 7//25
f 12//7 7//7 3//7
f 12//18 8//18 1//18
f 12//18 6//18 8//18
f 12//26 4//26 6//26
f 5//27 1//27 7//27
f 5//28 7//28 11//28
f 5//28 11//28 6//28
`;

	var rhombicdodecahedron = `# Blender v2.93.1 OBJ File: ''
# www.blender.org
mtllib rhombic_dodecahedron.mtl
o Rhombic_dodecahedron
v -0.254559 0.254559 0.254559
v -0.509117 0.000000 0.000000
v 0.000000 0.000000 0.509117
v 0.000000 0.509117 0.000000
v 0.254559 0.254559 -0.254559
v 0.000000 0.000000 -0.509117
v 0.000000 -0.509117 0.000000
v 0.254559 -0.254559 0.254559
v -0.254559 -0.254559 0.254559
v -0.254559 -0.254559 -0.254559
v -0.254559 0.254559 -0.254559
v 0.509117 0.000000 0.000000
v 0.254559 -0.254559 -0.254559
v 0.254559 0.254559 0.254559
vn -0.7071 -0.7071 0.0000
vn 0.0000 0.7071 0.7071
vn 0.7071 0.7071 0.0000
vn -0.7071 -0.0000 0.7071
vn 0.7071 0.0000 0.7071
vn -0.7071 0.0000 -0.7071
vn 0.0000 -0.7071 -0.7071
vn 0.7071 -0.7071 0.0000
vn 0.7071 0.0000 -0.7071
vn -0.7071 0.7071 0.0000
vn 0.0000 -0.7071 0.7071
vn 0.0000 0.7071 -0.7071
usemtl None
s off
f 9//1 2//1 10//1 7//1
f 4//2 1//2 3//2 14//2
f 12//3 5//3 4//3 14//3
f 1//4 2//4 9//4 3//4
f 3//5 8//5 12//5 14//5
f 10//6 2//6 11//6 6//6
f 10//7 6//7 13//7 7//7
f 12//8 8//8 7//8 13//8
f 6//9 5//9 12//9 13//9
f 2//10 1//10 4//10 11//10
f 7//11 8//11 3//11 9//11
f 4//12 5//12 6//12 11//12
`;

	var stellatedoctahedron = `# Blender v2.93.1 OBJ File: ''
# www.blender.org
mtllib stellated_octahedron.mtl
o stellated_octahedron.stl
v -1.000000 0.000000 0.000001
v -0.000001 0.000002 -1.000000
v -1.000000 -1.000000 -1.000000
v -0.000001 0.000002 -1.000000
v -1.000000 0.000000 0.000001
v -1.000000 1.000000 -0.999996
v -1.000000 1.000000 -0.999996
v -1.000000 0.000000 0.000001
v 0.000000 1.000000 0.000001
v 0.000000 1.000000 0.000001
v -1.000000 0.000000 0.000001
v -1.000000 1.000000 1.000004
v -1.000000 1.000000 1.000004
v -1.000000 0.000000 0.000001
v 0.000001 -0.000001 1.000000
v 0.000001 -0.000001 1.000000
v -1.000000 0.000000 0.000001
v -1.000000 -1.000000 1.000000
v -1.000000 -1.000000 1.000000
v -1.000000 0.000000 0.000001
v 0.000000 -1.000000 -0.000002
v 0.000000 -1.000000 -0.000002
v -1.000000 0.000000 0.000001
v -1.000000 -1.000000 -1.000000
v 0.000000 -1.000000 -0.000002
v -1.000000 -1.000000 -1.000000
v -0.000001 0.000002 -1.000000
v 0.000000 -1.000000 -0.000002
v -0.000001 0.000002 -1.000000
v 1.000000 -1.000000 -1.000004
v 1.000000 -1.000000 -1.000004
v -0.000001 0.000002 -1.000000
v 1.000000 0.000000 -0.000001
v 1.000000 0.000000 -0.000001
v -0.000001 0.000002 -1.000000
v 1.000000 1.000000 -1.000000
v 1.000000 1.000000 -1.000000
v -0.000001 0.000002 -1.000000
v 0.000000 1.000000 0.000001
v 0.000000 1.000000 0.000001
v -0.000001 0.000002 -1.000000
v -1.000000 1.000000 -0.999996
v -1.000000 -1.000000 1.000000
v 0.000000 -1.000000 -0.000002
v 0.000001 -0.000001 1.000000
v 0.000001 -0.000001 1.000000
v 0.000000 -1.000000 -0.000002
v 1.000000 -1.000000 0.999996
v 1.000000 -1.000000 0.999996
v 0.000000 -1.000000 -0.000002
v 1.000000 0.000000 -0.000001
v 1.000000 0.000000 -0.000001
v 0.000000 -1.000000 -0.000002
v 1.000000 -1.000000 -1.000004
v 1.000000 1.000000 -1.000000
v 0.000000 1.000000 0.000001
v 1.000000 0.000000 -0.000001
v 1.000000 0.000000 -0.000001
v 0.000000 1.000000 0.000001
v 1.000000 1.000000 1.000000
v 1.000000 1.000000 1.000000
v 0.000000 1.000000 0.000001
v 0.000001 -0.000001 1.000000
v 0.000001 -0.000001 1.000000
v 0.000000 1.000000 0.000001
v -1.000000 1.000000 1.000004
v 1.000000 1.000000 1.000000
v 0.000001 -0.000001 1.000000
v 1.000000 0.000000 -0.000001
v 1.000000 0.000000 -0.000001
v 0.000001 -0.000001 1.000000
v 1.000000 -1.000000 0.999996
vn -0.5774 0.5774 -0.5773
vn -0.5774 -0.5773 -0.5774
vn -0.5773 0.5773 0.5774
vn -0.5773 -0.5774 0.5774
vn -0.5773 0.5774 0.5774
vn 0.5774 -0.5773 -0.5774
vn 0.5773 0.5774 -0.5774
vn 0.5773 -0.5774 -0.5774
vn 0.5773 -0.5774 0.5773
vn 0.5773 -0.5773 -0.5774
vn 0.5774 -0.5774 0.5773
vn 0.5774 0.5773 0.5774
vn -0.5774 0.5773 0.5774
usemtl DefaultMaterial
s 1
f 1//1 2//1 3//1
f 4//2 5//2 6//2
f 7//3 8//3 9//3
f 10//1 11//1 12//1
f 13//4 14//4 15//4
f 16//5 17//5 18//5
f 19//2 20//2 21//2
f 22//4 23//4 24//4
f 25//6 26//6 27//6
f 28//2 29//2 30//2
f 31//7 32//7 33//7
f 34//8 35//8 36//8
f 37//1 38//1 39//1
f 40//7 41//7 42//7
f 43//9 44//9 45//9
f 46//4 47//4 48//4
f 49//10 50//10 51//10
f 52//11 53//11 54//11
f 55//12 56//12 57//12
f 58//7 59//7 60//7
f 61//13 62//13 63//13
f 64//12 65//12 66//12
f 67//11 68//11 69//11
f 70//12 71//12 72//12
`;

	var cubeoctahedron = `# Blender v2.93.1 OBJ File: ''
# www.blender.org
mtllib cubeoctahedron.mtl
o Cuboctahedron
v -0.494975 0.494975 0.000000
v -0.494975 -0.494975 0.000000
v -0.494975 0.000000 0.494975
v 0.000000 0.494975 0.494975
v 0.000000 0.494975 -0.494975
v 0.000000 -0.494975 0.494975
v 0.000000 -0.494975 -0.494975
v 0.494975 0.000000 -0.494975
v 0.494975 0.494975 0.000000
v -0.494975 0.000000 -0.494975
v 0.494975 -0.494975 0.000000
v 0.494975 0.000000 0.494975
vn -0.5774 0.5774 0.5774
vn 0.0000 0.0000 1.0000
vn 0.0000 0.0000 -1.0000
vn -0.5774 -0.5774 0.5774
vn -1.0000 0.0000 0.0000
vn 1.0000 0.0000 0.0000
vn 0.5774 0.5774 -0.5774
vn -0.5774 -0.5774 -0.5774
vn -0.5774 0.5774 -0.5774
vn 0.0000 1.0000 0.0000
vn 0.5774 -0.5774 -0.5774
vn 0.5774 -0.5774 0.5774
vn 0.5774 0.5774 0.5774
vn 0.0000 -1.0000 0.0000
usemtl None
s off
f 3//1 4//1 1//1
f 4//2 3//2 6//2 12//2
f 8//3 7//3 10//3 5//3
f 6//4 3//4 2//4
f 2//5 3//5 1//5 10//5
f 11//6 8//6 9//6 12//6
f 9//7 8//7 5//7
f 10//8 7//8 2//8
f 10//9 1//9 5//9
f 5//10 1//10 4//10 9//10
f 11//11 7//11 8//11
f 12//12 6//12 11//12
f 12//13 9//13 4//13
f 6//14 2//14 7//14 11//14
`;

	var j27 = `# Blender v2.93.1 OBJ File: ''
# www.blender.org
mtllib johnson_solid_j27.mtl
o J27_triangular_orthobicupola
v 0.000000 0.424264 -0.424264
v 0.424264 0.424264 0.000000
v 0.424264 0.000000 -0.424264
v -0.424264 0.000000 -0.424264
v 0.000000 0.424264 0.424264
v 0.000000 -0.424264 -0.424264
v -0.565685 -0.141421 0.141421
v -0.141421 -0.141421 0.565685
v 0.424264 -0.424264 0.000000
v 0.424264 0.000000 0.424264
v -0.424264 0.424264 0.000000
v -0.141421 -0.565685 0.141421
vn 0.5774 0.5774 -0.5774
vn 0.0000 1.0000 0.0000
vn -0.6667 0.3333 0.6667
vn -0.6667 -0.6667 -0.3333
vn 0.0000 0.0000 -1.0000
vn 0.5774 -0.5774 -0.5774
vn 1.0000 0.0000 0.0000
vn 0.5774 0.5774 0.5774
vn 0.1925 0.1925 0.9623
vn -0.9623 0.1925 -0.1925
vn -0.5774 0.5774 -0.5774
vn -0.5774 -0.5774 0.5774
vn 0.1925 -0.9623 -0.1925
vn 0.3333 -0.6667 0.6667
usemtl None
s off
f 1//1 2//1 3//1
f 5//2 2//2 1//2 11//2
f 8//3 5//3 11//3 7//3
f 7//4 4//4 6//4 12//4
f 1//5 3//5 6//5 4//5
f 9//6 6//6 3//6
f 9//7 3//7 2//7 10//7
f 10//8 2//8 5//8
f 10//9 5//9 8//9
f 11//10 4//10 7//10
f 11//11 1//11 4//11
f 12//12 8//12 7//12
f 12//13 6//13 9//13
f 10//14 8//14 12//14 9//14
`;

	var j34 = `# Blender v2.93.1 OBJ File: ''
# www.blender.org
mtllib johnson_solid_j34.mtl
o J34_pentagonal_orthobirotunda
v -0.154509 0.404509 -0.250000
v 0.154509 0.404509 -0.250000
v -0.250000 0.154509 -0.404509
v 0.000000 0.500000 0.000000
v 0.154509 0.404509 0.250000
v -0.154509 0.404509 0.250000
v 0.000000 0.000000 0.500000
v 0.026393 -0.292705 -0.404509
v 0.430902 -0.042705 -0.250000
v 0.292705 -0.319098 -0.250000
v 0.042705 -0.473607 -0.154509
v 0.042705 -0.473607 0.154509
v -0.223607 -0.447214 0.000000
v 0.000000 0.000000 -0.500000
v 0.250000 0.154509 -0.404509
v 0.404509 0.250000 -0.154509
v 0.430902 -0.042705 0.250000
v 0.404509 0.250000 0.154509
v 0.447214 -0.223607 0.000000
v -0.250000 -0.154509 -0.404509
v -0.500000 0.000000 0.000000
v 0.292705 -0.319098 0.250000
v 0.250000 0.154509 0.404509
v -0.404509 0.250000 -0.154509
v 0.026393 -0.292705 0.404509
v -0.404509 0.250000 0.154509
v -0.250000 0.154509 0.404509
v -0.404509 -0.250000 -0.154509
v -0.250000 -0.154509 0.404509
v -0.404509 -0.250000 0.154509
vn 0.0000 0.9342 -0.3568
vn 0.0000 0.9342 0.3568
vn 0.2582 -0.7746 -0.5774
vn -0.0986 -0.9951 0.0000
vn 0.0000 0.5257 -0.8507
vn -0.8507 0.0000 -0.5257
vn 0.7746 0.2582 -0.5774
vn 0.5774 0.5774 -0.5774
vn 0.9960 0.0898 0.0000
vn 0.8355 -0.4178 -0.3568
vn 0.4702 -0.2351 -0.8507
vn -0.1596 -0.3192 -0.9342
vn -0.3568 0.0000 -0.9342
vn 0.4702 -0.2351 0.8507
vn 0.8355 -0.4178 0.3568
vn 0.5774 0.5774 0.5774
vn 0.7746 0.2582 0.5774
vn -0.8507 -0.0000 0.5257
vn -0.5774 0.5774 -0.5774
vn 0.2582 -0.7746 0.5774
vn 0.0000 0.5257 0.8507
vn 0.5257 0.8507 0.0000
vn -0.9342 0.3568 0.0000
vn -0.5774 0.5774 0.5774
vn -0.3804 -0.7608 0.5257
vn -0.1596 -0.3192 0.9342
vn -0.3568 0.0000 0.9342
vn -0.9342 -0.3568 0.0000
vn -0.7369 -0.6760 0.0000
vn 0.5257 -0.8507 0.0000
vn -0.3804 -0.7608 -0.5257
vn -0.5257 0.8507 -0.0000
usemtl None
s off
f 1//1 4//1 2//1
f 6//2 5//2 4//2
f 8//3 10//3 11//3
f 13//4 11//4 12//4
f 1//5 2//5 15//5 14//5 3//5
f 3//6 20//6 28//6 21//6 24//6
f 16//7 9//7 15//7
f 16//8 15//8 2//8
f 9//9 16//9 18//9 17//9 19//9
f 19//10 10//10 9//10
f 9//11 10//11 8//11 14//11 15//11
f 20//12 14//12 8//12
f 20//13 3//13 14//13
f 22//14 17//14 23//14 7//14 25//14
f 22//15 19//15 17//15
f 23//16 18//16 5//16
f 23//17 17//17 18//17
f 27//18 26//18 21//18 30//18 29//18
f 24//19 1//19 3//19
f 25//20 12//20 22//20
f 5//21 6//21 27//21 7//21 23//21
f 2//22 4//22 5//22 18//22 16//22
f 26//23 24//23 21//23
f 27//24 6//24 26//24
f 13//25 12//25 25//25 29//25 30//25
f 29//26 25//26 7//26
f 29//27 7//27 27//27
f 30//28 21//28 28//28
f 30//29 28//29 13//29
f 12//30 11//30 10//30 19//30 22//30
f 8//31 11//31 13//31 28//31 20//31
f 6//32 4//32 1//32 24//32 26//32
`;

	var j48 = `# Blender v2.93.1 OBJ File: ''
# www.blender.org
mtllib johnson_solid_j48.mtl
o J48_gyroelongated_pentagonal_birotunda
v 0.110027 0.445153 -0.106452
v -0.065602 0.491292 0.065791
v 0.003575 0.379362 0.278694
v -0.131393 0.450631 -0.172243
v 0.049714 0.157595 -0.385146
v -0.237844 0.384840 0.212904
v 0.078115 -0.328875 -0.327625
v 0.056738 -0.091804 -0.404967
v 0.293809 -0.350252 -0.202483
v 0.091326 -0.475394 -0.125142
v 0.091326 -0.475394 0.125142
v -0.124369 -0.454017 0.000000
v 0.259221 0.033338 -0.327625
v 0.405740 -0.126392 -0.202483
v 0.384363 0.110680 -0.125142
v 0.405740 -0.126392 0.202483
v 0.384363 0.110680 0.125142
v -0.168668 0.272910 -0.344485
v 0.418951 -0.272910 0.000000
v -0.145746 -0.216945 -0.327625
v 0.293809 -0.350252 0.202483
v 0.056738 -0.091804 0.404967
v 0.259221 0.033338 0.327625
v -0.344296 0.319050 -0.172243
v -0.447362 0.100668 -0.106452
v 0.078115 -0.328875 0.327625
v -0.410087 0.278389 0.065791
v -0.340910 0.166459 0.278694
v -0.270887 -0.294287 -0.125142
v -0.145746 -0.216945 0.327625
v -0.270887 -0.294287 0.125142
v 0.221957 0.264046 -0.238033
v 0.287747 0.304707 0.000000
v 0.221957 0.264046 0.238033
v -0.163190 0.026013 -0.385146
v -0.163190 0.026013 0.385146
v 0.049714 0.157595 0.385146
v -0.335432 -0.080439 -0.238033
v -0.335432 -0.080439 0.238033
v -0.401223 -0.121100 0.000000
vn 0.0733 0.9795 -0.1876
vn -0.1142 0.8636 0.4911
vn 0.2582 -0.7746 -0.5773
vn -0.0986 -0.9951 0.0000
vn 0.3098 0.0840 -0.9471
vn 0.4885 0.8276 0.2764
vn 0.7746 0.2582 -0.5774
vn -0.6823 0.1040 -0.7236
vn 0.8355 -0.4178 -0.3568
vn 0.4702 -0.2351 -0.8507
vn -0.1596 -0.3192 -0.9342
vn 0.9960 0.0898 0.0000
vn 0.8355 -0.4178 0.3568
vn 0.7746 0.2582 0.5774
vn 0.5257 -0.8507 0.0000
vn -0.4178 0.6760 -0.6071
vn 0.2582 -0.7746 0.5773
vn -0.2351 0.3804 0.8944
vn -0.9089 0.3724 -0.1876
vn -0.7213 0.4884 0.4911
vn -0.5257 0.8507 0.0000
vn -0.1596 -0.3192 0.9342
vn -0.7369 -0.6760 0.0000
vn 0.4702 -0.2351 0.8507
vn 0.4498 0.3855 -0.8056
vn 0.7334 0.3458 -0.5853
vn 0.7576 0.5757 -0.3077
vn 0.8952 0.4457 0.0000
vn 0.6960 0.6507 -0.3035
vn 0.7334 0.3458 0.5853
vn 0.7576 0.5757 0.3077
vn -0.3804 -0.7608 -0.5257
vn -0.0481 0.0778 -0.9958
vn -0.0986 0.1596 -0.9822
vn -0.2137 -0.2396 -0.9471
vn -0.2137 -0.2396 0.9471
vn -0.0481 0.0778 0.9958
vn 0.4498 0.3855 0.8056
vn 0.3925 0.4631 0.7947
vn 0.3098 0.0840 0.9471
vn -0.6372 -0.5013 -0.5853
vn -0.9587 -0.0668 0.2764
vn -0.5460 -0.2299 -0.8056
vn -0.5460 -0.2299 0.8056
vn -0.5897 -0.1440 0.7947
vn -0.6372 -0.5013 0.5853
vn -0.8537 -0.4201 -0.3077
vn -0.7990 -0.6013 0.0000
vn -0.8933 -0.3315 -0.3035
vn -0.3804 -0.7608 0.5257
vn -0.8537 -0.4201 0.3077
vn 0.2121 0.6568 -0.7236
usemtl None
s off
f 4//1 2//1 1//1
f 6//2 3//2 2//2
f 7//3 9//3 10//3
f 12//4 10//4 11//4
f 13//5 8//5 5//5
f 1//6 2//6 3//6 34//6 33//6
f 14//7 13//7 15//7
f 24//8 18//8 35//8 38//8 25//8
f 19//9 9//9 14//9
f 7//10 8//10 13//10 14//10 9//10
f 20//11 8//11 7//11
f 14//12 15//12 17//12 16//12 19//12
f 21//13 19//13 16//13
f 23//14 16//14 17//14
f 11//15 10//15 9//15 19//15 21//15
f 24//16 4//16 18//16
f 26//17 11//17 21//17
f 3//18 6//18 28//18 36//18 37//18
f 27//19 24//19 25//19
f 28//20 6//20 27//20
f 6//21 2//21 4//21 24//21 27//21
f 30//22 26//22 22//22
f 31//23 29//23 12//23
f 21//24 16//24 23//24 22//24 26//24
f 32//25 13//25 5//25
f 32//26 15//26 13//26
f 33//27 15//27 32//27
f 33//28 17//28 15//28
f 33//29 32//29 1//29
f 34//30 23//30 17//30
f 34//31 17//31 33//31
f 7//32 10//32 12//32 29//32 20//32
f 35//33 5//33 8//33
f 35//34 18//34 5//34
f 35//35 8//35 20//35
f 36//36 30//36 22//36
f 37//37 36//37 22//37
f 37//38 23//38 34//38
f 37//39 34//39 3//39
f 37//40 22//40 23//40
f 38//41 20//41 29//41
f 28//42 27//42 25//42 40//42 39//42
f 38//43 35//43 20//43
f 39//44 30//44 36//44
f 39//45 36//45 28//45
f 39//46 31//46 30//46
f 40//47 38//47 29//47
f 40//48 29//48 31//48
f 40//49 25//49 38//49
f 12//50 11//50 26//50 30//50 31//50
f 40//51 31//51 39//51
f 4//52 1//52 32//52 5//52 18//52
`;

	var j72 = `# Blender v2.93.1 OBJ File: ''
# www.blender.org
mtllib johnson_solid_j72.mtl
o J72_gyrate_rhombicosidodecahedron
v 0.192974 0.424198 0.181154
v 0.374128 0.312239 -0.111960
v 0.081015 0.493393 0.000000
v -0.111960 0.474268 0.111960
v -0.111960 0.474268 -0.111960
v -0.405073 0.293114 0.000000
v 0.405073 -0.293114 0.000000
v 0.111960 -0.474268 0.111960
v 0.111960 -0.474268 -0.111960
v -0.111960 -0.474268 -0.111960
v -0.181154 -0.293114 -0.362309
v 0.111960 -0.111960 -0.474268
v 0.181154 -0.293114 -0.362309
v -0.111960 -0.474268 0.111960
v -0.405073 -0.293114 0.000000
v 0.111960 0.111960 -0.474268
v -0.181154 0.293114 -0.362309
v 0.181154 0.293114 -0.362309
v 0.362309 0.181154 -0.293114
v 0.474268 0.111960 -0.111960
v 0.192974 0.424198 -0.181154
v 0.000000 0.405073 -0.293114
v 0.293114 0.000000 -0.405073
v 0.474268 0.111960 0.111960
v 0.362309 -0.181154 -0.293114
v 0.374128 0.312239 0.111960
v 0.181154 0.293114 0.362309
v 0.000000 -0.405073 -0.293114
v -0.111960 0.111960 -0.474268
v 0.474268 -0.111960 -0.111960
v -0.362309 0.181154 -0.293114
v 0.293114 -0.362309 -0.181154
v -0.111960 -0.111960 -0.474268
v 0.474268 -0.111960 0.111960
v 0.293114 0.000000 0.405073
v -0.362309 -0.181154 -0.293114
v 0.293114 -0.362309 0.181154
v 0.181154 -0.293114 0.362309
v 0.111960 0.111960 0.474268
v -0.181154 0.293114 0.362309
v -0.474268 0.111960 -0.111960
v 0.362309 0.181154 0.293114
v -0.293114 0.362309 -0.181154
v 0.000000 0.405073 0.293114
v -0.293114 0.000000 -0.405073
v 0.111960 -0.111960 0.474268
v -0.181154 -0.293114 0.362309
v -0.474268 0.111960 0.111960
v 0.362309 -0.181154 0.293114
v -0.293114 0.362309 0.181154
v 0.000000 -0.405073 0.293114
v -0.111960 0.111960 0.474268
v -0.293114 0.000000 0.405073
v -0.474268 -0.111960 -0.111960
v -0.362309 0.181154 0.293114
v -0.293114 -0.362309 -0.181154
v -0.111960 -0.111960 0.474268
v -0.474268 -0.111960 0.111960
v -0.362309 -0.181154 0.293114
v -0.293114 -0.362309 0.181154
vn -0.0986 0.9951 0.0000
vn -0.5257 -0.8507 0.0000
vn 0.8355 0.4178 -0.3568
vn 0.8944 0.4472 0.0000
vn 0.5854 0.6382 -0.5000
vn 0.0854 0.9472 0.3090
vn -0.5000 0.3090 -0.8090
vn 0.0000 0.5257 0.8507
vn 0.2582 0.7746 -0.5774
vn 0.3568 0.0000 -0.9342
vn 0.3090 -0.8090 -0.5000
vn 0.5000 0.3090 0.8090
vn -0.3090 -0.8090 -0.5000
vn 0.0000 -0.9342 -0.3568
vn -0.5000 -0.3090 -0.8090
vn 0.8507 0.0000 0.5257
vn 0.8090 -0.5000 0.3090
vn 1.0000 0.0000 0.0000
vn 0.5000 0.3090 -0.8090
vn 0.8090 -0.5000 -0.3090
vn 0.5774 -0.5774 -0.5774
vn 0.9342 -0.3568 0.0000
vn 0.5000 -0.3090 -0.8090
vn 0.8507 0.0000 -0.5257
vn 0.0000 0.5257 -0.8507
vn 0.5000 -0.3090 0.8090
vn -0.8090 0.5000 0.3090
vn 0.8355 0.4178 0.3568
vn -0.5774 0.5774 -0.5774
vn -0.3090 0.8090 -0.5000
vn 0.2582 0.7746 0.5774
vn -0.3568 0.0000 -0.9342
vn 0.3090 -0.8090 0.5000
vn 0.3568 0.0000 0.9342
vn -0.9342 0.3568 0.0000
vn 0.5774 -0.5774 0.5774
vn 0.5854 0.6382 0.5000
vn -0.3090 0.8090 0.5000
vn -0.5000 0.3090 0.8090
vn -0.8090 -0.5000 -0.3090
vn -0.8507 0.0000 0.5257
vn 0.0000 -0.9342 0.3568
vn 0.0000 0.0000 1.0000
vn 0.0854 0.9472 -0.3090
vn 0.0000 -0.5257 0.8507
vn -0.8090 -0.5000 0.3090
vn 0.0000 -0.5257 -0.8507
vn -0.8507 0.0000 -0.5257
vn -0.5774 0.5774 0.5774
vn -0.3090 -0.8090 0.5000
vn -0.5774 -0.5774 -0.5774
vn -0.8090 0.5000 -0.3090
vn -0.3568 0.0000 0.9342
vn -0.9342 -0.3568 0.0000
vn -1.0000 0.0000 0.0000
vn -0.5000 -0.3090 0.8090
vn -0.5774 -0.5774 0.5774
vn -0.5257 0.8507 0.0000
vn 0.0000 -1.0000 0.0000
vn 0.5257 0.8507 0.0000
vn 0.5257 -0.8507 0.0000
vn 0.0000 0.0000 -1.0000
usemtl None
s off
f 4//1 3//1 5//1
f 10//2 14//2 60//2 15//2 56//2
f 19//3 2//3 20//3
f 24//4 20//4 2//4 26//4
f 19//5 18//5 21//5 2//5
f 1//6 3//6 4//6 44//6
f 31//7 17//7 29//7 45//7
f 39//8 27//8 44//8 40//8 52//8
f 22//9 21//9 18//9
f 23//10 12//10 16//10
f 28//11 13//11 32//11 9//11
f 39//12 35//12 42//12 27//12
f 28//13 10//13 56//13 11//13
f 28//14 9//14 10//14
f 33//15 11//15 36//15 45//15
f 34//16 24//16 42//16 35//16 49//16
f 37//17 7//17 34//17 49//17
f 30//18 20//18 24//18 34//18
f 16//19 18//19 19//19 23//19
f 30//20 7//20 32//20 25//20
f 32//21 13//21 25//21
f 34//22 7//22 30//22
f 13//23 12//23 23//23 25//23
f 23//24 19//24 20//24 30//24 25//24
f 18//25 16//25 29//25 17//25 22//25
f 46//26 38//26 49//26 35//26
f 50//27 6//27 48//27 55//27
f 42//28 24//28 26//28
f 43//29 17//29 31//29
f 22//30 17//30 43//30 5//30
f 44//31 27//31 1//31
f 45//32 29//32 33//32
f 37//33 38//33 51//33 8//33
f 46//34 35//34 39//34
f 48//35 6//35 41//35
f 49//36 38//36 37//36
f 26//37 1//37 27//37 42//37
f 44//38 4//38 50//38 40//38
f 52//39 40//39 55//39 53//39
f 54//40 36//40 56//40 15//40
f 55//41 48//41 58//41 59//41 53//41
f 51//42 14//42 8//42
f 46//43 39//43 52//43 57//43
f 5//44 3//44 21//44 22//44
f 38//45 46//45 57//45 47//45 51//45
f 59//46 58//46 15//46 60//46
f 12//47 13//47 28//47 11//47 33//47
f 41//48 31//48 45//48 36//48 54//48
f 55//49 40//49 50//49
f 51//50 47//50 60//50 14//50
f 56//51 36//51 11//51
f 41//52 6//52 43//52 31//52
f 57//53 52//53 53//53
f 58//54 54//54 15//54
f 48//55 41//55 54//55 58//55
f 57//56 53//56 59//56 47//56
f 60//57 47//57 59//57
f 4//58 5//58 43//58 6//58 50//58
f 10//59 9//59 8//59 14//59
f 3//60 1//60 26//60 2//60 21//60
f 8//61 9//61 32//61 7//61 37//61
f 16//62 12//62 33//62 29//62
`;

	var j33 = `# Blender v2.93.1 OBJ File: ''
# www.blender.org
mtllib johnson_solid_j33.mtl
o J33_pentagonal_gyrocupolarotunda
v 0.095491 0.250000 -0.154509
v 0.404509 0.250000 0.154509
v 0.404509 0.250000 -0.154509
v 0.095491 0.250000 0.154509
v -0.309017 0.000000 0.000000
v 0.250000 0.154509 -0.404509
v 0.026393 -0.292705 -0.404509
v 0.000000 0.000000 -0.500000
v -0.250000 -0.154509 -0.404509
v -0.404509 -0.250000 -0.154509
v -0.154509 0.095491 -0.250000
v 0.250000 0.154509 0.404509
v 0.000000 0.000000 0.500000
v -0.404509 -0.250000 0.154509
v -0.250000 -0.154509 0.404509
v -0.154509 0.095491 0.250000
v 0.042705 -0.473607 -0.154509
v 0.292705 -0.319098 -0.250000
v 0.042705 -0.473607 0.154509
v -0.223607 -0.447214 0.000000
v 0.292705 -0.319098 0.250000
v 0.430902 -0.042705 0.250000
v 0.026393 -0.292705 0.404509
v 0.447214 -0.223607 0.000000
v 0.430902 -0.042705 -0.250000
vn 0.0000 0.9342 -0.3568
vn -0.5257 0.8507 0.0000
vn -0.1596 -0.3192 -0.9342
vn -0.3090 0.8090 -0.5000
vn -0.5774 0.5774 -0.5774
vn 0.0000 0.9342 0.3568
vn 0.0000 1.0000 0.0000
vn -0.8090 0.5000 -0.3090
vn -0.9342 0.3568 0.0000
vn -0.3090 0.8090 0.5000
vn -0.5774 0.5774 0.5774
vn 0.2582 -0.7746 -0.5774
vn -0.0986 -0.9951 0.0000
vn -0.7369 -0.6760 0.0000
vn -0.3804 -0.7608 -0.5257
vn -0.8090 0.5000 0.3090
vn 0.7746 0.2582 0.5774
vn -0.1596 -0.3192 0.9342
vn 0.2582 -0.7746 0.5774
vn 0.4702 -0.2351 -0.8507
vn -0.3804 -0.7608 0.5257
vn 0.8355 -0.4178 0.3568
vn 0.8355 -0.4178 -0.3568
vn 0.5257 -0.8507 0.0000
vn 0.9960 0.0898 0.0000
vn 0.7746 0.2582 -0.5774
vn 0.4702 -0.2351 0.8507
usemtl None
s off
f 6//1 1//1 3//1
f 4//2 1//2 11//2 5//2 16//2
f 9//3 8//3 7//3
f 6//4 8//4 11//4 1//4
f 11//5 8//5 9//5
f 12//6 2//6 4//6
f 2//7 3//7 1//7 4//7
f 10//8 5//8 11//8 9//8
f 14//9 5//9 10//9
f 12//10 4//10 16//10 13//10
f 16//11 15//11 13//11
f 18//12 17//12 7//12
f 20//13 17//13 19//13
f 20//14 14//14 10//14
f 10//15 9//15 7//15 17//15 20//15
f 14//16 15//16 16//16 5//16
f 22//17 2//17 12//17
f 23//18 13//18 15//18
f 23//19 19//19 21//19
f 7//20 8//20 6//20 25//20 18//20
f 15//21 14//21 20//21 19//21 23//21
f 24//22 22//22 21//22
f 25//23 24//23 18//23
f 19//24 17//24 18//24 24//24 21//24
f 3//25 2//25 22//25 24//25 25//25
f 25//26 6//26 3//26
f 12//27 13//27 23//27 21//27 22//27
`;

	var polyhedra = {
		pentakisdodecahedron,
		triakistetrahedron,
		triakisoctahedron,
		triakisicosahedron,
		greatdodecahedron,
		rhombicdodecahedron,
		stellatedoctahedron,
		smallstellateddodecahedron,
		cubeoctahedron,
		snubcube,
		j27,
		j34,
		j48,
		j72,
		j33
	};

	function loadObj(str, scale){

	    let obj = {
	        vertices: {v:[], vt:[], vn:[]},
	        elements: {
	            p:{v:[], vt:[], vn:[]},
	            l:{v:[], vt:[], vn:[]}, 
	            f:{v:[], vt:[], vn:[]}
	        },
	        indices: {v:[], vt:[], vn:[]}
	    };
	    if (!scale) scale = 1;    
	    let a = str.split('\n');
	    for(let s of a){

	        let arr = s.split(' ').filter(el=> el!='');
	        let c = arr.shift();
	        
	        switch(c){
	            case 'v':
	                arr = arr.map(f=>+f*scale);
	                if(arr.length == 3) arr.push(1);
	                obj.vertices.v.push(arr);
	            break;

	            case 'vt':
	               obj.vertices.vt.push(arr.map(f=>+f));
	            break;

	            case 'vn':
	                obj.vertices.vn.push(arr.map(f=>+f));
	            break;
	            
	            case 'f':
	            case 'l':
	            case 'p':
	                let f = obj.elements[c];
	                let v = [], vt = [], vn = [];
	                for(let e of arr){
	                    let el = e.split('/').filter(el=> el!='');
	                    switch(el.length){
	                        case 1:
	                            v.push(+el[0]-1);
	                        break;
	                        case 2:
	                            v.push(+el[0]-1);
	                            vn.push(+el[1]-1);
	                        break;
	                        case 3:
	                            v.push(+el[0]-1);
	                            vt.push(+el[1]-1);
	                            vn.push(+el[2]-1);
	                        break;
	                    }
	                }
	                if(v.length) f.v.push(v);
	                if(vt.length) f.vt.push(vt);
	                if(vn.length) f.vn.push(vn);
	        }
	        
	        for(let e in obj.elements){
	            for(let i in obj.elements[e]){
	               obj.indices[i].push(...obj.elements[e][i]); 
	           }
	        }
	    }   
	    return obj;
	} 

	function edgeList(elements){
	    let edges = {};
	    function add(a, b){
	        let key = a <= b ? a+' '+b : b+' '+a;
	        edges[key] = a < b ? [a, b] : [b, a];
	    }
	    for(let f of elements){
	        let n = f.length;
	        if(n == 2){
	            add(f[0], f[1]);
	        }else if(n > 2){
	            for(let i = 0; i < n; i++){
	                let a = f[i], b = f[(i+1)%n];
	                add(a, b);
	            }
	        }
	    }
	    return Object.values(edges);
	}

	const {sin: sin$3, cos: cos$3, floor: floor$3, abs: abs$2, sqrt: sqrt$3, PI: PI$3} = Math;

	// row-order matrix v*T(4x4)
	function mat_mul_4(a, b){
	    let mat = [];
	    for(let i = 0; i < a.length; i++){
	        mat.push([
	        a[i][0]*b[0][0] + a[i][1]*b[1][0] + a[i][2]*b[2][0] + a[i][3]*b[3][0],
	        a[i][0]*b[0][1] + a[i][1]*b[1][1] + a[i][2]*b[2][1] + a[i][3]*b[3][1],
	        a[i][0]*b[0][2] + a[i][1]*b[1][2] + a[i][2]*b[2][2] + a[i][3]*b[3][2],
	        a[i][0]*b[0][3] + a[i][1]*b[1][3] + a[i][2]*b[2][3] + a[i][3]*b[3][3]
	        ]);
	    }
	    return mat;
	}

	function mat_mul_4w(a, b){
	    let mat = [];
	    for(let i = 0; i < a.length; i++){
	        let x = a[i][0]*b[0][0] + a[i][1]*b[1][0] + a[i][2]*b[2][0] + a[i][3]*b[3][0];
	        let y = a[i][0]*b[0][1] + a[i][1]*b[1][1] + a[i][2]*b[2][1] + a[i][3]*b[3][1];
	        let z = a[i][0]*b[0][2] + a[i][1]*b[1][2] + a[i][2]*b[2][2] + a[i][3]*b[3][2];
	        let w = a[i][0]*b[0][3] + a[i][1]*b[1][3] + a[i][2]*b[2][3] + a[i][3]*b[3][3];
	        mat.push([x/w, y/w, z/w, w]);
	    }
	    return mat;
	}
	function subv(a, b){
	    return [a[0]-b[0], a[1]-b[1], a[2]-b[2], 1];
	}

	function cross(a, b){
	    return [a[1]*b[2] - a[2]*b[1],
	            a[2]*b[0] - a[0]*b[2],
	            a[0]*b[1] - a[1]*b[0], 1];
	}

	function dot(a,b){
	    return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
	}

	function normalize$1(v){
	    let n = sqrt$3(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
	    return [v[0]/n, v[1]/n, v[2]/n, v[3] || 1];
	}

	function lookAt(from, to, zamt){
	    let z = normalize$1(subv(from, to));
	    let x = normalize$1(cross(z, [0,1,0]));
	    let y = cross(x, z);

	    return [[x[0], x[1], x[2], 0],
	            [y[0], y[1], y[2], 0],
	            [z[0], z[1], z[2], 0],
	            [-dot(x, from), -dot(y, from), -(1-zamt)-dot(z, from)*zamt, 1]];
	}

	function create_rot$1(tx, ty, tz){
	    let rot = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
	    let zrot = [[cos$3(tz), -sin$3(tz), 0, 0],
	                [sin$3(tz), cos$3(tz), 0, 0],
	                [0, 0, 1, 0],
	                [0, 0, 0, 1]];
	    let xrot = [[1, 0, 0, 0],
	                [0, cos$3(tx), -sin$3(tx), 0],
	                [0, sin$3(tx), cos$3(tx), 0],
	                [0, 0, 0, 1]];
	    let yrot = [[cos$3(ty), 0, sin$3(ty), 0],
	                [0, 1, 0, 0],
	                [-sin$3(ty), 0, cos$3(ty), 0],
	                [0, 0, 0, 1]];

	    rot = mat_mul_4(rot, zrot);
	    rot = mat_mul_4(rot, yrot);
	    rot = mat_mul_4(rot, xrot);
	    return rot;
	}

	function create_proj(scale, perspective, plane){
	    return [[scale,0,0,0],[0,scale,0,0],[0,0,scale,-perspective],[0,0,0,plane]];
	}

	function create_canvas_scene(ctx, x, y, models, v_mat, p_mat){
	    let m = models instanceof Array ? models : [models];
	    return {
	        ctx: ctx, x: x, y: y, models: m, v_mat: v_mat, p_mat: p_mat, z_clip: 5 //-.3
	    };
	}

	function create_model(colors, vertices, elements, r_mat, t_mat, v_mat){
	    return {
	        colors: colors, vertices: vertices, elements: elements, r_mat: r_mat, t_mat: t_mat, v_mat: v_mat
	    }
	}

	function line$1(ctx, w, h, ax, ay, bx, by){
	    ctx.beginPath();
	    ctx.moveTo(ax*w*.5 +w*.5, ay*h*.5+h*.5);
	    ctx.lineTo(bx*w*.5 +w*.5, by*h*.5+h*.5);
	    ctx.closePath();
	    ctx.stroke();
	}

	function canvasrender(s, t){
	    // s.ctx.fillRect(0,0,s.x, s.y);

	    for(let m of s.models){
	        // s.ctx.fillStyle = m.colors.bkgd;
	        // s.ctx.strokeStyle = m.colors.stroke;

	        let mat = m.r_mat ? mat_mul_4(m.vertices, m.r_mat) : m.vertices; 
	        mat = m.t_mat ? mat_mul_4(mat, m.t_mat) : mat;  

	        // m.vertices = m.r_mat ? mat_mul_4(m.vertices, m.r_mat) : m.vertices; 
	        // let mat = m.t_mat ? mat_mul_4(m.vertices, m.t_mat) : m.vertices;  
	        if(m.v_mat) mat = mat_mul_4(mat, m.v_mat);
	        if(s.p_mat) mat = mat_mul_4w(mat, s.p_mat);

	        for(let el of m.elements){
	            let n = el.length;
	            if(n == 2){
	                let a = el[0], b = el[1];  
	                if(Math.max(mat[a][2], mat[b][2]) < s.z_clip)  
	                line$1(s.ctx, s.x, s.y, mat[a][0], mat[a][1], mat[b][0], mat[b][1]);

	            }else if(n > 2){
	                for(let i = 0; i < n; i++){
	                    let a = el[i], b = el[(i+1)%n];
	                    line$1(s.ctx, s.x, s.y, mat[a][0], mat[a][1], mat[b][0], mat[b][1]);
	                }
	            }
	        }
	    }
	}

	const {cos: cos$2, sin: sin$2, sqrt: sqrt$2, min: min$1, max: max$1, floor: floor$2, round: round$1, random: random$1, PI: PI$2} = Math;

	var ctx$1, ww$1, wh$1;
	var obj, rot, proj, translate, view, model$1, scene;
	var viewx = 0, viewy = 0;
	var translatez = -.55;
	var rotx = -.2;
	var roty = -.15;
	var rotz = -.12;
	var rr = PI$2;
	var scale = 1.4;
	var idx = 8;
	const atable = [2.5,3,3,2.5,1.2,1,3,2,1.5,2,1.1,1.1,1.1,1.1];

	var _h$1 = .58, _s$1 = 1, _l$1 = .5, _a$1 = 1; 
	var stroke$2 =  hlsaStr$1(_h$1, _s$1, _l$1, _a$1);
	var useStroke$1 = true;

	function setup$1(_ctx, _w, _h){
	    ctx$1 = _ctx;  ww$1 = _w; wh$1 = _h;
	    obj = load(polyhedra, idx);
	    rot = create_rot$1(rotx*rr, roty*rr, rotz*rr);
	    translate = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
	    translate[3][2] = translatez;
	    proj = create_proj(scale,.5,.3);
	    view = lookAt([viewx*1, viewy*1, -1.], [0,0, .1], .0);
	    model$1 = create_model(0, obj.v, obj.i, rot, translate, view);
	    scene = create_canvas_scene(ctx$1, ww$1, wh$1, model$1, null, proj);
	    scene.z_clip = 5;
	}

	function load(set, idx, amp=.5){
	    let _obj = loadObj(Object.values(set)[idx], 1/atable[idx]);
	    let o = {v: _obj.vertices.v, i: _obj.indices.v};
	    o.i = edgeList(o.i);
	    return o;
	}

	function draw$1(){
	    if(useStroke$1) ctx$1.strokeStyle = stroke$2;
	    canvasrender(scene);
	}

	function loop$1(time){
	    if(useStroke$1) ctx$1.strokeStyle = stroke$2;
	    let m = scene.models[0];
	    let rot = create_rot$1(rotx*.04, roty*.04, rotz*.04);
	    m.vertices = mat_mul_4(m.vertices, rot);
	    canvasrender(scene);
	}

	function unloop$1(){

	}

	const gui$1 = {
	    name: 'geom',
	    open: true,
	    switch: true,
	    updateFame: true,
	    fields:[
	        {
	            idx: idx,
	            min: 0,
	            max: Object.values(polyhedra).length-1,
	            step: 1,
	            onChange: (v)=>{
	                obj = load(polyhedra, v);
	                model$1 = create_model(idx, obj.v, obj.i, rot, translate, view);
	                scene.models[0] = model$1;
	            }
	        },
	        {
	            scale: scale,
	            min: .1,
	            max: 1.9,
	            step: .1,
	            onChange: (v)=>{
	                scene.p_mat = create_proj(v,.5,.3);
	            }
	        },
	        {
	            rot_x: rotx,
	            min: -1,
	            max: 1,
	            step: .01,
	            onChange: (v)=>{
	                rotx = v;
	                scene.models[0].r_mat = create_rot$1(rotx*rr, roty*rr, rotz*rr);
	            }
	        },
	        {
	            rot_y: roty,
	            min: -1,
	            max: 1,
	            step: .01,
	            onChange: (v)=>{
	                roty = v;
	                scene.models[0].r_mat = create_rot$1(rotx*rr, roty*rr, rotz*rr);
	            }
	        },
	        {
	            rot_z: rotz,
	            min: -1,
	            max: 1,
	            step: .01,
	            onChange: (v)=>{
	                rotz = v;
	                scene.models[0].r_mat = create_rot$1(rotx*rr, roty*rr, rotz*rr);
	            }
	        },
	        {
	            translate_z: translatez,
	            min:-1,
	            max:1,
	            step:.01,
	            onChange: (v)=>{
	                translatez = v;
	                translate[3][2] = v;
	            }
	        },
	        {
	            zclip: [5, -2, 5, .01],
	            onChange: (v)=>{
	                scene.z_clip = v;
	            }
	        },
	        {
	            reset: ()=>{
	                prog$1.gui.fields[1].ref.setValue(1);
	                prog$1.gui.fields[2].ref.setValue(0);
	                prog$1.gui.fields[3].ref.setValue(0);
	                prog$1.gui.fields[4].ref.setValue(0);
	                prog$1.gui.fields[5].ref.setValue(0);

	            }
	        },
	        {
	            name: 'color',
	            open: false,
	            updateFrame: true,
	            fields: [
	                {
	                    usecolor: useStroke$1,
	                    onChange: (v)=>{ useStroke$1 = v;}
	                },
	                {
	                    h: [_h$1, 0, 1, .01],
	                    onChange: (v)=>{
	                        _h$1 = v; stroke$2 = hlsaStr$1(_h$1, _s$1, _l$1, _a$1);
	                    }
	                },
	                {
	                    s: [_s$1, 0, 1, .01],
	                    onChange: (v)=>{
	                        _s$1 = v; stroke$2 = hlsaStr$1(_h$1, _s$1, _l$1, _a$1);
	                    }
	                },
	                {
	                    l: [_l$1, 0, 1, .01],
	                    onChange: (v)=>{
	                        _l$1 = v; stroke$2 = hlsaStr$1(_h$1, _s$1, _l$1, _a$1);
	                    }
	                },
	                {
	                    a: [_a$1, 0, 1, .01],
	                    onChange: (v)=>{
	                        _a$1 = v; stroke$2 = hlsaStr$1(_h$1, _s$1, _l$1, _a$1);
	                    }
	                }
	            ]
	        }
	    ]
	};

	function hsl2rgb$1(h,s,l) { // https://stackoverflow.com/a/64090995
	   let a=s*Math.min(l,1-l);
	   let f= (n,k=(n+h/30)%12) => l - a*Math.max(Math.min(k-3,9-k,1),-1);
	   return [f(0),f(8),f(4)];
	}
	function hlsaStr$1(h, s, l, a){
	    let v = hsl2rgb$1(h*360, s, l);
	    return `rgba(${v[0]*255}, ${v[1]*255}, ${v[2]*255}, ${a})`;
	}

	const prog$1 = {
	    setup: setup$1,
	    draw: draw$1,
	    loop: loop$1,
	    unloop: unloop$1,
	    gui: gui$1,
	    // on: false
	};

	const {sin: sin$1, cos: cos$1, floor: floor$1, abs: abs$1, sqrt: sqrt$1, PI: PI$1} = Math;

	const defaultrule = {
		axiom: 'X',
		theta: 24,
		delta: 5,
		F:'FF',
		X: 'F-[[X]+X]+F[+FX]-X'
	};

	const turtle = {
		geom: [],
		stack: [],
		delta: 8,
		theta: PI$1*.5,
		pos : [0,0,0,1],
		dir: [0,-1,0,1]
	};

	const routines = {
		'F': (t)=>{
			let a = [t.pos];
			t.pos = addv(t.pos, mults(t.dir, t.delta));
			a.push(t.pos);
			t.geom.push(a);
		},
		'f': (t)=>{
			t.pos = addv(t.pos, mults(t.dir, t.delta));
		},
		'-': (t)=>{
			t.dir = vec_mul$1(t.dir, z_rot(t.theta));
		},
		'+': (t)=>{
			t.dir = vec_mul$1(t.dir, z_rot(-t.theta));
		},
		'&': (t)=>{
			t.dir = vec_mul$1(t.dir, x_rot(t.theta));
		},
		'^': (t)=>{
			t.dir = vec_mul$1(t.dir, x_rot(-t.theta));
		},
		'\\': (t)=>{
			t.dir = vec_mul$1(t.dir, y_rot(t.theta));
		},
		'/': (t)=>{
			t.dir = vec_mul$1(t.dir, y_rot(-t.theta));
		},
		'|': (t)=>{
			t.dir = vec_mul$1(t.dir, z_rot(PI$1));
		},
		'[': (t)=>{
			t.stack.push({pos: t.pos, dir: t.dir});
		},
		']': (t)=>{
			let f = t.stack.pop();
			if(f){ t.pos = f.pos; t.dir = f.dir; }
		}
	};

	function mulberry32(a) {
	    return function() {
	      var t = a += 0x6D2B79F5;
	      t = Math.imul(t ^ t >>> 15, t | 1);
	      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
	      return ((t ^ t >>> 14) >>> 0) / 4294967296;
	    }
	}

	function sequence(rules, n, _rand){
		let str = rules.axiom;
		let rand = _rand ? mulberry32(_rand) : Math.random;
		for(let i = 0; i < n; i++){
			let s = '';
			for(let c of str){
				let term = null;
				if(rules[c] instanceof Array){
					term = rules[c][Math.round(rand()*(rules[c].length-1))];
				}else term = rules[c];
				s +=  (term == undefined)? c : term;	
			}
			str = s;
		}
		return str;
	}

	function build(turtle, rules, n, rand=0){ 
		turtle.pos = [0,0,0,1];
		turtle.dir = [0,-1,0,1];
		turtle.geom = [];
		turtle.stack = [];
		if(n==0) n = rules.n ? rules.n : 3;
		let s = sequence(rules, n, rand);
		if(rules.theta) turtle.theta = rules.theta * (PI$1/180);
		if(rules.delta) turtle.delta = rules.delta;
		for(let c of s)
			if(routines[c]) routines[c](turtle);
	}

	function normalize(v, w, h){
		return [(2.*v[0]-w)/h,
				(2.*v[1]-h)/h,
				(2.*v[2]-h)/h,1];
	}

	function recenter$1(geom, x, y, shift=true){ 
		let cx = 0, cy = 0, cz = 0;
		for(let i = 0; i < geom.length; i++){
			geom[i] = normalize(geom[i], x, y);
			cx += geom[i][0];
			cy += geom[i][1];
			cz += geom[i][2];
		}
		cx /= geom.length;
		cy /= geom.length;
		cz /= geom.length;
		if(!shift){cx = cy = cz = -1;}
		for(let i = 0; i < geom.length; i++){
			geom[i][0] -=cx;
			geom[i][1] -=cy;
			geom[i][2] -=cz;
		}
		return geom;
	}

	function index(geom){ 
		let vertices = [], indices = [];
		let i = 0;
		for(let el of geom){
			vertices.push(...el);
			indices.push([i++,i++]);
		}
		return {v: vertices, i: indices}
	}

	function lsystem(rules, n=3, shift, rand=0, w=400, h=400){
		turtle.geom = [];
		turtle.stack = [];
		build(turtle, rules || defaultrule, n, rand);
		let model = index(turtle.geom);
		recenter$1(model.v, w, h, shift);
		return model;
	}

	function x_rot(tx){
	    return [[1, 0, 0, 0],
	    [0, cos$1(tx), -sin$1(tx), 0],
	    [0, sin$1(tx), cos$1(tx), 0],
	    [0, 0, 0, 1]];	
	}

	function y_rot(ty){
		return [[cos$1(ty), 0, sin$1(ty), 0],
	    [0, 1, 0, 0],
	    [-sin$1(ty), 0, cos$1(ty), 0],
	    [0, 0, 0, 1]];
	}

	function z_rot(tz){
	    return [[cos$1(tz), -sin$1(tz), 0, 0],
	    [sin$1(tz), cos$1(tz), 0, 0],
	    [0, 0, 1, 0],
	    [0, 0, 0, 1]];	
	}

	function vec_mul$1(v, t){
		return [
		    v[0]*t[0][0] + v[1]*t[1][0] + v[2]*t[2][0] + v[3]*t[3][0],
		    v[0]*t[0][1] + v[1]*t[1][1] + v[2]*t[2][1] + v[3]*t[3][1],
		    v[0]*t[0][2] + v[1]*t[1][2] + v[2]*t[2][2] + v[3]*t[3][2],
		    v[0]*t[0][3] + v[1]*t[1][3] + v[2]*t[2][3] + v[3]*t[3][3]
	    ];
	}

	function addv(a, b){
	    return [a[0]+b[0], a[1]+b[1], a[2]+b[2], 1];
	}
	function mults(v, s){
	    return [v[0]*s, v[1]*s, v[2]*s, 1];
	}

	const arr = [
	{
		axiom: 'F',
		theta: 60,
		delta: 4,
		n: 5,
		F: ['FF-[XY]+[XY]', 'FYF-[XY]+[--XY]'],
		X: '+F+--X+Y',
		Y: '-FX'
	},
	{
		theta: 45,
		delta: 10,
		n: 3,
		axiom: '+WF--YF--ZF',
		W: 'YF++ZF----XF[-YF----WF]++',
		X: '+YF--ZF[---WF--XF]+',
		Y: ['-WF++XF[+++YF++ZF]-', '+XF[YFZF]-', 'XX-F'],
		Z: '--YF++++WF[+ZF++++XF]--XF',
		F: 'FF'
	},
	{
		theta: 36,
		delta: 10,
		n: 2,
	    axiom:'+WF--XF---YF--ZF',
	    F: 'FF',
		W: ['YF++ZF----XF[+++]++', 'YF++ZF----XF[-YF----WF]++'],
		X: '+YF--ZF[---WF--XF]+',
		Y: ['-WF++XF[+++YF++ZF]-', '-XY[F++F]'],
		Z: '--YF++++WF[+ZF++++XF]--XF'
	},
	{
		theta: 45,
		delta: 6,
		n: 3,
		axiom: 'F',
		// F: 'F[+FF]F[-FF]F' 
		F: ['F[+FF]F[-FF]F', 'FF[+FF]F[-FFF]', 'F[+FFF]Z[-FF]F', 'F[+FFF]Z[-FF]F'],
		Z: ['', '-', 'F[ZF]-']
	},
	{
		theta: 36,
		delta: 20,
		n: 3,
	    axiom:'+WF--XF---YF--ZF',
	    F: '',
		W: 'YF++ZF----XF[-YF----WF]++',
		X: '+YF--ZF[---WF--XF]+',
		Y: '-WF++XF[+++YF++ZF]-',
		Z: '--YF++++WF[+ZF++++XF]--XF'
	},
	{
		theta: 16,
		delta: 12,
		n: 3,
		axiom: 'FXFXFX',
		F: '',
		X: ['[FX-FY][-FX-FY-FX][ZZ]-FY-FX+FY+FX', '[FX-FY]-FF+FY+FX'],
		Y: 'FY',
		Z: '-FX-FY-FX'
	},
	{
		axiom: 'X',
		theta: 24,
		delta: 5,
		n: 4,
		F:'FF',
		X: 'F-[[X]+X]+F[+FX]-X'
	},
	{
		axiom: 'F',
		theta: 60,
		delta: 5,
		n: 5,
		F: 'FF-[XY]+[XY]',
		X: '+FY',
		Y: '-FX'
	},
	{
		axiom: 'F',
		theta: 30,
		delta: 5,
		n: 5,
		F: 'FF-[FY]+[XY]',
		X: '+F--Y',
		Y: 'Y-Y'
	},
	{	
		axiom: 'X++F',
		theta: 45,
		delta: 7,
		n: 3,
		F: ['+X-F', '-XX+F', '+XF+'],
		X:['-FFXF[X+FF-F+]', '-FF[X+XX]-F']
	},
	{	
		axiom: 'F+F+F+F',
		theta: 90,
		delta: 8,
		n: 2,
		F:'F+F-F-FF+F+F-F'
	},
	{
		axiom: 'F',
		theta: 28,
		delta: 9,
		n: 3,
		F: 'FF+[+F-F-F]-[-F+F+F]'
	},
	{
		theta: 60,
		delta: 10,
		n: 3,
	    axiom:'+WF--XF---YF--ZF',
	    F: 'FF',
		W: ['YF++ZF----XF[+++]++', 'YF++ZF----XF[-YF----WF]++'],
		X: '+YF--ZF[---WF--XF]+',
		Y: ['-WF++XF[+++YF++ZF]-', '-XY[F++F]'],
		Z: '--YF++++WF[+ZF++++XF]--XF'
	}, /*
	{
		theta: 45,
		delta: 18,
		n: 3,
	    axiom:'[N]FF++[N]-P',
		M: ['O[-OF----MF]++', 'OFF+'],
		N: '+OF--PF[---MF--NF]+',
		O: ['-MF++NF[+++OF++PF]-', '-MF++NF[+++OF++PF]-'],
		P: ['--OF++++MF[+PFF++++NF]--NF', '--OF++++MNF[+PF++++NF]--NF'],
	}, */
	{
		theta: 45,
		delta: 14,
		n: 3,
	    axiom:'[N]++[N]++[N]++[N]++[N]',
		M: ['OF++PF----NF[-OF----MF]++', 'OF++PF-NF[-OF----MF]++'],
		N: '+OF--PF[---MF--NF]+',
		O: ['-MF++NF[+++OF++PF]-', 'M+NF-'],
		P: '--OF++++MF[+PF++++NF]--NF',
		F: ['','FF','M']
	},
	];

	/**
	 * @license Quaternion.js v1.4.0 27/03/2022
	 *
	 * Copyright (c) 2022, Robert Eisele (robert@xarg.org)
	 * Licensed under the MIT license.
	 **/

	  /**
	   * Calculates log(sqrt(a^2+b^2)) in a way to avoid overflows
	   *
	   * @param {number} a
	   * @param {number} b
	   * @returns {number}
	   */
	  function logHypot(a, b) {

	    var _a = Math.abs(a);
	    var _b = Math.abs(b);

	    if (a === 0) {
	      return Math.log(_b);
	    }

	    if (b === 0) {
	      return Math.log(_a);
	    }

	    if (_a < 3000 && _b < 3000) {
	      return 0.5 * Math.log(a * a + b * b);
	    }

	    a = a / 2;
	    b = b / 2;

	    return 0.5 * Math.log(a * a + b * b) + Math.LN2;
	  }

	  /*
	   * Default is the multiplicative one element
	   *
	   */
	  var P = {
	    'w': 1,
	    'x': 0,
	    'y': 0,
	    'z': 0
	  };

	  function parse(dest, w, x, y, z) {

	    // Most common internal use case with 4 params
	    if (z !== undefined) {
	      dest['w'] = w;
	      dest['x'] = x;
	      dest['y'] = y;
	      dest['z'] = z;
	      return;
	    }

	    if (typeof w === 'object' && y === undefined) {

	      // Check for quats, for example when an object gets cloned
	      if ('w' in w || 'x' in w || 'y' in w || 'z' in w) {
	        dest['w'] = w['w'] || 0;
	        dest['x'] = w['x'] || 0;
	        dest['y'] = w['y'] || 0;
	        dest['z'] = w['z'] || 0;
	        return;
	      }

	      // Check for complex numbers
	      if ('re' in w && 'im' in w) {
	        dest['w'] = w['re'];
	        dest['x'] = w['im'];
	        dest['y'] = 0;
	        dest['z'] = 0;
	        return;
	      }

	      // Check for array
	      if (w.length === 4) {
	        dest['w'] = w[0];
	        dest['x'] = w[1];
	        dest['y'] = w[2];
	        dest['z'] = w[3];
	        return;
	      }

	      // Check for augmented vector
	      if (w.length === 3) {
	        dest['w'] = 0;
	        dest['x'] = w[0];
	        dest['y'] = w[1];
	        dest['z'] = w[2];
	        return;
	      }

	      throw new Error('Invalid object');
	    }

	    // Parse string values
	    if (typeof w === 'string' && y === undefined) {

	      var tokens = w.match(/\d+\.?\d*e[+-]?\d+|\d+\.?\d*|\.\d+|./g);
	      var plus = 1;
	      var minus = 0;

	      var iMap = { 'i': 'x', 'j': 'y', 'k': 'z' };

	      if (tokens === null) {
	        throw new Error('Parse error');
	      }

	      // Reset the current state
	      dest['w'] =
	        dest['x'] =
	        dest['y'] =
	        dest['z'] = 0;

	      for (var i = 0; i < tokens.length; i++) {

	        var c = tokens[i];
	        var d = tokens[i + 1];

	        if (c === ' ' || c === '\t' || c === '\n') ; else if (c === '+') {
	          plus++;
	        } else if (c === '-') {
	          minus++;
	        } else {

	          if (plus + minus === 0) {
	            throw new Error('Parse error' + c);
	          }
	          var g = iMap[c];

	          // Is the current token an imaginary sign?
	          if (g !== undefined) {

	            // Is the following token a number?
	            if (d !== ' ' && !isNaN(d)) {
	              c = d;
	              i++;
	            } else {
	              c = '1';
	            }

	          } else {

	            if (isNaN(c)) {
	              throw new Error('Parser error');
	            }

	            g = iMap[d];

	            if (g !== undefined) {
	              i++;
	            }
	          }

	          dest[g || 'w'] += parseFloat((minus % 2 ? '-' : '') + c);
	          plus = minus = 0;
	        }
	      }

	      // Still something on the stack
	      if (plus + minus > 0) {
	        throw new Error('Parser error');
	      }
	      return;
	    }

	    // If no single variable was given AND it was the constructor, set it to the identity
	    if (w === undefined && dest !== P) {
	      dest['w'] = 1;
	      dest['x'] =
	      dest['y'] =
	      dest['z'] = 0;
	    } else {

	      dest['w'] = w || 0;

	      // Note: This isn't setFromAxis, it's just syntactic sugar!
	      if (x && x.length === 3) {
	        dest['x'] = x[0];
	        dest['y'] = x[1];
	        dest['z'] = x[2];
	      } else {
	        dest['x'] = x || 0;
	        dest['y'] = y || 0;
	        dest['z'] = z || 0;
	      }
	    }
	  }

	  function numToStr(n, char, prev) {

	    var ret = '';

	    if (n !== 0) {

	      if (prev !== '') {
	        ret += n < 0 ? ' - ' : ' + ';
	      } else if (n < 0) {
	        ret += '-';
	      }

	      n = Math.abs(n);

	      if (1 !== n || char === '') {
	        ret += n;
	      }
	      ret += char;
	    }
	    return ret;
	  }

	  /**
	   * Quaternion constructor
	   *
	   * @constructor
	   * @param {number|Object|string} w real
	   * @param {number=} x imag
	   * @param {number=} y imag
	   * @param {number=} z imag
	   * @returns {Quaternion}
	   */
	  function Quaternion(w, x, y, z) {

	    if (!(this instanceof Quaternion)) {
	      return new Quaternion(w, x, y, z);
	    }

	    parse(this, w, x, y, z);
	  }

	  Quaternion.prototype = {
	    'w': 1,
	    'x': 0,
	    'y': 0,
	    'z': 0,
	    /**
	     * Adds two quaternions Q1 and Q2
	     *
	     * @param {number|Object|string} w real
	     * @param {number=} x imag
	     * @param {number=} y imag
	     * @param {number=} z imag
	     * @returns {Quaternion}
	     */
	    'add': function(w, x, y, z) {

	      parse(P, w, x, y, z);

	      // Q1 + Q2 := [w1, v1] + [w2, v2] = [w1 + w2, v1 + v2]

	      return new Quaternion(
	        this['w'] + P['w'],
	        this['x'] + P['x'],
	        this['y'] + P['y'],
	        this['z'] + P['z']);
	    },
	    /**
	     * Subtracts a quaternions Q2 from Q1
	     *
	     * @param {number|Object|string} w real
	     * @param {number=} x imag
	     * @param {number=} y imag
	     * @param {number=} z imag
	     * @returns {Quaternion}
	     */
	    'sub': function(w, x, y, z) {

	      parse(P, w, x, y, z);

	      // Q1 - Q2 := Q1 + (-Q2)
	      //          = [w1, v1] - [w2, v2] = [w1 - w2, v1 - v2]

	      return new Quaternion(
	        this['w'] - P['w'],
	        this['x'] - P['x'],
	        this['y'] - P['y'],
	        this['z'] - P['z']);
	    },
	    /**
	     * Calculates the additive inverse, or simply it negates the quaternion
	     *
	     * @returns {Quaternion}
	     */
	    'neg': function() {

	      // -Q := [-w, -v]

	      return new Quaternion(-this['w'], -this['x'], -this['y'], -this['z']);
	    },
	    /**
	     * Calculates the length/modulus/magnitude or the norm of a quaternion
	     *
	     * @returns {number}
	     */
	    'norm': function() {

	      // |Q| := sqrt(|Q|^2)

	      // The unit quaternion has |Q| = 1

	      var w = this['w'];
	      var x = this['x'];
	      var y = this['y'];
	      var z = this['z'];

	      return Math.sqrt(w * w + x * x + y * y + z * z);
	    },
	    /**
	     * Calculates the squared length/modulus/magnitude or the norm of a quaternion
	     *
	     * @returns {number}
	     */
	    'normSq': function() {

	      // |Q|^2 := [w, v] * [w, -v]
	      //        = [w^2 + dot(v, v), -w * v + w * v + cross(v, -v)]
	      //        = [w^2 + |v|^2, 0]
	      //        = [w^2 + dot(v, v), 0]
	      //        = dot(Q, Q)
	      //        = Q * Q'

	      var w = this['w'];
	      var x = this['x'];
	      var y = this['y'];
	      var z = this['z'];

	      return w * w + x * x + y * y + z * z;
	    },
	    /**
	     * Normalizes the quaternion to have |Q| = 1 as long as the norm is not zero
	     * Alternative names are the signum, unit or versor
	     *
	     * @returns {Quaternion}
	     */
	    'normalize': function() {

	      // Q* := Q / |Q|

	      // unrolled Q.scale(1 / Q.norm())

	      var w = this['w'];
	      var x = this['x'];
	      var y = this['y'];
	      var z = this['z'];

	      var norm = Math.sqrt(w * w + x * x + y * y + z * z);

	      if (norm < Quaternion['EPSILON']) {
	        return Quaternion['ZERO'];
	      }

	      norm = 1 / norm;

	      return new Quaternion(w * norm, x * norm, y * norm, z * norm);
	    },
	    /**
	     * Calculates the Hamilton product of two quaternions
	     * Leaving out the imaginary part results in just scaling the quat
	     *
	     * @param {number|Object|string} w real
	     * @param {number=} x imag
	     * @param {number=} y imag
	     * @param {number=} z imag
	     * @returns {Quaternion}
	     */
	    'mul': function(w, x, y, z) {

	      parse(P, w, x, y, z);

	      // Q1 * Q2 = [w1 * w2 - dot(v1, v2), w1 * v2 + w2 * v1 + cross(v1, v2)]

	      // Not commutative because cross(v1, v2) != cross(v2, v1)!

	      var w1 = this['w'];
	      var x1 = this['x'];
	      var y1 = this['y'];
	      var z1 = this['z'];

	      var w2 = P['w'];
	      var x2 = P['x'];
	      var y2 = P['y'];
	      var z2 = P['z'];

	      return new Quaternion(
	        w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
	        w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
	        w1 * y2 + y1 * w2 + z1 * x2 - x1 * z2,
	        w1 * z2 + z1 * w2 + x1 * y2 - y1 * x2);
	    },
	    /**
	     * Scales a quaternion by a scalar, faster than using multiplication
	     *
	     * @param {number} s scaling factor
	     * @returns {Quaternion}
	     */
	    'scale': function(s) {

	      return new Quaternion(
	        this['w'] * s,
	        this['x'] * s,
	        this['y'] * s,
	        this['z'] * s);
	    },
	    /**
	     * Calculates the dot product of two quaternions
	     *
	     * @param {number|Object|string} w real
	     * @param {number=} x imag
	     * @param {number=} y imag
	     * @param {number=} z imag
	     * @returns {number}
	     */
	    'dot': function(w, x, y, z) {

	      parse(P, w, x, y, z);

	      // dot(Q1, Q2) := w1 * w2 + dot(v1, v2)

	      return this['w'] * P['w'] + this['x'] * P['x'] + this['y'] * P['y'] + this['z'] * P['z'];
	    },
	    /**
	     * Calculates the inverse of a quat for non-normalized quats such that
	     * Q^-1 * Q = 1 and Q * Q^-1 = 1
	     *
	     * @returns {Quaternion}
	     */
	    'inverse': function() {

	      // Q^-1 := Q' / |Q|^2
	      //       = [w / (w^2 + |v|^2), -v / (w^2 + |v|^2)]

	      // Proof:
	      // Q * Q^-1 = [w, v] * [w / (w^2 + |v|^2), -v / (w^2 + |v|^2)]
	      //          = [1, 0]
	      // Q^-1 * Q = [w / (w^2 + |v|^2), -v / (w^2 + |v|^2)] * [w, v]
	      //          = [1, 0].

	      var w = this['w'];
	      var x = this['x'];
	      var y = this['y'];
	      var z = this['z'];

	      var normSq = w * w + x * x + y * y + z * z;

	      if (normSq === 0) {
	        return Quaternion['ZERO']; // TODO: Is the result zero or one when the norm is zero?
	      }

	      normSq = 1 / normSq;

	      return new Quaternion(w * normSq, -x * normSq, -y * normSq, -z * normSq);
	    },
	    /**
	     * Multiplies a quaternion with the inverse of a second quaternion
	     *
	     * @param {number|Object|string} w real
	     * @param {number=} x imag
	     * @param {number=} y imag
	     * @param {number=} z imag
	     * @returns {Quaternion}
	     */
	    'div': function(w, x, y, z) {

	      parse(P, w, x, y, z);

	      // Q1 / Q2 := Q1 * Q2^-1

	      var w1 = this['w'];
	      var x1 = this['x'];
	      var y1 = this['y'];
	      var z1 = this['z'];

	      var w2 = P['w'];
	      var x2 = P['x'];
	      var y2 = P['y'];
	      var z2 = P['z'];

	      var normSq = w2 * w2 + x2 * x2 + y2 * y2 + z2 * z2;

	      if (normSq === 0) {
	        return Quaternion['ZERO']; // TODO: Is the result zero or one when the norm is zero?
	      }

	      normSq = 1 / normSq;

	      return new Quaternion(
	        (w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2) * normSq,
	        (x1 * w2 - w1 * x2 - y1 * z2 + z1 * y2) * normSq,
	        (y1 * w2 - w1 * y2 - z1 * x2 + x1 * z2) * normSq,
	        (z1 * w2 - w1 * z2 - x1 * y2 + y1 * x2) * normSq);
	    },
	    /**
	     * Calculates the conjugate of a quaternion
	     *
	     * @returns {Quaternion}
	     */
	    'conjugate': function() {

	      // Q' = [s, -v]

	      // If the quaternion is normalized,
	      // the conjugate is the inverse of the quaternion - but faster
	      // Q' * Q = Q * Q' = 1

	      // Additionally, the conjugate of a unit quaternion is a rotation with the same
	      // angle but the opposite axis.

	      // Moreover the following property holds:
	      // (Q1 * Q2)' = Q2' * Q1'

	      return new Quaternion(this['w'], -this['x'], -this['y'], -this['z']);
	    },
	    /**
	     * Calculates the natural exponentiation of the quaternion
	     *
	     * @returns {Quaternion}
	     */
	    'exp': function() {

	      var w = this['w'];
	      var x = this['x'];
	      var y = this['y'];
	      var z = this['z'];

	      var vNorm = Math.sqrt(x * x + y * y + z * z);
	      var wExp = Math.exp(w);
	      var scale = wExp / vNorm * Math.sin(vNorm);

	      if (vNorm === 0) {
	        //return new Quaternion(wExp * Math.cos(vNorm), 0, 0, 0);
	        return new Quaternion(wExp, 0, 0, 0);
	      }

	      return new Quaternion(
	        wExp * Math.cos(vNorm),
	        x * scale,
	        y * scale,
	        z * scale);
	    },
	    /**
	     * Calculates the natural logarithm of the quaternion
	     *
	     * @returns {Quaternion}
	     */
	    'log': function() {

	      var w = this['w'];
	      var x = this['x'];
	      var y = this['y'];
	      var z = this['z'];

	      if (y === 0 && z === 0) {
	        return new Quaternion(
	          logHypot(w, x),
	          Math.atan2(x, w), 0, 0);
	      }

	      var qNorm2 = x * x + y * y + z * z + w * w;
	      var vNorm = Math.sqrt(x * x + y * y + z * z);

	      var scale = Math.atan2(vNorm, w) / vNorm;

	      return new Quaternion(
	        Math.log(qNorm2) * 0.5,
	        x * scale,
	        y * scale,
	        z * scale);
	    },
	    /**
	     * Calculates the power of a quaternion raised to a real number or another quaternion
	     *
	     * @param {number|Object|string} w real
	     * @param {number=} x imag
	     * @param {number=} y imag
	     * @param {number=} z imag
	     * @returns {Quaternion}
	     */
	    'pow': function(w, x, y, z) {

	      parse(P, w, x, y, z);

	      if (P['y'] === 0 && P['z'] === 0) {

	        if (P['w'] === 1 && P['x'] === 0) {
	          return this;
	        }

	        if (P['w'] === 0 && P['x'] === 0) {
	          return Quaternion['ONE'];
	        }

	        // Check if we can operate in C
	        // Borrowed from complex.js
	        if (this['y'] === 0 && this['z'] === 0) {

	          var a = this['w'];
	          var b = this['x'];

	          if (a === 0 && b === 0) {
	            return Quaternion['ZERO'];
	          }

	          var arg = Math.atan2(b, a);
	          var loh = logHypot(a, b);

	          if (P['x'] === 0) {

	            if (b === 0 && a >= 0) {

	              return new Quaternion(Math.pow(a, P['w']), 0, 0, 0);

	            } else if (a === 0) {

	              switch (P['w'] % 4) {
	                case 0:
	                  return new Quaternion(Math.pow(b, P['w']), 0, 0, 0);
	                case 1:
	                  return new Quaternion(0, Math.pow(b, P['w']), 0, 0);
	                case 2:
	                  return new Quaternion(-Math.pow(b, P['w']), 0, 0, 0);
	                case 3:
	                  return new Quaternion(0, -Math.pow(b, P['w']), 0, 0);
	              }
	            }
	          }

	          a = Math.exp(P['w'] * loh - P['x'] * arg);
	          b = P['x'] * loh + P['w'] * arg;
	          return new Quaternion(
	            a * Math.cos(b),
	            a * Math.sin(b), 0, 0);
	        }
	      }

	      // Normal quaternion behavior
	      // q^p = e^ln(q^p) = e^(ln(q)*p)
	      return this['log']()['mul'](P)['exp']();
	    },
	    /**
	     * Checks if two quats are the same
	     *
	     * @param {number|Object|string} w real
	     * @param {number=} x imag
	     * @param {number=} y imag
	     * @param {number=} z imag
	     * @returns {boolean}
	     */
	    'equals': function(w, x, y, z) {

	      parse(P, w, x, y, z);

	      var eps = Quaternion['EPSILON'];

	      // maybe check for NaN's here?
	      return Math.abs(P['w'] - this['w']) < eps
	        && Math.abs(P['x'] - this['x']) < eps
	        && Math.abs(P['y'] - this['y']) < eps
	        && Math.abs(P['z'] - this['z']) < eps;
	    },
	    /**
	     * Checks if all parts of a quaternion are finite
	     *
	     * @returns {boolean}
	     */
	    'isFinite': function() {

	      return isFinite(this['w']) && isFinite(this['x']) && isFinite(this['y']) && isFinite(this['z']);
	    },
	    /**
	     * Checks if any of the parts of the quaternion is not a number
	     *
	     * @returns {boolean}
	     */
	    'isNaN': function() {

	      return isNaN(this['w']) || isNaN(this['x']) || isNaN(this['y']) || isNaN(this['z']);
	    },
	    /**
	     * Gets the Quaternion as a well formatted string
	     *
	     * @returns {string}
	     */
	    'toString': function() {

	      var w = this['w'];
	      var x = this['x'];
	      var y = this['y'];
	      var z = this['z'];
	      var ret = '';

	      if (isNaN(w) || isNaN(x) || isNaN(y) || isNaN(z)) {
	        return 'NaN';
	      }

	      // Alternative design?
	      // '(%f, [%f %f %f])'

	      ret = numToStr(w, '', ret);
	      ret += numToStr(x, 'i', ret);
	      ret += numToStr(y, 'j', ret);
	      ret += numToStr(z, 'k', ret);

	      if ('' === ret)
	        return '0';

	      return ret;
	    },
	    /**
	     * Returns the real part of the quaternion
	     *
	     * @returns {number}
	     */
	    'real': function() {

	      return this['w'];
	    },
	    /**
	     * Returns the imaginary part of the quaternion as a 3D vector / array
	     *
	     * @returns {Array}
	     */
	    'imag': function() {

	      return [this['x'], this['y'], this['z']];
	    },
	    /**
	     * Gets the actual quaternion as a 4D vector / array
	     *
	     * @returns {Array}
	     */
	    'toVector': function() {

	      return [this['w'], this['x'], this['y'], this['z']];
	    },
	    /**
	     * Calculates the 3x3 rotation matrix for the current quat
	     *
	     * @param {boolean=} twoD
	     * @returns {Array}
	     */
	    'toMatrix': function(twoD) {

	      var w = this['w'];
	      var x = this['x'];
	      var y = this['y'];
	      var z = this['z'];

	      var wx = w * x, wy = w * y, wz = w * z;
	      var xx = x * x, xy = x * y, xz = x * z;
	      var yy = y * y, yz = y * z, zz = z * z;

	      if (twoD) {
	        return [
	          [1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy)],
	          [2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx)],
	          [2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy)]];
	      }

	      return [
	        1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy),
	        2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx),
	        2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy)];
	    },
	    /**
	     * Calculates the homogeneous 4x4 rotation matrix for the current quat
	     *
	     * @param {boolean=} twoD
	     * @returns {Array}
	     */
	    'toMatrix4': function(twoD) {

	      var w = this['w'];
	      var x = this['x'];
	      var y = this['y'];
	      var z = this['z'];

	      var wx = w * x, wy = w * y, wz = w * z;
	      var xx = x * x, xy = x * y, xz = x * z;
	      var yy = y * y, yz = y * z, zz = z * z;

	      if (twoD) {
	        return [
	          [1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), 0],
	          [2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), 0],
	          [2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), 0],
	          [0, 0, 0, 1]];
	      }

	      return [
	        1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), 0,
	        2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), 0,
	        2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), 0,
	        0, 0, 0, 1];
	    },
	    /**
	     * Calculates the Euler angles represented by the current quat
	     * 
	     * @returns {Object}
	     */
	    'toEuler': function() {

	      var w = this['w'];
	      var x = this['x'];
	      var y = this['y'];
	      var z = this['z'];

	      var t = 2 * (w * y - z * x);

	      return {
	        // X-axis rotation
	        roll: Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)),
	        // Y-axis rotation
	        pitch: t >= 1 ? Math.PI / 2 : (t <= -1 ? -Math.PI / 2 : Math.asin(t)),
	        // Z-axis rotation
	        yaw: Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z))
	      };
	    },
	    /**
	     * Clones the actual object
	     *
	     * @returns {Quaternion}
	     */
	    'clone': function() {

	      return new Quaternion(this);
	    },
	    /**
	     * Rotates a vector according to the current quaternion, assumes |q|=1
	     * @link https://www.xarg.org/proof/vector-rotation-using-quaternions/
	     *
	     * @param {Array} v The vector to be rotated
	     * @returns {Array}
	     */
	    'rotateVector': function(v) {

	      var qw = this['w'];
	      var qx = this['x'];
	      var qy = this['y'];
	      var qz = this['z'];

	      var vx = v[0];
	      var vy = v[1];
	      var vz = v[2];

	      // t = 2q x v
	      var tx = 2 * (qy * vz - qz * vy);
	      var ty = 2 * (qz * vx - qx * vz);
	      var tz = 2 * (qx * vy - qy * vx);

	      // v + w t + q x t
	      return [
	        vx + qw * tx + qy * tz - qz * ty,
	        vy + qw * ty + qz * tx - qx * tz,
	        vz + qw * tz + qx * ty - qy * tx];
	    },

	    /**
	     * Gets a function to spherically interpolate between two quaternions
	     * 
	     * @returns Function
	     */
	    'slerp': function(w, x, y, z) {

	      parse(P, w, x, y, z);

	      // slerp(Q1, Q2, t) := Q1(Q1^-1 Q2)^t

	      var w1 = this['w'];
	      var x1 = this['x'];
	      var y1 = this['y'];
	      var z1 = this['z'];

	      var w2 = P['w'];
	      var x2 = P['x'];
	      var y2 = P['y'];
	      var z2 = P['z'];

	      var cosTheta0 = w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2;

	      if (cosTheta0 < 0) {
	        w1 = -w1;
	        x1 = -x1;
	        y1 = -y1;
	        z1 = -z1;
	        cosTheta0 = -cosTheta0;
	      }

	      if (cosTheta0 >= 1 - Quaternion['EPSILON']) {
	        return function(pct) {
	          return new Quaternion(
	            w1 + pct * (w2 - w1),
	            x1 + pct * (x2 - x1),
	            y1 + pct * (y2 - y1),
	            z1 + pct * (z2 - z1))['normalize']();
	        };
	      }

	      var Theta0 = Math.acos(cosTheta0);
	      var sinTheta0 = Math.sin(Theta0);

	      return function(pct) {

	        var Theta = Theta0 * pct;
	        var sinTheta = Math.sin(Theta);
	        var cosTheta = Math.cos(Theta);

	        var s0 = cosTheta - cosTheta0 * sinTheta / sinTheta0;
	        var s1 = sinTheta / sinTheta0;

	        return new Quaternion(
	          s0 * w1 + s1 * w2,
	          s0 * x1 + s1 * x2,
	          s0 * y1 + s1 * y2,
	          s0 * z1 + s1 * z2);
	      };
	    }
	  };

	  Quaternion['ZERO'] = new Quaternion(0, 0, 0, 0); // This is the additive identity Quaternion
	  Quaternion['ONE'] = new Quaternion(1, 0, 0, 0); // This is the multiplicative identity Quaternion
	  Quaternion['I'] = new Quaternion(0, 1, 0, 0);
	  Quaternion['J'] = new Quaternion(0, 0, 1, 0);
	  Quaternion['K'] = new Quaternion(0, 0, 0, 1);
	  Quaternion['EPSILON'] = 1e-16;

	  /**
	   * Creates quaternion by a rotation given as axis-angle orientation
	   *
	   * @param {Array} axis The axis around which to rotate
	   * @param {number} angle The angle in radians
	   * @returns {Quaternion}
	   */
	  Quaternion['fromAxisAngle'] = function(axis, angle) {

	    // Q = [cos(angle / 2), v * sin(angle / 2)]

	    var halfAngle = angle * 0.5;

	    var a = axis[0];
	    var b = axis[1];
	    var c = axis[2];

	    var sin_2 = Math.sin(halfAngle);
	    var cos_2 = Math.cos(halfAngle);

	    var sin_norm = sin_2 / Math.sqrt(a * a + b * b + c * c);

	    return new Quaternion(cos_2, a * sin_norm, b * sin_norm, c * sin_norm);
	  };

	  /**
	   * Calculates the quaternion to rotate one vector onto another
	   * @link https://www.xarg.org/proof/quaternion-from-two-vectors/
	   *
	   * @param {Array} u
	   * @param {Array} v
	   */
	  Quaternion['fromBetweenVectors'] = function(u, v) {

	    var ux = u[0];
	    var uy = u[1];
	    var uz = u[2];

	    var vx = v[0];
	    var vy = v[1];
	    var vz = v[2];

	    var dot = ux * vx + uy * vy + uz * vz;

	    // Parallel check (TODO must be normalized)
	    if (dot >= 1 - Quaternion['EPSILON']) ;

	    // Close to PI @TODO
	    //if (1 + dot <= Quaternion['EPSILON']) {
	    // return Quaternion.fromAxisAngle(Math.abs(ux) > Math.abs(uz) ? [-uy,  ux, 0] : [0, -uz,  uy], 0) -> OR
	    // return Quaternion.fromAxisAngle(Math.abs(ux) > Math.abs(uz) ? [ uy, -ux, 0] : [0,  uz, -uy], 0)
	    //}

	    var wx = uy * vz - uz * vy;
	    var wy = uz * vx - ux * vz;
	    var wz = ux * vy - uy * vx;

	    return new Quaternion(
	      dot + Math.sqrt(dot * dot + wx * wx + wy * wy + wz * wz),
	      wx,
	      wy,
	      wz
	    ).normalize();
	  };

	  /**
	   * Gets a spherical random number
	   * @link http://planning.cs.uiuc.edu/node198.html
	   */
	  Quaternion['random'] = function() {

	    var u1 = Math.random();
	    var u2 = Math.random();
	    var u3 = Math.random();

	    var s = Math.sqrt(1 - u1);
	    var t = Math.sqrt(u1);

	    return new Quaternion(
	      t * Math.cos(2 * Math.PI * u3),
	      s * Math.sin(2 * Math.PI * u2),
	      s * Math.cos(2 * Math.PI * u2),
	      t * Math.sin(2 * Math.PI * u3)
	    );
	  };

	  /**
	   * Creates a quaternion by a rotation given by Euler angles
	   *
	   * @param {number} phi
	   * @param {number} theta
	   * @param {number} psi
	   * @param {string=} order
	   * @returns {Quaternion}
	   */
	  Quaternion['fromEuler'] = function(phi, theta, psi, order) {

	    var _x = phi * 0.5;
	    var _y = theta * 0.5;
	    var _z = psi * 0.5;

	    var cX = Math.cos(_x);
	    var cY = Math.cos(_y);
	    var cZ = Math.cos(_z);

	    var sX = Math.sin(_x);
	    var sY = Math.sin(_y);
	    var sZ = Math.sin(_z);

	    if (order === undefined || order === 'ZXY') {
	      // axisAngle([0, 0, 1], x) * axisAngle([1, 0, 0], y) * axisAngle([0, 1, 0], z)
	      return new Quaternion(
	        cX * cY * cZ - sX * sY * sZ,
	        cX * cZ * sY - cY * sX * sZ,
	        cX * cY * sZ + cZ * sX * sY,
	        cY * cZ * sX + cX * sY * sZ);
	    }

	    if (order === 'XYZ' || order === 'RPY') {
	      // axisAngle([1, 0, 0], x) * axisAngle([0, 1, 0], y) * axisAngle([0, 0, 1], z)
	      return new Quaternion(
	        cX * cY * cZ - sX * sY * sZ,
	        cY * cZ * sX + cX * sY * sZ,
	        cX * cZ * sY - cY * sX * sZ,
	        cX * cY * sZ + cZ * sX * sY);
	    }

	    if (order === 'YXZ') {
	      // axisAngle([0, 1, 0], x) * axisAngle([1, 0, 0], y) * axisAngle([0, 0, 1], z)
	      return new Quaternion(
	        cX * cY * cZ + sX * sY * sZ,
	        cX * cZ * sY + cY * sX * sZ,
	        cY * cZ * sX - cX * sY * sZ,
	        cX * cY * sZ - cZ * sX * sY);
	    }

	    if (order === 'ZYX' || order === 'YPR') {
	      // axisAngle([0, 0, 1], x) * axisAngle([0, 1, 0], y) * axisAngle([1, 0, 0], z)
	      return new Quaternion(
	        cX * cY * cZ + sX * sY * sZ,
	        cX * cY * sZ - cZ * sX * sY,
	        cX * cZ * sY + cY * sX * sZ,
	        cY * cZ * sX - cX * sY * sZ);
	    }

	    if (order === 'YZX') {
	      // axisAngle([0, 1, 0], x) * axisAngle([0, 0, 1], y) * axisAngle([1, 0, 0], z)
	      return new Quaternion(
	        cX * cY * cZ - sX * sY * sZ,
	        cX * cY * sZ + cZ * sX * sY,
	        cY * cZ * sX + cX * sY * sZ,
	        cX * cZ * sY - cY * sX * sZ);
	    }

	    if (order === 'XZY') {
	      // axisAngle([1, 0, 0], x) * axisAngle([0, 0, 1], z) * axisAngle([0, 1, 0], y)
	      return new Quaternion(
	        cX * cY * cZ + sX * sY * sZ,
	        cY * cZ * sX - cX * sY * sZ,
	        cX * cY * sZ - cZ * sX * sY,
	        cX * cZ * sY + cY * sX * sZ);
	    }
	    return null;
	  };

	  /**
	   * Creates a quaternion by a rotation matrix
	   *
	   * @param {Array} matrix
	   * @returns {Quaternion}
	   */
	  Quaternion['fromMatrix'] = function(matrix) {

	    if (matrix.length === 9) {

	      var m00 = matrix[0];
	      var m01 = matrix[1];
	      var m02 = matrix[2];

	      var m10 = matrix[3];
	      var m11 = matrix[4];
	      var m12 = matrix[5];

	      var m20 = matrix[6];
	      var m21 = matrix[7];
	      var m22 = matrix[8];

	    } else {
	      var m00 = matrix[0][0];
	      var m01 = matrix[0][1];
	      var m02 = matrix[0][2];

	      var m10 = matrix[1][0];
	      var m11 = matrix[1][1];
	      var m12 = matrix[1][2];

	      var m20 = matrix[2][0];
	      var m21 = matrix[2][1];
	      var m22 = matrix[2][2];
	    }

	    var tr = m00 + m11 + m22;

	    if (tr > 0) { 
	      var S = Math.sqrt(tr+1.0) * 2; // S=4*qw

	      return new Quaternion(
	        0.25 * S,
	        (m21 - m12) / S,
	        (m02 - m20) / S,
	        (m10 - m01) / S);
	    } else if ((m00 > m11)&(m00 > m22)) { 
	      var S = Math.sqrt(1.0 + m00 - m11 - m22) * 2; // S=4*qx

	      return new Quaternion(
	        (m21 - m12) / S,
	        0.25 * S,
	        (m01 + m10) / S,
	        (m02 + m20) / S);
	    } else if (m11 > m22) { 
	      var S = Math.sqrt(1.0 + m11 - m00 - m22) * 2; // S=4*qy

	      return new Quaternion(
	        (m02 - m20) / S,
	        (m01 + m10) / S,
	        0.25 * S,
	        (m12 + m21) / S);
	    } else { 
	      var S = Math.sqrt(1.0 + m22 - m00 - m11) * 2; // S=4*qz

	      return new Quaternion(
	        (m10 - m01) / S,
	        (m02 + m20) / S,
	        (m12 + m21) / S,
	        0.25 * S);
	    }
	  };

	const {cos, sin, pow, sqrt, abs, sign, min, max, floor, round, random, PI} = Math;

	var ctx, ww, wh;

	var model;
	var _lev = .7;
	var lev = ease(_lev);
	var rule =  0;
	var n_i = 0; 
	var rot_n = 6;
	var theta = 0;
	var draw_mod = repeat_rot; 
	var recenter = false;
	var seed = 0;
	var mirror = true;
	var amp = .7;
	var yofs = 0;
	var yrot = false;
	var a_mode = 1;
	var hold = 10;
	const r_mat = create_rot$1(-.04,.05,-.03);
	var qr, qi, qs;

	var _h = .14, _s = 1, _l = .5, _a = 1; 
	var stroke$1 =  hlsaStr(_h, _s, _l, _a);
	var useStroke = true;

	function setup(_ctx, _w, _h){
	    ctx = _ctx; ww = _w; wh = _h;
	    model = buildModel();
	    qr = new Quaternion.fromEuler(-.03, -.04, .05);
	    qi = new Quaternion();
	    qs = new Quaternion();
	}

	function draw(){
		if(useStroke) ctx.strokeStyle = stroke$1;
		display(ctx, model, lev, draw_mod);
	}

	var vz = [0,0,1, 1];
	var az = 0, azlast = 1;
	var lerp = 0;

	function loop(time, ctl){
		ctl.mouse;
		if(useStroke) ctx.strokeStyle = stroke$1;

		if(a_mode == 1){
			vz = qs.rotateVector(vz);
			az = vz[2];
		    if((az-azlast > 0 && az > .7) || az-azlast == 0){ lerp += .04;}
			if(lerp > hold) lerp = 0;
			qs = qr.slerp(qi)(min(lerp,1));
			qrot(model, qs);
			azlast = az;
		}
		else if(a_mode == 2){
			model.v = mat_mul_4(model.v, r_mat);
		}
		display(ctx, model, lev, draw_mod);	
	}

	function unloop(){
		model = buildModel();
	}

	function buildModel(){
		return lsystem(arr[rule], n_i, recenter, seed);
	}

	function qrot(model, q){
		for(let i = 0; i < model.i.length; i++){
			model.v[model.i[i][0]] = homv(q.rotateVector(model.v[model.i[i][0]]));
			model.v[model.i[i][1]] = homv(q.rotateVector(model.v[model.i[i][1]]));
		}
	}

	function line_m(a, b, mirror){
		if(yrot){
			a[2] = 0, b[2] = 0;
			let q = Quaternion.fromEuler(0,0,min(lerp*.7, 3.1));
			a = q.rotateVector(a); b = q.rotateVector(b);
		}
		line(ctx, ww, wh, a[0], a[1], b[0], b[1]);
		if(mirror) line(ctx, ww, wh, -a[0], a[1], -b[0], b[1]);	
	}

	function display(ctx, model, f, cb){
		const n = max(floor(model.i.length*f),1);
		for(let i = 0; i < n; i++){		
			let a = model.v[model.i[i][0]]; 
			let b = model.v[model.i[i][1]];
			if(cb){cb(a, b);}
			else line_m(a, b, mirror);		
		}
	}

	function repeat_rot(a, b){
		let d = 2*PI/rot_n;
		for(let t = 0; t < 2*PI; t+= d){
		let rot = create_rot(t+theta);
			let aa = vec_mul(a, rot);
			let bb = vec_mul(b, rot);
			line_m(aa, bb, mirror);		
		}
	}

	function line(ctx, w, h, ax, ay, bx, by){
	    ctx.beginPath();
	    ctx.moveTo(amp*ax*w*.5 +w*.5, amp*(ay+yofs)*h*.5+h*.5);
	    ctx.lineTo(amp*bx*w*.5 +w*.5, amp*(by+yofs)*h*.5+h*.5);
	    ctx.closePath();
	    ctx.stroke();
	}

	function vec_mul(v, t){
		return [
		    v[0]*t[0][0] + v[1]*t[1][0] + v[2]*t[2][0] + v[3]*t[3][0],
		    v[0]*t[0][1] + v[1]*t[1][1] + v[2]*t[2][1] + v[3]*t[3][1],
		    v[0]*t[0][2] + v[1]*t[1][2] + v[2]*t[2][2] + v[3]*t[3][2],
		    v[0]*t[0][3] + v[1]*t[1][3] + v[2]*t[2][3] + v[3]*t[3][3]
	    ];
	}
	function create_rot(t){
	    return [[cos(t), -sin(t), 0, 0], [sin(t), cos(t), 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
	}
	function homv(v){
		return [v[0], v[1], v[2], 1];
	}
	function ease(x){
		return min((2**(3.46*x)-1)/10,1);
	}

	const gui = {
	    name: 'l-system',
	    open: true,
	    switch: true,
	    updateFrame: true,
	    fields:[
	    	{
	    		rule: [rule, 0, arr.length-1, 1],
	    		onChange: (v)=>{
	    			rule = v;
	    			model = buildModel();
	    		}

	    	},
		    {
		        level: [_lev, 0, 1, .01],
		        onChange : v => {lev = ease(v);}
		    },
		    {
		        amp: [amp, .3, 1.3, .01],
		        onChange : v => {amp = v;}
		    },
		    {
		    	seed: seed,
		    	onChange: (v)=>{
		    		seed = v ? v : Math.random()*99+1;
		    		model = buildModel();
		    		prog.ctl.frame();
		    	}
		    },
		    {
	    		randomize: ()=>{
	    			prog.gui.fields[3].ref.setValue(0);
	    		}
		    },
		    {
		    	amode: [a_mode, 0, 2, 1],
		    	onChange: v => {a_mode = v;}
		    },
		    {
		    	mode1_hold: [hold, 1, 20, .1],
		    	onChange: v => {hold = v;}
		    },
		    {
		    	yrot: false,
		    	onChange: v => {yrot = v;}
		    },
		    {
		    	rot_n: [rot_n, 1, 9, 1],
		    	onChange: v => {rot_n = v;}
		    },
	    {
	            name: 'color',
	            open: false,
	            updateFrame: true,
	            fields: [
	                {
	                    usecolor: useStroke,
	                    onChange: (v)=>{ useStroke = v;}
	                },
	                {
	                    h: [_h, 0, 1, .01],
	                    onChange: (v)=>{
	                        _h = v; stroke$1 = hlsaStr(_h, _s, _l, _a);
	                    }
	                },
	                {
	                    s: [_s, 0, 1, .01],
	                    onChange: (v)=>{
	                        _s = v; stroke$1 = hlsaStr(_h, _s, _l, _a);
	                    }
	                },
	                {
	                    l: [_l, 0, 1, .01],
	                    onChange: (v)=>{
	                        _l = v; stroke$1 = hlsaStr(_h, _s, _l, _a);
	                    }
	                },
	                {
	                    a: [_a, 0, 1, .01],
	                    onChange: (v)=>{
	                        _a = v; stroke$1 = hlsaStr(_h, _s, _l, _a);
	                    }
	                }
	            ]
	        }
	    ]
	};

	function hsl2rgb(h,s,l) { // https://stackoverflow.com/a/64090995
	   let a=s*Math.min(l,1-l);
	   let f= (n,k=(n+h/30)%12) => l - a*Math.max(Math.min(k-3,9-k,1),-1);
	   return [f(0),f(8),f(4)];
	}
	function hlsaStr(h, s, l, a){
	    let v = hsl2rgb(h*360, s, l);
	    return `rgba(${v[0]*255}, ${v[1]*255}, ${v[2]*255}, ${a})`;
	}

	const prog = {
	    setup: setup,
	    draw: draw,
	    loop: loop,
	    unloop: unloop,
	    gui: gui
	};

	const canvas = document.querySelector('#disp');
	const canvas2 = document.querySelector('#disp2');
	canvas.style.border = '1px solid black';
	canvas2.style.border = '1px solid black';

	const res = [500, 500];
	const lineview = new Lineview(canvas, [prog$1, prog], res);
	const stroke = { w:.5, h: .24, s: .7, l: .5, a: 1 };
	lineview.setStroke(stroke.h, stroke.s, stroke.l, stroke.a);
	lineview.lineWidth(stroke.w);

	let animate = true;
	const maingui = {
	    fields: [{
	            animate: animate,
	            onChange: (v)=>{
	                if(v) maingui.ctl.start();
	                else maingui.ctl.stop();
	            }
	        },
	        {
	            name: 'line',
	            open: false,
	            updateFrame: true,
	            fields:[
	                {
	                    width: [stroke.w, .01, 2, .01],
	                    onChange: v => lineview.lineWidth(v)
	                    
	                },
	                {
	                    h: [stroke.h, 0, 1, .01],
	                    onChange: (v)=>{
	                        stroke.h = v;
	                        lineview.setStroke(stroke.h, stroke.s, stroke.l, stroke.a);
	                    }
	                },
	                {
	                    s: [stroke.s, 0, 1, .01],
	                    onChange: (v)=>{
	                        stroke.s = v;
	                        lineview.setStroke(stroke.h, stroke.s, stroke.l, stroke.a);
	                    }
	                },
	                {
	                    l: [stroke.l, 0, 1, .01],
	                    onChange: (v)=>{
	                        stroke.l = v;
	                        lineview.setStroke(stroke.h, stroke.s, stroke.l, stroke.a);
	                    }
	                }
	            ]
	        },
	    ]
	};

	const cb = {
	    init: lineview.init.bind(lineview),
	    frame: lineview.frame.bind(lineview),
	    start: lineview.start.bind(lineview),
	    stop: lineview.stop.bind(lineview),
	    pgms: lineview.pgms
	};

	const pgm = {};
	pgm.chain = [prog$3, prog$2];
	// waves2.on = false;
	const glview = new Glview(canvas2, pgm, res, 0, new GUI$1(), maingui, cb);
	glview.start();

})();

/**
 * dwgl.js - a very lightweight webgl wrapper.
 * 
 * Copyright 2018 by Thomas Diewald (https://www.thomasdiewald.com)
 *
 *           MIT License: https://opensource.org/licenses/MIT
 *            ource: https://github.com/diwi/p5.EasyCam (will be moved)
 *
 * versions: webgl1, webgl2
 *
 */
 
/**
 * Note:
 * This is just a draft and for experimental purposes only.
 * To work with it you need a browser that supports webgl2.
 * 
 * http://webglreport.com/?v=2
 * https://caniuse.com/#feat=webgl2
 * https://webglstats.com/
 *
 */
 
 
 
'use strict';


function webgl1support(){
  return typeof WebGLRenderingContext !== 'undefined';
}


function webgl2support(){
  return typeof WebGL2RenderingContext !== 'undefined';
}




////////////////
//////////////// WebGLRenderingContext - custom creator methods
////////////////

var WEBGL1_CTX = webgl1support() ? WebGLRenderingContext  : null;
var WEBGL2_CTX = webgl2support() ? WebGL2RenderingContext : WEBGL1_CTX;

WEBGL1_CTX.prototype.getVersion =
WEBGL2_CTX.prototype.getVersion = function(){
  if(webgl1support() && this instanceof WebGLRenderingContext ) return 1;
  if(webgl2support() && this instanceof WebGL2RenderingContext) return 2;
  return 0;
};

WEBGL1_CTX.prototype.newFramebuffer = 
WEBGL2_CTX.prototype.newFramebuffer = function(){
  var fbo = this.createFramebuffer();
  fbo.gl = this;
  return fbo;
};

WEBGL1_CTX.prototype.newRenderbuffer = 
WEBGL2_CTX.prototype.newRenderbuffer = function(w, h, def){
  var rbo = this.createRenderbuffer();
  rbo.gl = this;
  rbo.resize(w, h, def);
  return rbo;
};

WEBGL1_CTX.prototype.newTexture = 
WEBGL2_CTX.prototype.newTexture = function(w, h, def){
  var tex = this.createTexture();
  tex.gl = this;
  tex.resize(w, h, def);
  return tex;
};

WEBGL1_CTX.prototype.newBuffer = 
WEBGL2_CTX.prototype.newBuffer = function(buffer, vtxSize, vtxType, target, usage){
  var vbo = this.createBuffer();
  vbo.gl = this;
  vbo.resize(buffer, vtxSize, vtxType, target, usage);
  return vbo;
};

WEBGL1_CTX.prototype.newShader = 
WEBGL2_CTX.prototype.newShader = function(type, source){
  var shader = this.createShader(type);
  shader.gl = this;
  shader.type = type;
  if(source){
    shader.setSource(source);
  }
  return shader;
};

WEBGL1_CTX.prototype.newFragShader = 
WEBGL2_CTX.prototype.newFragShader = function(source){
  return this.newShader(this.FRAGMENT_SHADER, source);
};

WEBGL1_CTX.prototype.newVertShader = 
WEBGL2_CTX.prototype.newVertShader = function(source){
  return this.newShader(this.VERTEX_SHADER, source);
};


WEBGL1_CTX.prototype.newProgram =
WEBGL2_CTX.prototype.newProgram = function(){
  var prog = this.createProgram();
  prog.gl = this;
  prog.list = {};
  return prog;
};



WEBGL1_CTX.prototype.newExt =
WEBGL2_CTX.prototype.newExt = function(names, printlog=false){
  var ext = {
    log : "",
    toString : function(){ return this.log; }
  };
  
  for(var i = 0; i < names.length; i++){
    var name = names[i];
    ext[name] = this.getExtension(name);
    ext.log += (ext[name] ? "[x]" : "[ ]")+" - "+name+"\n";
  }
  
  if(printlog){
    console.log(ext.log);
  }
  
  return ext;
};






////////////////
//////////////// WebGLBuffer 
////////////////

WebGLBuffer.prototype.release = function(){
  this.gl.deleteBuffer(this);
};

WebGLBuffer.prototype.resize = function(buffer, vtxSize, vtxType, target, usage){
  if(!buffer){
    return;
  }
  var vbo = this;
  var gl = this.gl;
  
  vbo.buffer   = buffer;                     // vertex data
  vbo.vtxCount = buffer.length / vtxSize;    // number of vertices
  vbo.vtxSize  = vtxSize;                    // values per vertex
  vbo.type     = vtxType || gl.FLOAT;        // float, int
  vbo.target   = target  || gl.ARRAY_BUFFER;
  vbo.usage    = usage   || gl.STATIC_DRAW;
  
  gl.bindBuffer(vbo.target, this);
  gl.bufferData(vbo.target, vbo.buffer, vbo.usage);
  gl.bindBuffer(vbo.target, null);
}

WebGLBuffer.prototype.attribute = function(loc){
  var gl = this.gl;
  gl.bindBuffer(this.target, this);
  gl.vertexAttribPointer(loc, this.vtxSize, this.type, false, 0, 0);
}



////////////////
//////////////// WebGLTexture 
////////////////

WebGLTexture.prototype.release = function(){
  this.gl.deleteTexture(this);
  this.dead = true;
};

WebGLTexture.prototype.resize = function(w, h, def, gl){
  var gl = this.gl;
  var tex = this;
  if(tex.w != w || tex.h != h){
    // TODO, check def diff as well
    def = def || {};
    
    tex.w         = w;
    tex.h         = h;
    tex.target    = tex.target  || def.target  || gl.TEXTURE_2D;
    tex.iformat   = tex.iformat || def.iformat || gl.RGBA;
    tex.format    = tex.format  || def.format  || gl.RGBA;
    tex.type      = tex.type    || def.type    || gl.UNSIGNED_BYTE;
    tex.wrap      = tex.wrap    || def.wrap    || gl.CLAMP_TO_EDGE;
    tex.filter    = tex.filter  || def.filter  || [gl.LINEAR, gl.LINEAR];
    
    def.data      = def.data    || null;
 
    gl.bindTexture  (tex.target, tex);
    gl.texParameteri(tex.target, gl.TEXTURE_WRAP_S, tex.wrap);
    gl.texParameteri(tex.target, gl.TEXTURE_WRAP_T, tex.wrap);
    gl.texParameteri(tex.target, gl.TEXTURE_MIN_FILTER, tex.filter[0]);
    gl.texParameterf(tex.target, gl.TEXTURE_MAG_FILTER, tex.filter[1]);
    gl.texImage2D   (tex.target, 0, tex.iformat, tex.w, tex.h, 0, tex.format, tex.type, def.data);
    gl.bindTexture  (tex.target, null);
    
    return true;
  }
  return false;
};
  
WebGLTexture.prototype.bind = function(){
  this.gl.bindTexture(this.target, this);
};
  
WebGLTexture.prototype.unbind = function(){
  this.gl.bindTexture(this.target, null);
};



////////////////
//////////////// WebGLFramebuffer 
////////////////

WebGLFramebuffer.prototype.release = function(){
  this.gl.deleteFramebuffer(this);
  this.dead = true;
};

WebGLFramebuffer.prototype.begin = function(tex){
  var gl = this.gl;
  
  if(gl.fbo && gl.fbo !== this){
    console.log("WARNING: another fbo is currently bound");
  }
  
  if(!gl.fbo){
    gl.bindFramebuffer(gl.FRAMEBUFFER, this);
    gl.fbo = this;
  }

  if(tex instanceof WebGLTexture){
    this.setTexture(tex);
  }
};

WebGLFramebuffer.prototype.end = function(){
  var gl = this.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.fbo = null;
};

WebGLFramebuffer.prototype.setRenderbuffer = function(rbo){
  var gl = this.gl;
  var fbo = this;
  
  if(gl.fbo && gl.fbo !== this){
    console.log("WARNING: another fbo is currently bound");
  }

  if(!gl.fbo) gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  
  if(fbo.rbo != rbo){
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo);
    fbo.rbo = rbo
    if(tex && fbo.rbo){
      fbo.rbo.resize(tex.w, tex.h);
    }
  } 
};

WebGLFramebuffer.prototype.setTexture = function(tex){
  var gl = this.gl;
  var fbo = this;
  
  if(gl.fbo && gl.fbo !== this){
    console.log("WARNING: another fbo is currently bound");
  }
  
  if(!gl.fbo) gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  
  if(fbo.tex != tex){
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    fbo.tex = tex;
    if(tex && fbo.rbo){
      fbo.rbo.resize(tex.w, tex.h);
    }
  } 
  
  if(!gl.fbo) gl.bindFramebuffer(gl.FRAMEBUFFER, null);
};



////////////////
//////////////// WebGLRenderbuffer 
////////////////

WebGLRenderbuffer.prototype.release = function(){
  this.gl.deleteRenderbuffer(this);
  this.dead = true;
};

WebGLRenderbuffer.prototype.resize = function(w, h, def){
  var gl = this.gl;
  var rbo = this;
  if(rbo.w != w || rbo.h != h){ 
    // TODO, check def diff as well
    def = def || {};
    rbo.w = w;
    rbo.h = h;
    rbo.target  = rbo.target  || def.target  || gl.RENDERBUFFER;
    rbo.iformat = rbo.iformat || def.iformat || gl.DEPTH_COMPONENT16;
    gl.bindRenderbuffer   (rbo.target, rbo);
    gl.renderbufferStorage(rbo.target, rbo.iformat, rbo.w, rbo.h);
    gl.bindRenderbuffer   (rbo.target, null);
    return true;
  }
  return false;
};




////////////////
//////////////// WebGLProgram 
////////////////

WebGLProgram.prototype.release = function(){
  this.gl.deleteProgram(this);
  this.dead = true;
};

WebGLProgram.prototype.attach = function(shader){
  var curr = shader;
  if(curr){
    var type = curr.type;
    var prev = this.list[type];
    if(prev != curr){
      if(prev) this.gl.detachShader(this, prev);
      if(curr) this.gl.attachShader(this, curr);
      this.list[type] = curr;
    }
  }
  return this;
};

WebGLProgram.prototype.build = function(shaderlist){
  if(shaderlist){
    var gl = this.gl;
    var prog = this;

    for(var i = 0; i < shaderlist.length; i++){
      this.attach(shaderlist[i]);
    }
    
    gl.linkProgram(prog);

    if(!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      var info = gl.getProgramInfoLog(prog);
      throw 'Could not compile WebGL program. \n\n' + info;
    }
  }
  return this;
};



////////////////
//////////////// WebGLShader 
////////////////

WebGLShader.prototype.release = function(){
  this.gl.deleteShader(this);
  this.dead = true;
};

WebGLShader.prototype.build = function(){
  if(this.rebuild){
    var gl = this.gl;
    var shader = this;    
    var source = shader.source;
    
    // apply defines
    var map = shader.defines;
    for (var key in map) {
      if(!map.hasOwnProperty(key)) continue;
      var def = map[key];
      source[def.i] = '#define '+def.name+' '+def.val;
    }
    
    // compile
    gl.shaderSource(shader, source.join('\n').trim());
    gl.compileShader(shader);

    // err check
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS) ) {
      var info = gl.getShaderInfoLog(shader);
      throw 'Could not compile WebGL program. \n\n' + info;
    }

    this.rebuild = false;
    return true;
  } 
  return false;
};

WebGLShader.prototype.setSource = function(source){
  
  if(typeof source === 'string'){
    source = source.split(/\r\n|\r|\n/g);
  }
  this.source = source;
  this.rebuild = true;

  // parse for defines
  // NOTE: this is only some very very basic parsing and certainly
  // doesnt account for more complex #define constructs.
  this.defines = {};
  
  const DEFINE = '#define ';
  for(var i = 0; i < this.source.length; i++){
    var line = this.source[i].trim();
    if(line.startsWith(DEFINE)){
      line = line.substring(DEFINE.length).trim();
      var ltoken = line.split(/(\s+)/);
      if(ltoken[0].includes("(")){
        // not my #define
      } else {
        var name = ltoken[0].trim();
        var ss_from = name.length;
        var ss_to = line.indexOf("//");
        if( ss_to == -1) ss_to = line.length;
        var val = line.substring(ss_from, ss_to).trim();
        this.defines[name] = {name:name, val:val, i:i};
      }
    }
  }
}


WebGLShader.prototype.setDefine = function(name, val){
  var define = this.defines[name];
  if(!define){
    console.log("define "+name+" does not exist");
    return;
  }
  if(define.val !== val){
    define.val = val;
    this.rebuild = true;
  }
}





////////////////
//////////////// Shader 
////////////////

class Shader {
  
  constructor(gl, def){
    // gl context
    this.gl = gl;
    
    // active texture location counter
    this.tex_loc = 0; 
    
    // vbo, fullscreenquad
    var vertices = new Float32Array([-1,-1, +1,-1, -1,+1, +1,+1]);
    this.fsq_vbo = gl.newBuffer(vertices, 2, gl.FLOAT);

    // default vertex shader, for fullscreenquad rendering

if(gl.getVersion() === 2){
    def.vs = def.vs || 
`
#version 300 es
in vec2 pos;
void main() {
  gl_Position = vec4(pos, 0, 1);
}
`;
} else {
    def.vs = def.vs || 
`
#version 100
attribute vec2 pos;
void main() {
  gl_Position = vec4(pos, 0, 1);
}
`;
}

    if(!def.vs || !def.fs){
      throw("Shader.ctor: no vs/fs source available.");
    }

    // alloc objects, but build (=compile and link) on the fly.
    this.vert = gl.newVertShader(def.vs);
    this.frag = gl.newFragShader(def.fs);
    this.prog = gl.newProgram();
  }
  
  release(){
    this.fsq_vbo.release();
    this.vert.release();
    this.frag.release();
    this.prog.release();
    this.dead = true;
  }
  
  build(){
    var bvert = this.vert.build();
    var bfrag = this.frag.build();
    
    if(bvert || bfrag){
      this.prog.build([this.vert, this.frag]);
      this.uniform_loc   = {}; // cached uniform locations
      this.attribute_loc = {}; // cached attribute locations
      return true;
    }
    return false;
  }

  begin(){
    var gl = this.gl;
    if(gl.shader){
      gl.shader.end();
    }
    this.build();
    gl.useProgram(this.prog);
    gl.shader = this;
  }

  end(){
    var gl = this.gl;
    // clear active texture locations
    this.uniformTclear();

    // clear used shader
    gl.useProgram(null);
    gl.shader = null;
  }
  
  attributeLoc(name){
    var loc = this.attribute_loc[name];
    if(loc === undefined){
      loc = this.gl.getAttribLocation(this.prog, name);
      this.attribute_loc[name] = loc;
    }
    return loc;
  }
  
  uniformLoc(name){
    var loc = this.uniform_loc[name];
    if(!loc){
      loc = this.gl.getUniformLocation(this.prog, name);
      this.uniform_loc[name] = loc;
    }
    return loc;
  }
  

  attribute(name, vbo){
    var gl = this.gl;
    var loc = this.attributeLoc(name);
    if(loc >= 0){
      vbo.attribute(loc);
      gl.enableVertexAttribArray(loc);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    return loc;
  }
  
  uniformF(name, values, arraylen = 1){
    var gl = this.gl;
    var loc = this.uniformLoc(name);
    if(loc){
      var type = values.length / arraylen;
      switch(type){
        case 1: gl.uniform1fv(loc, values); break; 
        case 2: gl.uniform2fv(loc, values); break; 
        case 3: gl.uniform3fv(loc, values); break; 
        case 4: gl.uniform4fv(loc, values); break;
      }
    }
  }
  
  uniformI(name, val, arraylen = 1){
    var gl = this.gl;
    var loc = this.uniformLoc(name);
    if(loc){
      var type = values.length / arraylen;
      switch(type){
        case 1: gl.uniform1iv(loc, values); break; 
        case 2: gl.uniform2iv(loc, values); break; 
        case 3: gl.uniform3iv(loc, values); break; 
        case 4: gl.uniform4iv(loc, values); break;
      }
    }
  }
  
  uniformM(name, val, arraylen = 1){
    var gl = this.gl;
    var loc = this.uniformLoc(name);
    if(loc){
      var type = values.length / arraylen;
      switch(type){
        case  4: gl.uniformMatrix2fv(loc, values); break; 
        case  9: gl.uniformMatrix3fv(loc, values); break; 
        case 16: gl.uniformMatrix4fv(loc, values); break; 
      }
    }
  }
  
  uniformT(name, val){
    var gl = this.gl;
    var loc = this.uniformLoc(name);
    if(loc){
      gl.bindTexture(gl.TEXTURE_2D, val);
      gl.activeTexture(gl.TEXTURE0 + this.tex_loc);
      gl.uniform1i(loc, this.tex_loc);
      this.tex_loc++;
    } 
  }
  
  uniformTclear(){
    var gl = this.gl;
    // clear active texture locations
    for(var i = this.tex_loc - 1; i >= 0; --i){
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
    this.tex_loc = 0;
  }
  
  
  
  scissors(x, y, w, h){
    var gl = this.gl;
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x,y,w,h);
  }
  
  viewport(x, y, w, h){
    this.gl.viewport(x,y,w,h);
  }
  
  quad(){
    var gl = this.gl;
    this.attribute('pos', this.fsq_vbo);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  
};


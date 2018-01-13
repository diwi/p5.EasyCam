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
 
 
/**
 * This Reaction-Diffusion Demo is a port from the PixelFlow-Library.
 * https://github.com/diwi/PixelFlow/tree/master/examples/Miscellaneous/ReactionDiffusion
 */
 
 
'use strict';



var fbo;
var tex = {};

var shader_grayscott;
var shader_display;

var SCREEN_SCALE = 0.5; // offscreen resolution scale factor.


var rdDef = {
  name : 'ReactionDiffusion',
  da : 1.0,
  db : 0.6,
  feed : 0.04,
  kill : 0.06,
  dt : 1.0,
  iterations : 10,
  reset : initRD,
  preset0 : function() {  this.feed = 0.040; this.kill = 0.060; this.da = 1.00; this.db = 0.60; },
  preset1 : function() {  this.feed = 0.034; this.kill = 0.059; this.da = 1.00; this.db = 0.60; },
  preset2 : function() {  this.feed = 0.080; this.kill = 0.060; this.da = 1.00; this.db = 0.40; },
  preset3 : function() {  this.feed = 0.015; this.kill = 0.050; this.da = 1.00; this.db = 0.60; },
};


function GUI(){
  var gui = new dat.GUI();
  gui.add(rdDef, 'name');
  gui.add(rdDef, 'da'        , 0, 1  ).listen();
  gui.add(rdDef, 'db'        , 0, 1  ).listen();
  gui.add(rdDef, 'feed'      , 0, 0.1).listen();
  gui.add(rdDef, 'kill'      , 0, 0.1).listen();
  gui.add(rdDef, 'dt'        , 0, 1);
  gui.add(rdDef, 'iterations', 1, 50  );
  gui.add(rdDef, 'preset0');
  gui.add(rdDef, 'preset1');
  gui.add(rdDef, 'preset2');
  gui.add(rdDef, 'preset3');
  gui.add(rdDef, 'reset');
}




function setup() { 
  pixelDensity(1);
  
  var canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  GUI();
  
  // webgl context
  var gl = this._renderer.GL;
  
  // webgl version (1=webgl1, 2=webgl2)
  var VERSION = gl.getVersion();
  
  console.log("WebGL Version: "+VERSION);
  

  // get some webgl extensions
  // if(VERSION === 1){
    // var ext = gl.newExt(['OES_texture_float', 'OES_texture_float_linear'], true);
  // }
  // if(VERSION === 2){
    // var ext = gl.newExt(['EXT_color_buffer_float'], true);
  // }
  
  // beeing lazy ... load all available extensions.
  gl.newExt(gl.getSupportedExtensions(), true);

  
  // create FrameBuffer for offscreen rendering
  fbo = gl.newFramebuffer();

  // create Textures for multipass rendering
  var def = {
     target   : gl.TEXTURE_2D
    ,iformat  : gl.RGBA32F
    ,format   : gl.RGBA
    ,type     : gl.FLOAT
    ,wrap     : gl.CLAMP_TO_EDGE
    ,filter   : [gl.NEAREST, gl.LINEAR]
  }

  
  var tex_w = ceil(width * SCREEN_SCALE);
  var tex_h = ceil(height * SCREEN_SCALE);

  tex.src = gl.newTexture(tex_w, tex_h, def);
  tex.dst = gl.newTexture(tex_w, tex_h, def);
  tex.swap = function(){
    var tmp = this.src;
    this.src = this.dst;
    this.dst = tmp;
  }
  
 
  // Shader source, depending on available webgl version
  var fs_grayscott = document.getElementById("webgl"+VERSION+".fs_grayscott").textContent;
  var fs_display   = document.getElementById("webgl"+VERSION+".fs_display"  ).textContent;
  
  // crreate Shader
  shader_grayscott = new Shader(gl, {fs:fs_grayscott});
  shader_display   = new Shader(gl, {fs:fs_display  });
  
  
  // shading colors
  var pallette = [
    0.00, 0.00, 0.00,
    0.00, 0.20, 0.40,
    1.00, 0.80, 0.00,
    0.00, 0.40, 1.00,     
    0.40, 0.40, 0.20,
    0.00, 0.00, 0.00
  ];
  
  // set some uniforms that probably wont change
  shader_display.begin();
  shader_display.uniformF("PALLETTE", pallette, 6); 
  shader_display.end();
  
  // place initial samples
  initRD();
}

function windowResized() {
  var w = windowWidth;
  var h = windowHeight;
  resizeCanvas(w, h);
  
  var tex_w = ceil(w * SCREEN_SCALE);
  var tex_h = ceil(h * SCREEN_SCALE);
  
  tex.src.resize(tex_w, tex_h);
  tex.dst.resize(tex_w, tex_h);
  
  initRD();
}


function draw(){

  ortho(0, width, -height, 0, 0, 20000);

  updateRD();

  var w = tex.dst.w / SCREEN_SCALE;
  var h = tex.dst.h / SCREEN_SCALE;
  
  // display result
  shader_display.viewport(0, 0, w, h);
  shader_display.begin();
  shader_display.uniformT('tex', tex.src);
  shader_display.uniformF('wh_rcp', [1.0/w, 1.0/h]);
  shader_display.quad();
  shader_display.end();
}








function initRD(){
  ortho();
    
  var gl = fbo.gl;
  
  // bind framebuffer and texture for offscreenrendering
  fbo.begin(tex.dst);
  
  var w = tex.dst.w;
  var h = tex.dst.h;
  
  gl.viewport(0, 0, w, h);
  gl.clearColor(1.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  
  // < native p5 here
  noStroke();
  fill(0,255,0);
  ellipse(-100, 0, 100, 100);
  ellipse(+100, 0, 100, 100);
  ellipse(0, -100, 100, 100);
  ellipse(0, +100, 100, 100);
  // >
  tex.swap();
  fbo.end();

}


function updateRD(){
  var gl = fbo.gl;
  fbo.begin();
 
  // multipass rendering (ping-pong)
  for(var i = 0; i < rdDef.iterations; i++){
    
    // set texture as rendertarget
    fbo.begin(tex.dst);
    
    var w = tex.dst.w;
    var h = tex.dst.h;
 
    // clear texture
    gl.viewport(0, 0, w, h);
    gl.clearColor(1.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    
    // apply shader
    shader_grayscott.begin();
    shader_grayscott.uniformF("dA"    , [rdDef.da]);
    shader_grayscott.uniformF("dB"    , [rdDef.db]);
    shader_grayscott.uniformF("feed"  , [rdDef.feed]);
    shader_grayscott.uniformF("kill"  , [rdDef.kill]);
    shader_grayscott.uniformF("dt"    , [rdDef.dt]);
    shader_grayscott.uniformF("wh_rcp", [1.0/w, 1.0/h]);
    shader_grayscott.uniformT("tex"   , tex.src);
    shader_grayscott.quad();
    shader_grayscott.end();
    
    // < native p5 here
    if(mouseIsPressed){
      noStroke();
      fill(0,255,0);
      ellipse(mouseX, mouseY, 80, 80);
    }
    // >
    
    // ping-pong
    tex.swap();
  }
  
  fbo.end();
}












////////////////////////////////////////////////////////////////////////////////
//
// p5.js ... patches/fixes/extensions
//
////////////////////////////////////////////////////////////////////////////////


// due to a current bug it seems antialiasing cant be set to graphics 
// via the official api.
// also, this allows to create a webgl2 context

var attributes = {
  alpha: true, // canvas contains an alpha buffer.
  depth: true, // drawing buffer has a depth buffer of at least 16 bits.
  stencil: true, // drawing buffer has a stencil buffer of at least 8 bits.
  antialias: true, //  whether or not to perform anti-aliasing.
  // premultipliedAlpha: false, // drawing buffer contains colors with pre-multiplied alpha.
  preserveDrawingBuffer: true, // buffers will not be cleared
  failIfMajorPerformanceCaveat: true
};


p5.RendererGL.prototype._initContext = function() {
  
  this.attributes = attributes; // use custom attributes

  try {
    this.drawingContext = false
                       || this.canvas.getContext('webgl2', this.attributes)
                       || this.canvas.getContext('webgl', this.attributes)
                       || this.canvas.getContext('experimental-webgl', this.attributes)
                        ;
    if (this.drawingContext) {
      var gl = this.drawingContext;
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      this._viewport = gl.getParameter(gl.VIEWPORT);
    } else {
      throw new Error('Error creating webgl context');
    }
  } catch (er) {
    throw new Error(er);
  }
};








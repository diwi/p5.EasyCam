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


function setup() { 
  pixelDensity(1);
  
  var canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  
  // webgl context
  var gl = this._renderer.GL;

  // get some webgl extensions
  var extnames = [
    'WEBGL_color_buffer_float',
    'EXT_color_buffer_float',
    'EXT_color_buffer_half_float',
    'OES_texture_float',
    'OES_texture_float_linear',
    'OES_texture_half_float',
    'OES_texture_half_float_linear',
  ];
  
  var ext = gl.newExt(extnames);
  // ext = gl.newExt(gl.getSupportedExtensions());
  
  
  // create FrameBuffer for offscreen rendering
  fbo = gl.newFramebuffer();

  
  // create Textures for multipass rendering
  var def = {
     target   : gl.TEXTURE_2D
    ,iformat  : gl.RGBA32F
    ,format   : gl.RGBA
    ,type     : gl.FLOAT
    ,wrap     : gl.CLAMP_TO_EDGE
    ,filter   : [gl.NEAREST, gl.NEAREST]
  }

  tex.src = gl.newTexture(width, height, def);
  tex.dst = gl.newTexture(width, height, def);
  tex.swap = function(){
    var tmp = this.src;
    this.src = this.dst;
    this.dst = tmp;
  }
  
  
  // webgl version (1=webgl1, 2=webgl2)
  var VERSION = gl.getVersion();
  
  // Shader source, depending on available webgl version
  var fs_grayscott = document.getElementById("webgl"+VERSION+".fs_grayscott").textContent;
  var fs_display   = document.getElementById("webgl"+VERSION+".fs_display"  ).textContent;
  
  // crreate Shader
  shader_grayscott = new Shader(gl, {fs:fs_grayscott});
  shader_display   = new Shader(gl, {fs:fs_display  });
  
  // place initial samples
  initRD();
}


function initRD(){
  var gl = fbo.gl;
  
    // Init
  fbo.begin(tex.dst);
  gl.viewport(0, 0, width, height);
  gl.clearColor(1.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  
  // < native p5 here
  rectMode(CENTER);
  noStroke();
  fill(0,255,0);
  ellipse(-100, 0, 100, 100);
  ellipse(+100, 0, 100, 100);
  // >

  fbo.end();
  tex.swap();
}



function windowResized() {
  var w = windowWidth;
  var h = windowHeight;
  resizeCanvas(w, h);
  tex.src.resize(w, h);
  tex.dst.resize(w, h);
  initRD();
}


function draw(){
  
  ortho(0, width, -height, 0, 0, 20000);
  noStroke();
  fill(0,255,0);
  
  // multipass rendering (ping-pong)
  for(var i = 0; i < 20; i++){
    fbo.begin(tex.dst);
    var gl = fbo.gl;
    gl.viewport(0, 0, width, height);
    gl.clearColor(1.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    
    shader_grayscott.begin();
    shader_grayscott.uniformF("dA"    , [1.0  ]);
    shader_grayscott.uniformF("dB"    , [0.5  ]);
    shader_grayscott.uniformF("feed"  , [0.040]);
    shader_grayscott.uniformF("kill"  , [0.061]);
    shader_grayscott.uniformF("dt"    , [1.0    ]);
    shader_grayscott.uniformF("wh_rcp", [1.0/width, 1.0/height]);
    shader_grayscott.uniformT("tex"   , tex.src);
    shader_grayscott.quad();
    shader_grayscott.end();
    
    // < native p5 here
    noStroke();
    fill(0,255,0);
    ellipse(mouseX, mouseY, 50, 50);
    // >
    
    fbo.end();
    tex.swap();
  }
  
  // display result
  shader_display.begin();
  shader_display.uniformT('tex', tex.src);
  shader_display.uniformF('wh_rcp', [1.0/width, 1.0/height]);
  shader_display.quad();
  shader_display.end();
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








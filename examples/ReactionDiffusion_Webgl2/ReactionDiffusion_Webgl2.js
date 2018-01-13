/**
 * p5.EasyGL.js - a very lightweight webgl2 wrapper.
 *
 *   Copyright 2018 by Thomas Diewald (https://www.thomasdiewald.com)
 *
 *   Source: https://github.com/diwi/p5.EasyCam
 *
 *   MIT License: https://opensource.org/licenses/MIT
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
  
  var gl = this._renderer.GL;
  getGLExtensions(gl);

  gl.shader = null;
  gl.fbo = null;

  // FrameBuffer
  fbo = gl.newFramebuffer();

  // Textures
  var def = {
     target   : gl.TEXTURE_2D
    ,iformat  : gl.RG32F
    ,format   : gl.RG
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
  
  // Shader
  var fs_grayscott = document.getElementById("fs_grayscott").textContent;
  var fs_display   = document.getElementById("fs_display"  ).textContent;
  
  shader_grayscott = new Shader(gl, {fs:fs_grayscott});
  shader_display   = new Shader(gl, {fs:fs_display  });
  
  
  // Init
  fbo.begin(tex.dst);
  gl.viewport(0, 0, width, height);
  gl.clearColor(1.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  
  // < native p5 here
  // init some pixels, somewhere
  rectMode(CENTER);
  noStroke();
  fill(0,255,0);
  ellipse(0, 0, 100, 100);
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
}


function draw(){
  
  ortho(0, width, -height, 0, 0, 20000);

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
  
  shader_display.begin();
  shader_display.uniformT('tex', tex.src);
  shader_display.uniformF('wh_rcp', [1.0/width, 1.0/height]);
  shader_display.quad();
  shader_display.end();
}



function getGLExtensions(gl){
  var available_extensions = gl.getSupportedExtensions();
  console.log(available_extensions);
  
  const OES_texture_float = gl.getExtension('OES_texture_float_linear');
  if (!OES_texture_float) {
    alert("need EXT_color_buffer_float");
    return;
  }

  const EXT_color_buffer_float = gl.getExtension('EXT_color_buffer_float');
  if (!EXT_color_buffer_float) {
    alert("need EXT_color_buffer_float");
    return;
  }
}




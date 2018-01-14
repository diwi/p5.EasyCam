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


// framebuffer
var fbo;

// tex-struct (ping-pong)
var tex = 
{
  src : null,
  dst : null,
  swap : function(){
    var tmp = this.src;
    this.src = this.dst;
    this.dst = tmp;
  }
};

// shader
var shader_grayscott;
var shader_display;

// offscreen resolution scale factor.
var SCREEN_SCALE = 1.0; 

// reaction diffusion settings and presets
var rdDef = {
  name    : 'ReactionDiffusion',
  da      : 1.0,
  db      : 0.6,
  feed    : 0.04,
  kill    : 0.06,
  dt      : 1.0,
  iter    : 10,
  reset   : initRD,
  preset0 : function() {  this.feed = 0.040; this.kill = 0.060; this.da = 1.00; this.db = 0.60; },
  preset1 : function() {  this.feed = 0.034; this.kill = 0.059; this.da = 1.00; this.db = 0.60; },
  preset2 : function() {  this.feed = 0.080; this.kill = 0.060; this.da = 1.00; this.db = 0.40; },
  preset3 : function() {  this.feed = 0.015; this.kill = 0.050; this.da = 1.00; this.db = 0.60; },
  preset4 : function() {  this.feed = 0.072; this.kill = 0.062; this.da = 0.50; this.db = 0.25; },
  preset5 : function() {  this.feed = 0.071; this.kill = 0.063; this.da = 0.40; this.db = 0.20; },
  preset6 : function() {  this.feed = 0.023; this.kill = 0.052; this.da = 0.50; this.db = 0.50; },
  preset7 : function() {  this.feed = 0.029; this.kill = 0.056; this.da = 0.60; this.db = 0.46; },
};



function setup() { 
  pixelDensity(1);
  
  // webgl canvas
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  // create gui (dat.gui)
  var gui = new dat.GUI();
  gui.add(rdDef, 'name');
  gui.add(rdDef, 'da'   , 0, 1  ).listen();
  gui.add(rdDef, 'db'   , 0, 1  ).listen();
  gui.add(rdDef, 'feed' , 0.01, 0.09).listen();
  gui.add(rdDef, 'kill' , 0.01, 0.09).listen();
  gui.add(rdDef, 'dt'   , 0, 1);
  gui.add(rdDef, 'iter' , 1, 50);
  gui.add(rdDef, 'preset0');
  gui.add(rdDef, 'preset1');
  gui.add(rdDef, 'preset2');
  gui.add(rdDef, 'preset3');
  gui.add(rdDef, 'preset4');
  gui.add(rdDef, 'preset5');
  gui.add(rdDef, 'preset6');
  gui.add(rdDef, 'preset7');
  gui.add(rdDef, 'reset'  );
  
  
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


  
  // Shader source, depending on available webgl version
  var fs_grayscott = document.getElementById("webgl"+VERSION+".fs_grayscott").textContent;
  var fs_display   = document.getElementById("webgl"+VERSION+".fs_display"  ).textContent;
  
  // crreate Shader
  shader_grayscott = new Shader(gl, {fs:fs_grayscott});
  shader_display   = new Shader(gl, {fs:fs_display  });
  
 
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



// shading colors
var pallette = [
  1.00, 1.00, 1.00,
  0.00, 0.40, 0.80,
  0.20, 0.00, 0.20,
  1.00, 0.80, 0.40,
  0.50, 0.25, 0.12,     
  0.50, 0.50, 0.50,
  0.00, 0.00, 0.00
];



function randomizeColors(){
  var num = pallette.length /3;
  for(var i = 1; i < num-1; i++){
    var id = i * 3;
    var r = random(1);
    var g = random(1);
    var b = random(1);
    
    pallette[id + 0] = r;
    pallette[id + 1] = g;
    pallette[id + 2] = b;
  }
}


function keyReleased(){
  if(key === 'C'){
    randomizeColors();
  }
}

function draw(){

  // ortho(0, width, -height, 0, 0, 20000);
  push();
  ortho();
  translate(-width/2, -height/2, 0);
  updateRD();
  pop();

  var w = tex.dst.w / SCREEN_SCALE;
  var h = tex.dst.h / SCREEN_SCALE;
  

  // display result
  shader_display.viewport(0, 0, w, h);
  shader_display.begin();
  shader_display.uniformF('PALLETTE', pallette, 7); 
  shader_display.uniformT('tex', tex.src);
  shader_display.uniformF('wh_rcp', [1.0/w, 1.0/h]);
  shader_display.quad();
  shader_display.end();

}



function initRD(){
  ortho();
  // translate(-width/2, -height/2, 0);
    
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

  // multipass rendering (ping-pong)
  for(var i = 0; i < rdDef.iter; i++){
    
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
      ellipse(mouseX, mouseY, 50, 50);
    }
    // >
    
    // ping-pong
    tex.swap();
  }
  
  // end fbo, so p5 can take over again.
  fbo.end();
}





















////////////////////////////////////////////////////////////////////////////////
//
//
// p5 bugfixes
//
//
////////////////////////////////////////////////////////////////////////////////





p5.Vector.cross = function cross(a, b, dst) {
  dst = dst || new p5.Vector();
  dst.x = a.y * b.z - a.z * b.y;
  dst.y = a.z * b.x - a.x * b.z;
  dst.z = a.x * b.y - a.y * b.x;
  return dst;
};


p5.Vector.prototype.normalize = function normalize() {
  
  var x = this.x;
  var y = this.y;
  var z = this.z;
  
  var mag = x * x + y * y + z * z; // squared
  if(mag !== 1.0 && mag !== 0.0){
    mag = 1.0 / Math.sqrt(mag);
    x *= mag;
    y *= mag;
    z *= mag;
  }
  
  this.x = x;
  this.y = y;
  this.z = z;
  return this;
};




p5.Geometry.prototype._getFaceNormal = function(faceId, normal) {
 
  // face data
  var face = this.faces[faceId];
  var vA = this.vertices[face[0]];
  var vB = this.vertices[face[1]];
  var vC = this.vertices[face[2]];
  
  // reuse existing 
  this.tmp_ab = this.tmp_ab || new p5.Vector();
  this.tmp_ac = this.tmp_ac || new p5.Vector();
  normal = normal || new p5.Vector();
  
  // base
  var ab = this.tmp_ab.set(vB).sub(vA);
  var ac = this.tmp_ac.set(vC).sub(vA);

  // check for zero length
  var mag_ab = ab.magSq();
  var mag_ac = ac.magSq();
  if(mag_ab === 0.0 || mag_ac === 0.0){
    return normal.set(0,0,0);
  }
  
  // cross product
  normal = p5.Vector.cross(ab, ac, normal);

  // length adjustment
  // var mag = normal.mag();
  // mag_ab = Math.sqrt(mag_ab);
  // mag_ac = Math.sqrt(mag_ac);
  // var alpha = mag / (mag_ab * mag_ac);
  // normal.mult(Math.asin(alpha) / mag);
  
  // normalize
  normal.normalize();
  
  return normal;
};



p5.Geometry.prototype.computeNormals = function() {
  
  var verts = this.vertices;
  var faces = this.faces;

  var num_verts = verts.length;
  var num_faces = faces.length;
  
  
  // 1) init list of face id's for each vertex
  this.vert_facelist = this.vert_facelist || [];
  for (var vi = 0; vi < num_verts; vi++) {
    this.vert_facelist[vi] = [];
  }
  
  // 2) precompute face-normals
  //    create list of face id's for each vertex
  this.facenormals = this.facenormals || [];
  for (var fi = 0; fi < num_faces; fi++) {
    this.facenormals[fi] = this._getFaceNormal(fi, this.facenormals[fi]);
    this.vert_facelist[faces[fi][0]].push(fi);
    this.vert_facelist[faces[fi][1]].push(fi);
    this.vert_facelist[faces[fi][2]].push(fi);
  }
  
  // create vertex normal by averaging adjacent face-normals.
  this.vertexNormals = this.vertexNormals || [];
  for (var vi = 0; vi < num_verts; vi++) {

    // reuse existing
    var normal = this.vertexNormals[vi];
    if(normal){
      normal.set(0,0,0);
    } else {
      normal = new p5.Vector();
    }
    // iterate through all adjacent faces and sum up face normals
    var face_ids = this.vert_facelist[vi];
    var num_face_ids = face_ids.length;
    for (var k = 0; k < num_face_ids; k++) {
      var fi = face_ids[k];
      normal.add(this.facenormals[fi]);
    }
    // each normal was normalized, so we can ust divide by the count
    normal.mult(1.0 / num_face_ids); 
    // normal.normalize();
    this.vertexNormals[vi] = normal;
  }
  
  return this;
};





p5.RendererGL.prototype._edgesToVertices = function(geom) {

  var verts = geom.vertices;
  var edges = geom.edges;
  
  var edge;
  var vA, vB, viA, viB;
  var dx, dy, dz, dd, dn, dp;
  
  geom.lineVertices = [];
  geom.lineNormals = [];
  
  for (var i = 0; i < edges.length; i++) {
    edge = edges[i];
    
    // edge vertex indices
    viA = edge[0];
    viB = edge[1];
    
    // edge vertices
    vA = verts[viA];
    vB = verts[viB];

    // dir
    dx = vB.x - vA.x;
    dy = vB.y - vA.y;
    dz = vB.z - vA.z;
    
    // normalize
    dd = dx*dx + dy*dy + dz*dz;
    // ignore length 0.0 or 1.0
    if(dd !== 1.0 && dd !== 0.0){
      dd = 1.0 / Math.sqrt(dd);
      dx *= dd;
      dy *= dd;
      dz *= dd;
    }
    
    vA = [vA.x, vA.y, vA.z];
    vB = [vB.x, vB.y, vB.z];
    dp = [dx, dy, dz, +1];
    dn = [dx, dy, dz, -1];
    
    geom.lineNormals .push(dp, dn, dp, dp, dn, dn);
    geom.lineVertices.push(vA, vA, vB, vB, vA, vB);
  }
  
};




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








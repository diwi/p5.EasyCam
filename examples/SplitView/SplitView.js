/**
 * 
 * The p5.EasyCam library - Easy 3D CameraControl for p5.js and WEBGL.
 *
 *   Copyright 2018 by Thomas Diewald (https://www.thomasdiewald.com)
 *
 *   Source: https://github.com/diwi/p5.EasyCam
 *
 *   MIT License: https://opensource.org/licenses/MIT
 * 
 * 
 * explanatory notes:
 * 
 * p5.EasyCam is a derivative of the original PeasyCam Library by Jonathan Feinberg 
 * and combines new useful features with the great look and feel of its parent.
 * 
 * 
 */

//
// SplitView setup
//
// Two cameras, each one owns its own rendertarget.
//
// Note: p5 (v0.5.16) is a bit bugy here.
//       AntiAliasing is disabled + this demo comes with a little patch to be
//       be able to execute.
//
// https://github.com/processing/p5.js/issues/2479
// https://github.com/processing/p5.js/issues/2478
//
 
var easycam1;
var easycam2;





// due to a current bug it seems antialiasing cant be set to graphics 
// via the official api.
// also, this allows to create a webgl2 context

var attributes = {
  alpha: true, // canvas contains an alpha buffer.
  depth: true, // drawing buffer has a depth buffer of at least 16 bits.
  stencil: true, // drawing buffer has a stencil buffer of at least 8 bits.
  antialias: true, //  whether or not to perform anti-aliasing.
  premultipliedAlpha: false, // drawing buffer contains colors with pre-multiplied alpha.
  preserveDrawingBuffer: true, // buffers will not be cleared
  failIfMajorPerformanceCaveat: true
};


p5.RendererGL.prototype._initContext = function() {
  
  this.attributes = attributes; // use custom attributes

  try {
    this.drawingContext = this.canvas.getContext('webgl2', this.attributes)
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





function setup() { 

  pixelDensity(1);
  // p5.BUG
  // var canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  // setAttributes('antialias', true);

  var canvas = createCanvas(windowWidth, windowHeight);

  // console.log(this);
  // console.log(this._renderer);
  // console.log(this._renderer._pInst);

  var w = Math.ceil(windowWidth / 2);
  var h = windowHeight;
  
  var graphics1 = createGraphics(w, h, WEBGL)
  var graphics2 = createGraphics(w, h, WEBGL);
  
  console.log(Dw.EasyCam.INFO);

  easycam1 = new Dw.EasyCam(graphics1._renderer, {distance : 600});
  easycam2 = new Dw.EasyCam(graphics2._renderer, {distance : 600});
  
  easycam1.setDistanceMin(10);
  easycam1.setDistanceMax(3000);
  
  easycam2.setDistanceMin(10);
  easycam2.setDistanceMax(3000);
  
  easycam1.attachMouseListeners(this._renderer);
  easycam2.attachMouseListeners(this._renderer);
  
  
  // add some custom attributes
  easycam1.IDX = 0;
  easycam2.IDX = 1;
  
  // set viewports
  easycam1.setViewport([0,0,w,h]);
  easycam2.setViewport([w,0,w,h]);
  
  // some debug stuff, p5 is quite confusing at this point
  // console.log("--------------------------------")
  // console.log("this");
  // console.log(this);
  // console.log("--------------------------------")
  // console.log("canvas");
  // console.log(canvas);
  // console.log("--------------------------------")
  // console.log("graphics");
  // console.log(graphics1);
  // console.log(graphics2);
  // console.log("--------------------------------")
  // console.log("easycam.renderer");
  // console.log(easycam1.renderer);
  // console.log(easycam2.renderer);
  // console.log("--------------------------------")
  // console.log("easycam.graphics");
  // console.log(easycam1.graphics);
  // console.log(easycam2.graphics);
  // console.log("--------------------------------")

} 



function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  var w = Math.ceil(windowWidth / 2);
  var h = windowHeight;
  
  // resize p5.RendererGL
  easycam1.renderer.resize(w,h);
  easycam2.renderer.resize(w,h);
  
  // set new graphics dim
  easycam1.graphics.width  = w;
  easycam1.graphics.height = h;
  
  easycam2.graphics.width  = w;
  easycam2.graphics.height = h;

  // set new viewport
  easycam1.setViewport([0,0,w,h]);
  easycam2.setViewport([w,0,w,h]);
}



function draw(){
 
  handleSuperController([easycam1, easycam2]);
  
  // render a scene for each camera
  displayScene(easycam1);
  displayScene(easycam2);

  // display results
  displayResult_P2D();
  // displayResult_WEBGL();
}

// use this, when the main canvas is P2D ... createCanvas(w,h,P2D)
function displayResult_P2D(){
  var vp1 = easycam1.getViewport();
  var vp2 = easycam2.getViewport();
  
  image(easycam1.graphics, vp1[0], vp1[1], vp1[2], vp1[3]);
  image(easycam2.graphics, vp2[0], vp2[1], vp2[2], vp2[3]);
}


// use this, when the main canvas is WEBGL ... createCanvas(w,h,WEBGL)
function displayResult_WEBGL(){
  var vp1 = easycam1.getViewport();
  var vp2 = easycam2.getViewport();
 
  resetMatrix();
  ortho(0, width, -height, 0, -Number.MAX_VALUE, +Number.MAX_VALUE);

  texture(easycam1.graphics);
  rect(vp1[0], vp1[1], vp1[2], vp1[3]);
  
  texture(easycam2.graphics);
  rect(vp2[0], vp2[1], vp2[2], vp2[3]);
}




function displayScene(cam){

  var pg = cam.graphics;
  
  var w = pg.width;
  var h = pg.height;
  
  var gray = 200;
  
  pg.push();
  pg.noStroke();
  
  // projection
  pg.perspective(60 * PI/180, w/h, 1, 5000);

  // BG
	if(cam.IDX == 0) pg.background(220);
  if(cam.IDX == 1) pg.background(32);
 
  pg.ambientLight(100);
  pg.pointLight(255, 255, 255, 0, 0, 0);
  
  // objects
  randomSeed(2);
  for(var i = 0; i < 50; i++){
    pg.push();
    var m = 100;
    var tx = random(-m, m);
    var ty = random(-m, m);
    var tz = random(-m, m);

    var r = ((tx / m) * 0.5 + 0.5) * 255;
    var g = ((ty / m) * 0.5 + 0.5) * r/2;
    var b = ((tz / m) * 0.5 + 0.5) * g;
 
    pg.translate(tx, ty, tz);
    
    var gray = random(64,255);

    if(cam.IDX == 0) pg.ambientMaterial(r,g,b);
    if(cam.IDX == 1) pg.ambientMaterial(gray);
    
    pg.box(random(10,40));
    pg.pop();
  }
  
  pg.ambientMaterial(255, 220, 0);
  pg.box(50, 50, 10);
  
  pg.push();
  pg.rotateZ(sin(frameCount*0.015) * PI*1.5);
  pg.translate(120, 0, 0);
  pg.ambientMaterial(0,128,255);
  pg.sphere(15);
  pg.pop();
    
  pg.push();
  pg.rotateX(sin(frameCount*0.02) * PI);
  pg.translate(0, 150, 0);
  pg.ambientMaterial(128,255,0);
  pg.sphere(15);
  pg.pop();
  
  pg.pop();
}



function mousePressed(){
}






function handleSuperController(cameralist){

  if(keyIsPressed && key === ' '){
    
    var delay = 150; 
    var active  = undefined;
    var focused = undefined;
    
    // find active or focused camera which controls the others
    for(var i in cameralist){
      var cam = cameralist[i];
      if(cam.mouse.isPressed){
        active = cam;
        break;
      }
      if(cam.mouse.insideViewport(mouseX, mouseY)){
        focused = cam;
      }
    }
    
    // no active camera, try focused
    active = active || focused;
    
    // apply state to all other cameras
    if(active) {
      var state = active.getState();
      for(var i in cameralist){
        var cam = cameralist[i];
        if(cam != active){
          cam.setState(state, delay);
        }
      }
    }
  }
  
}









////////////////////////////////////////////////////////////////////////////////
//
// patches, bug fixes, workarounds, ...
//
////////////////////////////////////////////////////////////////////////////////

p5.RendererGL.prototype._applyColorBlend = function(v1,v2,v3,a){
  var gl = this.GL;
  
  // p5.BUG
  var inst = this._pInst;
  if(inst instanceof p5.Graphics){
    var inst = inst._pInst;
  }
  // p5.BUG
  

  var color = inst.color.apply(inst, arguments);
  var colors = color._array;
  if(colors[colors.length-1] < 1.0){
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendEquation( gl.FUNC_ADD );
    gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
  } else {
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }
  return colors;
};

























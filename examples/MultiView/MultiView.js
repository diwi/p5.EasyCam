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
 
 
var NX = 3;
var NY = 2;
var cameras = [];

function setup() { 
  createCanvas(windowWidth, windowHeight, WEBGL);
  
  setAttributes('antialias', true);
  console.log(Dw.EasyCam.INFO);
  
  var RENDERER = this._renderer;
  // console.log(this);
  // console.log(this._renderer);
  // console.log(this._renderer._pInst);

  // console.log(this instanceof p5);

  cameras.length = NX * NY;
 
  for(var i = 0; i < cameras.length; i++){
    cameras[i] = new Dw.EasyCam(RENDERER);
    cameras[i].ID = i;
    cameras[i].setCanvas(null);      // no canvas needed
    cameras[i].setAutoUpdate(false); // update is handled manually
    // cameras[i].P5 = this;
  
    // set some random states at the beginning
    var rx = random(-PI,PI)/8;
    var ry = random(-PI,PI)/4;
    var rz = random(-PI,PI)/1;
    cameras[i].setRotation(Dw.Rotation.create({angles_xyz:[rx,ry,rz]}), 2000);
    cameras[i].setDistance(random(400, 600), 2000);
  }
  
  // set camera viewports
  setCameraViewports();

  // set camera callbacks
  RENDERER.mousePressed (function(event){
    for (var i in cameras){
      cameras[i].mouse.pressed(event);
    }
  });
  RENDERER.mouseReleased (function(event){ 
    for (var i in cameras){
      cameras[i].mouse.released(event);
    }
  });
  RENDERER.mouseClicked (function(event){  
    for (var i in cameras){
      cameras[i].mouse.clicked(event);
    }
  });
  RENDERER.mouseWheel (function(event){  
    for (var i in cameras){
      cameras[i].mouse.wheel(event);
    }
  });
  
}


function setCameraViewports(){
  var border = 2;
  var dimx = (width  / NX);
  var dimy = (height / NY);
  
  for(var y = 0; y < NY; y++){
    for(var x = 0; x < NX; x++){
      var id = y * NX + x;
      var cw = dimx - border * 2;
      var ch = dimy - border * 2;
      var cx = x * dimx + border;
      var cy = y * dimy + border;
      cameras[id].setViewport([cx, cy, cw, ch]); // this is the key of this whole demo
    }
  }
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  setCameraViewports();
}


function setGLGraphicsViewport(x,y,w,h){
  var gl = this._renderer.GL;
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor (x,y,w,h);
  gl.viewport(x,y,w,h);
}


function draw(){
  // for (var i in cameras){
    // cameras[i].update();
  // }
  
  // cameras.forEach(function(cam) { 
    // cam.update();
  // });
  
  
  // cameras.forEach(function(cam) { 
    // displayScene(cam);
  // });
  
  
  // update current camera states
  for (var i in cameras){
    cameras[i].update();
  }
  
  // check if god-mode is on
  handleSuperController(cameras)
  
  // clear background once, for the whole window
  setGLGraphicsViewport(0,0,width,height);
  background(0);
  
  // render scene once per camera/viewport
  for (var i in cameras){
    var cam =  cameras[i];
    push();
    displayScene(cam);
    pop();
  }
  
}



function displayScene(cam){
  
  var viewport = cam.getViewport();
  var w = viewport[2];
  var h = viewport[3];
  var x = viewport[0];
  var y = viewport[1];
  var y_inv =  height - y - h; // inverted y-axis
  
  // scissors-test and viewport transformation
  setGLGraphicsViewport(x,y_inv,w,h);
  
  // modelview - using camera state
  cam.apply(this._renderer);
  
  // projection - using camera viewport
  perspective(60 * PI/180, w/h, 1, 5000);
  
  // clear background (scissors makes sure we only clear the region we own)
  background(32);
  
  // render scene as usual
	strokeWeight(1);

	fill(255, 64, 0);
	box(200);
  
	push();
	translate(0, +200, 0);
	fill(0, 64, 255);
	box(100);
	pop();
  
  push();
	translate(0, -200, 0);
	fill(64, 255, 0);
	box(50);
	pop();
  
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
  


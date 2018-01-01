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
 
 

// var easycam;

function setup() { 
  var canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  setAttributes('antialias', true);
  console.log(Dw.EasyCam.INFO);

  // easycam = new Dw.EasyCam(this._renderer, {distance : 600});
  easycam = createEasyCam({distance : 600});
  
  // some debug stuff, p5 is quite confusing at this point
  // console.log("--------------------------------")
  // console.log("this");
  // console.log(this);
  // console.log("--------------------------------")
  // console.log("canvas");
  // console.log(canvas);
  // console.log("--------------------------------")
  // console.log("easycam.renderer");
  // console.log(easycam.renderer);
  // console.log("--------------------------------")
  // console.log("easycam.graphics");
  // console.log(easycam.graphics);
  // console.log("--------------------------------")
  // console.log("easycam.P5");
  // console.log(easycam.P5);
  // console.log("--------------------------------")
  
} 


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  easycam.setViewport([0,0,windowWidth, windowHeight]);
}


function draw(){
	rotateX(-0.5);
	rotateY(-0.5);
	scale(10);
  
  background(0);
	strokeWeight(1);

	fill(255, 64, 0);
	box(15);
  
	push();
	translate(0, 0, 20);
	fill(0, 64, 255);
	box(5);
	pop();
  
  push();
	translate(0, 0, -20);
	fill(64, 255, 0);
	box(5);
	pop();
}












# p5.EasyCam

Simple 3D camera control for p5js and the WEBGL renderer.

This library is a derivative of the original PeasyCam Library by Jonathan Feinberg 
and combines new useful features with the great look and feel of the original version.

Java Version of this project: https://github.com/diwi/peasycam/tree/PeasyCam3


## Examples

- [CameraStates](https://diwi.github.io/p5.EasyCam/examples/CameraStates/)
- [CameraStates_Basic](https://diwi.github.io/p5.EasyCam/examples/CameraStates_Basic/)
- [HeadUpDisplay](https://diwi.github.io/p5.EasyCam/examples/HeadUpDisplay/)
- [QuickStart](https://diwi.github.io/p5.EasyCam/examples/QuickStart/)
- [QuickStart_Ortho](https://diwi.github.io/p5.EasyCam/examples/QuickStart_Ortho/)
- [SplitView](https://diwi.github.io/p5.EasyCam/examples/SplitView/)
- [MultiView](https://diwi.github.io/p5.EasyCam/examples/MultiView/)


## Usage

```javascript
var easycam;

function setup() { 
  createCanvas(windowWidth, windowHeight, WEBGL);

  easycam = createEasyCam();
  // easycam = new Dw.EasyCam(this._renderer);
  // easycam = new Dw.EasyCam(this._renderer, {distance:300, center:[0,0,0]});
} 

function draw(){
  background(64);
  fill(255);
  box(200);
}
```
something to play: [jsfiddle](https://jsfiddle.net/wqjugp9m/7/)


## Reference

... coming ...

for now, the Java API should do it:
- http://thomasdiewald.com/processing/libraries/PeasyCam3/reference/index.html


## Screenshots

![MultiView](screenshots/MultiView.jpg)

![CameraStates](screenshots/CameraStates.jpg)

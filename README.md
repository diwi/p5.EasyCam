![MultiView](screenshots/RandomBoxes_crop.jpg)


# p5.EasyCam

Simple 3D camera control for p5js and the WEBGL renderer.

This library is a derivative of the original PeasyCam Library by Jonathan Feinberg 
and combines new useful features with the great look and feel of the original version.

Java Version of this project: https://github.com/diwi/peasycam/tree/PeasyCam3


## Releases

- [p5.easycam.js](https://diwi.github.io/p5.EasyCam/p5.easycam.js)
- [p5.easycam.min.js](https://diwi.github.io/p5.EasyCam/p5.easycam.min.js)
- [All Releases](https://github.com/diwi/p5.EasyCam/releases)


## Examples

- [PerPixelPhong](https://diwi.github.io/p5.EasyCam/examples/PerPixelPhong/)
- [RandomBoxes](https://diwi.github.io/p5.EasyCam/examples/RandomBoxes/)
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
  // easycam = new Dw.EasyCam(this._renderer, {distance:300, center:[0,0,0], rotation:[1,0,0,0]});
} 

function draw(){
  background(64);
  fill(255);
  box(200);
}
```
something to play: [jsfiddle](https://jsfiddle.net/wqjugp9m/7/)


## Reference

  - [p5.EasyCam.documentation](https://diwi.github.io/p5.EasyCam/documentation/)
  
  
```
  
+ AUTOUPDATE
  - setAutoUpdate(status)
  - getAutoUpdate()

// INPUT HANDLER
attachMouseListeners(renderer)
removeMouseListeners()

// RENDERER
setCanvas(renderer)
getCanvas()

// VIEWPORT (bounding screen-rectangle)
setViewport(viewport)
getViewport()

// APPLY CURRENT STATE TO RENDERER
apply(renderer)

// UPDATE STATE
update()

// DELETE
dispose()



// INPUT BEHAVIOUR/SCALE/SPEED
setZoomScale(scale_zoom)
getZoomScale()
setPanScale(scale_pan)
getPanScale()
setRotationScale(scale_rotation)
getRotationScale()
setWheelScale(wheelScale)
getWheelScale()
setDefaultInterpolationTime(duration)
setDamping(damping)
setRotationConstraint(yaw, pitch, roll)


// GET ZOOM/PAN/ROTATE/POSITION/UP
getCenter()
getDistance()
getRotation()
getUpVector(dst)
getPosition(dst)


// SET ZOOM/PAN/ROTATE
setDistance(distance, duration)
setDistanceMax(distance_max)
setDistanceMin(distance_min)
setCenter(center, duration)
setRotation(rotation, duration)
setInterpolatedCenter(valA, valB, t)
setInterpolatedDistance(valA, valB, t)
setInterpolatedRotation(valA, valB, t)


// MODIFY ZOOM/PAN/ROTATE
zoom(dz)
pan(dx, dy)
panX(dx)
panY(dy)
pan(dx, dy)
rotateX(rx)
rotateY(ry)
rotateZ(rz)
rotate(axis, angle)


// STATE MANAGEMENT
setState(other, duration)
getState()
pushState()
popState(duration)
pushResetState()
reset(duration)


// HEAD_UP_DISPLAY
beginHUD(renderer, w, h)
endHUD(renderer)


```


## Screenshots

![MultiView](screenshots/MultiView.jpg)

![PerPixelPhong](screenshots/PerPixelPhong.jpg)

![CameraStates](screenshots/CameraStates.jpg)

![MultiView](screenshots/RandomBoxes.jpg)

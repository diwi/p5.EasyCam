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


// Dw namespace, .... new Dw.EasyCam(renderer, args);
var Dw = {};


 
(function(ext) {
  
  
// p5.EasyCam library info
const INFO = 
{
  LIBRARY : "p5.EasyCam",
  VERSION : "1.0.5",
  AUTHOR  : "Thomas Diewald",
  SOURCE  : "https://github.com/diwi/p5.EasyCam",
  
  toString : function(){
    return this.LIBRARY+" v"+this.VERSION+" by "+this.AUTHOR+" ("+this.SOURCE+")";
  },
  
};




/**
 * p5.EasyCam
 *
 *   new p5.EasyCam(p5.RendererGL, {
 *     distance : z                 // scalar
 *     center   : [x, y, z]         // vector
 *     rotation : [q0, q1, q2, q3]  // quaternion
 *     viewport : [x, y, w, h]      // array
 *   }
 *
 */
 
var EasyCam = class {
  

  /**
   *
   * renderer ... p5.RendererGL
   * args     ... {distance, center, rotation, viewport}
   *
   */
  constructor(renderer, args) {
    

    // WEBGL renderer required
    if(!(renderer instanceof p5.RendererGL)){
      console.log("renderer needs to be an instance of p5.RendererGL");
      return;
    }
    
    // define default args
    args = args || {};
    if(args.distance === undefined) args.distance  = 500;
    if(args.center   === undefined) args.center    = [0, 0, 0];
    if(args.rotation === undefined) args.rotation  = Rotation.identity();
    if(args.viewport === undefined) args.viewport  = [0, 0, renderer.width, renderer.height];
   

    // library info
    this.INFO = INFO;

    // set renderer, graphics, p5
    // this.renderer;
    // this.graphics;
    // this.P5
    this.setCanvas(renderer);

    // self reference
    var cam = this;
    this.cam = cam;
    
    // some constants
    this.LOOK = [0, 0, 1];
    this.UP   = [0, 1, 0];

    // principal axes flags
    this.AXIS = new function() {
      this.YAW   = 0x01;
      this.PITCH = 0x02;
      this.ROLL  = 0x04;
      this.ALL   = this.YAW | this.PITCH | this.ROLL;
    };
  
    // mouse action constraints
    this.SHIFT_CONSTRAINT = 0; // applied when pressing the shift key
    this.FIXED_CONSTRAINT = 0; // applied, when set by user and SHIFT_CONSTRAINT is 0
    this.DRAG_CONSTRAINT  = 0; // depending on SHIFT_CONSTRAINT and FIXED_CONSTRAINT, default is ALL
    
    // mouse action speed
    this.scale_rotation  = 0.001;
    this.scale_pan       = 0.0002;
    this.scale_zoom      = 0.001;
    this.scale_zoomwheel = 20.0;
    
    this.default_interpolation_time = 300;
    
    // zoom limits
    this.distance_min_limit = 0.01;
    this.distance_min       = 1.0;
    this.distance_max       = Number.MAX_VALUE;
    
    // main state
    this.state = {
      distance : args.distance,         // scalar
      center   : args.center.slice(),   // vec3
      rotation : args.rotation.slice(), // quaternion
      
      copy : function(dst){
        dst = dst || {};
        dst.distance = this.distance;      
        dst.center   = this.center.slice(); 
        dst.rotation = this.rotation.slice();
        return dst;
      },
    };

    // backup-state at start
    this.state_reset  = this.state.copy();
    // backup-state, probably not required
    this.state_pushed = this.state.copy();
    
    // viewport for the mouse-pointer [x,y,w,h]
    this.viewport = args.viewport.slice();
    
    // mouse action handler
    this.mouse = {
      cam : cam,
      
      curr   : [0,0],
      prev   : [0,0],
      dist   : [0,0],
      mwheel : 0,
      
      isPressed : false,
      button : -1,
      
      mouseDragLeft   : cam.mouseDragRotate,
      mouseDragCenter : cam.mouseDragPan,
      mouseDragRight  : cam.mouseDragZoom,
      mouseWheelAction: cam.mouseWheelZoom,
     
      
      insideViewport : function(x, y){
        var x0 = cam.viewport[0], x1 = x0 + cam.viewport[2];
        var y0 = cam.viewport[1], y1 = y0 + cam.viewport[3];
        return (x > x0) && (x < x1) && (y > y0) && (y < y1);
      },
      
      solveConstraint : function(){
        var dx = this.dist[0];
        var dy = this.dist[1];
        
        // YAW, PITCH
        if (this.shiftKey && !cam.SHIFT_CONSTRAINT && Math.abs(dx - dy) > 1) {
          cam.SHIFT_CONSTRAINT = Math.abs(dx) > Math.abs(dy) ? cam.AXIS.YAW : cam.AXIS.PITCH;
        }
        
        // define constraint by increasing priority
        cam.DRAG_CONSTRAINT = cam.AXIS.ALL;
        if(cam.FIXED_CONSTRAINT) cam.DRAG_CONSTRAINT = cam.FIXED_CONSTRAINT;
        if(cam.SHIFT_CONSTRAINT) cam.DRAG_CONSTRAINT = cam.SHIFT_CONSTRAINT;
      },
      
      mousedown : function(event){

        // console.log("pressed");
        var mouse = cam.mouse;

        var x = event.x;
        var y = event.y;

        if(mouse.insideViewport(x, y)){
          mouse.curr[0] = mouse.prev[0] = x;
          mouse.curr[1] = mouse.prev[1] = y;
          
          mouse.dist[0] = 0;
          mouse.dist[1] = 0;
          
          mouse.isPressed = true;
          mouse.button = event.button;
          cam.SHIFT_CONSTRAINT = 0;
        }
      },
      
      update : function(){
        // console.log("update");
        var mouse = cam.mouse;
        if(mouse.isPressed){
          mouse.prev[0] = mouse.curr[0];
          mouse.prev[1] = mouse.curr[1];
         
          mouse.curr[0] = cam.P5.mouseX;
          mouse.curr[1] = cam.P5.mouseY;
          
          mouse.dist[0] = -(mouse.curr[0] - mouse.prev[0]);
          mouse.dist[1] = -(mouse.curr[1] - mouse.prev[1]);
          
          mouse.solveConstraint();
          
          if(mouse.button === 0 && mouse.mouseDragLeft  ) mouse.mouseDragLeft();
          if(mouse.button === 1 && mouse.mouseDragCenter) mouse.mouseDragCenter();
          if(mouse.button === 2 && mouse.mouseDragRight ) mouse.mouseDragRight();
        }
      },
      
      mouseup : function(event){
        // console.log("released");
        cam.mouse.isPressed = false;
        cam.SHIFT_CONSTRAINT = 0;
      },
      
 
      dblclick : function(event){
        var x = event.x;
        var y = event.y;
        if(cam.mouse.insideViewport(x, y)){
          cam.reset();
        }
      },
      
      wheel : function(event){
        var x = event.x;
        var y = event.y;
        var mouse = cam.mouse;
        if(mouse.insideViewport(x, y)){
          mouse.mwheel = event.deltaY * 0.01;
          if(mouse.mouseWheelAction) mouse.mouseWheelAction();
        }
      },
      
      
      // key-event for shift constraints
      shiftKey : false,
   
      keydown : function(event){
        var mouse = cam.mouse;
        if(!mouse.shiftKey){
          mouse.shiftKey   = (event.keyCode === 16);
        }
      },
      
      keyup : function(event){
        var mouse = cam.mouse;
        if(mouse.shiftKey){
          mouse.shiftKey = (event.keyCode !== 16);
          if(!mouse.shiftKey){
            cam.SHIFT_CONSTRAINT = 0;
          }
        }
      }
      
    };
    
    

    // camera mouse listeners
    this.attachMouseListeners();
   
    // P5 registered callbacks, TODO unregister on dispose
    this.auto_update = true;
    this.P5.registerMethod('pre', function(){
      if(cam.auto_update){
        cam.update(); 
      }
    });
 
    // damped camera transition
    this.dampedZoom = new DampedAction(this, function(d){ cam.zoom   (d * cam.getZoomMult    ()); }  );
    this.dampedPanX = new DampedAction(this, function(d){ cam.panX   (d * cam.getPanMult     ()); }  );
    this.dampedPanY = new DampedAction(this, function(d){ cam.panY   (d * cam.getPanMult     ()); }  );
    this.dampedRotX = new DampedAction(this, function(d){ cam.rotateX(d * cam.getRotationMult()); }  );
    this.dampedRotY = new DampedAction(this, function(d){ cam.rotateY(d * cam.getRotationMult()); }  );
    this.dampedRotZ = new DampedAction(this, function(d){ cam.rotateZ(d * cam.getRotationMult()); }  );
    
    // interpolated camera transition
    this.timedRot  = new Interpolation(this, this.setInterpolatedRotation);
    this.timedPan  = new Interpolation(this, this.setInterpolatedCenter  );
    this.timedzoom = new Interpolation(this, this.setInterpolatedDistance);
  }
  
  

  
  setCanvas(renderer){
    if(renderer instanceof p5.RendererGL){
      // p5js seems to be not very clear about this
      // ... pretty confusing, so i guess this could change in future releases
      this.renderer = renderer;
      if(renderer._pInst instanceof p5){
        this.graphics = renderer;
      } else {
        this.graphics = renderer._pInst;
      }
      this.P5 = this.graphics._pInst;
    } else {
      this.graphics = undefined;
      this.renderer = undefined;
    }
  }

  getCanvas(){
    return this.renderer;
  }
  
  
  
  attachListener(el, ev, fx, op){
    if(!el || (el === fx.el)){
      return;
    }
    
    this.detachListener(fx);

    fx.el = el;
    fx.ev = ev;
    fx.op = op;
    fx.el.addEventListener(fx.ev, fx, fx.op);
  }
  
  detachListener(fx){
    if(fx.el) {
      fx.el.removeEventListener(fx.ev, fx, fx.op);
      fx.el = undefined;
    }
  }
  

  
  attachMouseListeners(renderer){
    var cam = this.cam;
    var mouse = cam.mouse;
    
    renderer = renderer || cam.renderer;
    if(renderer){
      
      var op = { passive:true };
      var el = renderer.elt;
      
      cam.attachListener(el    , 'mousedown', mouse.mousedown, op);
      cam.attachListener(el    , 'mouseup'  , mouse.mouseup  , op);
      cam.attachListener(el    , 'dblclick' , mouse.dblclick , op);
      cam.attachListener(el    , 'wheel'    , mouse.wheel    , op);
      cam.attachListener(window, 'keydown'  , mouse.keydown  , op);
      cam.attachListener(window, 'keyup'    , mouse.keyup    , op);
    }
  }
  
  removeMouseListeners(){
    var cam = this.cam;
    var mouse = cam.mouse;
       
    cam.detachListener(mouse.mousedown);
    cam.detachListener(mouse.mouseup  );
    cam.detachListener(mouse.dblclick );
    cam.detachListener(mouse.wheel    );
    cam.detachListener(mouse.keydown  );
    cam.detachListener(mouse.keyup    );
  }
  
  
  dispose(){
    // TODO: p5 unregister 'pre', ... not available in 0.5.16
    removeMouseListeners();
  }
  
  
  getAutoUpdate(){
    return this.auto_update;
  }
  
  setAutoUpdate(status){
    this.auto_update = status;
  }
  

  
  
  // [x,y,w,h]
  setViewport(viewport){
    this.viewport = viewport.slice();
  }
  
  getViewport(){
    return this.viewport;
  }

  
  // main easycam update call, registeredPre > update
  update(){
    var cam = this.cam;
    var mouse = cam.mouse;
    
    mouse.update();
    
    var b_update = false;
    b_update |= cam.dampedZoom.update();
    b_update |= cam.dampedPanX.update();
    b_update |= cam.dampedPanY.update();
    b_update |= cam.dampedRotX.update();
    b_update |= cam.dampedRotY.update();
    b_update |= cam.dampedRotZ.update();
    
    // interpolated actions have lower priority then damped actions
    if(b_update){
      cam.timedRot .stop();
      cam.timedPan .stop();
      cam.timedzoom.stop();
    } else {
      cam.timedRot .update();
      cam.timedPan .update();
      cam.timedzoom.update();
    }
 
    cam.apply();
  }
  

  apply(renderer) { 

    var cam = this.cam;
    renderer = renderer || cam.renderer;
    
    if(renderer){
      this.camEYE = this.getPosition(this.camEYE);   
      this.camLAT = this.getCenter  (this.camLAT);
      this.camRUP = this.getUpVector(this.camRUP);
      
      renderer.camera(this.camEYE[0], this.camEYE[1], this.camEYE[2],
                      this.camLAT[0], this.camLAT[1], this.camLAT[2],
                      this.camRUP[0], this.camRUP[1], this.camRUP[2]);
    }

  }
  


    
  //
  // mouse state changes
  //
  mouseWheelZoom() {
    var mouse = this;
    var cam = this.cam;
    cam.dampedZoom.addForce(mouse.mwheel * cam.scale_zoomwheel);
  }
  
  mouseDragZoom() {
    var mouse = this;
    var cam = this.cam;
    cam.dampedZoom.addForce(-mouse.dist[1]);
  }
  
  mouseDragPan() {
    var mouse = this;
    var cam = this.cam;
    cam.dampedPanX.addForce((cam.DRAG_CONSTRAINT & cam.AXIS.YAW  ) ? mouse.dist[0] : 0);
    cam.dampedPanY.addForce((cam.DRAG_CONSTRAINT & cam.AXIS.PITCH) ? mouse.dist[1] : 0);
  }
  
  mouseDragRotate() {
    var mouse = this;
    var cam = this.cam;
    
    var mx = mouse.curr[0], my = mouse.curr[1];
    var dx = mouse.dist[0], dy = mouse.dist[1];
    
    // mouse [-1, +1]
    var mxNdc = Math.min(Math.max((mx - cam.viewport[0]) / cam.viewport[2], 0), 1) * 2 - 1;
    var myNdc = Math.min(Math.max((my - cam.viewport[1]) / cam.viewport[3], 0), 1) * 2 - 1;

    if (cam.DRAG_CONSTRAINT & cam.AXIS.YAW) {
      cam.dampedRotY.addForce(+dx * (1.0 - myNdc * myNdc));
    }
    if (cam.DRAG_CONSTRAINT & cam.AXIS.PITCH) {
      cam.dampedRotX.addForce(-dy * (1.0 - mxNdc * mxNdc));
    }
    if (cam.DRAG_CONSTRAINT & cam.AXIS.ROLL) {
      cam.dampedRotZ.addForce(-dx * myNdc);
      cam.dampedRotZ.addForce(+dy * mxNdc);
    }
  }
  
  
  //
  // damped multipliers
  //
  getZoomMult(){
    return this.state.distance * this.scale_zoom;
  }
  
  getPanMult(){
    return this.state.distance * this.scale_pan;
  }
  
  getRotationMult(){
    return Math.pow(Math.log10(1 + this.state.distance), 0.5) * this.scale_rotation;
  }
  
  
  
 
  
  //
  // damped state changes
  //
  zoom(dz){
    var cam = this.cam;
    var distance_tmp = cam.state.distance + dz;
    
    // check lower bound
    if(distance_tmp < cam.distance_min) {
      distance_tmp = cam.distance_min;
      cam.dampedZoom.stop();
    }
    
    // check upper bound
    if(distance_tmp > cam.distance_max) {
      distance_tmp = cam.distance_max;
      cam.dampedZoom.stop();
    }
    
    cam.state.distance = distance_tmp;
  }
  
  panX(dx) {
    var state = this.cam.state;
    if(dx) {
      var val = Rotation.applyToVec3(state.rotation, [dx, 0, 0]);
      Vec3.add(state.center, val, state.center);
    }
  }
  
  panY(dy) {
    var state = this.cam.state;
    if(dy) {
      var val = Rotation.applyToVec3(state.rotation, [0, dy, 0]);
      Vec3.add(state.center, val, state.center);
    }
  }
  
  pan(dx, dy) {
    this.cam.panX(dx);
    this.cam.panY(dx);
  }

  rotateX(rx) {
   this.cam.rotate([1,0,0], rx);
  }

  rotateY(ry) {
    this.cam.rotate([0,1,0], ry);
  }

  rotateZ(rz) {
    this.cam.rotate([0,0,1], rz);
  }
  
  rotate(axis, angle) {
    var state = this.cam.state;
    if(angle) {
      var new_rotation = Rotation.create({axis:axis, angle:angle});
      Rotation.applyToRotation(state.rotation, new_rotation, state.rotation);
    }
  }
  
  
  


  
  
  // 
  // interpolated states
  //
  setInterpolatedDistance(valA, valB, t) {
    this.cam.state.distance = Scalar.mix(valA, valB, Scalar.smoothstep(t));
  }
  setInterpolatedCenter(valA, valB, t) {
    this.cam.state.center = Vec3.mix(valA, valB, Scalar.smoothstep(t));
  }
  setInterpolatedRotation(valA, valB, t) {
    this.cam.state.rotation = Rotation.slerp(valA, valB, t);
  }
  
  
  
  //
  // DISTANCE
  //
  setDistanceMin(distance_min) {
    this.distance_min = Math.max(distance_min, this.distance_min_limit);
    this.zoom(0); // update, to ensure new minimum
  }

  setDistanceMax(distance_max) {
    this.distance_max = distance_max;
    this.zoom(0); // update, to ensure new maximum
  }
  
  setDistance(distance, duration) {
    this.timedzoom.start(this.state.distance, distance, duration, [this.dampedZoom]);
  }
  getDistance() {
    return this.state.distance;
  }
  
  //
  // CENTER / LOOK AT
  //
  setCenter(center, duration) {
    this.timedPan.start(this.state.center, center, duration, [this.dampedPanX, this.dampedPanY]);
  }
  getCenter() {
    return this.state.center;
  }
  
  //
  // ROTATION
  //
  setRotation(rotation, duration) {
    this.timedRot.start(this.state.rotation, rotation, duration, [this.dampedRotX, this.dampedRotY, this.dampedRotZ]);
  }
  getRotation() {
    return this.state.rotation;
  }
  

  
  //
  // CAMERA POSITION/EYE
  //
   getPosition(dst) {

    var cam = this.cam;
    var state = cam.state;
    
    dst = Vec3.assert(dst);
    Rotation.applyToVec3(state.rotation, cam.LOOK, dst);
    Vec3.mult(dst, state.distance, dst);
    Vec3.add(dst, state.center, dst);

    return dst;
  }

  //
  // CAMERA UP
  //
  getUpVector(dst) {
    var cam = this.cam;
    var state = cam.state;
    dst = Vec3.assert(dst);
    Rotation.applyToVec3(state.rotation, cam.UP, dst);
    return dst;
  }
  
  
  
  
  
  
  
  
    
  //
  // STATE (rotation, center, distance)
  //
  getState() {
    return this.state.copy();
  }  
  
  setState(other, duration) {
    if(other){
      this.setDistance(other.distance, duration);
      this.setCenter  (other.center  , duration);
      this.setRotation(other.rotation, duration);
    }
  }

  pushState(){
    return (this.state_pushed = this.getState());
  }
  
  popState(duration){
    this.setState(this.state_pushed, duration);
  }
  
  pushResetState(){
    return (this.state_reset = this.getState());
  }
  
  reset(duration){
    this.setState(this.state_reset, duration);
  }
  
  
  
  
  

  
  
  
  setRotationScale(scale_rotation){
    this.scale_rotation = scale_rotation;
  }
  
  setPanScale(scale_pan){
    this.scale_pan = scale_pan;
  }
  
  setZoomScale(scale_zoom){
    this.scale_zoom = scale_zoom;
  }
  
  getRotationScale(){
    return this.scale_rotation;
  }
  
  getPanScale(){
    return this.scale_pan;
  }
  
  getZoomScale(){
    return this.scale_zoom;
  }
  
  getWheelScale() {
    return this.scale_zoomwheel;
  }

  setWheelScale(wheelScale) {
    this.scale_zoomwheel = wheelScale;
  }
  
  setDamping(damping){
    this.dampedZoom.damping = damping;
    this.dampedPanX.damping = damping;
    this.dampedPanY.damping = damping;
    this.dampedRotX.damping = damping;
    this.dampedRotY.damping = damping;
    this.dampedRotZ.damping = damping;
  }
  
  setDefaultInterpolationTime(duration){
    this.default_interpolation_time = duration;
  }
  
  getDefaultInterpolationTime(){
    return this.default_interpolation_time;
  }
  
  setRotationConstraint(yaw, pitch, roll) {
    var cam = this.cam;
    cam.FIXED_CONSTRAINT  = 0;
    cam.FIXED_CONSTRAINT |= yaw   ? cam.AXIS.YAW   : 0;
    cam.FIXED_CONSTRAINT |= pitch ? cam.AXIS.PITCH : 0;
    cam.FIXED_CONSTRAINT |= roll  ? cam.AXIS.ROLL  : 0;
  }
  
  
  
 
  /**
   * 
   * begin screen-aligned 2D-drawing.
   * 
   * <pre>
   * beginHUD()
   *   disabled depth test
   *   ortho
   *   ... your code is executed here ...
   * endHUD()
   * </pre>
   * 
   */
  beginHUD(renderer, w, h) {
    var cam = this.cam;
    renderer = renderer || cam.renderer;
    
    if(!renderer) return;
    renderer.push();
    
    var gl = renderer.drawingContext;
    var w = (w !== undefined) ? w : renderer.width;
    var h = (h !== undefined) ? h : renderer.height;
    var d = Number.MAX_VALUE;
    
    gl.flush();
    // gl.finish();
    
    // 1) disable DEPTH_TEST
    gl.disable(gl.DEPTH_TEST);
    // 2) push modelview/projection
    //    p5 is not creating a push/pop stack
    this.pushed_uMVMatrix = renderer.uMVMatrix.copy();
    this.pushed_uPMatrix  = renderer.uPMatrix .copy();
    
    // 3) set new modelview (identity)
    renderer.resetMatrix();
    // 4) set new projection (ortho)
    renderer.ortho(0, w, -h, 0, -d, +d);
    // renderer.ortho();
    // renderer.translate(-w/2, -h/2);

  }
  
  

  /**
   * 
   * end screen-aligned 2D-drawing.
   * 
   */
  endHUD(renderer) {
    var cam = this.cam;
    renderer = renderer || cam.renderer;
    
    if(!renderer) return;
    
    var gl = renderer.drawingContext;
    
    gl.flush();
    // gl.finish();
      
    // 2) restore modelview/projection
    renderer.uMVMatrix.set(this.pushed_uMVMatrix);
    renderer.uPMatrix .set(this.pushed_uPMatrix );
    // 1) enable DEPTH_TEST
    gl.enable(gl.DEPTH_TEST);
    renderer.pop();
  }

  
  
}












var DampedAction = class {
    
  constructor(cam, cb_action){
    this.cam = cam;
    this.value = 0.0;
    this.damping = 0.85;
    this.action = cb_action;
  }

  addForce(force) {
    this.value += force;
  }

  update() {
    var active = (this.value*this.value) > 0.000001;
    if (active){
      this.action(this.value);
      this.value *= this.damping;
    } else {
      this.stop();
    }
    return active;
  }

  stop() {
    this.value = 0.0;
  }

}



var Interpolation = class {
    
  constructor(cam, cb_action){
    this.cam = cam;
    this.action = cb_action;
  }

  start(valA, valB, duration, actions) {
    for(var x in actions){
      actions[x].stop();
    }
    this.valA = valA;
    this.valB = valB;
    this.duration = (duration === undefined) ? this.cam.default_interpolation_time : duration;
    this.timer = new Date().getTime();
    this.active = this.duration > 0;
    if(!this.active){
      this.interpolate(1);
    }
  }
  
  update() {
    if(this.active){
      var t = (new Date().getTime() - this.timer) / this.duration;
      if (t > 0.995) {
        this.interpolate(1);
        this.stop();
      } else {
        this.interpolate(t);
      }
    }
  }
  
  interpolate(t){
    this.action(this.valA, this.valB, t);
  }
  
  stop() {
    this.active = false;
  }

}










var Rotation = 
{
  
  assert : function(dst){
    return ((dst === undefined) || (dst.constructor !== Array)) ? [1, 0, 0, 0] : dst;
  },
  
  // Return identity
  identity : function() {
    return [1, 0, 0, 0];
  },
  
  // Apply the rotation to a vector.
  applyToVec3 : function(rot, vec, dst) {
    var x = vec[0];
    var y = vec[1];
    var z = vec[2];
    
    var q0 = rot[0];
    var q1 = rot[1];
    var q2 = rot[2];
    var q3 = rot[3];
    
    var s = q1 * x + q2 * y + q3 * z;
    
    dst = Vec3.assert(dst);
    dst[0] = 2 * (q0 * (x * q0 - (q2 * z - q3 * y)) + s * q1) - x; 
    dst[1] = 2 * (q0 * (y * q0 - (q3 * x - q1 * z)) + s * q2) - y; 
    dst[2] = 2 * (q0 * (z * q0 - (q1 * y - q2 * x)) + s * q3) - z;
    return dst;
  },
  
  
  applyToRotation(rotA, rotB, dst) {
    var a0 = rotA[0], a1 = rotA[1], a2 = rotA[2], a3 = rotA[3];
    var b0 = rotB[0], b1 = rotB[1], b2 = rotB[2], b3 = rotB[3];
    
    dst = Rotation.assert(dst);
    dst[0] = b0 * a0 - (b1 * a1 +  b2 * a2 + b3 * a3);
    dst[1] = b1 * a0 +  b0 * a1 + (b2 * a3 - b3 * a2);
    dst[2] = b2 * a0 +  b0 * a2 + (b3 * a1 - b1 * a3);
    dst[3] = b3 * a0 +  b0 * a3 + (b1 * a2 - b2 * a1);
    return dst;     
  },
  
  
  
  slerp : function(rotA, rotB, t, dst) {
    var a0 = rotA[0], a1 = rotA[1], a2 = rotA[2], a3 = rotA[3];
    var b0 = rotB[0], b1 = rotB[1], b2 = rotB[2], b3 = rotB[3];
    
    var cosTheta = a0 * b0 + a1 * b1 + a2 * b2 + a3 * b3;
    if (cosTheta < 0) {
      b0 = -b0;
      b1 = -b1;
      b2 = -b2;
      b3 = -b3;
      cosTheta = -cosTheta;
    }
    
    var theta = Math.acos(cosTheta);
    var sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);
    
    var w1, w2;
    if (sinTheta > 0.001) {
      w1 = Math.sin((1.0 - t) * theta) / sinTheta;
      w2 = Math.sin(t * theta) / sinTheta;
    } else {
      w1 = 1.0 - t;
      w2 = t;
    }
    
    dst = Rotation.assert(dst);
    dst[0] = w1 * a0 + w2 * b0; 
    dst[1] = w1 * a1 + w2 * b1; 
    dst[2] = w1 * a2 + w2 * b2; 
    dst[3] = w1 * a3 + w2 * b3;
    
    return Rotation.create({rotation : dst, normalize : true}, dst);
  },
  
  
  create : function(def, dst) {
    
    dst = Rotation.assert(dst);
    
    // 1) from axis and angle
    if(def.axis)
    {
      var axis = def.axis;
      var angle = def.angle;
    
      var norm = Vec3.mag(axis);
      if (norm == 0.0) return; // vector is of zero length
      
      var halfAngle = -0.5 * angle;
      var coeff = Math.sin(halfAngle) / norm;

      dst[0] = Math.cos(halfAngle);
      dst[1] = coeff * axis[0];
      dst[2] = coeff * axis[1];
      dst[3] = coeff * axis[2];
      return dst;
    }
    
    // 2) from another rotation
    if(def.rotation)
    {
      dst[0] = def.rotation[0];
      dst[1] = def.rotation[1];
      dst[2] = def.rotation[2];
      dst[3] = def.rotation[3];
      
      if(def.normalize){
        var inv = 1.0 / Math.sqrt(dst[0]*dst[0] + dst[1]*dst[1] + dst[2]*dst[2] + dst[3]*dst[3]);
        dst[0] *= inv;
        dst[1] *= inv;
        dst[2] *= inv;
        dst[3] *= inv;
      }
       
      return dst;
    }
    
    // 3) from 3 euler angles, order XYZ
    if(def.angles_xyz){
      
      var ax = -0.5 *  def.angles_xyz[0];
      var ay = -0.5 *  def.angles_xyz[1];
      var az = -0.5 *  def.angles_xyz[2];
      
      var rotX = [Math.cos(ax), Math.sin(ax), 0, 0];
      var rotY = [Math.cos(ay), 0, Math.sin(ay), 0];
      var rotZ = [Math.cos(az), 0, 0, Math.sin(az)];
      
      Rotation.applyToRotation(rotY, rotZ, dst);
      Rotation.applyToRotation(rotX, dst, dst);
 
      return dst;
    }


  }
  
  
  //
  // ... to be continued ...
  //
  
};



var Scalar = {
  
  mix : function(a, b, t){
    return a * (1-t) + b * t;
  },
   
  smoothstep : function(x) {
    return x * x * (3 - 2 * x);
  },
  
  smootherstep : function(t) {
    return x * x * x * (x * (x * 6 - 15) + 10);
  },
  
};




var Vec3 = 
{
  
  assert : function(dst){
    return ((dst === undefined) || (dst.constructor !== Array)) ? [0, 0, 0] : dst;
  },
  
  isScalar : function(arg){
    // TODO: do some profiling to figure out what fails
    return (arg !== undefined) && (arg.constructor !== Array);
    // return typeof(arg) === 'number';
  },
  
  
  add : function(a, b, dst) {
    dst = this.assert(dst);
    if(this.isScalar(b)){
      dst[0] = a[0] + b;
      dst[1] = a[1] + b;
      dst[2] = a[2] + b;
    } else {
      dst[0] = a[0] + b[0];
      dst[1] = a[1] + b[1];
      dst[2] = a[2] + b[2];
    }
    return dst;
  },

  
  mult : function(a, b, dst){
    dst = this.assert(dst);
    if(this.isScalar(b)){
      dst[0] = a[0] * b;
      dst[1] = a[1] * b;
      dst[2] = a[2] * b;
    } else {
      dst[0] = a[0] * b[0];
      dst[1] = a[1] * b[1];
      dst[2] = a[2] * b[2];
    }
    return dst;
  },


  magSq : function(a) {
    return a[0]*a[0] + a[1]*a[1] + a[2]*a[2];
  },
  
  
  mag : function(a) {
    return Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]);
  },

  
  dot : function(a, b) {
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  },
  
  
  cross : function(a, b, dst) {
    dst = this.assert(dst);
    dst[0] = a[1] * b[2] - a[2] * b[1];
    dst[1] = a[2] * b[0] - a[0] * b[2];
    dst[2] = a[0] * b[1] - a[1] * b[0];
    return dst;
  },

  
  angle : function(v1, v2){

    var normProduct = this.mag(v1) * this.mag(v2);
    if (normProduct === 0.0) {
      return 0.0; // at least one vector is of zero length
    }
    
    var dot = this.dot(v1, v2);
    var threshold = normProduct * 0.9999;
    if ((dot < -threshold) || (dot > threshold)) {
      // the vectors are almost aligned, compute using the sine
      var v3 = this.cross(v1, v2);
      if (dot >= 0) {
        return Math.asin(this.mag(v3) / normProduct);
      } else {
        return Math.PI - Math.asin(this.mag(v3) / normProduct);
      }
    }
    
    // the vectors are sufficiently separated to use the cosine
    return Math.acos(dot / normProduct);
  },
  
  
  mix(a, b, t, dst) {
    dst = this.assert(dst);
    dst[0] = Scalar.mix(a[0], b[0], t); 
    dst[1] = Scalar.mix(a[1], b[1], t);
    dst[2] = Scalar.mix(a[2], b[2], t);
    return dst;
  },
  
  
  //
  // ... to be continued ...
  //
  
};



// utility function to get some GL/GLSL/WEBGL information
var glInfo = function(){
  var gl = this.drawingContext;
  
  var info = {};
  info.gl = this.drawingContext;
  
  var debugInfo  = gl.getExtension("WEBGL_debug_renderer_info");
  if (debugInfo) {
    info.gpu_renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    info.gpu_vendor   = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
  }
  info.wgl_renderer = gl.getParameter(gl.RENDERER);
  info.wgl_version  = gl.getParameter(gl.VERSION);
  info.wgl_glsl     = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
  info.wgl_vendor   = gl.getParameter(gl.VENDOR);

  return info;
}








EasyCam.INFO = INFO; // make static
Object.freeze(INFO); // and constant

ext.EasyCam       = EasyCam;
ext.DampedAction  = DampedAction;
ext.Interpolation = Interpolation;
ext.Rotation      = Rotation;
ext.Vec3          = Vec3;
ext.Scalar        = Scalar;


////////////////////////////////////////////////////////////////////////////////
//
// p5 patches, bug fixes, workarounds, ...
//
////////////////////////////////////////////////////////////////////////////////
if(p5){
  
  
  //
  // p5.glInfo();
  //
  if(!p5.prototype.hasOwnProperty('glInfo'))
  {
    p5.prototype.glInfo = function(){
      return this._renderer.glInfo.apply(this._renderer, arguments);
    };
    
    p5.RendererGL.prototype.glInfo = glInfo;
  }
  
  
  //
  // p5.createEasyCam();
  //
  if(!p5.prototype.hasOwnProperty('createEasyCam'))
  {
    p5.prototype.createEasyCam = function(/* p5.RendererGL, {state} */){
      
      var renderer = this._renderer;
      var args     = arguments[0];
      
      if(arguments[0] instanceof p5.RendererGL){
        renderer = arguments[0];
        args     = arguments[1]; // could still be undefined, which is fine
      } 
      
      return new ext.EasyCam(renderer, args); 
    }
  }
  
  
  //
  // p5.ortho();
  //
  // https://github.com/processing/p5.js/pull/2463
  p5.prototype.ortho = function(){
    this._renderer.ortho.apply(this._renderer, arguments);
    return this;
  };

  p5.RendererGL.prototype.ortho = function(left, right, bottom, top, near, far) {

    if(left   === undefined) left   = -this.width  / 2;
    if(right  === undefined) right  = +this.width  / 2;
    if(bottom === undefined) bottom = -this.height / 2;
    if(top    === undefined) top    = +this.height / 2;
    if(near   === undefined) near   =  0;
    if(far    === undefined) far    =  Math.max(this.width, this.height);

    var w = right - left;
    var h = top - bottom;
    var d = far - near;

    var x = +2.0 / w;
    var y = +2.0 / h;
    var z = -2.0 / d;

    var tx = -(right + left) / w;
    var ty = -(top + bottom) / h;
    var tz = -(far + near) / d;

    this.uPMatrix = p5.Matrix.identity();
    this.uPMatrix.set(  x,  0,  0,  0,
                        0, -y,  0,  0,
                        0,  0,  z,  0,
                       tx, ty, tz,  1);

    this._curCamera = 'custom';
    
  };
    
  

  
}
  


})(Dw);










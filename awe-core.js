/*
 * Artefact Web Extensions
 *
 * Copyright 2012, Artefact Group LLC
 * Licensed under MIT.
 */
(function(global, document, undefined) {

  // = awe-core =
  //
  // This is a library of all-purpose, general utility functions contained within
  // the {{{Awe}}} namespace.

  // Create Awe
  var Awe = {}

  // == Helpers ==
  
  // ** {{{ Awe.isArray(o) }}} **
  //
  // Tests whether object {{{o}}} is an array
  //
  // |=param|=description|
  // |{{{o}}}|The object to test|
  // 
  // **{{{returns}}}** {{{true}}} if {{{o}}} is an array, otherwise {{{false}}}
  Awe.isArray = function(o) {
    return o && o.constructor == Array.prototype.constructor;
  }

  // ** {{{ Awe.isArrayOrString(o) }}} **
  //
  // Tests whether object {{{o}}} is either an array or a string
  //
  // |=param|=description|
  // |{{{o}}}|The object to test|
  // 
  // **{{{returns}}}** {{{true}}} if {{{o}}} is an array or string, otherwise {{{false}}}
  Awe.isArrayOrString = function(o) {
    return o && (o.constructor == Array.prototype.constructor ||
      o.constructor == String.prototype.constructor);
  }

  // ** {{{ Awe.isType(o, type) }}} **
  //
  // Tests whether object {{{o}}} is a of type {{{type}}}
  //
  // |=param|=description|
  // |{{{o}}}|The object to test|
  // |{{{type}}}|The type to compare|
  // 
  // **{{{returns}}}** {{{true}}} if {{{o}}} is of type {{{type}}}, otherwise {{{false}}}
  Awe.isType = function(o, type) {
    return o && o.constructor == type.prototype.constructor;
  }
  
  // ** {{{ Awe.isFunction(o) }}} **
  //
  // Tests whether object {{{o}}} is a function
  //
  // |=param|=description|
  // |{{{o}}}|The object to test|
  // 
  // **{{{returns}}}** {{{true}}} if {{{o}}} is a function, otherwise {{{false}}}
  Awe.isFunction = function(o) {
    return o && o.constructor == Function.prototype.constructor;
  }

  // ** {{{ Awe.env }}} **
  //
  // An object describing the current environment
  //
  // |=field|=description|
  // |{{{inputTouch}}}|{{{true}}} if the current environment is a touch input device|
  // |{{{inputMouse}}}|{{{true}}} if the current environment is a mouse input device, opposite of {{{inputTouch}}}|  
  // |eventDragStart|The event name for drag start events on this platform, for example mousedown or touchstart|
  // |eventDragMove|The event name for drag move events on this platform|
  // |eventDragEnd|The event name for drag move events on this platform|
  // |eventClick|The event name for click events on this platform|
  Awe.env = {};
  Awe.env.inputTouch = "ontouchstart" in global;
  Awe.env.inputMouse = !Awe.env.inputTouch;
  
  Awe.env.eventDragStart = Awe.env.inputTouch ? "touchstart" : "mousedown";
  Awe.env.eventDragMove = Awe.env.inputTouch ? "touchmove" : "mousemove";
  Awe.env.eventDragEnd = Awe.env.inputTouch ? "touchend" : "mouseup";
  Awe.env.eventClick = Awe.env.inputTouch ? "touchend" : "click";
  
  // ** {{{ Awe.clamp(n, range1, range2 }}} **
  //
  // Clamps {{{n}}} between {{{range1}}} and {{{range2}}}
  //
  // |=param|=description|
  // |{{{n}}}|The number to be clamped|
  // |{{{range1}}}|An upper or lower limit to clamp to|
  // |{{{range2}}}|The other upper or lower limit to clamp to|
  // 
  // **{{{returns}}}** the clamped number
  Awe.clamp = function(n, range1, range2) {
    if (range2 < range1) {
      var t = range1;
      range1 = range2;
      range2 = t;
    }
    return Math.min(Math.max(n, range1), range2);
  }

  // Return -1 if n < 0 or 1 otherwise
  // ** {{{ Awe.sign(n) }}} **
  //
  // Returns the positive/negative direction of n
  //
  // |=param|=description|
  // |{{{n}}}|The number to return the sign of|
  // 
  // **{{{returns}}}** -1 if {{{n}}} < 0, otherwise, 1
  Awe.sign = function(n) {
    return (n < 0) ? -1 : 1;
  }
  
  // Ensure n is a positive value or zero.
  Awe.positiveOrZero = function(n) {
    return (n > 0) ? n : 0;
  }

  // Clamp a number between -1 and 1 before passing to Math.acos to prevent an exception.
  // Ensure that this makes sense for your parameters - it is assumed they will be close to
  // the clamped range but allows computational errors to be safely ignored.
  Awe.acosSafe = function(rad) {
    return Math.acos(Awe.clamp(rad, -1, 1));
  }

  // Get a query string parameter value by name
  Awe.getQueryParam = function(name, url) {
    url = url || global.location.href;
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( url );
    if (!results)
      return "";
    return results[1];
  }

  if (Array.prototype.forEach) {
    Awe.forEach = function(array, callback, thisArg) {
      array.forEach(callback, thisArg);
    }
  } else {
    Awe.forEach = function(array, callback, thisArg) {
      var length = array.length;
      var i = 0;
      while (i < length) {
        callback.call(thisArg, array[i], i);
        ++i;
      }
    }
  }
  
  /* Create an HTML element of the given type and attach to the given parent if not null.
   * The config object can contain styles, attrs, a class and a background sprite to apply
   * to the element
   */
  Awe.createElement = function(type, parent, config) {
    var k;
    var el = document.createElement(type);
    config = config || {};
    if (config.backgroundSprite) {
      // TODO:
      throw("TODO:");
      //setBackgroundSprite(el, config.backgroundSprite);
    }
    for (k in (config.styles || {})) {
      el.style[k] = config.styles[k];
    }
    for (k in (config.attrs || {})) {
      el[k] = config.attrs[k];
    }
    for (k in (config.setAttrs || {})) {
      el.setAttribute(k, config.setAttrs[k]);
    }
  
    if (parent)
      parent.appendChild(el);
  
    if (config.className)
      el.className = config.className;
      
    return el;
  }

  
  /*
   * method: Awe.enableDrag
   * 
   * purpose: enable drag on a DOM element
   *
   */  
  Awe.enableDrag = function(el, config) {
  
    config = config || {};
    var filters = config.filters;
    var updater = config.updater;
    var hasAnimatingFilter = false;
    
    // Convert a single drag filter
    if (filters) {
      if (!Awe.isArray(filters)) {
        filters = [filters];
      }
      Awe.forEach(filters, function(filter) {
        if (filter.animates) {
          hasAnimatingFilter = true;
        }
      });
    } else {
      filters = [];
    }

    // Drag state
    var touch = {};

    // Animation state is an object used during filter-controlled animations containing:
    //  - animationTime
    //  - velocity
    //  - pos
    var animationState = {};
    
    function getClientPos(evt)
    {
      var p;
      if (Awe.env.inputTouch)
      {
        // TODO: Use correct touch (lookup by touch start ID instead of always using index 0)
        p = { x: evt.changedTouches[0].clientX, y: evt.changedTouches[0].clientY };
      } else {
        p = { x: evt.clientX, y: evt.clientY };
      }
      p.x += touch.anchor.x;
      p.y += touch.anchor.y;
      return p
    }
  
    function updateAnimationState(evt) {
      if (hasAnimatingFilter) {
        if (touch.dragging) {
          animationState._last = Date.now() * 0.001;
          animationState.animationTime = 0;
          animationState.deltaTime = 0;
          animationState.velocity = evt.velocity;
          animationState.pos = evt.pos;
        } else {
          var t = Date.now() * 0.001;
          animationState.deltaTime = t - animationState._last;
          animationState.animationTime += animationState.deltaTime;
          animationState._last = t;
        }
      }
    }
    
    function processDrag(clientPos, pos, start) {
      if (touch.now) {
        touch.maxDistanceSquared = Math.max(touch.maxDistanceSquared, (touch.now.x - touch.start.x) * (touch.now.x - touch.start.x) + (touch.now.y - touch.start.y) * (touch.now.y - touch.start.y));
      } else {
        touch.maxDistanceSquared = 0;
      }
  
      // Create the new drag state
      var newDrag = {
        clientPos: { x: clientPos.x, y: clientPos.y },
        pos: { x: pos.x, y: pos.y },
        dragTime: (Date.now() - touch.startTime) * 0.001,
        maxDistanceSquared: touch.maxDistanceSquared,
        velocity: { x: 0, y: 0 }
      }
      if (touch.lastDrag) {
        newDrag.clientDelta = {
          x: newDrag.clientPos.x - touch.lastDrag.clientPos.x,
          y: newDrag.clientPos.y - touch.lastDrag.clientPos.y
        }
        newDrag.delta = {
          x: newDrag.pos.x - touch.lastDrag.pos.x,
          y: newDrag.pos.y - touch.lastDrag.pos.y
        }
        var dt = newDrag.dragTime - touch.lastDrag.dragTime;
        if (dt) {
          newDrag.velocity.x = newDrag.delta.x / dt;
          newDrag.velocity.y = newDrag.delta.y / dt;
        }
      } else {
        newDrag.clientDelta = { x: 0, y: 0 };
        newDrag.delta = { x: 0, y: 0 };
      }
      
      
      // Copy current drag state to last
      touch.lastDrag = {
        clientPos: { x: newDrag.clientPos.x, y: newDrag.clientPos.y },
        pos: { x: newDrag.pos.x, y: newDrag.pos.y },
        delta: { x: newDrag.delta.x, y: newDrag.delta.y },
        clientDelta: { x: newDrag.clientDelta.x, y: newDrag.clientDelta.y },
        velocity: { x: newDrag.velocity.x, y: newDrag.velocity.y },
        dragTime: newDrag.dragTime,
        maxDistanceSquared: newDrag.maxDistanceSquared
      }
      
      updateAnimationState(newDrag);
      
      return newDrag;
    }
    
    function updateDrag() {
      return touch.lastDrag && {
        clientPos: touch.lastDrag.clientPos,
        pos: touch.lastDrag.pos,
        velocity: touch.lastDrag.velocity,
        clientDelta: { x: 0, y: 0 },
        delta: { x: 0, y: 0 },
        dragTime: (Date.now() - touch.startTime) * 0.001,
        maxDistanceSquared: touch.lastDrag.maxDistanceSquared
      }
    }
    
    function endAnimation() {
      if (touch.updateIntervalId) {
        // Call end on any remaining animating filters
        Awe.forEach(filters, function(filter) {
          if (filter.animates && filter.end) {
            filter.end();
          }
        });

        if (updater.end) {
          updater.end();
        }
        clearInterval(touch.updateIntervalId);
        touch.updateIntervalId = null;
      }
    }
    
    // Per-frame updates
    
    function dragUpdateAnimating() {
      updateAnimationState();
      var animationsRunning = false;
      Awe.forEach(filters, function(filter) {
        if (filter.animates) {
          animationsRunning = animationsRunning || !filter.animate(animationState);
        }
      });

      if (animationsRunning) {
        var pos = { x: animationState.pos.x, y: animationState.pos.y };
        var drag = processDrag(pos, pos);
        updater.move(el, drag);
        // TODO: Should this callback be called after release?
        //config.onDragMove(processDrag(clientPos, pos));
      } else {
        // Animation is done
        endAnimation();
      }
    }

    function dragUpdateDragging() {
      var clientPos = touch.now || touch.start;
      clientPos = { x: clientPos.x, y: clientPos.y };
      var drag = updateDrag();
      if (drag) {
        if (config.onDragUpdate) {
          config.onDragUpdate(drag);
        }
      }
    }
    
    function dragUpdate(evt) {
      if (touch.dragging) {
        dragUpdateDragging();
      } else {
        dragUpdateAnimating();
      }
    }
      
    function dragMove(evt) {
      Awe.cancelEvent(evt);
      touch.now = getClientPos(evt);
      var pos = applyFilters(touch.now);
      var drag = processDrag(touch.now, pos);
      if (updater && updater.move) {
        updater.move(el, drag);
      }
      if (config.onDragMove) {
        config.onDragMove(drag);
      }
    }
    
    function dragEnd(evt, immediate) {
      if (!touch.dragging) {
        return;
      }
      touch.dragging = false;
      evt && Awe.cancelEvent(evt);
      xRemoveEventListener(Awe.env.inputTouch ? el : document, Awe.env.eventDragMove, dragMove);
      xRemoveEventListener(Awe.env.inputTouch ? el : document, Awe.env.eventDragEnd, dragEnd);
      // TODO Check for animating filters before cancelling event bits
      Awe.forEach(filters, function(filter) {
        if ((immediate || !filter.animates) && filter.end) {
          filter.end();
        }
      });
      if (!hasAnimatingFilter && updater.end) {
        updater.end();
      }
      // TODO: Figure out how whether release events are still appropriate here when there's an
      // animating filter
      if (config.onDragEnd && evt) {
        var pos = getClientPos(evt);
        config.onDragEnd(processDrag(pos, pos));
      }
      if (touch.updateIntervalId && !hasAnimatingFilter) {
        clearInterval(touch.updateIntervalId);
        touch.updateIntervalId = null;
      }
    }
    
    function applyFilters(pos) {
      Awe.forEach(filters, function(filter) {
        pos = filter.move(el, pos) || pos;
      });
      return pos;
    }
    
    function dragStart(evt) {
      Awe.cancelEvent(evt);
      
      // Cancel any existing animation
      endAnimation();
      
      touch.dragging = true;
      touch.anchor = { x: 0, y: 0 }
      // Calculate the position without the anchor
      touch.now = getClientPos(evt);
      // Calculate the anchor position
      if (config.anchor) {
        touch.anchor = config.anchor.getAnchor(el, touch.now);
        // Get the client position again, taking the anchor into account
        touch.now = getClientPos(evt);
      }
      touch.lastDrag = null;
      touch.start = getClientPos(evt);
      touch.startTime = Date.now();
      touch.maxDistanceSquared = 0;
      
      var pos = touch.start;
      Awe.forEach(filters, function(filter) {
        if (filter.start) {
          pos = filter.start(el, pos) || pos;
        }
      });

      var pos = applyFilters(touch.now);
      
      var drag = processDrag(touch.now, pos);

      if (updater.start) {
        updater.start(el, drag);
      }

      if (config.onDragStart) {
        config.onDragStart(drag);
      }

      xAddEventListener(Awe.env.inputTouch ? el : document, Awe.env.eventDragMove, dragMove);
      xAddEventListener(Awe.env.inputTouch ? el : document, Awe.env.eventDragEnd, dragEnd);
//      if (config.onDragUpdate) {
      touch.updateIntervalId = setInterval(dragUpdate, config.dragUpdateInterval || 16);
//      }
    }
    
    xAddEventListener(el, Awe.env.eventDragStart, dragStart);
    
    el._disableDrag = function() {
      xRemoveEventListener(el, Awe.env.eventDragStart, dragStart);
      // Make sure any in-progress drags have their listeners removed
      dragEnd(null, true);
    }
  }
  
  /*
   * method: Awe.disableDrag
   * 
   * purpose: disable drag on a DOM element
   *
   */
  Awe.disableDrag = function(el) {
    if (el._disableDrag) {
      el._disableDrag();
      el._disableDrag = null;
    }
  }
  
  Awe.DragAnchorTopLeft = function(anchorEl) {
    var _i = this;
    
    _i.getAnchor = function(el, pos) {
      el = anchorEl || el;
      return { x: xLeft(el) - pos.x, y: xTop(el) - pos.y }
    }
  }
  
  Awe.DragFilterLimitAxes = function(minX, maxX, minY, maxY) {
    var _i = this;
    
    _i.move = function(el, pos) {
      var x = Awe.clamp(pos.x, minX, maxX);
      var y = Awe.clamp(pos.y, minY, maxY);
      return { x: x, y: y };
    }
  }
  
/*
  // To be continued...
  Awe.DragFilterLimitAxesNoSpring = function(minX, maxX, minY, maxY) {
    var _i = this;
    
    _i.move = function(el, pos) {
      var x = Awe.clamp(pos.x, minX, maxX);
      var y = Awe.clamp(pos.y, minY, maxY);
      return { x: x, y: y };
    }
  }
*/
  
  Awe.DragFilterMomentum = function() {
    var _i = this;
    
    _i.start = function(el, pos) {
      _i.lastPos = null;
      _i.vel = { x: 0, y: 0 };
    }
    
    _i.move = function(el, pos) {
      if (_i.lastPos) {
        var deltaTime = (Date.now() - _i.lastTime) * 0.001;
        _i.vel.x = (pos.x - _i.lastPos.x) / deltaTime;
        _i.vel.y = (pos.y - _i.lastPos.y) / deltaTime;
      }
      _i.lastPos = { x: pos.x, y: pos.y };
      // TODO: Make drag time available to this function
      _i.lastTime = Date.now();

      return pos;
    }

    _i.animates = true;

    _i.animate = function(animationState) {
      // Apply velocity and acceleration
      animationState.velocity.x *= 0.8;
      animationState.velocity.y *= 0.8;

      var dx = animationState.velocity.x * animationState.deltaTime;
      var dy = animationState.velocity.y * animationState.deltaTime;
      
      if ((dx * dx + dy * dy) > 1) {
        animationState.pos.x += dx;
        animationState.pos.y += dy;
        
        return false;
      }
      // Done
      return true;
    }
  }
  
  Awe.DragUpdaterTopLeft = function() {
    var _i = this;
    
    _i.move = function(el, evt) {
      var left = evt.pos.x;
      var top = evt.pos.y;
      el.style.left = left + "px";
      el.style.top = top + "px";
    }
  }

  // ** {{{ Awe.objectToString(o) }}} **
  //
  // Convert an object to its string representation
  //
  // |=param|=description|
  // |{{{o}}}|object to turn to string|
  // 
  // **{{{returns}}}** a string representation suitable for console logging
  Awe.objectToString = function(o) {
    // Do something more interesting in the future?
    return JSON.stringify(o);
  }

  var requestAnimationFrameShim = (function() {
    return  global.requestAnimationFrame       ||
            global.webkitRequestAnimationFrame || 
            global.mozRequestAnimationFrame    || 
            global.oRequestAnimationFrame      || 
            global.msRequestAnimationFrame     || 
            function( callback ){
              global.setTimeout(callback, 1000 / 60);
            };
  })();
  
  // ** {{{ Awe.addAnimationCallback(callback, [config]) }}} **
  //
  // Begins an animation loop, calling the supplied callback each frame until the callback returns true to signify completion or
  // until {{{Awe.cancelAnimationCallback(handle)}}} is called to cancel the animation. This method will use the browser's
  // {{{requestAnimationFrame}}} function if possible which is optimized for rendering and animation callbacks and generally runs
  // at 60fps if practical.
  //
  // |=param|=description|
  // |{{{callback}}}|a function to call on an interval. Its parameters will be {{{callback(deltaTime, totalTime, iteration)}}}|
  // |{{{config.interval}}}|callback interval in seconds. Don't use this unless you need a specific interval since modern browsers will pick the optimal animation callback interval by default|
  // |{{{config.onCancel}}}|function to call when this animation is cancelled|
  // |{{{config.onEnd}}}|function to call when this animation has ended|
  //
  // **Returns** a handle that can be passed to {{{Awe.cancelAnimationCallback(handle)}}}
  Awe.addAnimationCallback = function(callback, config) {
    var config = config || {};
    var startTime = Date.now();
    var lastTime = startTime;
    var handle = {};
    var cancelled = false;
    var iteration = 0;
    
    if (config.interval === undefined) {
      requestAnimationFrameShim(function wrapper() {
        time = Date.now();
        if (!cancelled && !callback(time - lastTime, time - startTime, iteration++)) {
          requestAnimationFrameShim(wrapper);
        } else {
          if (cancelled) {
            config.onCancel && config.onCancel();
          } else {
            config.onEnd && config.onEnd();
          }
        }
        lastTime = time;
      })
      handle.cancel = function() {
        cancelled = true;
      }
    } else {
      var intervalId = setInterval(function () {
        time = Date.now();
        if (callback(time - lastTime, time - startTime, iteration++)) {
          config.onEnd && config.onEnd();
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
        lastTime = time;
      }, config.interval);
      handle.cancel = function() {
        if (intervalId) {
          config.onCancel && config.onCancel();
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    }
    
    return handle;
  }
  
  // ** {{{ Awe.cancelAnimationCallback(handle) }}} **
  //
  // Cancels an animation requested with {{{Awe.addAnimationCallback}}}.
  //
  // |=param|=description|
  // |{{{handle}}}|an animation handle returned by {{{Awe.addAnimationCallback}}}|
  Awe.cancelAnimationCallback = function(handle) {
    handle && handle.cancel();
  }

  // Cancels an event to stop propogation. Use this to swallow events in listeners.
  Awe.cancelEvent = function(e) {
    if (e == null) {
      e = global.event;
    }
  
    if (!e) {
      return;
    }
  
    if (!global.attachEvent) {

      if (e.stopPropagation) {
        e.stopPropagation();
      }
      e.preventDefault();    
      return false
    }
    
    e.cancelBubble = true;
    e.returnValue = false;
    
    return false;
  }

  var _nextGuid = 0;
  
  // Returns a string unique to this session
  Awe.getGuid = function() {
    return "_guid_" + ++_nextGuid;
  }
  
  // Returns a unique positive integral number > 0
  Awe.getGuidNumeric = function() {
    return ++_nextGuid;
  }

  // Classes
  var hexToInt = {
    "0":0,
    "1":1,
    "2":2,
    "3":3,
    "4":4,
    "5":5,
    "6":6,
    "7":7,
    "8":8,
    "9":9,
    "a":10,"A":10,
    "b":11,"B":11,
    "c":12,"C":12,
    "d":13,"D":13,
    "e":14,"E":14,
    "f":15,"F":15,
  }
  
  // Color class parses CSS color specs in different formats ("#rrggbb", "rgb(r, g, b)" or "rgba(r, g, b, a)") and provides
  // accessors to r/g/b/a components and CSS color strings.
  Awe.Color = function(color) {
    var _i = this;
    
    _i.toHex = function() {
      return _i.hex;
    }
  
    _i.toRGBA = function(alpha) {
      if (alpha == undefined) {
        alpha = _i.a;
      }
      return "rgba("+_i.r+","+_i.g+","+_i.b+","+alpha+")";
    }
  
    _i.toRGB = function() {
      return "rgba("+_i.r+","+_i.g+","+_i.b+")";
    }
        
    if (color[0] == "#") {
      _i.hex = color;
      _i.r = (hexToInt[color[1]] << 4) + hexToInt[color[2]];
      _i.g = (hexToInt[color[3]] << 4) + hexToInt[color[4]];
      _i.b = (hexToInt[color[5]] << 4) + hexToInt[color[6]];
      _i.a = 1;
    } else {
      if (color.indexOf('rgb(') == 0) {
        color = color.substring(4,color.length-1);
      } else if (color.indexOf('rgba(') == 0) {
        color = color.substring(5,color.length-1);
      }
      var i;
      _i.r = parseInt(color);
      color = color.substring(color.indexOf(',')+1);
      _i.g = parseInt(color);
      color = color.substring(color.indexOf(',')+1);
      _i.b = parseInt(color);
      color = color.substring(color.indexOf(',')+1);
      if (color) {
        _i.a = parseFloat(color);
      } else {
        _i.a = 1;
      }
    }
  }

  global.Awe = Awe;

})(typeof exports === 'undefined' ? this : exports, typeof document === 'undefined' ? {} : document);

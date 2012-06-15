/*
 * Artefact Web Extensions
 *
 * Copyright 2012, Artefact Group LLC
 * Licensed under MIT.
 */

(function(Awe, global, document, undefined) {

  // = Awe.StateMachine =
  //
  // A general state machine. More documentation to come...
  //
  // State contains any of:
  //  {{{allowOnly}}} - array with 0 or more states (or null)
  //  {{{doNotAllow}}} - array with 1 or more states (or null)
  //  {{{start}}} function (or null)
  //  {{{update}}} function (or null)
  //  {{{end}}} function (or null)
  
  var StateMachine = Awe.StateMachine = function(name, stateMap, initialStateId) {
    var _i = this;
    
    function _sm_trace(str) { console.log("[awe.sm] " + str); }
    function _sm_trace_na(from,to)    { _sm_trace(from + " -> " + to + " not allowed"); }
    function _sm_trace_e(s)           { _sm_trace("enter      : " + s); }
    function _sm_trace_x(s)           { _sm_trace("exit       : " + s); }
    function _sm_trace_restart(s)     { _sm_trace("restart    : " + s); }
    function _sm_trace_transition(s)  { _sm_trace("transition : " + s); }
        
    StateMachine.stateMachines.push(_i);
  
    _i.name = name;
    _i.states = stateMap || [];
    _i.currentStateId = null;
    
    _i.tracing = false;
      
    _i.addState = function(id, state) {
      if (_i.states[id]) {
        throw "Duplicate state added!";
      }
      _i.states[id] = state;
    }
    
    _i.getCurrentStateId = function() {
      return _i.currentStateId;
    }
  
    // Request a state that is assumed to be a transitional state and call the supplied callback on completion.
    // The callback will not be called if the transition state is interrupted, but you can prevent this by making
    // the transition state uninterruptable: pass an empty array in the transition states allowOnly field, which will
    // disallow any transitions while the state is active. The transitionCompleteCallback should then change state
    // once the transition is complete.
    _i.requestTransitionState = function(id) {
      
      if(_i.tracing) _sm_trace_transition(id);
      
      var lastArg = arguments[arguments.length - 1];
      var onDone;
      if (Awe.isType(lastArg, String)) {
        onDone = function() {
          _i.requestState(lastArg);
        }
      } else if (Awe.isType(lastArg, Array) && lastArg.length > 0) {
        onDone = function() {
          var state = lastArg.shift();
          if (lastArg.length > 0) {
            _i.requestTransitionState(state, lastArg);
          } else {
            _i.requestState(state);
          }
        }
      } else if (Awe.isType(lastArg, Function)) {
        onDone = lastArg;
      }
      
      if (!onDone) {
        throw "Last argument of StateMachine.requestTransitionState must be an on-complete callback, a state id string or an array of state ids";
      }
      
      if (_i.requestState.apply(_i, arguments)) {
        _i.transitionCompleteCallback = onDone;
  
        if (!_i.states[_i.currentStateId].update) {
          throw "ERROR: Transition states must have an update method, otherwise they will never be able to complete.";
        }
        return true;
      }
      
      // Remove the transition complete callback if the switch to the transition state was refused.
      _i.transitionCompleteCallback = null;
      return false;
    }
    
    // ** {{{ restartCurrentState() }}} **
    //
    // Restarts the current state, causing its end and start functions to be called. Note that {{{requestState}}}
    // will never restart the current state, it will just leave a matching state running which makes this call
    // necessary to force a restart.
    //
    // **{{{returns}}}** {{{true}}} if the transition completed, {{{false}}} if the transition was disallowed.
    _i.restartCurrentState = function() {
      if(_i.tracing) _sm_trace_restart(_i.currentStateId);
      var rcs = _i.restartingCurrentState;
      _i.restartingCurrentState = true;
      var success = _i.requestState(_i.currentStateId);
      _i.restartingCurrentState = rcs;
      return success;
    }
    
    // Request a change to the supplied state. If a current state exists that will be checked for any conditions that
    // disallow transition to the new state.
    _i.requestState = function(id) {
    
      if (!id) throw 'Cannot request a null state';
      
      var nextState = _i.states[id];
      
      if (!nextState) throw 'Specified state does not exist';
      
      if (_i.currentStateId) {
      
        if(_i.currentStateId == id && !_i.restartingCurrentState) {
          if(_i.tracing) _sm_trace_e(id + " (no change)");
          return true;
        }
        
        var currentState = _i.states[_i.currentStateId];
        
        if (!_i.currentStateDone && currentState.allowOnly && currentState.allowOnly.indexOf(id) < 0) {
          if(_i.tracing) _sm_trace_na(_i.currentStateId, id);
          return false;
        }
        if (!_i.currentStateDone && currentState.doNotAllow && currentState.doNotAllow.indexOf(id) >= 0) {
          if(_i.tracing) _sm_trace_na(_i.currentStateId, id)
          return false;
        }
        
        if(_i.tracing) _sm_trace_x(_i.currentStateId);
        if (currentState.end) {
          currentState.end.call(currentState, id);
        }
      }
      
      if (nextState) {
        nextState._startTime = Date.now();
        nextState.runTime = 0;
        if(_i.tracing) _sm_trace_e(id);
        if (nextState.start) {
          nextState.start.apply(nextState, [_i.currentState && _i.currentState.id].concat(Array.prototype.slice.call(arguments,1)));
        }
      }
      
      _i.currentStateId = id;
      
      return true;
    }
    
    _i.update = function() {
      var currentState = _i.states[_i.currentStateId];
      currentState.runTime = (Date.now() - currentState._startTime) * 0.001;
      if (currentState && currentState.update) {
        // Update the current state and if it's a transition state, call the transition state callback once the
        // transition state's update returns true to signify completion
        if (currentState.update.call(currentState) && _i.transitionCompleteCallback) {
          var callback = _i.transitionCompleteCallback;
          _i.transitionCompleteCallback = null;
          _i.currentStateDone = true;
          callback();
          _i.currentStateDone = false;
        }
      }
    }
      
    if (initialStateId) {
      _i.requestState(initialStateId);
    }
  
    return _i;
  }
  
  StateMachine.stateMachines = []
  StateMachine.update = function() {
    for (var i = 0; i < StateMachine.stateMachines.length; ++i) {
      StateMachine.stateMachines[i].update();
    }
  }
})(typeof exports === 'undefined' ? Awe : exports, this, typeof document === 'undefined' ? {} : document);

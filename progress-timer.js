(function (root, factory) {
  'use strict';
  /* istanbul ignore next */
  if (typeof exports === 'object') {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define(factory);
  } else {
    root.ProgressTimer = factory();
  }
}(this, function () {
    var slice = Array.prototype.slice

    // Polyfill for Object.create
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
    /*istanbul ignore next*/
    if (typeof Object.create != 'function') {
      Object.create = (function(undefined) {
        var Temp = function() {};
        return function (prototype, propertiesObject) {
          if(prototype !== Object(prototype) && prototype !== null) {
            throw TypeError('Argument must be an object, or null');
          }
          Temp.prototype = prototype || {};
          if (propertiesObject !== undefined) {
            Object.defineProperties(Temp.prototype, propertiesObject);
          }
          var result = new Temp();
          Temp.prototype = null;
          // to imitate the case of Object.create(null)
          if(prototype === null) {
            result.__proto__ = null;
          }
          return result;
        };
      })();
    }

    /*istanbul ignore next*/
    var now = typeof performance !== 'undefined' && performance.now.bind(performance)
      || Date.now
      || function () {return +new Date()}

    function extend (Target, Base) {
      Target.prototype = Object.create(Base.prototype)
      Target.prototype.constructor = Target
    }

    /**
     * A micro EventEmitter like class
     * @constructor
     */
    function MicroEmitter () {}

    MicroEmitter.prototype = {
      on: function (event, cb) {
        this._events = this._events || /*istanbul ignore next*/ {}
        this._events[event] = this._events[event] || /*istanbul ignore next*/ []
        this._events[event].push(cb)
      },
      emit: function (event) {
        this._events = this._events || /*istanbul ignore next*/ {}
        if (!(event in this._events)) {
          return
        }
        var cbs = this._events[event] || /*istanbul ignore next*/ []
        var cbArgs = slice.call(arguments, 1)
        var cbLength = cbs.length
        for (var i = 0; i < cbLength; i++) {
          cbs[i].apply(this, cbArgs)
        }
      }
    }


    var STATE = ProgressTimer.STATE = {
      INIT: 'init',
      STARTED: 'started',
      PAUSE: 'pause',
      COMPLETED: 'completed'
    }

    /**
     *
     * @param {Object} options
     * @param {Number} [options.interval = 1000 / 60]  exec interval milliseconds, for example, 1000 / 24 will be 24fps
     * @param {Number} [options.total = Infinity]  total time, timer will stop
     * @return {ProgressTimer}
     * @constructor
     */
    function ProgressTimer (options) {
      options = options || {}

      if (!(this instanceof ProgressTimer)) {
        return new ProgressTimer(options)
      }

      this.interval = options.interval || (1000 / 60)
      this.total = options.total || Infinity

      this._init()
    }

    // extend emit and on from MicroEmitter
    extend(ProgressTimer, MicroEmitter)

    ProgressTimer.prototype._init = function () {
      this._clearTimeout()
      this._timeout = null

      this._changeCurrentTime(0)
      this._zero()
      this._state = STATE.INIT
    }

    ProgressTimer.prototype._zero = function () {
      this._start_at = null
      this._pause_at = 0
      this._pause_time = 0
      this._offset = 0
    }

    ProgressTimer.prototype._changeCurrentTime = function (time) {
      this._currentTime = time < 0 ? 0 :
                          time >= this.total ? this.total :
                          time

      this.emit('change', this._currentTime)
    }

    ProgressTimer.prototype._clearTimeout = function () {
      if (this._timeout !== void 0 && this._timeout !== null) {
        clearTimeout(this._timeout)
        this._timeout = null
      }
      return this
    }

    ProgressTimer.prototype._changeState = function (state) {
      this._state = state
      var args = slice.call(arguments, 1).concat(this)
      switch (state) {
        case STATE.STARTED:
          this.emit('start', args)
          break
        case STATE.PAUSE:
          this.emit('pause', args)
          break
        case STATE.COMPLETED:
          this.emit('completed', args)
          break
      }
    }

    ProgressTimer.prototype._stateIs = function (state) {
      return this._state === state
    }

    function _start () {
      var self = this
      if (self._state !== STATE.STARTED) {
        /*istanbul ignore next:hard to test*/
        return self
      }
      if (self._currentTime >= self.total) {
        self._changeState(STATE.COMPLETED)
        return self
      }

      var interval = self.interval

      var currentTime = now() - self._start_at - self._pause_time
      currentTime = currentTime > self.total ? self.total : currentTime
      self._changeCurrentTime(currentTime)

      var faster = now() - (self._start_at + self._currentTime + self._offset)
      var delay = faster > 0 ? interval - faster : interval

      self.emit('interval', self._currentTime, self)
      self._timeout = setTimeout(_start.bind(self), delay)
      return self
    }

    /**
     * start timer, if param `time` passed will start from it
     * @param {Number|undefined} [time=undefined]
     * @returns {*}
     */
    ProgressTimer.prototype.start = function (time) {
      var self = this
      var theTime = now()

      if (time !== void 0) {
        this._clearTimeout()
        this._zero()
        this._changeCurrentTime(time)
        this._start_at = theTime - time
        this._changeState(STATE.STARTED)
        return _start.call(this)
      }

      if (this._stateIs(STATE.STARTED)) {
        return self
      }

      if (this._stateIs(STATE.PAUSE)) {
        self._offset = theTime - self._pause_at
        self._pause_time += self._offset
      }

      if (this._stateIs(STATE.INIT)) {
        this._start_at = theTime
      }

      this._changeState(STATE.STARTED)

      return _start.call(this)
    }

    /**
     * pause timer
     * @returns {ProgressTimer}
     */
    ProgressTimer.prototype.pause = function () {
      if (this._stateIs(STATE.INIT) || this._stateIs(STATE.PAUSE)) {
        return this
      }
      this._clearTimeout()
      this._pause_at = now()
      this._changeState(STATE.PAUSE)
      return this
    }

    /**
     * reset(stop) timer
     * @returns {ProgressTimer}
     */
    ProgressTimer.prototype.reset = function () {
      if (this._stateIs(STATE.INIT)) {
        return this
      }
      this._init()
      this.emit('reset', this)
      return this
    }

    /**
     * get passed time or set current time if time param passed
     * @param {Number} [time=undefined]
     * @returns {*}
     */
    ProgressTimer.prototype.current = function (time) {
      if (time !== void 0) {
        this._zero()
        var theTime = now()
        this._start_at = theTime - time
        if (!this._stateIs(STATE.STARTED)) {
          // change state to pause without trigger event
          this._state = STATE.PAUSE
          this._pause_at = theTime
        }
        this.emit('seek')
        this._changeCurrentTime(time)
      }
      return this._currentTime
    }

    /**
     * get current state
     * @returns {String}
     */
    ProgressTimer.prototype.state = function () {
      return this._state
    }

    /**
     * current progress in percent (0-1)
     * @returns {number}
     */
    ProgressTimer.prototype.currentProgress = function () {
      return this.total === Infinity ? 0 : this._currentTime / this.total
    }

    // alias
    ProgressTimer.prototype.stop = ProgressTimer.prototype.reset

    return ProgressTimer
  }
))
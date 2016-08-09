Progress Timer
--------------------
An event base accurate timer with start,pause,reset


Quick Example
-------------
1. clone or download the project
2. cd examples
3. open examples in browser

or edit on jsfiddle
- [basic](https://jsfiddle.net/yz39fzg0/)
- [progress-bar](https://jsfiddle.net/ffL813kw/1/)

Install
-------
ProgressTimer is an UMD module, so you can
```html
<script src="../progress-timer.js"></script>
```
or do this
```javascript
require('progress-timer')
```

Basic Usage
-----------


```javascript

var timer = new ProgressTimer({
  total: 3000 // total time,the unit is ms,default to Infinity
})

timer.on('change', function (currentTime, timer) {
	// do something
})
timer.start()
```

Documentation
-------------
### options

- total - Defaults to **Infinity**, total execute time
- interval -  Defaults to **1000 / 60** for 60 fps, execute interval

### methods
- start(time) - start or continue timer
    - time(optional) - Start timer from `time`. If no `time` provided, timer will start from 0(zero) or continue from last pause time
- pause() - Pause timer
- stop() - Stop timer
- reset() - Same as `stop`, only an alias method
- current(time) - Get current time in ms **or** change current time
    - time(optional) - Get current time if `time` not provided .Or set current time if `time` provided
- currentProgress() - Get current progress in percent( same as `timer.current() / timer.total`)
- state() - Get current state (init | started | pause | completed)
- on(event, callback)
    - event(string) - change | start | pause | reset | completed | seek
    - callback(function) - Callback for spec event

License
-------
MIT

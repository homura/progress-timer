import test from 'ava'
const Timer = require('../progress-timer')

function within (expect, range, actual) {
  range = Math.abs(range)
  return actual - range <= expect && actual + range >= expect
}

function timerPassed (expect, timer) {
  return within(expect, timer.interval * 2, timer.current())
}

test('test timer as a micro EventEmitter', t => {
  var ee = new Timer()
  var msg = 'some message'
  t.plan(2)

  ee.on('hello', (message) => t.true(msg === message))
  ee.emit('hello', msg)
  ee.emit('hello', msg)
  ee.emit('hello1', msg)
})

test.cb('basic', t => {
  const timer = new Timer({total: 3000})
  // var startAt = Date.now()
  timer.start()

  setTimeout(() => {
    t.true(timerPassed(500, timer))
    t.end()
  }, 500)
})

test.cb('start from 1000ms', t => {
  const timer = new Timer({total: 3000})
  var startFrom = 1000
  timer.start(startFrom)

  setTimeout(() => {
    t.true(timerPassed(1500, timer))
    t.end()
  }, 500)
})

test.cb('A little more complicated process', t => {
  const timer = new Timer({total: 3000})

  t.true(timer.state() === Timer.STATE.INIT)

  timer.start()
  t.true(timer.state() === Timer.STATE.STARTED)

  setTimeout(() => {
    t.true(timerPassed(500, timer))
    timer.pause()
    timer.pause()
  }, 500)

  setTimeout(() => {
    t.true(within(500, 20, timer.current()))
    timer.start()
    timer.start()
  }, 800)

  setTimeout(() => {
    t.true(timerPassed(700, timer))
    t.true(within(700 / 3000, 0.02, timer.currentProgress()))
  }, 1000)

  setTimeout(() => {
    t.true(timerPassed(1200, timer))
    t.true(within(1200 / 3000, 0.02, timer.currentProgress()))
    timer.reset()
    timer.stop()
    timer.start()
  }, 1500)

  setTimeout(() => {
    t.true(timerPassed(1500, timer))
    t.end()
  }, 3000)

})

test.cb('should callback when start,pause,reset,completed', t => {
  t.plan(5)

  const timer = Timer({total: 200})

  timer.on('start', () => t.pass())
  timer.on('pause', () => t.pass())
  timer.on('reset', () => t.pass())
  timer.on('completed', () => t.pass())

  timer.start(-1)
  timer.pause()
  timer.stop()
  timer.start()

  setTimeout(() => t.end(), 500)
})

test.cb('change time while timer is running', t => {
  var timer = new Timer({total: 3000})

  timer.start()

  setTimeout(() => {
    t.true(timerPassed(500, timer))
    timer.current(1000)
  }, 500)

  setTimeout(() => {
    t.true(timerPassed(1500, timer))
    timer.pause()
    timer.current(1000)
  }, 1000)

  setTimeout(() => {
    t.true(timerPassed(1000, timer))
    timer.start()
  }, 1500)

  setTimeout(() => {
    t.true(timerPassed(1500, timer))
    t.end()
  }, 2000)
})


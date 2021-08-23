import { spy, stub } from 'sinon'
import bodyParser from 'body-parser'
import express from 'express'
import delay from 'delay'
import auth from 'basic-auth'
import pify from 'pify'
import test from 'ava'
import Analytics from '.'
import { version } from './package'

const noop = () => {}

const context = {
  library: {
    name: 'filum-react-native',
    version
  }
}

const metadata = { nodeVersion: process.versions.node }
const port = 4063
const separateAxiosClientPort = 4064
const retryCount = 5

const createClient = options => {
  options = Object.assign({
    host: `http://localhost:${port}`
  }, options)

  const client = new Analytics('key', options)
  client.flush = pify(client.flush.bind(client))
  client.flushed = true

  return client
}

test.before.cb(t => {
  let count = 0
  express()
    .use(bodyParser.json())
    .post('/events', (req, res) => {
      const batch = req.body.batch

      const { name: writeKey } = auth(req)
      if (!writeKey) {
        return res.status(400).json({
          error: { message: 'missing write key' }
        })
      }

      const ua = req.headers['user-agent']
      if (ua !== `filum-react-native/${version}`) {
        return res.status(400).json({
          error: { message: 'invalid user-agent' }
        })
      }

      if (batch[0] === 'error') {
        return res.status(400).json({
          error: { message: 'error' }
        })
      }

      if (batch[0] === 'timeout') {
        return setTimeout(() => res.end(), 5000)
      }

      if (batch[0] === 'axios-retry') {
        if (count++ === retryCount) return res.json({})
        return res.status(503).json({
          error: { message: 'Service Unavailable' }
        })
      }

      if (batch[0] === 'axios-retry-forever') {
        return res.status(503).json({
          error: { message: 'Service Unavailable' }
        })
      }

      res.json({})
    })
    .listen(port, t.end)
})

test('expose a constructor', t => {
  t.is(typeof Analytics, 'function')
})

test('require a write key', t => {
  t.throws(() => new Analytics(), 'You must pass your Filum source\'s write key.')
})

test('create a queue', t => {
  const client = createClient()

  t.deepEqual(client.queue, [])
})

test('default options', t => {
  const client = new Analytics('key')

  t.is(client.writeKey, 'key')
  t.is(client.host, 'https://event.filum.ai')
  t.is(client.flushAt, 20)
  t.is(client.flushInterval, 10000)
})

test('remove trailing slashes from `host`', t => {
  const client = new Analytics('key', { host: 'http://google.com///' })

  t.is(client.host, 'http://google.com')
})

test('overwrite defaults with options', t => {
  const client = new Analytics('key', {
    host: 'a',
    flushAt: 1,
    flushInterval: 2
  })

  t.is(client.host, 'a')
  t.is(client.flushAt, 1)
  t.is(client.flushInterval, 2)
})

test('keep the flushAt option above zero', t => {
  const client = createClient({ flushAt: 0 })

  t.is(client.flushAt, 1)
})

test('enqueue - add a message to the queue', t => {
  const client = createClient()

  const timestamp = new Date()
  client.enqueue('type', { timestamp }, noop)

  t.is(client.queue.length, 1)

  const item = client.queue.pop()

  t.is(typeof item.message.messageId, 'string')
  t.regex(item.message.messageId, /node-[a-zA-Z0-9]{32}/)
  t.deepEqual(item, {
    message: {
      timestamp,
      type: 'type',
      context,
      _metadata: metadata,
      messageId: item.message.messageId
    },
    callback: noop
  })
})

test('enqueue - stringify user_id', t => {
  const client = createClient()

  client.track({
    user_id: 10,
    event: 'event'
  }, noop)

  t.is(client.queue.length, 1)

  const item = client.queue.pop()

  t.is(item.message.anonymous_id, undefined)
  t.is(item.message.user_id, '10')
})

test('enqueue - stringify anonymous_id', t => {
  const client = createClient()

  client.screen({
    anonymous_id: 157963456373623802,
    name: 'screen name'
  }, noop)

  t.is(client.queue.length, 1)

  const item = client.queue.pop()

  t.is(item.message.user_id, undefined)
  // v8 will lose precision for big numbers.
  t.is(item.message.anonymous_id, '157963456373623800')
})

test('enqueue - don\'t modify the original message', t => {
  const client = createClient()
  const message = { event: 'test' }

  client.enqueue('type', message)

  t.deepEqual(message, { event: 'test' })
})

test('enqueue - flush on first message', t => {
  const client = createClient({ flushAt: 2 })
  client.flushed = false
  spy(client, 'flush')

  client.enqueue('type', {})
  t.true(client.flush.calledOnce)

  client.enqueue('type', {})
  t.true(client.flush.calledOnce)

  client.enqueue('type', {})
  t.true(client.flush.calledTwice)
})

test('enqueue - flush the queue if it hits the max length', t => {
  const client = createClient({
    flushAt: 1,
    flushInterval: null
  })

  stub(client, 'flush')

  client.enqueue('type', {})

  t.true(client.flush.calledOnce)
})

test('enqueue - flush after a period of time', async t => {
  const client = createClient({ flushInterval: 10 })
  stub(client, 'flush')

  client.enqueue('type', {})

  t.false(client.flush.called)
  await delay(20)

  t.true(client.flush.calledOnce)
})

test('enqueue - don\'t reset an existing timer', async t => {
  const client = createClient({ flushInterval: 10 })
  stub(client, 'flush')

  client.enqueue('type', {})
  await delay(5)
  client.enqueue('type', {})
  await delay(5)

  t.true(client.flush.calledOnce)
})

test('enqueue - extend context', t => {
  const client = createClient()

  client.enqueue('type', {
    event: 'test',
    context: { name: 'travis' }
  }, noop)

  const actualContext = client.queue[0].message.context
  const expectedContext = Object.assign({}, context, { name: 'travis' })

  t.deepEqual(actualContext, expectedContext)
})

test('enqueue - skip when client is disabled', async t => {
  const client = createClient({ enable: false })
  stub(client, 'flush')

  const callback = spy()
  client.enqueue('type', {}, callback)
  await delay(5)

  t.true(callback.calledOnce)
  t.false(client.flush.called)
})

test('flush - don\'t fail when queue is empty', async t => {
  const client = createClient()

  await t.notThrows(client.flush())
})

test('flush - send messages', async t => {
  const client = createClient({ flushAt: 2 })

  const callbackA = spy()
  const callbackB = spy()
  const callbackC = spy()

  client.queue = [
    {
      message: 'a',
      callback: callbackA
    },
    {
      message: 'b',
      callback: callbackB
    },
    {
      message: 'c',
      callback: callbackC
    }
  ]

  const data = await client.flush()
  t.deepEqual(Object.keys(data), ['batch', 'timestamp', 'sentAt'])
  t.deepEqual(data.batch, ['a', 'b'])
  t.true(data.timestamp instanceof Date)
  t.true(data.sentAt instanceof Date)
  t.true(callbackA.calledOnce)
  t.true(callbackB.calledOnce)
  t.false(callbackC.called)
})

test('flush - respond with an error', async t => {
  const client = createClient()
  const callback = spy()

  client.queue = [
    {
      message: 'error',
      callback
    }
  ]

  await t.throws(client.flush(), 'Bad Request')
})

test('flush - time out if configured', async t => {
  const client = createClient({ timeout: 500 })
  const callback = spy()

  client.queue = [
    {
      message: 'timeout',
      callback
    }
  ]

  await t.throws(client.flush(), 'timeout of 500ms exceeded')
})

test('flush - skip when client is disabled', async t => {
  const client = createClient({ enable: false })
  const callback = spy()

  client.queue = [
    {
      message: 'test',
      callback
    }
  ]

  await client.flush()

  t.false(callback.called)
})

test('identify - enqueue a message', t => {
  const client = createClient()
  stub(client, 'enqueue')

  const message = { user_id: 'id' }
  client.identify(message, noop)

  t.true(client.enqueue.calledOnce)
  t.deepEqual(client.enqueue.firstCall.args, ['identify', message, noop])
})

test('identify - require a user_id or anonymous_id', t => {
  const client = createClient()
  stub(client, 'enqueue')

  t.throws(() => client.identify(), 'You must pass a message object.')
  t.throws(() => client.identify({}), 'You must pass either an "anonymous_id" or a "user_id".')
  t.notThrows(() => client.identify({ user_id: 'id' }))
  t.notThrows(() => client.identify({ anonymous_id: 'id' }))
})

test('track - enqueue a message', t => {
  const client = createClient()
  stub(client, 'enqueue')

  const message = {
    user_id: 1,
    event: 'event'
  }

  client.track(message, noop)

  t.true(client.enqueue.calledOnce)
  t.deepEqual(client.enqueue.firstCall.args, ['track', message, noop])
})

test('track - require event and either user_id or anonymous_id', t => {
  const client = createClient()
  stub(client, 'enqueue')

  t.throws(() => client.track(), 'You must pass a message object.')
  t.throws(() => client.track({}), 'You must pass either an "anonymous_id" or a "user_id".')
  t.throws(() => client.track({ user_id: 'id' }), 'You must pass an "event".')
  t.throws(() => client.track({ anonymous_id: 'id' }), 'You must pass an "event".')
  t.notThrows(() => {
    client.track({
      user_id: 'id',
      event: 'event'
    })
  })

  t.notThrows(() => {
    client.track({
      anonymous_id: 'id',
      event: 'event'
    })
  })
})

test('isErrorRetryable', t => {
  const client = createClient()

  t.false(client._isErrorRetryable({}))

  // ETIMEDOUT is retryable as per `is-retry-allowed` (used by axios-retry in `isNetworkError`).
  t.true(client._isErrorRetryable({ code: 'ETIMEDOUT' }))

  // ECONNABORTED is not retryable as per `is-retry-allowed` (used by axios-retry in `isNetworkError`).
  t.false(client._isErrorRetryable({ code: 'ECONNABORTED' }))

  t.true(client._isErrorRetryable({ response: { status: 500 } }))
  t.true(client._isErrorRetryable({ response: { status: 429 } }))

  t.false(client._isErrorRetryable({ response: { status: 200 } }))
})

test('dont allow messages > 32kb', t => {
  const client = createClient()

  const event = {
    user_id: 1,
    event: 'event',
    properties: {}
  }
  for (var i = 0; i < 10000; i++) {
    event.properties[i] = 'a'
  }

  t.throws(() => {
    client.track(event, noop)
  })
})

test('ensure that failed requests are retried', async t => {
  const client = createClient({ retryCount: retryCount })
  const callback = spy()

  client.queue = [
    {
      message: 'axios-retry',
      callback
    }
  ]

  await t.notThrows(client.flush())
})

test('ensure that failed requests are not retried forever', async t => {
  const client = createClient()
  const callback = spy()

  client.queue = [
    {
      message: 'axios-retry-forever',
      callback
    }
  ]

  await t.throws(client.flush())
})

test('ensure we can pass our own axios instance', async t => {
  const axios = require('axios')
  const myAxiosInstance = axios.create()
  const stubAxiosPost = stub(myAxiosInstance, 'post').resolves()
  const client = createClient({
    axiosInstance: myAxiosInstance,
    host: 'https://my-dummy-host.com',
    path: '/test/path'
  })

  const callback = spy()
  client.queue = [
    {
      message: 'something',
      callback
    }
  ]

  client.flush()

  t.true(stubAxiosPost.called)
  t.true(stubAxiosPost.alwaysCalledWith('https://my-dummy-host.com/test/path'))
})

test('ensure other axios clients are not impacted by axios-retry', async t => {
  let client = createClient() // eslint-disable-line
  const axios = require('axios')

  let callCounter = 0

  // Client will return a successful response for any requests beyond the first
  let server = express()
    .use(bodyParser.json())
    .get('/v1/anotherEndpoint', (req, res) => {
      if (callCounter > 0) {
        res.status(200).send('Ok')
      } else {
        callCounter++
        res.status(503).send('Service down')
      }
    })
    .listen(separateAxiosClientPort)

  await axios.get(`http://localhost:${separateAxiosClientPort}/v1/anotherEndpoint`)
    .then(response => {
      t.fail()
    })
    .catch(error => {
      if (error) {
        t.pass()
      }
    })

  server.close()
})

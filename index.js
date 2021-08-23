'use strict'
const removeSlash = require('remove-trailing-slash')
const axios = require('axios')
const axiosRetry = require('axios-retry')
const ms = require('ms')
import uuid from 'react-native-uuid';

const name = require('./package.json').name
const version = require('./package.json').version
const isString = require('lodash.isstring')

const setImmediate = global.setImmediate || process.nextTick.bind(process)
const noop = () => {}

const IdentityManager = require('./identity.js')
const DeviceInfoManager = require('./device.js')

class Analytics {
  /**
   * Initialize a new `Analytics` with your Filum project's `writeKey` and an
   * optional dictionary of `options`.
   *
   * @param {String} writeKey
   * @param {Object} [options] (optional)
   *   @property {Number} [flushAt] (default: 20)
   *   @property {Number} [flushInterval] (default: 10000)
   *   @property {String} [host] (default: 'https://event.filum.ai')
   *   @property {Boolean} [enable] (default: true)
   *   @property {Object} [axiosConfig] (optional)
   *   @property {Object} [axiosInstance] (default: axios.create(options.axiosConfig))
   */
  identityManager;
  deviceInfoManager;
  constructor (writeKey, options) {
    options = options || {}

    if(writeKey == null){
      console.log('You must pass your Filum project\'s write key.');
    }
    

    this.queue = []
    this.writeKey = writeKey
    this.host = removeSlash(options.host || 'https://event.filum.ai')
    this.path = removeSlash(options.path || '/events')
    let axiosInstance = options.axiosInstance
    if (axiosInstance == null) {
      axiosInstance = axios.create(options.axiosConfig)
    }
    this.axiosInstance = axiosInstance
    this.timeout = options.timeout || false
    this.flushAt = Math.max(options.flushAt, 1) || 20
    this.flushInterval = options.flushInterval || 10000
    this.flushed = false
    Object.defineProperty(this, 'enable', {
      configurable: false,
      writable: false,
      enumerable: true,
      value: typeof options.enable === 'boolean' ? options.enable : true
    })
    axiosRetry(this.axiosInstance, {
      retries: options.retryCount || 3,
      retryCondition: this._isErrorRetryable,
      retryDelay: axiosRetry.exponentialDelay
    })

    this.identityManager = new IdentityManager();
    this.deviceInfoManager = new DeviceInfoManager();
  }

  async identify (user_id='', event_params = {}, origin='', callback) {
    let anonymous_id;
    this.identityManager.loadAnonymousID(function(loaded_anonymous_id) {
      anonymous_id = loaded_anonymous_id;
    });
    // update user_id after anonymous to make sure user_id not cleansed because of no anonymous_id generated
    await this.identityManager.updateUserID(user_id);
    var deviceInfo = await this.deviceInfoManager.getDeviceInfo();

    let message = {
      anonymous_id: anonymous_id,
      user_id: user_id,
      event_name: "Identify",
      event_params: event_params,
      origin: origin,
      context: deviceInfo
    }
    this.enqueue('identify', message, callback);
  }

  async track (event_name, event_params = {}, origin='', callback) {
    let anonymous_id;
    let user_id;
    this.identityManager.loadAnonymousID(function(loaded_anonymous_id) {
      anonymous_id = loaded_anonymous_id;
    });
    this.identityManager.loadUserID(function(loaded_user_id) {
      user_id = loaded_user_id;
    });
    var deviceInfo = await this.deviceInfoManager.getDeviceInfo();

    let message = {
      anonymous_id: anonymous_id,
      user_id: user_id,
      event_name: event_name,
      event_params: event_params,
      origin: origin,
      context: deviceInfo
    }

    this.enqueue('track', message, callback)
  }

  reset() {
      this.identityManager.resetIDs();
  }

  enqueue (type, message, callback) {
    callback = callback || noop

    if (!this.enable) {
      return setImmediate(callback)
    }

    message = Object.assign({}, message)
    message.event_type = type
    
    // TODO
    message.context = this._process_context_data(message.context)

    if (!message.timestamp) {
      message.timestamp = new Date()
    }
    if (!message.original_timestamp) {
      message.original_timestamp = new Date()
    }
    if (!message.sent_at) {
      message.sent_at = new Date()
    }
    if (!message.received_at) {
      message.received_at = new Date()
    }
    
    if (!message.event_id) {
      message.event_id = uuid.v4();
    }

    if (!message.anonymous_id) {
      message.anonymous_id = ''
    }
    if (message.anonymous_id && !isString(message.anonymous_id)) {
      message.anonymous_id = JSON.stringify(message.anonymous_id)
    }
    if (message.user_id && !isString(message.user_id)) {
      message.user_id = JSON.stringify(message.user_id)
    }

    // TODO
    if (!message.origin) {
      message.origin = ''
    }

    // TODO
    if (message.event_params) {
      message.event_params = this._convert_to_list_of_filum_item(message.event_params);
    }
    this.queue.push({ message, callback })

    if (!this.flushed) {
      this.flushed = true
      this.flush(callback)
      return
    }

    if (this.queue.length >= this.flushAt) {
      this.flush(callback)
    }

    if (this.flushInterval && !this.timer) {
      this.timer = setTimeout(this.flush.bind(this, callback), this.flushInterval)
    }
  }

  /**
   * Flush the current queue
   *
   * @param {Function} [callback] (optional)
   * @return {Analytics}
   */

  flush (callback) {
    callback = callback || noop

    if (!this.enable) {
      return setImmediate(callback)
    }

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    if (!this.queue.length) {
      return setImmediate(callback)
    }

    const items = this.queue.splice(0, this.flushAt)
    const callbacks = items.map(item => item.callback)
    const messages = items.map(item => item.message)

    const data = messages
    const done = err => {
      callbacks.forEach(callback => callback(err))
      callback(err, data)
    }

    const headers = {}
    headers['user-agent'] = `filum-node-sdk/${version}`,
    headers['Content-Type'] = 'application/json',
    headers['Authorization'] = 'Bearer ' + this.writeKey

    const req = {
      headers
    }

    if (this.timeout) {
      req.timeout = typeof this.timeout === 'string' ? ms(this.timeout) : this.timeout
    }

    this.axiosInstance.post(`${this.host}${this.path}`, data, req)
      .then(() => done())
      .catch(err => {
        if (err.response) {
          const error = new Error(err.response.statusText)
          return done(error)
        }

        done(err)
      })
  }

  _isErrorRetryable (error) {
    // Retry Network Errors.
    if (axiosRetry.isNetworkError(error)) {
      return true
    }

    if (!error.response) {
      // Cannot determine if the request can be retried
      return false
    }

    // Retry Server Errors (5xx).
    if (error.response.status >= 500 && error.response.status <= 599) {
      return true
    }

    // Retry if rate limited.
    if (error.response.status === 429) {
      return true
    }

    return false
  }

  _convert_to_list_of_filum_item(event_params) {
    var event_params_server_format = []
    for (const [ k, v ] of Object.entries(event_params)) {
      const new_item = this._convert_item(k, v);
      event_params_server_format.push(new_item);
    }
    return event_params_server_format;
  }

  _convert_item(k, v) {
    var new_item = {};
    new_item.key = k;
    new_item.value = {};
    if (typeof v === "number") {
      if (Number.isInteger(v)) {
        new_item.value.int_value = v;
      } else if (this._isFloat(v)) {
        new_item.value.double_value = v;
      }
    } else if (typeof v === 'string') {
      new_item.value.string_value = v;
    } else if (typeof v === 'boolean') {
      new_item.value.int_value = v ? 1 : 0;
    } else if (!v) {
      new_item.value.string_value = null;
    }
    else {
      new_item.value.string_value = JSON.stringify(v);
    }
    return new_item
  }

  _convert_to_dict_of_filum_item(dict_object) {
    var filum_dict = {};
    for (const [ k, v ] of Object.entries(dict_object)) {
      const new_item = this._convert_item(k, v);
      filum_dict[new_item.key] = new_item.value;
    }
    return filum_dict;
  }

  _isFloat(n){
    return Number(n) === n && n % 1 !== 0;
  }

  _process_context_data(context_obj) {
    var _context = {}
    _context.active = 0
    _context.app = {}
    _context.campaign = {}
    _context.device = {}
    _context.ip = ''
    _context.library = {}
    _context.library.name = name
    _context.library.version = version
    // TODO: improve locale with react-native get locale 
    _context.locale = 'vi-VN'
    _context.location = {}
    _context.network = {}
    _context.os = {}
    _context.page = {}
    _context.referrer = {}
    _context.screen = {}
    _context.user_agent = ''

    for (const [ k, v ] of Object.entries(context_obj)) {
      _context[k] = v;
    }

    return _context
  }
}

module.exports = Analytics

/*!
 * Redback
 * Copyright(c) 2011 Chris O'Hara <cohara87@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;

/**
 * Wrap the Redis pub/sub commands.
 *
 * Usage:
 *    `redback.createChannel(name);`
 *
 * Reference:
 *    http://redis.io/topics/pubsub
 */

var Channel = exports.Channel = function (client, channel_name) {
    this.name = channel_name;
    this.setClient(client);
}

/**
 * Channel is an event emitter.
 */

Channel.prototype = new EventEmitter();

/**
 * Bind a new Redis client (e.g. if not exclusively using pub/sub mode).
 *
 * @param {Object} client
 * @return this
 * @api public
 */

Channel.prototype.setClient = function (client) {
    this.client = client;
    var self = this;
    ['message','subscribe','unsubscribe'].forEach(function (event) {
        self.client.on(event, function (channel, arg) {
            if (channel == self.name) {
                self.emit(event, arg);
            }
        });
    });
    return this;
}

/**
 * Publish a message to the channel.
 *
 * @param {string} msg
 * @param {Function} callback
 * @return this
 * @api public
 */

Channel.prototype.publish = function (msg, callback) {
    this.client.publish(this.name, msg, callback);
    return this;
}

/**
 * Subscribe to the channel.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

Channel.prototype.subscribe = function (callback) {
    this.client.subscribe(this.name);
    if (typeof callback === 'function') {
        this.on('subscribe', callback);
    }
    return this;
}

/**
 * Unsubscribe from the channel.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

Channel.prototype.unsubscribe = function (callback) {
    this.client.unsubscribe(this.name);
    if (typeof callback === 'function') {
        this.on('unsubscribe', callback);
    }
    return this;
}

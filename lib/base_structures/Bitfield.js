/*!
 * Redback
 * Copyright(c) 2011 Chris O'Hara <cohara87@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Structure = require('../Structure');

/**
 * Wrap the Redis bit commands.
 *
 * Usage:
 *    `redback.createBitfield(key);`
 *
 * Reference:
 *    http://redis.io/commands#string
 *
 * Redis Structure:
 *    `(namespace:)key = string`
 */

var Bitfield = exports.Bitfield = Structure.new();

/**
 * Get a single bit
 *
 * @param {int} bit
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

Bitfield.prototype.get = function (bit, callback) {
    callback = callback || function () {};
    this.client.getbit(this.key, bit, callback);
    return this;
}

/**
 * Set a single bit. The callback receives the previous value.
 *
 * @param {int} bit
 * @param {bool} value
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

Bitfield.prototype.set = function (bit, value, callback) {
    callback = callback || function () {};
    this.client.setbit(this.key, bit, value ? 1 : 0, callback);
    return this;
}

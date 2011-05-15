/*!
 * Redback
 * Copyright(c) 2011 Chris O'Hara <cohara87@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Structure = require('../Structure'),
    List = require('../base_structures/List').List;

/**
 * A simple FIFO/LIFO queue.
 *
 * Usage:
 *    `redback.createQueue(key [, is_fifo]);`
 *
 * Reference:
 *    http://redis.io/topics/data-types#lists
 *    http://en.wikipedia.org/wiki/Queue_(data_structure)
 *
 * Redis Structure:
 *    `(namespace:)key = list(values)`
 */

var Queue = exports.Queue = Structure.new();

/**
 * Setup the Queue to be either FIFO or LIFO.
 *
 * @param {bool} is_fifo
 * @api private
 */

Queue.prototype.init = function (is_fifo) {
    this.fifo = is_fifo;
    this.list = new List(this.client, this.id, this.namespace);
}

/**
 * Add one or more elements to the queue.
 *
 * @param {string|Array} value(s)
 * @param {Function} callback (optional)
 * @api public
 */

Queue.prototype.enqueue = Queue.prototype.add = function (values, callback) {
    this.list.unshift(values, callback);
    return this;
}

/**
 * Remove the next element from the queue.
 *
 * @param {int} wait (optional) - block for this many seconds
 * @param {Function} callback
 * @api public
 */

Queue.prototype.dequeue = Queue.prototype.next = function (wait, callback) {
    this.list[this.fifo ? 'pop' : 'shift'](wait, callback);
    return this;
}

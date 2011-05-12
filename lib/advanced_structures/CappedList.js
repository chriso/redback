/*!
 * Redback
 * Copyright(c) 2011 Chris O'Hara <cohara87@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var List = require('../base_structures/List').List;

/**
 * A Redis list with a fixed length. Each command that adds a value to the
 * list is followed by an `LTRIM` command.
 *
 * Usage:
 *    `redback.createCappedList(key [, max_length]);`
 *
 * Reference:
 *    http://redis.io/topics/data-types#lists
 *    http://redis.io/commands/ltrim
 *
 * Redis Structure:
 *    `(namespace:)key = list(values)`
 */

var CappedList = exports.CappedList = List.prototype.extend();

/**
 * Setup the Capped List.
 *
 * @param {int} length - the maximum length of the list
 * @param {Function} callback
 * @api private
 */

CappedList.prototype.init = function (length) {
    this.len = length || 1000;
}

/**
 * Insert an element before the specified pivot.
 *
 * @param {int} pivot
 * @param {string} value
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

CappedList.prototype.insertBefore = function (pivot, value, callback) {
    callback = callback || function () {};
    var multi = this.client.multi()
    multi.linsert(this.key, 'BEFORE', pivot, value);
    multi.ltrim(this.key, -1 * this.len, -1);
    multi.exec(callback);
    return this;
}

/**
 * Insert an element after the specified pivot.
 *
 * @param {int} pivot
 * @param {string} value
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

CappedList.prototype.insertAfter = function (pivot, value, callback) {
    callback = callback || function () {};
    var multi = this.client.multi()
    multi.linsert(this.key, 'AFTER', pivot, value);
    multi.ltrim(this.key, -1 * this.len, -1);
    multi.exec(callback);
    return this;
}

/**
 * Add one or more elements to the start of the list.
 *
 * @param {string|array} value(s)
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

CappedList.prototype.unshift = CappedList.prototype.lpush = function (values, callback) {
    callback = callback || function () {};
    var multi = this.client.multi();
    if (Array.isArray(values)) {
        var key = this.key;
        values.reverse().forEach(function (value) {
            multi.lpush(key, value);
        });
    } else {
        multi.lpush(this.key, values);
    }
    multi.ltrim(this.key, -1 * this.len, -1);
    multi.exec(callback);
    return this;
}

/**
 * Add one or more elements to the end of the list.
 *
 * @param {string|array} value(s)
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

CappedList.prototype.push = CappedList.prototype.add = function (values, callback) {
    callback = callback || function () {};
    var multi = this.client.multi();
    if (Array.isArray(values)) {
        var key = this.key;
        values.forEach(function (value) {
            multi.rpush(key, value);
        });
    } else {
        multi.rpush(this.key, values);
    }
    multi.ltrim(this.key, -1 * this.len, -1);
    multi.exec(callback);
    return this;
}

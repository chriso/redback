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
 * A wrapper for the Redis list type.
 *
 * Usage:
 *    `redback.createList(key);`
 *
 * Reference:
 *    http://redis.io/topics/data-types#lists
 *
 * Redis Structure:
 *    `(namespace:)key = list(values)`
 */

var List = exports.List = Structure.new();

/**
 * Get the list as an array.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

List.prototype.values = function (callback) {
    this.client.lrange(this.key, 0, -1, callback);
    return this;
}

/**
 * Get a range of list elements.
 *
 * @param {int} start
 * @param {count} end (optional - defaults to the last element)
 * @param {Function} callback
 * @return this
 * @api public
 */

List.prototype.range = function (start, end, callback) {
    if (typeof end === 'function') {
        callback = end;
        end = -1;
    }
    this.client.lrange(this.key, start, end, callback);
    return this;
}

/**
 * Get one or more elements starting at the specified index.
 *
 * @param {int} index
 * @param {count} count (optional - default is 1)
 * @param {Function} callback
 * @return this
 * @api public
 */

List.prototype.get = function (index, count, callback) {
    if (typeof count === 'function') {
        callback = count;
        this.client.lindex(this.key, index, callback);
    } else {
        this.client.lrange(this.key, index, index + count - 1, callback);
    }
    return this;
}

/**
 * Cap the length of the list.
 *
 * @param {int} length
 * @param {bool} keep_earliest (optional - default is false)
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

List.prototype.cap = function (length, keep_earliest, callback) {
    callback = callback || function () {};
    var start = 0, end = -1;
    if (typeof keep_earliest === 'function') {
        //Keep the last `length` elements
        start = -1 * length;
        callback = keep_earliest;
    } else {
        //Keep the first `length` elements
        end = length - 1;
    }
    this.client.ltrim(this.key, start, end, callback);
    return this;
}

/**
 * Remove one or more list elements matching the value.
 *
 * @param {string} value
 * @param {bool} count (optional - default is 1)
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

List.prototype.remove = function (value, count, callback) {
    callback = callback || function () {};
    if (typeof count === 'function') {
        callback = count;
        count = 1;
    }
    this.client.lrem(this.key, count, value, callback);
    return this;
}

/**
 * Trim a list to the specified bounds.
 *
 * @param {int} start
 * @param {int} end
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

List.prototype.trim = function (start, end, callback) {
    callback = callback || function () {};
    this.client.ltrim(this.key, start, end, callback);
    return this;
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

List.prototype.insertBefore = function (pivot, value, callback) {
    callback = callback || function () {};
    this.client.linsert(this.key, 'BEFORE', pivot, value, callback);
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

List.prototype.insertAfter = function (pivot, value, callback) {
    callback = callback || function () {};
    this.client.linsert(this.key, 'AFTER', pivot, value, callback);
    return this;
}

/**
 * Set the element at the specified index.
 *
 * @param {int} index
 * @param {string} value
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

List.prototype.set = function (index, value, callback) {
    callback = callback || function () {};
    this.client.lset(this.key, index, value, callback);
    return this;
}

/**
 * Get the number of elements in the list.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

List.prototype.length = function (callback) {
    this.client.llen(this.key, callback);
    return this;
}

/**
 * Get and remove the last element in the list. The first param can be used
 * to block the process and wait until list elements are available. If the list
 * is empty in both examples below, the first example will return `null`, while
 * the second will wait for up to 3 seconds. If a list element becomes available
 * during the 3 seconds it will be returned, otherwise `null` will be returned.
 *
 * Example:
 *    `list.shift(callback);`
 *
 * Blocking Example:
 *    `list.shift(3, callback)`
 *
 * @param {int} wait (optional) - seconds to block
 * @param {Function} callback
 * @return this
 * @api public
 */

List.prototype.shift = function (wait, callback) {
    if (typeof wait === 'function') {
        callback = wait;
        this.client.lpop(this.key, callback);
    } else {
        this.client.blpop(this.key, wait, callback);
    }
    return this;
}

/**
 * Get and remove the last element in the list. The first param can be used
 * to block the process and wait until list elements are available. If the list
 * is empty in both examples below, the first example will return `null`, while
 * the second will wait for up to 3 seconds. If a list element becomes available
 * during the 3 seconds it will be returned, otherwise `null` will be returned.
 *
 * Example:
 *    `list.pop(callback);`
 *
 * Blocking Example:
 *    `list.pop(3, callback)`
 *
 * @param {int} wait (optional) - seconds to block
 * @param {Function} callback
 * @return this
 * @api public
 */

List.prototype.pop = function (wait, callback) {
    if (typeof wait === 'function') {
        callback = wait;
        this.client.rpop(this.key, callback);
    } else {
        this.client.brpop(this.key, wait, callback);
    }
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

List.prototype.unshift = List.prototype.lpush = function (values, callback) {
    callback = callback || function () {};
    if (Array.isArray(values)) {
        var multi = this.client.multi(), key = this.key;
        values.reverse().forEach(function (value) {
            multi.lpush(key, value);
        });
        multi.exec(callback);
    } else {
        this.client.lpush(this.key, values, callback);
    }
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

List.prototype.push = List.prototype.add = function (values, callback) {
    callback = callback || function () {};
    if (Array.isArray(values)) {
        var multi = this.client.multi(), key = this.key;
        values.forEach(function (value) {
            multi.rpush(key, value);
        });
        multi.exec(callback);
    } else {
        this.client.rpush(this.key, values, callback);
    }
    return this;
}

/**
 * Remove the last element of the list and add it to the start
 * of another list.
 *
 * @param {String|List} list
 * @param {bool} wait (optional) - seconds to block while waiting
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

List.prototype.popShift = function (list, wait, callback) {
    callback = callback || function () {};
    list = this.getKey(list);
    if (typeof wait === 'function') {
        callback = wait;
        this.client.rpoplpush(this.key, list, callback);
    } else {
        this.client.brpoplpush(this.key, list, wait, callback);
    }
    return this;
}

/*!
 * Redback
 * Copyright(c) 2011 Chris O'Hara <cohara87@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var SortedSet = require('../base_structures/SortedSet').SortedSet;

/**
 * The DensitySet is similar to a SortedSet but the ability to explicitly
 * set an element's score has been removed. Instead, adding/removing
 * an element will increment/decrement its score, e.g.
 *     `DensitySet.add(['foo','foo','foo'], ..)` //'foo' has a score of 3
 *
 * Usage:
 *    `redback.createDensitySet(key);`
 *
 * Reference:
 *    http://redis.io/topics/data-types#sorted-sets
 *
 * Redis Structure:
 *    `(namespace:)key = zset(count => element)`
 */

var DensitySet = exports.DensitySet = SortedSet.prototype.extend();

/**
 * Add one or more elements to the set.
 *
 * @param {string|Array} element(s)
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

DensitySet.prototype.add = function (element, callback) {
    callback = callback || function () {};
    if (Array.isArray(element)) {
        return this.addAll(element, callback);
    }
    this.client.zincrby(this.key, 1, element, callback);
    return this;
}

/**
 * Remove one or more elements from the set.
 *
 * @param {string|Array} element(s)
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

DensitySet.prototype.remove = function (element, callback) {
    callback = callback || function () {};
    if (Array.isArray(element)) {
        return this.removeAll(element, callback);
    }
    var self = this;
    this.client.zincrby(this.key, -1, element, function (err, removed) {
        if (err) return callback(err, null);
        self.client.zremrangebyscore(self.key, '-inf', 0, callback);
    });
    return this;
}

/**
 * Add multiple elements to the set.
 *
 * @param {Array} elements
 * @param {Function} callback
 * @return this
 * @api private
 */

DensitySet.prototype.addAll = function (elements, callback) {
    var self = this,
        remaining = elements.length,
        failed = false,
        add_count = 0;

    elements.forEach(function (element) {
        self.client.zincrby(self.key, 1, element, function (err, added) {
            if (failed) {
                return;
            } else if (err) {
                failed = true;
                return callback(err);
            } else {
                if (added) add_count++;
                if (!--remaining) callback(null, add_count);
            }
        });
    });
    return this;
}

/**
 * Remove multiple elements from the set.
 *
 * @param {Array} elements
 * @param {Function} callback
 * @return this
 * @api private
 */

DensitySet.prototype.removeAll = function (elements, callback) {
    var self = this,
        remaining = elements.length,
        failed = false,
        rem_count = 0;

    elements.forEach(function (element) {
        self.client.zincrby(self.key, -1, element, function (err, added) {
            if (failed) {
                return;
            } else if (err) {
                failed = true;
                return callback(err);
            } else {
                if (added) rem_count++;
                if (!--remaining) {
                    self.client.zremrangebyscore(self.key, '-inf', 0, function (err) {
                        callback(err, rem_count);
                    });
                }
            }
        });
    });
    return this;
}

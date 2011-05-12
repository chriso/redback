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
 * A wrapper for the Redis set type.
 *
 * Usage:
 *    `redback.createSet(key);`
 *
 * Reference:
 *    http://redis.io/topics/data-types#sets
 *
 * Redis Structure:
 *    `(namespace:)key = set(elements)`
 */

var Set = exports.Set = Structure.new();

/**
 * Add one or more elements to the set.
 *
 * @param {string|Array} element(s)
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

Set.prototype.add = function (element, callback) {
    callback = callback || function () {};
    if (Array.isArray(element)) {
        return this.addAll(element, callback);
    }
    this.client.sadd(this.key, element, callback);
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

Set.prototype.remove = function (element, callback) {
    callback = callback || function () {};
    if (Array.isArray(element)) {
        return this.removeAll(element, callback);
    }
    this.client.srem(this.key, element, callback);
    return this;
}

/**
 * Get an array of elements in the set.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

Set.prototype.elements = Set.prototype.members = function (callback) {
    this.client.smembers(this.key, callback);
    return this;
}

/**
 * Move an element to another set.
 *
 * @param {string|Set} dest
 * @param {string} element
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

Set.prototype.move = function (dest, element, callback) {
    callback = callback || function () {};
    this.client.smove(this.key, this.getKey(dest), element, callback);
    return this;
}

/**
 * Check whether an element exists in the set.
 *
 * @param {string} element
 * @param {Function} callback
 * @return this
 * @api public
 */

Set.prototype.exists = Set.prototype.contains = function (element, callback) {
    this.client.sismember(this.key, element, callback);
    return this;
}

/**
 * Get the length (cardinality) of the set.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

Set.prototype.length = Set.prototype.cardinality = function (callback) {
    this.client.scard(this.key, callback);
    return this;
}

/**
 * Get a random element from the set and optionally remove it.
 *
 * @param {bool} remove (optional - default is false)
 * @param {Function} callback
 * @return this
 * @api public
 */

Set.prototype.random = function (remove, callback) {
    if (typeof remove === 'function') {
        callback = remove;
        this.client.srandmember(this.key, callback);
    } else {
        this.client.spop(this.key, callback);
    }
    return this;
}

/**
 * Get the intersection of one or more sets.
 *
 * @param {string|Set|Array} set(s)
 * @param {Function} callback
 * @return this
 * @api public
 */

Set.prototype.inter = function (sets, callback) {
    sets = this.getKeys(arguments);
    sets.unshift(this.key);
    this.client.sinter.apply(this.client, sets);
    return this;
}

/**
 * Get the intersection of one or more sets and store it another
 * set (dest).
 *
 * @param {string|Set} dest
 * @param {string|Set|Array} set(s)
 * @param {Function} callback
 * @return this
 * @api public
 */

Set.prototype.interStore = function (dest, sets, callback) {
    sets = this.getKeys(arguments);
    dest = sets.shift();
    sets.unshift(dest, this.key);
    this.client.sinterstore.apply(this.client, sets);
    return this;
}

/**
 * Get the union of one or more sets.
 *
 * @param {string|Set|Array} set(s)
 * @param {Function} callback
 * @return this
 * @api public
 */

Set.prototype.union = function (sets, callback) {
    sets = this.getKeys(arguments);
    sets.unshift(this.key);
    this.client.sunion.apply(this.client, sets);
    return this;
}

/**
 * Get the union of one or more sets and store it another
 * set (dest).
 *
 * @param {string|Set} dest
 * @param {string|Set|Array} set(s)
 * @param {Function} callback
 * @return this
 * @api public
 */

Set.prototype.unionStore = function (dest, sets, callback) {
    sets = this.getKeys(arguments);
    dest = sets.shift();
    sets.unshift(dest, this.key);
    this.client.sunionstore.apply(this.client, sets);
    return this;
}

/**
 * Get the difference of one or more sets.
 *
 * @param {string|Set|Array} set(s)
 * @param {Function} callback
 * @return this
 * @api public
 */

Set.prototype.diff = function (sets, callback) {
    sets = this.getKeys(arguments);
    sets.unshift(this.key);
    this.client.sdiff.apply(this.client, sets);
    return this;
}

/**
 * Get the difference of one or more sets and store it another
 * set (dest).
 *
 * @param {string|Set} dest
 * @param {string|Set|Array} set(s)
 * @param {Function} callback
 * @return this
 * @api public
 */

Set.prototype.diffStore = function (dest, sets, callback) {
    sets = this.getKeys(arguments);
    dest = sets.shift();
    sets.unshift(dest, this.key);
    this.client.sdiffstore.apply(this.client, sets);
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

Set.prototype.addAll = function (elements, callback) {
    var self = this,
        remaining = elements.length,
        failed = false,
        add_count = 0;

    elements.forEach(function (element) {
        self.client.sadd(self.key, element, function (err, added) {
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

Set.prototype.removeAll = function (elements, callback) {
    var self = this,
        remaining = elements.length,
        failed = false,
        rem_count = 0;

    elements.forEach(function (element) {
        self.client.srem(self.key, element, function (err, removed) {
            if (failed) {
                return;
            } else if (err) {
                failed = true;
                return callback(err);
            } else {
                if (removed) rem_count++;
                if (!--remaining) callback(null, rem_count);
            }
        });
    });
    return this;
}

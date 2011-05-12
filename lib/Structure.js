/*!
 * Redback
 * Copyright(c) 2011 Chris O'Hara <cohara87@gmail.com>
 * MIT Licensed
 */

/**
 * All Redback structures inherit from this.
 */

var Structure = exports.Structure = function () {};

/**
 * Create a new Structure by extending the base Structure.
 *
 * @param {Object} methods (optional)
 * @return structure
 * @api public
 */

exports.new = function (methods) {
    return Structure.prototype.extend(methods);
}

/**
 * Expire the structure after a certain number of seconds.
 *
 * @param {int} ttl
 * @param {Function} callback
 * @return this
 * @api public
 */

Structure.prototype.expire = function (ttl, callback) {
    this.client.expire(this.key, ttl, callback);
    return this;
}

/**
 * Expire the structure at a certain date.
 *
 * @param {Date} when
 * @param {Function} callback
 * @return this
 * @api public
 */

Structure.prototype.expireAt = function (when, callback) {
    if (typeof when.getTime === 'function') {
        when = Math.round(when.getTime() / 1000); //ms => s
    }
    this.client.expireat(this.key, when, callback);
    return this;
}

/**
 * Get the number of seconds before the structure expires.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

Structure.prototype.ttl = function (callback) {
    this.client.ttl(this.key, callback);
    return this;
}

/**
 * Remove the associated expiry TTL.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

Structure.prototype.persist = function (callback) {
    this.client.persist(this.key, callback);
    return this;
}

/**
 * Remove the structure from the Redis database.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

Structure.prototype.flush = function (callback) {
    this.client.del(this.key, callback);
    return this;
}

/**
 * A helper for creating atomically auto-incrementing keys.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

Structure.prototype.autoincrement = function (callback) {
    var key = this.key + ':_autoinc',
        multi = this.client.multi();
    multi.setnx(key, 1).get(key).incr(key);
    multi.exec(function (err, replies) {
        if (err) return callback(err, null);
        callback(null, replies[1]);
    });
    return this;
}

/**
 * Takes a redback structure or key string and returns the key.
 *
 * @param {string|Object} key
 * @return {string} key
 * @api public
 */

Structure.prototype.getKey = function (key, which) {
    which = which || 'key';
    if (typeof key[which] !== 'undefined') {
        return key[which];
    }
    return key;
}

/**
 * A helper that extracts the Redis keys from many Structure or string arguments.
 *
 * @param {Array} structures
 * @param {Function} callback
 * @return this
 * @api public
 */

Structure.prototype.getKeys = function (structures, which) {
    var structures = Array.prototype.slice.call(structures),
        callback = structures.pop(),
        self = this,
        keys = [];
    for (var i = 0, l = structures.length; i < l; i++) {
        if (Array.isArray(structures[i])) {
            structures[i].forEach(function (structure) {
                keys.push(self.getKey(structure, which));
            });
        } else {
            keys.push(this.getKey(structures[i], which));
        }
    }
    keys.push(callback);
    return keys;
}

/**
 * Add the namespace on to a key.
 *
 * @param {string} key
 * @return {string} namespaced_key
 * @api public
 */

Structure.prototype.namespaceKey = function (key) {
    if (this.namespace.length) {
        key = this.namespace + ':' + key;
    }
    return key;
}

/**
 * Extend the structure.
 *
 * @param {Object} methods (optional)
 * @return this
 * @api public
 */

Structure.prototype.extend = function (methods) {
    var structure = function (client, key, namespace, init_args) {
        this.client = client;
        this.namespace = namespace || '';
        if (!key) {
            throw new Error('A key is required');
        }
        if (Array.isArray(key)) {
            key = key.join(':');
        }
        this.id = key;
        if (this.namespace.length) {
            key = this.namespace + ':' + key;
        }
        this.key = key;
        if (typeof this.init === 'function') {
            this.init.apply(this, init_args);
        }
    }, ctor = function () {
        this.constructor = structure;
    }
    ctor.prototype = this;
    structure.prototype = new ctor;
    structure.__super__ = this;
    if (typeof methods === 'object') {
        for (var i in methods) {
            structure.prototype[i] = methods[i];
        }
    }
    return structure;
}

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
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

Structure.prototype.expire = function (ttl, callback) {
    callback = callback || function () {};
    this.client.expire(this.key, ttl, callback);
    return this;
}

/**
 * Expire the structure at a certain date.
 *
 * @param {Date} when
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

Structure.prototype.expireAt = function (when, callback) {
    callback = callback || function () {};
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
 * Checks whether the structure has an expiry.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

Structure.prototype.isVolatile = function (callback) {
    this.client.ttl(this.key, function (err, ttl) {
        if (err) return callback(err, null);
        callback(null, ttl != -1);
    });
    return this;
}

/**
 * Remove the structure's associated expiry.
 *
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

Structure.prototype.persist = function (callback) {
    callback = callback || function () {};
    this.client.persist(this.key, callback);
    return this;
}

/**
 * Remove the structure from the Redis database.
 *
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

Structure.prototype.destroy =
Structure.prototype.flush = function (callback) {
    callback = callback || function () {};
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
    key = key || '';
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


/**
 * Create a random key for temporary use.
 *
 * @return {string} random_key
 * @api public
 */

Structure.prototype.randomKey = function () {
    return Math.random();
}

/**
 * Get the type of the current structure.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

Structure.prototype.type = function (callback) {
    this.client.type(this.key, callback);
    return this;
}

/**
 * Rename the structure (change the Redis key).
 *
 * @param {string} new_key
 * @param {Function} callback
 * @return this
 * @api public
 */

Structure.prototype.rename = function (new_key, callback) {
    var self = this;
    new_key = this.namespaceKey(new_key);
    this.client.rename(this.key, new_key, function (err) {
        if (err) return callback(err, null);
        self.key = new_key;
        callback();
    });
    return this;
}

/**
 * Sort all elements in the structure.
 *
 * Options:
 *    limit, offset, by, get, alpha, desc, store
 *
 * Reference:
 *    http://redis.io/commands/sort
 *
 * @param {object} options
 * @param {Function} callback
 * @return this
 * @api public
 */

Structure.prototype.sort = function (options, callback) {
    var args = [this.key];

    //SORT key [BY pattern] [LIMIT offset count]
    //   [GET pattern [GET pattern ...]] [ASC|DESC] [ALPHA] [STORE destination]
    if (typeof options.by !== 'undefined') {
        args.push('BY', options.by);
    }
    if (typeof options.limit !== 'undefined') {
        args.push('LIMIT');
        if (typeof options.offset !== 'undefined') {
            args.push(options.offset);
        }
        args.push(options.limit);
    }
    if (typeof options.get !== 'undefined') {
        if (Array.isArray(options.get)) {
            options.get.forEach(function (pattern) {
                args.push('GET', pattern);
            });
        } else {
            args.push('GET', options.get);
        }
    }
    if (typeof options.desc !== 'undefined' && options.desc) {
        args.push('DESC');
    }
    if (typeof options.alpha !== 'undefined' && options.alpha) {
        args.push('ALPHA');
    }
    if (typeof options.store !== 'undefined') {
        args.push('STORE', options.store);
    }
    this.client.sort.apply(this.client, args);
    return this;
}

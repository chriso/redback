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
 * The KeyPair is a structure where unique values are assigned an
 * ID (like a table with a primary auto-incrementing key and
 * a single unique column). Internally, the KeyPair uses two Redis
 * hashes to provide O(1) lookup by both ID and value.
 *
 * Usage:
 *    `redback.createKeyPair(key);`
 *
 * Reference:
 *    http://redis.io/topics/data-types#hashes
 *
 * Redis Structure:
 *    `(namespace:)key     = hash(id => value)`
 *    `(namespace:)key:ids = hash(value => id)`
 */

var KeyPair = exports.KeyPair = Structure.new();

/**
 * Initialise the KeyPair.
 *
 * @api private
 */

KeyPair.prototype.init = function () {
    this.idkey = this.key + ':ids';
}

/**
 * Add a unique value to the KeyPair and return its id. If the value already
 * exists, the existing id is returned.
 *
 * @param {string|Array} value(s)
 * @param {Function} callback
 * @return this
 * @api public
 */

KeyPair.prototype.add = function (value, callback) {
    //Pass on an array of values to addAll()
    if (Array.isArray(value)) {
        return this.addAll(value, callback);
    }

    var self = this, hashed_value = this.hashValue(value);
    //Check if the value already has an id
    this.client.hget(this.idkey, value, function (err, id) {
        if (err) return callback(err, null);
        if (null !== id) {
            callback(null, id);
        } else {
            //If not, create a new id
            self.autoincrement(function (err, id) {
                if (err) return callback(err, null);

                //Set the id and value simultaneously
                var multi = self.client.multi();
                multi.hsetnx(self.idkey, hashed_value, id);
                multi.hsetnx(self.key, id, value);
                multi.exec(function(err, response) {
                    if (err) return callback(err, null);

                    //Another client may have add at exactly the same time, so do
                    //another get to get the actual stored id
                    self.client.hget(self.idkey, hashed_value, function (err, real_id) {
                        if (err) return callback(err, null);
                        if (real_id == id) {
                            return callback(null, real_id);
                        } else {
                            //Another client did beat us! remove the bad key
                            self.client.hdel(self.key, id, function (err) {
                                if (err) {
                                    callback(err, null);
                                } else {
                                    callback(null, real_id);
                                }
                            });
                        }
                    });
                });
            });
        }
    });
    return this;
}

/**
 * Add multiple unique values to the KeyPair and return and
 * object containing {value: id, ...}.
 *
 * @param {Array} values
 * @param {Function} callback
 * @return this
 * @api public
 */

KeyPair.prototype.addAll = function (values, callback) {
    var self = this,
        remaining = values.length,
        ids = {},
        failed = false;

    values.forEach(function (value) {
        self.add(value, function (err, id) {
            if (failed) {
                return;
            } else if (err) {
                failed = true;
                return callback(err, null);
            } else {
                ids[value] = id;
                if (!--remaining) callback(null, ids);
            }
        });
    });
}

/**
 * Lookup a unique value and get the associated id.
 *
 * @param {string} value
 * @param {Function} callback
 * @return this
 * @api public
 */

KeyPair.prototype.get = function (value, callback) {
    if (typeof value === 'function') {
        callback = value;
        this.client.hgetall(this.key, callback);
    } else if (Array.isArray(value)) {
        for (var i = 0, l = value.length; i < l; i++) {
            value[i] = this.hashValue(value[i]);
        }
        this.client.hmget(this.idkey, value, callback)
    } else {
        this.client.hget(this.idkey, this.hashValue(value), callback);
    }
    return this;
}

/**
 * Get the value associated with the id.
 *
 * @param {int} id
 * @param {Function} callback
 * @return this
 * @api public
 */

KeyPair.prototype.getById = function (id, callback) {
    this.client.hget(this.key, id, callback);
    return this;
}

/**
 * Get an array of ids.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

KeyPair.prototype.ids = function (callback) {
    this.client.hkeys(this.key, callback);
    return this;
}

/**
 * Get an array of values.
 *
 * @param {string} value
 * @param {Function} callback
 * @return this
 * @api public
 */

KeyPair.prototype.values = function (callback) {
    this.client.hvals(this.key, callback);
    return this;
}

/**
 * Check whether a unique value already exists and  has an associated id.
 *
 * @param {string} value
 * @param {Function} callback
 * @return this
 * @api public
 */

KeyPair.prototype.exists = function (value, callback) {
    this.client.hexists(this.idkey, this.hashValue(value), callback);
    return this;
}

/**
 * Checks whether an id exists.
 *
 * @param {string} value
 * @param {Function} callback
 * @return this
 * @api public
 */

KeyPair.prototype.idExists = function (id, callback) {
    this.client.hexists(this.key, id, callback);
    return this;
}

/**
 * Deletes a unique value and its associated id.
 *
 * @param {string} value
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

KeyPair.prototype.delete = function (value, callback) {
    callback = callback || function () {};
    var self = this, value = this.hashValue(value);
    this.client.hget(this.idkey, value, function (err, id) {
        if (err || value == null) return callback(err);
        self._delete(id, value, callback);
    });
    return this;
}

/**
 * Deletes an id and its associated unique value.
 *
 * @param {int} id
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

KeyPair.prototype.deleteById = function (id, callback) {
    callback = callback || function () {};
    var self = this;
    this.client.hget(this.key, id, function (err, value) {
        if (err || value == null) return callback(err);
        self._delete(id, self.hashValue(value), callback);
    });
    return this;
}

/**
 * An internal helper for simultaneously deleting an id/value pair.
 *
 * @param {int} id
 * @param {string} value
 * @param {Function} callback
 * @return this
 * @api private
 */

KeyPair.prototype._delete = function (id, value, callback) {
    var multi = this.client.multi();
    multi.hdel(this.key, id);
    multi.hdel(this.idkey, this.hashValue(value));
    multi.exec(callback);
    return this;
}

/**
 * Get the number of unique values.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

KeyPair.prototype.length = function (callback) {
    this.client.hlen(this.key, callback);
    return this;
}

/**
 * Override this method if you need to hash the unique value
 * in the second internal hash (i.e. if values are large).
 *
 * @param {string} value
 * @return {string} hashed_value
 * @api public
 */

KeyPair.prototype.hashValue = function (value) {
    return value;
}

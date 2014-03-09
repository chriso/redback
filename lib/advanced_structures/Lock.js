
var crypto = require('crypto');
var Structure = require('../Structure');

var Lock = exports.Lock = Structure.new();

/**
 * Acquire a temporary lock on some key.
 *
 * @param   {string}    key             The unique key of the lock
 * @param   {number}    ttl             The amount of time (in seconds) before the lock expires
 * @param   {Function}  callback        Invoked when the process completes
 * @param   {Error}     callback.err    An error that occurred, if any
 * @param   {string}    callback.token  The token that was acquired if successful. If the lock was
 *                                      not acquired then this will be `undefined`
 * @api public
 */

Lock.prototype.acquire = function(key, ttl, callback) {
    var client = this.client;

    _createToken(function(err, token) {
        if (err) {
            return callback(err);
        }

        client.setnx(key, token, function(err, wasSet) {
            if (err) {
                return callback();
            } else if (!wasSet) {
                // We did not successfully acquire the lock. Since a process can crash after it sets
                // the lock but before it sets the expiry, we need to avoid deadlocks by ensuring
                // the lock has a TTL associated to it
                _ensureTtl(client, key, ttl);
                return callback();
            }

            // Apply the expiry to the lock
            client.expire(key, ttl, function(err) {
                if (err) {
                    return callback(err);
                }

                // Return the token, which is used to release the lock
                return callback(null, token);
            });
        });
    });
};

/**
 * Release a lock that was acquired with the provided key and token.
 *
 * @param   {string}    key                 The key for the lock to release
 * @param   {string}    token               The token that was generated for the lock acquisition
 * @param   {Function}  callback            Invoked when the function completes
 * @param   {Error}     callback.err        An error that occurred, if any
 * @param   {boolean}   callback.hadLock    Determines whether or not we owned the lock at the time
 *                                          that we released it
 * @api public
 */
Lock.prototype.release = function(key, token, callback) {
    var client = this.client;

    client.get(key, function(err, lockedToken) {
        if (err) {
            return callback(err);
        } else if (lockedToken !== token) {
            // The current token is not the one we acquired. It's possible we held the lock longer
            // than its expiry
            return callback(null, false);
        }

        // We have the token, simply delete the lock key
        client.del(key, function(err) {
            if (err) {
                return callback(err);
            }

            return callback(null, true);
        });
    });
};

/**
 * Ensure the lock with the given key has a `ttl`. If it does not, the given expiry will be applied
 * to it.
 *
 * @param   {RedisClient}   client  The Redis to use to apply the ttl
 * @param   {string}        key     The key of the lock to check
 * @param   {number}        ttl     If the lock does not have an expiry set, set this duration (in
 *                                  seconds)
 * @api private
 */

var _ensureTtl = function(client, key, ttl) {
    client.ttl(key, function(err, currentTtl) {
        if (currentTtl === -1) {
            // There is no expiry set on this key, set it
            client.expire(key, ttl);
        }
    });
};

/**
 * Generate a random lock token.
 *
 * @param   {Function}  callback        Invoked with the token when complete
 * @param   {Error}     callback.err    An error that occurred, if any
 * @param   {string}    callback.token  The randomly generated token
 * @api private
 */

var _createToken = function(callback) {
    crypto.randomBytes(16, function(err, buffer) {
        if (err) {
            return callback(err);
        }

        return callback(null, buffer.toString('base64'));
    });
};

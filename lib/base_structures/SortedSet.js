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
 * A wrapper for the Redis sorted set (zset) type. Each element has a
 * score which is used to rank and order all elements in the set. Elements
 * are ranked from lowest score to highest (the lowest score has
 * a rank of 0)
 *
 * Usage:
 *    `redback.createSortedSet(key);`
 *
 * Reference:
 *    http://redis.io/topics/data-types#sorted-sets
 *
 * Redis Structure:
 *    `(namespace:)key = zset(score => element)`
 */

var SortedSet = exports.SortedSet = Structure.new();

/**
 * Add one or more elements to the set.
 *
 * To add a single element and score:
 *    `set.add(12, 'foo', callback);`
 *
 * To add multiple elements/scores:
 *    `set.add({foo:12, bar:3}, callback);`
 *
 * @param {int} score (optional)
 * @param {string|Object} element(s)
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

SortedSet.prototype.add = function (score, element, callback) {
    callback = callback || function () {};
    if (typeof score === 'object') {
        callback = element;
        element = score;
        return this.addAll(element, callback);
    }
    this.client.zadd(this.key, score, element, callback);
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

SortedSet.prototype.remove = function (element, callback) {
    callback = callback || function () {};
    if (Array.isArray(element)) {
        return this.removeAll(element, callback);
    }
    this.client.zrem(this.key, element, callback);
    return this;
}

/**
 * Get the number of elements in the set.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

SortedSet.prototype.length = function (callback) {
    this.client.zcard(this.key, callback);
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

SortedSet.prototype.exists =
SortedSet.prototype.contains = function (element, callback) {
    this.client.zscore(this.key, element, function (err, score) {
        callback(err, score != null);
    });
    return this;
}

/**
 * Get the rank of the specified element.
 *
 * @param {string} element
 * @param {Function} callback
 * @return this
 * @api public
 */

SortedSet.prototype.rank = function (element, callback) {
    this.client.zrank(this.key, element, callback)
    return this;
}

/**
 * Get the score of the specified element.
 *
 * @param {string} element
 * @param {Function} callback
 * @return this
 * @api public
 */

SortedSet.prototype.score = function (element, callback) {
    this.client.zscore(this.key, element, callback)
    return this;
}

/**
 * Increment the specified element's score.
 *
 * @param {string} element
 * @param {int} amount (optional - default is 1)
 * @param {Function} callback (optional)
 * @return this;
 * @api public
 */

SortedSet.prototype.increment =
SortedSet.prototype.incrBy = function (element, amount, callback) {
    callback = callback || function () {};
    if (typeof amount === 'function') {
        callback = amount;
        amount = 1;
    }
    this.client.zincrby(this.key, amount, element, callback);
    return this;
}

/**
 * Decrement the specified element's score.
 *
 * @param {string} element
 * @param {int} amount (optional - default is 1)
 * @param {Function} callback (optional)
 * @return this;
 * @api public
 */

SortedSet.prototype.decrement =
SortedSet.prototype.decrBy = function (element, amount, callback) {
    callback = callback || function () {};
    if (typeof amount === 'function') {
        callback = amount;
        amount = 1;
    }
    this.client.zincrby(this.key, -1 * amount, element, callback);
    return this;
}

/**
 * Add multiple elements to the set. See `add()`.
 *
 * @param {Object} elements
 * @param {Function} callback
 * @return this
 * @api private
 */

SortedSet.prototype.addAll = function (elements, callback) {
    var self = this, i,
        remaining = 0,
        failed = false,
        add_count = 0;

    for (i in elements) {
        remaining++;
        this.client.zadd(this.key, elements[i], i, function (err, added) {
            if (failed) {
                return;
            } else if (err) {
                failed = true;
                return callback(err);
            } else {
                if (added) add_count++;
                if (!--remaining) {
                    callback(null, add_count);
                }
            }
        });
    }
    return this;
}

/**
 * Remove multiple elements from the set. See `remove()`
 *
 * @param {Array} elements
 * @param {Function} callback
 * @return this
 * @api private
 */

SortedSet.prototype.removeAll = function (elements, callback) {
    var self = this,
        remaining = elements.length,
        failed = false,
        rem_count = 0;

    elements.forEach(function (element) {
        self.client.zrem(self.key, element, function (err, added) {
            if (failed) {
                return;
            } else if (err) {
                failed = true;
                return callback(err);
            } else {
                if (added) rem_count++;
                if (!--remaining) callback(null, rem_count);
            }
        });
    });
    return this;
}

/**
 * Get all elements in the set as an object `{element: score, ...}`.
 * If `without_scores` is true then just an array of elements is returned.
 *
 * @param {bool} without_scores (optional - scores are included by default)
 * @param {Function} callback
 * @return this
 * @api public
 */

SortedSet.prototype.get = function (without_scores, callback) {
    if (typeof without_scores === 'function') {
        callback = without_scores;
        this.client.zrange(this.key, 0, -1, 'WITHSCORES', this.parseScores(callback));
    } else {
        this.client.zrange(this.key, 0, -1, callback);
    }
    return this;
}


/**
 * Return a callback that parses a WITHSCORES result:
 *    `['foo','1','bar','2'] => {foo:1, bar:2}`
 *
 * @param {Function} callback
 * @api private
 */

SortedSet.prototype.parseScores = function (callback) {
    return function (err, results) {
        if (err) return callback(err, null);
        if (!results || results.length < 2) return callback(null, null);
        var len = results.length, i = 0, ret = {}, key, value;
        while (true) {
            key = results[i++];
            value = results[i++];
            ret[key] = value;
            if (i >= len) break;
        }
        callback(null, ret);
    }
}

/**
 * Get elements with scores between the specified range. Elements are returned
 * as an object `{element: score, ..}` and ordered from highest score to lowest.
 *
 * Note that the `start` and `end` range is inclusive and can be an integer or
 * the constants `redback.INF` to represent infinity, or `redback.NINF` to
 * represent negative infinity. `start` must be <= `end`.
 *
 * @param {int} start
 * @param {int} end
 * @param {int} count (optional) - the maximum number of elements to return
 * @param {int} offset (optional) - if using count, start at this offset
 * @param {Function} callback
 * @return this
 * @api public
 */

SortedSet.prototype.getScores = function (start, end, count, offset, callback) {
    if (null === start) start = '-inf';
    if (null === end) end = '+inf';
    if (typeof count === 'function') {
        callback = count;
        this.client.zrangebyscore(this.key, start, end,
            'WITHSCORES', this.parseScores(callback));
        return this;
    } else if (typeof offset === 'function') {
        callback = offset;
        offset = 0;
    }
    this.client.zrangebyscore(this.key, start, end, 'WITHSCORES',
        'LIMIT', offset, count, this.parseScores(callback));
    return this;
}

/**
 * The same as `getScores()` but elements are ordered from lowest score to
 * highest.
 *
 * Note that `end` must be <= `start`.
 *
 * @param {int} start
 * @param {int} end
 * @param {int} count (optional) - the maximum number of elements to return
 * @param {int} offset (optional) - if using count, start at this offset
 * @param {Function} callback
 * @return this
 * @api public
 */

SortedSet.prototype.getScoresReverse = function (start, end, count, offset, callback) {
    if (null === start) start = '+inf';
    if (null === end) end = '-inf';
    if (typeof count === 'function') {
        callback = count;
        this.client.zrevrangebyscore(this.key, start, end,
            'WITHSCORES', this.parseScores(callback));
        return this;
    } else if (typeof offset === 'function') {
        callback = offset;
        offset = 0;
    }
    this.client.zrevrangebyscore(this.key, start, end, 'WITHSCORES',
        'LIMIT', offset, count, this.parseScores(callback));
    return this;
}

/**
 * Remove elements with scores between the specified range (inclusive).
 *
 * @param {int} start
 * @param {int} end
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

SortedSet.prototype.removeScores = function (start, end, callback) {
    callback = callback || function () {};
    if (null === start) start = '-inf';
    if (null === end) end = '+inf';
    this.client.zremrangebyscore(this.key, start, end, callback);
    return this;
}

/**
 * Count the number of elements with scores between the specified
 * range (inclusive).
 *
 * @param {int} start
 * @param {int} end
 * @param {Function} callback
 * @return this
 * @api public
 */

SortedSet.prototype.countScores = function (start, end, callback) {
    if (null === start) start = '-inf';
    if (null === end) end = '+inf';
    this.client.zcount(this.key, start, end, callback);
    return this;
}

/**
 * Get elements with ranks between the specified range (inclusive).
 *
 * To get the first 3 elements in the set (with the highest scores):
 *    `set.getRanks(0, 2, callback);`
 *
 * To get the last 3 elements in the set (lowest scores):
 *    `set.getRanks(-3, -1, callback);`
 *
 * @param {int} start
 * @param {int} end
 * @param {Function} callback
 * @return this
 * @api public
 */

SortedSet.prototype.getRanks = function (start, end, callback) {
    if (null === start) start = 0;
    if (null === end) end = -1;
    this.client.zrange(this.key, start, end,
        'WITHSCORES', this.parseScores(callback));
    return this;
}

/**
 * The same as `getRanks()` but elements are ordered from lowest score
 * to the highest.
 *
 * Note that start and end have been deliberately switched for consistency.
 *
 * getScoresReverse(arg1, arg2, ..) expects arg1 >= arg2 and so does this
 * method.
 *
 * @param {int} end
 * @param {int} start
 * @param {Function} callback
 * @return this
 * @api public
 */

SortedSet.prototype.getRanksReverse = function (end, start, callback) {
    if (null === start) start = -1;
    if (null === end) end = 0;
    this.client.zrevrange(this.key, start, end,
        'WITHSCORES', this.parseScores(callback));
    return this;
}

/**
 * Remove elements with ranks between the specified range (inclusive).
 *
 * @param {int} start
 * @param {int} end
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

SortedSet.prototype.removeRanks = function (start, end, callback) {
    callback = callback || function () {};
    if (null === start) start = -1;
    if (null === end) end = 0;
    this.client.zremrangebyrank(this.key, start, end, callback);
    return this;
}

/**
 * Get `count` elements with the highest scores.
 *
 * @param {int} count
 * @param {Function} callback
 * @return this
 * @api public
 */

SortedSet.prototype.highestScores = function (count, callback) {
    this.getRanks(-1 * count, -1, callback);
    return this;
}

/**
 * Get `count` elements with the lowest scores.
 *
 * @param {int} count
 * @param {Function} callback
 * @return this
 * @api public
 */

SortedSet.prototype.lowestScores = function (count, callback) {
    this.getRanks(0, count - 1, callback);
    return this;
}

/**
 * Get the intersection of one or more sets. For more information on weights,
 * aggregate functions, etc. see: http://redis.io/commands/zinterstore
 *
 * @param {int} dest
 * @param {string|Set|Array} set(s)
 * @param {int|Array} weights (optional)
 * @param {string} aggregate (optional) - either SUM, MIN or MAX
 * @param {Function} callback
 * @return this
 * @api public
 */

SortedSet.prototype.inter = function (dest, sets, weights, aggregate, callback) {
    var args = [], self = this;
    args.push(this.getKey(dest));

    //weights/aggregate are optional
    if (typeof weights === 'function') {
        callback = weights;
        weights = aggregate = false;
    } else if (typeof aggregate === 'function') {
        callback = aggregate;
        aggregate = false;
    }

    //ZINTERSTORE destination numkeys key [key ...]
    //    [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]
    if (Array.isArray(sets)) {
        args.push(sets.length);
        sets.forEach(function (set) {
            args.push(self.getKey(set));
        });
    } else {
        args.push(1, this.getKey(sets));
    }
    if (weights) {
        args.push('WEIGHTS');
        if (Array.isArray(weights)) {
            weights.forEach(function (weight) {
                args.push(weight);
            });
        } else {
            args.push(weights);
        }
    }
    if (aggregate) {
        args.push('AGGREGATE', aggregate);
    }
    args.push(callback);
    this.client.zinterstore.apply(this.client, args);
    return this;
}

/**
 * Get the union of one or more sets. For more information on weights,
 * aggregate functions, etc. see: http://redis.io/commands/zunionstore
 *
 * @param {int} dest
 * @param {string|Set|Array} set(s)
 * @param {int|Array} weights (optional)
 * @param {string} aggregate (optional) - either SUM, MIN or MAX
 * @param {Function} callback
 * @return this
 * @api public
 */

SortedSet.prototype.union = function (dest, sets, weights, aggregate, callback) {
    var args = [], self = this;
    args.push(this.getKey(dest));

    //weights/aggregate are optional
    if (typeof weights === 'function') {
        callback = weights;
        weights = aggregate = false;
    } else if (typeof aggregate === 'function') {
        callback = aggregate;
        aggregate = false;
    }

    //ZUNIONSTORE destination numkeys key [key ...]
    //    [WEIGHTS weight [weight ...]] [AGGREGATE SUM|MIN|MAX]
    if (Array.isArray(sets)) {
        args.push(sets.length);
        sets.forEach(function (set) {
            args.push(self.getKey(set));
        });
    } else {
        args.push(1, this.getKey(sets));
    }
    if (weights) {
        args.push('WEIGHTS');
        if (Array.isArray(weights)) {
            weights.forEach(function (weight) {
                args.push(weight);
            });
        } else {
            args.push(weights);
        }
    }
    if (aggregate) {
        args.push('AGGREGATE', aggregate);
    }
    args.push(callback);
    this.client.zunionstore.apply(this.client, args);
    return this;
}

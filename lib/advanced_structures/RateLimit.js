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
 * See http://chris6f.com/rate-limiting-with-redis
 *
 * Count the number of times a subject performs an action over an interval
 * in the immediate past - this can be used to rate limit the subject if
 * the count goes over a certain threshold. For example, you could track
 * how many times an IP (the subject) has viewed a page (the action) over
 * a certain time frame and limit them accordingly.
 *
 * Usage:
 *    `redback.createRateLimit(action [, options]);`
 *
 * Options:
 *    `bucket_interval` - default is 5 seconds
 *    `bucket_span`     - default is 10 minutes
 *    `subject_expiry`  - default is 20 minutes
 *
 * Reference:
 *    http://chris6f.com/rate-limiting-with-redis
 *    http://redis.io/topics/data-types#hash
 *
 * Redis Structure:
 *    `(namespace:)action:<subject1> = hash(bucket => count)`
 *    `(namespace:)action:<subject2> = hash(bucket => count)`
 *    `(namespace:)action:<subjectN> = hash(bucket => count)`
 */

var RateLimit = exports.RateLimit = Structure.new();

/**
 * Setup the RateLimit structure.
 *
 * @param {Object} options (optional)
 * @api private
 */

RateLimit.prototype.init = function (options) {
    options = options || {};
    this.bucket_span = options.bucket_span || 600;
    this.bucket_interval = options.bucket_interval || 5;
    this.subject_expiry = options.subject_expiry || 1200;
    this.bucket_count = Math.round(this.bucket_span / this.bucket_interval);
}

/**
 * Get the bucket associated with the current time.
 *
 * @param {int} time (optional) - default is the current time (ms since epoch)
 * @return {int} bucket
 * @api private
 */

RateLimit.prototype.getBucket = function (time) {
    time = (time || new Date().getTime()) / 1000;
    return Math.floor((time % this.bucket_span) / this.bucket_interval);
}

/**
 * Increment the count for the specified subject.
 *
 * @param {string} subject
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

RateLimit.prototype.add = function (subject, callback) {
    if (Array.isArray(subject)) {
        return this.addAll(subject, callback);
    }
    var bucket = this.getBucket(), multi = this.client.multi();
    subject = this.key + ':' + subject;

    //Increment the current bucket
    multi.hincrby(subject, bucket, 1)

    //Clear the buckets ahead
    multi.hdel(subject, (bucket + 1) % this.bucket_count)
         .hdel(subject, (bucket + 2) % this.bucket_count)

    //Renew the key TTL
    multi.expire(subject, this.subject_expiry);

    multi.exec(function (err) {
        if (!callback) return;
        if (err) return callback(err);
        callback(null);
    });

    return this;
}

/**
 * Count the number of times the subject has performed an action
 * in the last `interval` seconds.
 *
 * @param {string} subject
 * @param {int} interval
 * @param {Function} callback
 * @return this
 * @api public
 */

RateLimit.prototype.count = function (subject, interval, callback) {
    var bucket = this.getBucket(),
        multi = this.client.multi(),
        count = Math.floor(interval / this.bucket_interval);

    subject = this.key + ':' + subject;

    //Get the counts from the previous `count` buckets
    multi.hget(subject, bucket);
    while (count--) {
        multi.hget(subject, (--bucket + this.bucket_count) % this.bucket_count);
    }

    //Add up the counts from each bucket
    multi.exec(function (err, counts) {
        if (err) return callback(err, null);
        for (var count = i = 0, l = counts.length; i < l; i++) {
            if (counts[i]) {
                count += parseInt(counts[i], 10);
            }
        }
        callback(null, count);
    });

    return this;
}

/**
 * An alias for `ratelimit.add(subject).count(subject, interval);`
 *
 * @param {string} subject
 * @param {int} interval
 * @param {Function} callback
 * @return this
 * @api public
 */

RateLimit.prototype.addCount = function (subject, interval, callback) {
    var bucket = this.getBucket(),
        multi = this.client.multi(),
        count = Math.floor(interval / this.bucket_interval);

    subject = this.key + ':' + subject;

    //Increment the current bucket
    multi.hincrby(subject, bucket, 1)

    //Clear the buckets ahead
    multi.hdel(subject, (bucket + 1) % this.bucket_count)
         .hdel(subject, (bucket + 2) % this.bucket_count)

    //Renew the key TTL
    multi.expire(subject, this.subject_expiry);

    //Get the counts from the previous `count` buckets
    multi.hget(subject, bucket);
    while (count--) {
        multi.hget(subject, (--bucket + this.bucket_count) % this.bucket_count);
    }

    //Add up the counts from each bucket
    multi.exec(function (err, counts) {
        if (err) return callback(err, null);
        for (var count = 0, i = 4, l = counts.length; i < l; i++) {
            if (counts[i]) {
                count += parseInt(counts[i], 10);
            }
        }
        callback(null, count);
    });

    return this;
}

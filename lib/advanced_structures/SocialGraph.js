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
 * Build a social graph similar to Twitter's. User ID can be a string or
 * integer, as long as they're unique.
 *
 * Usage:
 *    `redback.createSocialGraph(id [, prefix]);`
 *
 * Reference:
 *    http://redis.io/topics/data-types#sets
 *
 * Redis Structure:
 *    `(namespace:)(prefix:)id:following = set(ids)`
 *    `(namespace:)(prefix:)id:followers = set(ids)`
 */

var SocialGraph = exports.SocialGraph = Structure.new();

/**
 * Initialise the SocialGraph.
 *
 * @param {string} prefix (optional)
 * @api private
 */

SocialGraph.prototype.init = function (prefix) {
    this.key_prefix = this.namespaceKey();
    if (prefix) {
        this.key_prefix += prefix + ':';
    }
    this.key = this.key_prefix + this.id;
    this.following = this.key + ':following';
    this.followers = this.key + ':followers';
}

/**
 * Follow one or more users.
 *
 * @param {int|SocialGraph|Array} user(s)
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

SocialGraph.prototype.follow = function (users, callback) {
    var self = this,
        users = this.getKeys(arguments, 'id'),
        multi = this.client.multi();
    if (typeof users[users.length-1] === 'function') {
        callback = users.pop();
    } else {
        callback = function () {};
    }
    users.forEach(function (user) {
        multi.sadd(self.key_prefix + user + ':followers', self.id);
        multi.sadd(self.following, user);
    });
    multi.exec(callback);
    return this;
}

/**
 * Unfollow one or more users.
 *
 * @param {int|SocialGraph|Array} user(s)
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

SocialGraph.prototype.unfollow = function (users, callback) {
    var self = this,
        users = this.getKeys(arguments, 'id'),
        multi = this.client.multi();
    if (typeof users[users.length-1] === 'function') {
        callback = users.pop();
    } else {
        callback = function () {};
    }
    users.forEach(function (user) {
        multi.srem(self.key_prefix + user + ':followers', self.id);
        multi.srem(self.following, user);
    });
    multi.exec(callback);
    return this;
}

/**
 * Gets the users whom the current users follows as an array.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

SocialGraph.prototype.getFollowing = function (callback) {
    this.client.smembers(this.following, callback);
    return this;
}

/**
 * Gets an array of users who follow the current user.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

SocialGraph.prototype.getFollowers = function (callback) {
    this.client.smembers(this.followers, callback);
    return this;
}

/**
 * Count how many users the current user follows.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

SocialGraph.prototype.countFollowing = function (callback) {
    this.client.scard(this.following, callback);
    return this;
}

/**
 * Count how many users follow the current user.
 *
 * @param {Function} callback
 * @return this
 * @api public
 */

SocialGraph.prototype.countFollowers = function (callback) {
    this.client.scard(this.followers, callback);
    return this;
}

/**
 * Checks whether the current user follows the specified user.
 *
 * @param {string|SocialGraph} user
 * @param {Function} callback
 * @return this
 * @api public
 */

SocialGraph.prototype.isFollowing = function (user, callback) {
    user = this.getKey(user, 'id');
    this.client.sismember(this.following, user, callback);
    return this;
}

/**
 * Checks whether the specified user follows the current user.
 *
 * @param {string|SocialGraph} user
 * @param {Function} callback
 * @return this
 * @api public
 */

SocialGraph.prototype.hasFollower = function (user, callback) {
    user = this.getKey(user, 'id');
    this.client.sismember(this.followers, user, callback);
    return this;
}

/**
 * Gets an array of common followers for one or more users.
 *
 * @param {string|SocialGraph|Array} user(s)
 * @param {Function} callback
 * @return this
 * @api public
 */

SocialGraph.prototype.getCommonFollowers = function (users, callback) {
    var users = this.getSocialKeys(arguments, 'followers');
    users.unshift(this.followers);
    this.client.sinter.apply(this.client, users);
    return this;
}

/**
 * Gets an array of users who are followed by all of the specified user(s).
 *
 * @param {string|SocialGraph|Array} user(s)
 * @param {Function} callback
 * @return this
 * @api public
 */

SocialGraph.prototype.getCommonFollowing = function (users, callback) {
    var users = this.getSocialKeys(arguments, 'following');
    users.unshift(this.following);
    this.client.sinter.apply(this.client, users);
    return this;
}

/**
 * Gets an array of users who follow the current user but do not follow any
 * of the other specified users.
 *
 * @param {string|SocialGraph|Array} user(s)
 * @param {Function} callback
 * @return this
 * @api public
 */

SocialGraph.prototype.getDifferentFollowers = function (users, callback) {
    var users = this.getSocialKeys(arguments, 'followers');
    users.unshift(this.followers);
    this.client.sdiff.apply(this.client, users);
    return this;
}

/**
 * Gets an array of users who are followed by the current user but not any of
 * the other specified users.
 *
 * @param {string|SocialGraph|Array} user(s)
 * @param {Function} callback
 * @return this
 * @api public
 */

SocialGraph.prototype.getDifferentFollowing = function (users, callback) {
    var users = this.getSocialKeys(arguments, 'following');
    users.unshift(this.following);
    this.client.sdiff.apply(this.client, users);
    return this;
}

/**
 * Grabs the specified SocialGraph key from a list of arguments.
 *
 * @param {Array} args
 * @param {string} key
 * @return {string} social_keys
 * @api private
 */

SocialGraph.prototype.getSocialKeys = function (args, key) {
    var users = Array.prototype.slice.call(args),
        callback = users.pop(),
        user_key,
        self = this,
        keys = [];

    for (var i = 0, l = users.length; i < l; i++) {
        if (Array.isArray(users[i])) {
            users[i].forEach(function (user) {
                if (typeof user[key] !== 'undefined') {
                    user_key = user[key];
                } else {
                    user_key = self.key_prefix + user + ':' + key;
                }
                keys.push(user_key);
            });
        } else {
            if (typeof users[i][key] !== 'undefined') {
                user_key = users[i][key];
            } else {
                user_key = self.key_prefix + users[i] + ':' + key;
            }
            keys.push(user_key);
        }
    }
    keys.push(callback);
    return keys;
}

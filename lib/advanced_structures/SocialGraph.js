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
 * ..
 *
 * Reference:
 *     http://redis.io/topics/data-types#sets
 *
 * Redis structure:
 *     (namespace:)key:following = set(keys)
 *     (namespace:)key:followers = set(keys)
 */

var SocialGraph = exports.SocialGraph = Structure.new();

/**
 * Initialise the SocialGraph.
 *
 * @api private
 */

SocialGraph.prototype.init = function () {
    this.following = this.key + ':following';
    this.followers = this.key + ':followers';
}

/**
 * Follow one or more users.
 *
 * @param {string|SocialGraph|Array} user(s)
 * @param {Function} callback
 * @return this
 * @api public
 */

SocialGraph.prototype.follow = function (/* user(s) */ callback) {
    var user_ids = this.getKeys(arguments),
        users_followers = this.getKeys(arguments, 'followers'),
        multi;

    callback = users.pop();
    //multi = this.client.multi();
}

/**
 * Unfollow one or more users.
 *
 * @param {string|SocialGraph|Array} user(s)
 * @param {Function} callback
 * @return this
 * @api public
 */

SocialGraph.prototype.unfollow = function (/* user(s) */ callback) {
    var user_ids = this.getKeys(arguments),
        users_followers = this.getKeys(arguments, 'followers'),
        multi;

    callback = users.pop();
    //multi = this.client.multi();
    //
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

SocialGraph.prototype.following = function (user, callback) {
    user = this.getKey(user);
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
    user = this.getKey(user);
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

SocialGraph.prototype.getCommonFollowers = function (/* user(s) */ callback) {
    var users = this.getKeys(arguments, 'followers');
    users.shift(this.followers);
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

SocialGraph.prototype.getCommonFollowing = function (/* user(s) */ callback) {
    var users = this.getKeys(arguments, 'following');
    users.shift(this.following);
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

SocialGraph.prototype.getDifferentFollowers = function (/* user(s) */ callback) {
    var users = this.getKeys(arguments, 'followers');
    users.shift(this.followers);
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

SocialGraph.prototype.getDifferentFollowing = function (/* user(s) */ callback) {
    var users = this.getKeys(arguments, 'following');
    users.shift(this.following);
    this.client.sdiff.apply(this.client, users);
    return this;
}


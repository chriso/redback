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
 *     (namespace:)key:follows   = set(keys)
 *     (namespace:)key:following = set(keys)
 */

var SocialGraph = exports.SocialGraph = Structure.new();

SocialGraph.prototype.init = function () {
    this.follows = this.key + ':follows';
    this.following = this.key + ':following';
}

SocialGraph.prototype.addFollower = SocialGraph.prototype.addFollowers = function (/* followers */ callback) {
    //
}

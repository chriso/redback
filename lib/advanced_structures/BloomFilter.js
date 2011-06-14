/**
 * Module dependencies.
 */

var Structure = require('../Structure'),
    crc32 = require('../Utils').crc32;

/**
 * A Simple BloomFilter. Bloomfilter is a probabilistic data structure used to
 * determine if an element is present in a set. There may be false positives,
 * but there cannot be false negatives.
 *
 * Usage:
 *    `redback.createBloomFilter(key [, size, hashes]);`
 *
 * Options:
 *    `size` - Size of the bloom filter , default is 100 bits.
 *    `hashes` - Number of hashes to perform. default is 2.
 *
 * Reference:
 *    http://redis.io/commands#string
 *    http://en.wikipedia.org/wiki/Bloom_filter
 *    http://pages.cs.wisc.edu/~cao/papers/summary-cache/node8.html
 *
 * Redis Structure:
 *    `(namespace:)key = string(bits)`
 */

var BloomFilter = exports.BloomFilter = Structure.new();

/**
 * Initialise the bloom filter.
 *
 * @param {int} size (optional) - Size of bloom filter.
 * @param {int} num_hashes(optional) - Number of hashes to perform while storing.
 * @api private
 */

BloomFilter.prototype.init = function(size, num_hashes) {
    this.num_hashes = num_hashes || 2;
    this.size = size || 101;
}

/**
 * Adds an element to the bloom filter.
 *
 * @param {string} item - Item to store into bloom filter
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

BloomFilter.prototype.add = function(item, callback) {
    var multi = this.client.multi(), crc;

    for (var hash_index = 0; hash_index < this.num_hashes; hash_index++) {
        crc = (crc32(item, hash_index) % this.size).toString(2);
        for (var i =0; i <crc.length; i++) {
            if (crc[i] === '1') {
                multi.setbit(this.key, i, 1);
            }
        }
    }
    multi.exec(callback || function () {});
    return this;
}

/**
 * Checks if the element exists in the bloom filter. 
 * This can return false positives( i.e An element does not exist but it returns true)
 * But this can never return false negatives. (i.e an element )
 *
 * @param {string} item - Item to check for existence in bloom filter
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

BloomFilter.prototype.exists = function(item, callback) {
    var multi = this.client.multi(), crc;
    callback = callback || function () {};

    for (var hash_index = 0; hash_index < this.num_hashes; hash_index++) {
        crc = (crc32(item, hash_index) % this.size).toString(2);
        for (var i =0; i < crc.length; i++) {
            if (crc[i] === '1') {
                multi.getbit(this.key, i);
            }
        }
    }

    multi.exec(function(err, results) {
        callback(err, results.indexOf(0) === -1);
    });

    return this;
}

/**
 * Resets the Bloom filter.
 *
 * @param {Function} callback (optional)
 * @return this
 */

BloomFilter.prototype.reset = function (callback) {
    this.client.set(this.key, 0, callback || function () {});
    return this;
}

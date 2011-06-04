/**
 * Module dependencies.
 */

var Structure = require('../Structure'),
    BitField = require('../base_structures/BitField').BitField;
    crc32 = require('../Crc32').crc32;

/**
 * A Simple BloomFilter
 *
 * Usage:
 *    `redback.createBloomFilter(key [, size, hashes, seed]);`
 *
 */



var BloomFilter = exports.BloomFilter = Structure.new();

BloomFilter.prototype.init = function(size, num_hashes, seed) {
    this.
}

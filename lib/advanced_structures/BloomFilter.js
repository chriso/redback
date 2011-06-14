/**
 * Module dependencies.
 */

var Structure = require('../Structure'),
    BitField = require('../base_structures/BitField').BitField,
    crc32 = require('../Utils').crc32;

/**
 * A Simple BloomFilter. Bloomfilter is a probabilistic data structure to figure out if an element is present
 * in a set. Because of the probablities involved, there may be false positives. But there cannont be false negatives.
 * The basic idea is hash the input into a bitfields. Lets say entry 'test' hashes to 00100001. To test for existence of 'test'
 * we check if the bits 0 and 5 are set. Now let's say another item 'bar' is inserted with an hash of 00001001. This leaves the 
 * internal bit field becomes 00101001. Notice the 0th bit has not changed(still 1), but 3rd  is now set as well. 
 * This example assumes a 8 bit bloom filter with just 1 hash function.
 * Think of them as holograms
 * 
 * Please look at the references for more serious introduction to bloom filters.
 * 
 * Usage:
 *    `redback.createBloomFilter(key [, size, hashes]);`
 *    
 * Options:
 *    `size` - Size of the bloom filter , default is 100 bits. This is a way of controlling how many false positives you can have. Keep it too small(in relation to the real data set size) and you will get a lot of false positives and keep it to high and you will see little value.
 *    `hashes`     - Number of hashes to perform. default is 2. More hashes does not mean less false positives though. And also means computational overhead
 *
 * Reference:
 *    http://redis.io/commands#string
 *    http://en.wikipedia.org/wiki/Bloom_filter
 *    http://pages.cs.wisc.edu/~cao/papers/summary-cache/node8.html
 *
 * Redis Structure:
 *    `(namespace:)key = string` *
 */

var BloomFilter = exports.BloomFilter = Structure.new();

/**
* @param {Integer} size ( optional ) - Size of bloom filter. 
* @param {Integer} num_hashes( optional ) - Number of hashes to perform while storing.
* @api private */
BloomFilter.prototype.init = function(size, num_hashes) {
  this.num_hashes = num_hashes || 2;
  this.size = size || 101;
};

/**
 * Adds an element to the bloom filter.
 *
 * @param {String} item - Item to store into bloom filter
 * @param {Function} callback (optional)
 * @api public
 */
BloomFilter.prototype.add = function(item, callback){
  var multi = this.client.multi(), crc;

  callback = callback || function(){};
  for(var hash_index = 0; hash_index < this.num_hashes; hash_index++){
    crc = (crc32(item, hash_index) % this.size).toString(2);
    for(var i =0; i <crc.length; i++){
      if(crc[i] === '1') multi.setbit(this.key, i, 1);
    }
  }
  multi.exec(callback);
  return this;
};

/**
 * Checks if the element exists in the bloom filter. 
 * This can return false positives( i.e An element does not exist but it returns true)
 * But this can never return false negatives. (i.e an element )
 *
 * @param {String} item - Item to check for existence in bloom filter
 * @param {Function} callback (optional)
 * @api public
 */
BloomFilter.prototype.exists = function(item, callback){
  var multi = this.client.multi(), crc;
  
  callback = callback || function(err, value){};

  for(var hash_index = 0; hash_index < this.num_hashes; hash_index++){
    crc = (crc32(item, hash_index) % this.size).toString(2);
    for(var i =0; i < crc.length; i++){
      if(crc[i] === '1') multi.getbit(this.key, i);
    }
  }

  multi.exec(function(err, results){
    match = (results.indexOf(0) === -1)
    callback(err, match);
  });
  return this;
};

/**
 * Resets the Bloom filter. All Data is lost.
 * @param {Function} callback (optional)
 */
BloomFilter.prototype.reset = function(callback){
  this.client.set(this.key, 0);
};
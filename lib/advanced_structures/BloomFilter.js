/**
 * Module dependencies.
 */

var Structure = require('../Structure'),
    BitField = require('../base_structures/BitField').BitField,
    crc32 = require('../Utils').crc32;

/**
 * A Simple BloomFilter
 *
 * Usage:
 *    `redback.createBloomFilter(key [, size, hashes]);`
 *
 */

var BloomFilter = exports.BloomFilter = Structure.new();

BloomFilter.prototype.init = function(size, num_hashes) {
  this.num_hashes = num_hashes || 2;
  this.size = size || 101;
};

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

BloomFilter.prototype.reset = function(callback){
  this.client.set(this.key, 0);
};



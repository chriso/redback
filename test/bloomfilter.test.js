var redback = require('redback').createClient(),
    assert = require('assert');

//Flush the DB and close the Redis connection after 500ms
setTimeout(function () {
    redback.client.flushdb(function (err) {
        redback.client.quit();
    });
}, 500);

module.exports = {
  'test bloom filter#add#single hash': function () {
    var bloomfilter = redback.createBloomFilter('test_addstructure_bloom_filter_test', 101, 1);
    bloomfilter.add('test', function(err){
      bloomfilter.exists('test', function(err, value){
        assert.equal(true, value);
      });
  
      bloomfilter.exists('this probably does not exist', function(err, value){
        assert.equal(false, value);
      });
      
    });
  },
  
  'test bloom filter#add#multiple hashs': function () {
    var bloomfilter = redback.createBloomFilter('test_addstructure_bloom_filter_hello', 101, 3);
    bloomfilter.add('hello', function(err){
      bloomfilter.exists('hello', function(err, value){
        assert.equal(true, value);
      });
      bloomfilter.exists('this probably does not exist', function(err, value){
        assert.equal(false, value);
      });
      
    });
  },
  
  'test bloom filter#reset': function () {
    var bloomfilter = redback.createBloomFilter('test_addstructure_bloom_filter_bar', 101, 3);
    
    bloomfilter.add('bar', function(err){
      bloomfilter.add('baz', function(err){
        bloomfilter.exists('bar', function(err, value){
          assert.equal(true, value);
          bloomfilter.reset(function(err){
            bloomfilter.exists('bar', function(err, val){
              assert.equal(false, val);
            });

            bloomfilter.exists('baz', function(err, val){
              assert.equal(false, val);
            });
          });
        });
        
      });
    });
  }
  
  
}

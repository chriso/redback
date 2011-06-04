var crc32 = require('Crc32').crc32,
    assert = require('assert');

module.exports = {
  'test crc32': function () {
    console.log(crc32('foo'));
    assert.equal(-1938594527, crc32('foo'));
  },

  'test crc32 for 123456789': function () {
    console.log(crc32('123456789'));
    assert.equal(-873187034, crc32('123456789'));
  }
}

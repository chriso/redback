var crc32 = require('../lib/Utils').crc32,
    assert = require('assert');

module.exports = {
  'test crc32': function () {
    assert.equal(1938594527, crc32('foo'));
  },

  'test crc32 for 123456789': function () {
    assert.equal(873187034, crc32('123456789'));
  }
}

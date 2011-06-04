var crc32 = require('Crc32').crc32,
    assert = require('assert');

module.exports = {

    'test crc32': function () {
	assert.equals(0x3610A686,crc32('foo'));
    }

}

var redback = require('redback').createClient(),
    assert = require('assert');

//Flush the DB and close the Redis connection after 500ms
setTimeout(function () {
    redback.client.flushdb(function (err) {
        redback.client.quit();
    });
}, 500);

module.exports = {

    'test bitfield': function () {
        var bitfield = redback.createBitfield('test_bitfield');

        bitfield.set(3, 1, function (err, prev) {
            assert.ok(!prev);

            bitfield.get(2, function (err, bit) {
                assert.ok(!bit);
            });

            bitfield.get(3, function (err, bit) {
                assert.ok(bit);

                bitfield.set(3, 0, function (err, prev) {
                    assert.ok(prev);
                });
            });
        });
    }

}

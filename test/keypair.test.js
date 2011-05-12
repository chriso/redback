var redback = require('redback').createClient(),
    assert = require('assert');

//Flush the DB and close the Redis connection after 500ms
setTimeout(function () {
    redback.client.flushdb(function (err) {
        redback.client.quit();
    });
}, 500);

module.exports = {

    'test keypair set': function () {
        var keypair = redback.createKeyPair('test_keypair');

        keypair.add('foo', function (err, id) {
            assert.equal(1, id);
            keypair.add('bar', function (err, id) {
                assert.equal(2, id);

                keypair.add('bar', function (err, id) {
                    assert.equal(2, id);
                });

                keypair.length(function (err, length) {
                    assert.equal(2, length);
                });

                keypair.get(function (err, pairs) {
                    assert.equal('foo', pairs[1]);
                    assert.equal('bar', pairs[2]);
                });

                keypair.get('bar', function (err, id) {
                    assert.equal(2, id);
                });

                keypair.get(['foo','bar'], function (err, ids) {
                    assert.equal(2, ids.length);
                    assert.equal(1, ids.shift());
                    assert.equal(2, ids.shift());
                });

                keypair.getById(2, function (err, value) {
                    assert.equal('bar', value);
                });

                keypair.get('nothere', function (err, id) {
                    assert.equal(null, id);
                });

                keypair.values(function (err, values) {
                    assert.equal(2, values.length);
                    assert.equal('foo', values.shift());
                    assert.equal('bar', values.shift());
                });

                keypair.ids(function (err, ids) {
                    assert.equal(2, ids.length);
                    assert.equal(1, ids.shift());
                    assert.equal(2, ids.shift());
                });

                keypair.exists('bar', function (err, exists) {
                    assert.ok(exists);
                });

                keypair.exists('nothere', function (err, exists) {
                    assert.ok(!exists);
                });

                keypair.idExists(2, function (err, exists) {
                    assert.ok(exists);
                });

                keypair.idExists(5, function (err, exists) {
                    assert.ok(!exists);
                });
            });
        });
    },

    'test adding multiple values to a keypair': function () {
        var keypair = redback.createKeyPair('test_keypair_multi');

        keypair.add(['a','b','c','d'], function (err, ids) {
            assert.equal(1, ids.a);
            assert.equal(2, ids.b);
            assert.equal(3, ids.c);
            assert.equal(4, ids.d);

            keypair.delete('a', function (err) {
                keypair.values(function (err, values) {
                    assert.equal(3, values.length);
                    assert.equal('b', values.shift());
                    assert.equal('c', values.shift());
                    assert.equal('d', values.shift());

                    keypair.deleteById(4, function (err) {
                        keypair.values(function (err, values) {
                            assert.equal(2, values.length);
                            assert.equal('b', values.shift());
                            assert.equal('c', values.shift());
                        });
                    });
                });
            });
        });
    },

    'test uniqueness of keypair values': function () {
        var keypair = redback.createKeyPair('test_keypair_unique'),
            count = 50,
            returned = 0;

        //This is a test of atomicity - even when pipelining add() calls,
        //values should **ALWAYS** be unique. Only one 'foo' should be added
        while (count--) {
            keypair.add('foo', function () {
                if (returned++ == count) {
                    keypair.length(function (err, length) {
                        assert.equal(1, length);
                    });
                }
            });
        }
    }

}

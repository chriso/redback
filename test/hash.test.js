var redback = require('../').createClient(),
    assert = require('assert');

//Flush the DB and close the Redis connection after 500ms
setTimeout(function () {
    redback.client.flushdb(function (err) {
        redback.client.quit();
    });
}, 500);

module.exports = {

    'test simple hash set/get': function() {
        var hash = redback.createHash('test_hash');

        //Test simple get/set
        hash.set('foo', 'bar', function (err) {
            hash.get('foo', function (err, val) {
                assert.equal('bar', val);
            });
            hash.exists('foo', function (err, exists) {
                assert.ok(exists);
            });
            hash.exists('nonexistent', function (err, exists) {
                assert.ok(!exists);
            });
        });
    },

    'test multi hash set/get': function() {
        var hash = redback.createHash('test_hash_multi');

        //Test multi set/get
        hash.set({a: 'b', c: 'd'}, function (err) {
            hash.get(['a','c'], function (err, values) {
                assert.equal(2, values.length);
                assert.equal('b', values.shift());
                assert.equal('d', values.shift());
            });

            hash.get(function (err, values) {
                assert.equal('b', values.a);
                assert.equal('d', values.c);
            });

            hash.values(function (err, values) {
                assert.equal(2, values.length);
                assert.equal('b', values.shift());
                assert.equal('d', values.shift());
            });

            hash.keys(function (err, values) {
                assert.equal(2, values.length);
                assert.equal('a', values.shift());
                assert.equal('c', values.shift());
            });

            hash.length(function (err, length) {
                assert.equal(2, length);
            });
        });
    },

    'test hash aggregate': function() {
        var hash = redback.createHash('test_hash_aggregate');

        //Test multi set/get
        hash.set({a: 'b', c: 'd'}, function (err) {
            hash.values(function (err, values) {
                assert.equal(2, values.length);
                assert.equal('b', values.shift());
                assert.equal('d', values.shift());
            });

            hash.keys(function (err, values) {
                assert.equal(2, values.length);
                assert.equal('a', values.shift());
                assert.equal('c', values.shift());
            });

            hash.length(function (err, length) {
                assert.equal(2, length);
            });
        });
    },

    'test hash add': function() {
        var hash = redback.createHash('test_hash_add');

        //Test multi set/get
        hash.set('foo', 'bar', function (err) {
            assert.equal(null, err);
            hash.add('foo', 'foo', function (err) {
                assert.equal(null, err);
                hash.get('foo', function (err, foo) {
                    assert.equal('bar', foo);
                });
            });
        });
    },

    'test hash add': function() {
        var hash = redback.createHash('test_hash_add');

        //Test multi set/get
        hash.set('foo', 'bar', function (err) {
            assert.equal(null, err);

            //'foo' is already set..
            hash.add('foo', 'foo', function (err) {
                assert.equal(null, err);
                hash.get('foo', function (err, foo) {
                    assert.equal('bar', foo);

                    //Try deleting a hash key
                    hash.delete('foo', function (err) {
                        assert.equal(null, err);
                        hash.get('foo', function (err, foo) {
                            assert.equal(null, foo);
                        });
                    });
                });
            });
        });
    },

    'test hash increment / decrement': function() {
        var hash = redback.createHash('test_hash_incrdecr');

        //Test increment
        hash.set('foo', 1, function (err) {
            hash.increment('foo', 5, function (err) {
                assert.equal(null, err);
                hash.get('foo', function (err, foo) {
                    assert.equal(6, foo);

                    //The increment amount is optional
                    hash.increment('foo', function (err) {
                        assert.equal(null, err);
                        hash.get('foo', function (err, foo) {
                            assert.equal(7, foo);
                        });
                    });
                });
            });
        });

        //Test decrement
        hash.set('bar', 10, function (err) {
            hash.decrement('bar', 5, function (err) {
                assert.equal(null, err);
                hash.get('bar', function (err, foo) {
                    assert.equal(5, foo);

                    //The decrement amount is optional
                    hash.decrement('bar', function (err) {
                        assert.equal(null, err);
                        hash.get('bar', function (err, foo) {
                            assert.equal(4, foo);
                        });
                    });
                });
            });
        });
    }

}

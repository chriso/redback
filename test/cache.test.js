var redback = require('redback').createClient(),
    assert = require('assert');

//Flush the DB and close the Redis connection after 500ms
setTimeout(function () {
    redback.client.flushdb(function (err) {
        redback.client.quit();
    });
}, 500);

module.exports = {

    'test cache set/get': function () {
        var cache = redback.createCache('test_cache');

        cache.set('foo', 'bar', function (err) {
            cache.get('foo', function (err, value) {
                assert.equal('bar', value);
            });

            cache.exists('foo', function (err, exists) {
                assert.ok(exists);
            });

            cache.exists('nothere', function (err, exists) {
                assert.ok(!exists);
            });

            cache.add('foo', 'barbar', function (err, added) {
                assert.ok(!added);
            });

            cache.add('bar', 'foofoo', function (err, added) {
                assert.ok(added);

                cache.get('bar', function (err, value) {
                    assert.equal('foofoo', value);
                });

                cache.get('foo', function (err, value) {
                    assert.equal('bar', value);

                    cache.getSet('foo', 'a', function (err, value) {
                        assert.equal('bar', value);

                        cache.get('foo', function (err, value) {
                            assert.equal('a', value);
                        });
                    });
                });
            });
        });
    },

    'test cache multi set/get': function () {
        var cache = redback.createCache('test_cache_multi'), test_obj = {a:'b',c:'d',e:'f'};

        cache.set(test_obj, function (err) {
            cache.get(['a','c'], function (err, values) {
                assert.equal('b', values.a);
                assert.equal('d', values.c);
            });

            cache.get(function (err, values) {
                for (var i in test_obj) {
                    assert.ok(typeof values[i] !== 'undefined');
                    assert.equal(test_obj[i], values[i]);
                }
            });

            cache.add({a:'a', g:'h'}, function (err) {
                cache.get('a', function (err, value) {
                    assert.equal('b', value);
                });

                cache.get('g', function (err, value) {
                    //assert.equal('h', value);
                });
            });
        });
    },

    'test cache increment': function () {
        var cache = redback.createCache('test_cache_increment');

        cache.set('foo', 1, 1, function (err) {
            cache.increment('foo', function (err) {
                cache.get('foo', function (err, value) {
                    assert.equal(2, value);
                    cache.increment('foo', 5, function (err) {
                        cache.get('foo', function (err, value) {
                            assert.equal(7, value);
                        });
                    });
                });
            });
        });
    },

    'test cache decrement': function () {
        var cache = redback.createCache('test_cache_decrement');

        cache.set('foo', 10, function (err) {
            cache.decrement('foo', function (err) {
                cache.get('foo', function (err, value) {
                    assert.equal(9, value);
                    cache.decrement('foo', 5, function (err) {
                        cache.get('foo', function (err, value) {
                            assert.equal(4, value);
                        });
                    });
                });
            });
        });
    },

    'test cache key select': function () {
        var cache = redback.createCache('test_cache_keys');

        cache.set({foo: 'a', foo2: 'b', foo3: 'c', bar: 'd'}, function (err) {
            cache.keys(function (err, keys) {
                assert.equal(4, keys.length);
                assert.ok(keys.indexOf('foo') !== -1);
                assert.ok(keys.indexOf('foo2') !== -1);
                assert.ok(keys.indexOf('foo3') !== -1);
                assert.ok(keys.indexOf('bar') !== -1);
            });

            cache.keys('f*', function (err, keys) {
                assert.equal(3, keys.length);
                assert.ok(keys.indexOf('foo') !== -1);
                assert.ok(keys.indexOf('foo2') !== -1);
                assert.ok(keys.indexOf('foo3') !== -1);
                assert.ok(keys.indexOf('bar') === -1);
            });

            cache.keys('b?r', function (err, keys) {
                assert.equal(1, keys.length);
                assert.ok(keys.indexOf('foo') === -1);
                assert.ok(keys.indexOf('bar') !== -1);
            });
        });
    },

    'test cache key flush all': function () {
        var cache = redback.createCache('test_cache_flush');

        cache.set({foo: 'a', foo2: 'b', foo3: 'c', bar: 'd'}, function (err) {

            cache.flush(function (err) {
                cache.keys(function (err, keys) {
                    assert.equal(0, keys.length);
                });
            });
        });
    },

    'test cache key flush by pattern': function () {
        var cache = redback.createCache('test_cache_flush_pattern');

        cache.set({foo: 'a', foo2: 'b', foo3: 'c', bar: 'd'}, function (err) {

            cache.flush('f*', function (err) {
                cache.keys(function (err, keys) {
                    assert.equal(1, keys.length);
                    assert.ok(keys.indexOf('foo') === -1);
                    assert.ok(keys.indexOf('foo2') === -1);
                    assert.ok(keys.indexOf('foo3') === -1);
                    assert.ok(keys.indexOf('bar') !== -1);
                });
            });
        });
    },

/*
    'test cache expiries': function () {
        var cache = redback.createCache('test_cache_expiries');

        cache.set({foo: 'a', foo2: 'b', foo3: 'c', bar: 'd'}, function (err) {

            cache.expire('foo', 1, function (err) {
                cache.ttl('foo', function (err, ttl) {
                    assert.equal(1, ttl);

                    cache.persist('foo', function (err) {
                        cache.ttl('foo', function (err, ttl) {
                            assert.equal(-1, ttl);
                        });
                    });
                });
            });

            var when = new Date();
            cache.expireAt('foo2', when, function (err) {
                cache.ttl('foo2', function (err, ttl) {
                    assert.equal(1, ttl);
                });
            });
        });
    }
*/
}


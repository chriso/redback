var redback = require('redback').createClient(),
    assert = require('assert');

//Flush the DB and close the Redis connection after 500ms
setTimeout(function () {
    redback.client.flushdb(function (err) {
        redback.client.quit();
    });
}, 500);

module.exports = {

    'test density set': function () {
        var zset = redback.createDensitySet('test_densityset_add');

        zset.add('foo', function (err, was_new) {
            assert.ok(was_new);

            zset.length(function (err, length) {
                assert.equal(1, length);
            });

            zset.contains('foo', function (err, contains) {
                assert.ok(contains);
            });

            zset.contains('nothere', function (err, contains) {
                assert.ok(!contains);
            });

            zset.score('foo', function (err, score) {
                assert.equal(1, score);

                zset.rank('foo', function (err, rank) {
                    assert.equal(0, rank);

                    zset.add('foo', function (err, was_new) {
                        assert.ok(was_new);

                        zset.score('foo', function (err, score) {
                            assert.equal(2, score);

                            zset.remove('foo', function (err) {
                                zset.score('foo', function (err, score) {
                                    assert.equal(1, score);

                                    zset.remove('foo', function (err, removed) {
                                        assert.ok(removed);

                                        zset.score('foo', function (err, score) {
                                            assert.ok(score == null);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });

        });
    },

    'test density set multi add': function () {
        var zset = redback.createDensitySet('test_densityset_multi_add');

        zset.add(['foo','foo','foo','bar','bar','foobar'], function (err, added) {
            assert.equal(6, added);

            zset.score('foo', function (err, score) {
                assert.equal(3, score);
            });

            zset.rank('foo', function (err, rank) {
                assert.equal(2, rank);
            });

            zset.score('bar', function (err, score) {
                assert.equal(2, score);
            });

            zset.rank('bar', function (err, rank) {
                assert.equal(1, rank);
            });

            zset.score('foobar', function (err, score) {
                assert.equal(1, score);
            });

            zset.rank('foobar', function (err, rank) {
                assert.equal(0, rank);
            });

            zset.length(function (err, length) {
                assert.equal(3, length);
            });
        });
    },

    'test sorted set multi remove': function () {
        var zset = redback.createDensitySet('test_densityset_multi_remove');

        zset.add(['foo','foo','foo','bar','bar','foobar'], function (err, added) {
            assert.equal(6, added);

            zset.remove(['foo','bar','foobar'], function (err) {
                zset.score('foo', function (err, score) {
                    assert.equal(2, score);
                });

                zset.rank('foo', function (err, rank) {
                    assert.equal(1, rank);
                });

                zset.score('bar', function (err, score) {
                    assert.equal(1, score);
                });

                zset.rank('bar', function (err, rank) {
                    assert.equal(0, rank);
                });

                zset.score('foobar', function (err, score) {
                    assert.equal(null, score);
                });

                zset.rank('foobar', function (err, rank) {
                    assert.equal(null, rank);
                });

                zset.length(function (err, length) {
                    assert.equal(2, length);
                });
            });
        });
    }

}

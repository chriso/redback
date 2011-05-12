var redback = require('redback').createClient(),
    assert = require('assert');

//Flush the DB and close the Redis connection after 500ms
setTimeout(function () {
    redback.client.flushdb(function (err) {
        redback.client.quit();
    });
}, 500);

module.exports = {

    'test sorted set': function () {
        var zset = redback.createSortedSet('test_zset_add');

        zset.add(12, 'foo', function (err, was_new) {
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
                assert.equal(12, score);

                zset.rank('foo', function (err, rank) {
                    assert.equal(0, rank);

                    zset.add(3, 'foo', function (err, was_new) {
                        assert.ok(!was_new);

                        zset.score('foo', function (err, score) {
                            assert.equal(3, score);

                            zset.remove('foo', function (err, removed) {
                                assert.ok(removed);

                                zset.score('foo', function (err, score) {
                                    assert.ok(score == null);
                                });

                                zset.rank('foo', function (err, rank) {
                                    assert.ok(rank == null);
                                });
                            });
                        });
                    });
                });
            });

        });
    },

    'test sorted set multi add': function () {
        var zset = redback.createSortedSet('test_zset_multi_add');

        zset.add({foo:1, bar:2, foobar:3}, function (err) {
            zset.score('foo', function (err, score) {
                assert.equal(1, score);
            });

            zset.rank('foo', function (err, rank) {
                assert.equal(0, rank);
            });

            zset.score('bar', function (err, score) {
                assert.equal(2, score);
            });

            zset.rank('bar', function (err, rank) {
                assert.equal(1, rank);
            });

            zset.score('foobar', function (err, score) {
                assert.equal(3, score);
            });

            zset.rank('foobar', function (err, rank) {
                assert.equal(2, rank);
            });

            zset.length(function (err, length) {
                assert.equal(3, length);
            });
        });
    },

    'test sorted set multi remove': function () {
        var zset = redback.createSortedSet('test_zset_multi_remove');

        zset.add({foo:1, bar:2, foobar:3}, function (err, added) {
            assert.equal(3, added);

            zset.remove(['foo','bar'], function (err) {
                zset.score('foo', function (err, score) {
                    assert.ok(score == null);
                });

                zset.rank('foo', function (err, rank) {
                    assert.ok(rank == null);
                });

                zset.score('bar', function (err, score) {
                    assert.ok(score == null);
                });

                zset.rank('bar', function (err, rank) {
                    assert.ok(rank == null);
                });

                zset.score('foobar', function (err, score) {
                    assert.equal(3, score);
                });

                zset.rank('foobar', function (err, rank) {
                    assert.equal(0, rank);
                });

                zset.length(function (err, length) {
                    assert.equal(1, length);
                });
            });
        });
    },

    'test sorted set increment decrement': function () {
        var zset = redback.createSortedSet('test_zset_incdec');

        zset.add({foo:1, bar:2, foobar:3, barfoo: 4}, function (err) {
            zset.increment('foo', function (err) {
                zset.score('foo', function (err, score) {
                    assert.equal(2, score);
                });
            });
            zset.increment('bar', 7, function (err) {
                zset.score('bar', function (err, score) {
                    assert.equal(9, score);
                });
            });
            zset.decrement('foobar', function (err) {
                zset.score('foobar', function (err, score) {
                    assert.equal(2, score);
                });
            });
            zset.decrement('barfoo', 2, function (err) {
                zset.score('barfoo', function (err, score) {
                    assert.equal(2, score);
                });
            });
        });
    },

    'test sorted set get scores / ranks': function () {
        var zset = redback.createSortedSet('test_zset_scores');

        zset.add({foo:1, bar:2, foobar:3}, function (err) {
            zset.get(function (err, set) {
                var expected = ['foo','bar','foobar'], i;
                for (i in set) {
                    assert.equal(expected.shift(), i);
                }
                assert.equal(3, set.foobar);
                assert.equal(2, set.bar);
                assert.equal(1, set.foo);
            });

            zset.get(true, function (err, set) {
                var expected = ['foo','bar','foobar'], i, l = 3;
                while (--l) {
                    assert.equal(expected.shift(), set.shift());
                }
            });

            zset.getScores(redback.NINF, 2, function (err, set) {
                var expected = ['foo','bar'], i;
                for (i in set) {
                    assert.equal(expected.shift(), i);
                }
                assert.equal(1, set.foo);
                assert.equal(2, set.bar);
            });

            zset.getScores(null, 2, 1, function (err, set) {
                for (var i in set) {
                    assert.equal('foo', i);
                }
                assert.equal(1, set.foo);
            });

            zset.getScores(null, 2, 1, 1, function (err, set) {
                for (var i in set) {
                    assert.equal('bar', i);
                }
                assert.equal(2, set.bar);
            });

            zset.getScoresReverse(2, null, 1, function (err, set) {
                for (var i in set) {
                    assert.equal('bar', i);
                }
                assert.equal(2, set.bar);
            });

            zset.getScoresReverse(2, null, 1, 1, function (err, set) {
                for (var i in set) {
                    assert.equal('foo', i);
                }
                assert.equal(1, set.foo);
            });

            zset.getScoresReverse(2, redback.NINF, function (err, set) {
                var expected = ['bar','foo'], i;
                for (i in set) {
                    assert.equal(expected.shift(), i);
                }
                assert.equal(1, set.foo);
                assert.equal(2, set.bar);
            });

            zset.getScoresReverse(3, 2, function (err, set) {
                var expected = ['foobar','bar'], i;
                for (i in set) {
                    assert.equal(expected.shift(), i);
                }
                assert.equal(3, set.foobar);
                assert.equal(2, set.bar);
            });

            zset.countScores(1, 3, function (err, count) {
                assert.equal(3, count);
            });

            zset.countScores(5, null, function (err, count) {
                assert.equal(0, count);
            });

            zset.getScores(2, 3, function (err, set) {
                var expected = ['bar','foobar'], i;
                for (i in set) {
                    assert.equal(expected.shift(), i);
                }
                assert.equal(3, set.foobar);
                assert.equal(2, set.bar);
            });

            zset.getRanks(0, 1, function (err, set) {
                var expected = ['foo','bar'], i;
                for (i in set) {
                    assert.equal(expected.shift(), i);
                }
                assert.equal(2, set.bar);
                assert.equal(1, set.foo);
            });

            zset.getRanksReverse(2, 0, function (err, set) {
                var expected = ['foobar','bar','foo'], i;
                for (i in set) {
                    assert.equal(expected.shift(), i);
                }
                assert.equal(3, set.foobar);
                assert.equal(2, set.bar);
                assert.equal(1, set.foo);
            });
        });
    },

    'test sorted set remove by score and rank': function () {
        var zset = redback.createSortedSet('test_zset_remove');

        zset.add({a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9}, function (err) {
            zset.get(true, function (err, values) {
                var expected = ['a','b','c','d','e','f','g','h','i'];
                for (var i = 0, l = expected.length; i < l; i++) {
                    assert.equal(expected.shift(), values.shift());
                }

                zset.removeScores(1, 3, function (err) {
                    zset.get(true, function (err, values) {
                        var expected = ['d','e','f','g','h','i'];
                        for (var i = 0, l = expected.length; i < l; i++) {
                            assert.equal(expected.shift(), values.shift());
                        }

                        zset.removeRanks(-3, -1, function (err) {
                            zset.get(true, function (err, values) {
                                var expected = ['d','e','f'];
                                for (var i = 0, l = expected.length; i < l; i++) {
                                    assert.equal(expected.shift(), values.shift());
                                }

                                zset.highestScores(2, function (err, set) {
                                    var expected = ['e','f'], i;
                                    for (i in set) {
                                        assert.equal(expected.shift(), i);
                                    }
                                    assert.equal(5, set.e);
                                    assert.equal(6, set.f);
                                });

                                zset.lowestScores(2, function (err, set) {
                                    var expected = ['d','e'], i;
                                    for (i in set) {
                                        assert.equal(expected.shift(), i);
                                    }
                                    assert.equal(4, set.d);
                                    assert.equal(5, set.e);
                                });
                            });
                        });
                    });
                });
            });
        });
    }

}

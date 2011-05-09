var redback = require('redback').createClient(),
    assert = require('assert');

//Flush the DB and close the Redis connection after 500ms
setTimeout(function () {
    redback.client.flushdb(function (err) {
        redback.client.quit();
    });
}, 500);

module.exports = {

    'test set': function () {
        var set = redback.createSet('test_set');

        set.add('foo', function (err, added) {
            assert.ok(added);
            set.add('bar', function (err, added) {
                assert.ok(added);

                set.elements(function (err, values) {
                    assert.equal(2, values.length);
                    assert.equal('foo', values.shift());
                    assert.equal('bar', values.shift());
                });

                set.add('foo', function (err, added) {
                    assert.ok(!added);
                });

                set.exists('foo', function (err, exists) {
                    assert.ok(exists);
                });

                set.exists('nothere', function (err, exists) {
                    assert.ok(!exists);
                });

                set.remove('nothere', function (err, removed) {
                    assert.ok(!removed);
                });

                for (var i = 0; i < 5; i++) {
                    set.random(function (err, element) {
                        assert.ok(['foo','bar'].indexOf(element) !== -1);
                    });
                }

                set.length(function (err, length) {
                    assert.equal(2, length);
                });
            });
        });
    },

    'test multi add/remove': function () {
        var set = redback.createSet('test_set_multi');

        set.add(['a','b','c','d'], function (err, added) {
            set.elements(function (err, values) {
                assert.equal(4, values.length);
                assert.ok(values.indexOf('a') !== -1);
                assert.ok(values.indexOf('b') !== -1);
                assert.ok(values.indexOf('c') !== -1);
                assert.ok(values.indexOf('d') !== -1);

                set.remove('a', function (err, removed) {
                    assert.ok(removed);

                    set.elements(function (err, values) {
                        assert.equal(3, values.length);
                        assert.ok(values.indexOf('b') !== -1);
                        assert.ok(values.indexOf('c') !== -1);
                        assert.ok(values.indexOf('d') !== -1);

                        set.remove(['b','c'], function (err, removed) {
                            assert.ok(removed);

                            set.elements(function (err, values) {
                                assert.equal(1, values.length);
                                assert.equal('d', values[0]);
                            });
                        });
                    });
                });
            });
        });
    },

    'test popping a set element': function () {
        var set = redback.createSet('test_set_pop'), values = ['a','b','c'];

        set.add(values, function (err, added) {
            assert.ok(added);

            set.random(true, function (err, element) {
                assert.ok(values.indexOf(element) !== -1);

                set.random(true, function (err, element) {
                    assert.ok(values.indexOf(element) !== -1);

                    set.random(true, function (err, element) {
                        assert.ok(values.indexOf(element) !== -1);

                        set.random(true, function (err, element) {
                            assert.ok(!element);
                        });
                    });
                });
            });
        });
    },

    'test set move': function () {
        var src  = redback.createSet('test_set_move_src'),
            dest = redback.createSet('test_set_move_dest');

        src.add(['a','b','c'], function (err, added) {
            assert.ok(added);

            src.move(dest, 'a', function (err, moved) {
                assert.ok(moved);

                src.length(function (err, length) {
                    assert.equal(2, length);
                });

                dest.elements(function (err, values) {
                    assert.equal(1, values.length);
                    assert.equal('a', values[0]);
                });
            });
        });
    },

    'test set intersect': function () {
        var set1 = redback.createSet('test_set_inter1'),
            set2 = redback.createSet('test_set_inter2'),
            set3 = redback.createSet('test_set_inter3');

        set1.add(['a','b','c','d'], function (err, added) {
            assert.ok(added);
            set2.add(['b','c','d','e'], function (err, added) {
                assert.ok(added);
                set3.add(['1','2','3','a','b','c'], function (err, added) {
                    assert.ok(added);

                    set1.inter(set2, set3, function (err, values) {
                        assert.equal(2, values.length);
                        assert.ok(values.indexOf('b') !== -1);
                        assert.ok(values.indexOf('c') !== -1);
                    });

                    set1.interStore('test_set_inter_store', set2, set3, function (err, stored) {
                        assert.ok(stored);

                        redback.createSet('test_set_inter_store').elements(function (err, values) {
                            assert.equal(2, values.length);
                            assert.ok(values.indexOf('b') !== -1);
                            assert.ok(values.indexOf('c') !== -1);
                        });
                    });
                });
            });
        });
    },

    'test set union': function () {
        var set1 = redback.createSet('test_set_union1'),
            set2 = redback.createSet('test_set_union2'),
            set3 = redback.createSet('test_set_union3');

        set1.add(['a','b','c'], function (err, added) {
            assert.ok(added);
            set2.add(['b','c','d'], function (err, added) {
                assert.ok(added);
                set3.add(['1','2','3'], function (err, added) {
                    assert.ok(added);

                    set1.union(set2, set3, function (err, values) {
                        assert.equal(7, values.length);
                        assert.ok(values.indexOf('a') !== -1);
                        assert.ok(values.indexOf('b') !== -1);
                        assert.ok(values.indexOf('c') !== -1);
                        assert.ok(values.indexOf('d') !== -1);
                        assert.ok(values.indexOf('1') !== -1);
                        assert.ok(values.indexOf('2') !== -1);
                        assert.ok(values.indexOf('3') !== -1);
                    });

                    set1.unionStore('test_set_union_store', set2, set3, function (err, stored) {
                        assert.ok(stored);

                        redback.createSet('test_set_union_store').elements(function (err, values) {
                            assert.equal(7, values.length);
                            assert.ok(values.indexOf('a') !== -1);
                            assert.ok(values.indexOf('b') !== -1);
                            assert.ok(values.indexOf('c') !== -1);
                            assert.ok(values.indexOf('d') !== -1);
                            assert.ok(values.indexOf('1') !== -1);
                            assert.ok(values.indexOf('2') !== -1);
                            assert.ok(values.indexOf('3') !== -1);
                        });
                    });
                });
            });
        });
    },

    'test set diff': function () {
        var set1 = redback.createSet('test_set_diff1'),
            set2 = redback.createSet('test_set_diff2'),
            set3 = redback.createSet('test_set_diff3');

        set1.add(['a','b','c','d','e','f'], function (err, added) {
            assert.ok(added);
            set2.add(['b','c','d'], function (err, added) {
                assert.ok(added);
                set3.add(['c','d','e'], function (err, added) {
                    assert.ok(added);

                    set1.diff(set2, set3, function (err, values) {
                        assert.equal(2, values.length);
                        assert.ok(values.indexOf('a') !== -1);
                        assert.ok(values.indexOf('f') !== -1);
                    });

                    set1.diff([set2, set3], function (err, values) {
                        assert.equal(2, values.length);
                        assert.ok(values.indexOf('a') !== -1);
                        assert.ok(values.indexOf('f') !== -1);
                    });

                    set1.diffStore('test_set_diff_store', set2, set3, function (err, stored) {
                        assert.ok(stored);

                        redback.createSet('test_set_diff_store').elements(function (err, values) {
                            assert.equal(2, values.length);
                            assert.ok(values.indexOf('a') !== -1);
                            assert.ok(values.indexOf('f') !== -1);
                        });
                    });
                });
            });
        });
    }

}

var redback = require('redback').createClient(),
    assert = require('assert');

//Flush the DB and close the Redis connection after 500ms
setTimeout(function () {
    redback.client.flushdb(function (err) {
        redback.client.quit();
    });
}, 500);

module.exports = {

    'test list push / pop': function() {
        var list = redback.createList('test_list_pushpop');

        list.push('foo', function (err) {
            list.push('bar', function (err) {
                list.values(function (err, values) {
                    assert.equal(2, values.length);
                    assert.equal('foo', values.shift());
                    assert.equal('bar', values.shift());

                    list.push(['a','b'], function (err) {
                        list.values(function (err, values) {
                            assert.equal(4, values.length);
                            assert.equal('foo', values.shift());
                            assert.equal('bar', values.shift());
                            assert.equal('a', values.shift());
                            assert.equal('b', values.shift());

                            list.pop(function (err, value) {
                                assert.equal('b', value);
                                list.length(function (err, length) {
                                    assert.equal(3, length);
                                });
                            });
                        });
                    });
                });
            });
        });
    },

    'test list shift': function() {
        var list = redback.createList('test_list_shiftunshift');

        list.unshift('foo', function (err) {
            list.unshift('bar', function (err) {
                list.values(function (err, values) {
                    assert.equal(2, values.length);
                    assert.equal('bar', values.shift());
                    assert.equal('foo', values.shift());

                    list.unshift(['a','b'], function (err) {
                        list.values(function (err, values) {
                            assert.equal(4, values.length);
                            assert.equal('a', values.shift());
                            assert.equal('b', values.shift());
                            assert.equal('bar', values.shift());
                            assert.equal('foo', values.shift());

                            list.shift(function (err, value) {
                                assert.equal('a', value);
                                list.length(function (err, length) {
                                    assert.equal(3, length);
                                });
                            });
                        });
                    });
                });
            });
        });
    },

    'test list range': function () {
        var list = redback.createList('test_list_range');

        list.unshift(['a','b','c','d','e'], function () {
            list.range(2, function (err, values) {
                assert.equal(3, values.length);
                assert.equal('c', values.shift());
                assert.equal('d', values.shift());
                assert.equal('e', values.shift());
            });

            list.range(0, 1, function (err, values) {
                assert.equal(2, values.length);
                assert.equal('a', values.shift());
                assert.equal('b', values.shift());
            });

            list.range(-2, function (err, values) {
                assert.equal(2, values.length);
                assert.equal('d', values.shift());
                assert.equal('e', values.shift());
            });
        });
    },

    'test list get': function () {
        var list = redback.createList('test_list_get');

        list.unshift(['a','b','c','d','e'], function () {
            list.get(1, function (err, value) {
                assert.equal('b', value);
            });

            list.get(-1, function (err, value) {
                assert.equal('e', value);
            });

            list.get(0, 2, function (err, values) {
                assert.equal(2, values.length);
                assert.equal('a', values.shift());
                assert.equal('b', values.shift());
            });

            list.get(-2, 2, function (err, values) {
                assert.equal(2, values.length);
                assert.equal('d', values.shift());
                assert.equal('e', values.shift());
            });
        });
    },

    'test list cap - keep latest': function () {
        var list = redback.createList('test_list_cap_latest');

        list.unshift(['a','b','c','d','e'], function () {
            list.cap(3, function () {
                list.values(function (err, values) {
                    assert.equal(3, values.length);
                    assert.equal('c', values.shift());
                    assert.equal('d', values.shift());
                    assert.equal('e', values.shift());
                });
            });
        });
    },

    'test list cap - keep earliest': function () {
        var list = redback.createList('test_list_cap_earliest');

        list.unshift(['a','b','c','d','e'], function () {
            list.cap(3, true, function () {
                list.values(function (err, values) {
                    assert.equal(3, values.length);
                    assert.equal('a', values.shift());
                    assert.equal('b', values.shift());
                    assert.equal('c', values.shift());
                });
            });
        });
    },

    'test list trim': function () {
        var list = redback.createList('test_list_trim');

        list.unshift(['a','b','c','d','e'], function () {
            list.trim(1, 3, function () {
                list.values(function (err, values) {
                    assert.equal(3, values.length);
                    assert.equal('b', values.shift());
                    assert.equal('c', values.shift());
                    assert.equal('d', values.shift());
                });
            });
        });
    },

    'test list set': function () {
        var list = redback.createList('test_list_set');

        list.unshift(['a','b','c','d','e'], function () {
            list.set(1, 'foo', function () {
                list.get(0, 3, function (err, values) {
                    assert.equal(3, values.length);
                    assert.equal('a', values.shift());
                    assert.equal('foo', values.shift());
                    assert.equal('c', values.shift());
                });
            });
        });
    },

    'test list insert': function () {
        var list = redback.createList('test_list_insert');

        list.unshift(['a','b','c','d','e'], function () {
            list.insertAfter('a', 'foo', function (err) {
                list.get(0, 3, function (err, values) {
                    assert.equal(3, values.length);
                    assert.equal('a', values.shift());
                    assert.equal('foo', values.shift());
                    assert.equal('b', values.shift());
                });
            });

            list.insertBefore('e', 'foo', function (err) {
                list.get(-3, 3, function (err, values) {
                    assert.equal(3, values.length);
                    assert.equal('d', values.shift());
                    assert.equal('foo', values.shift());
                    assert.equal('e', values.shift());
                });
            });
        });
    },

    'test list remove A': function () {
        var list = redback.createList('test_list_remove_a');

        list.unshift(['a','b','a','b','c'], function () {
            list.remove('a', function () {
                list.values(function (err, values) {
                    assert.equal(4, values.length);
                    assert.equal('b', values.shift());
                    assert.equal('a', values.shift());
                    assert.equal('b', values.shift());
                    assert.equal('c', values.shift());
                });
            });
        });
    },

    'test list remove B': function () {
        var list = redback.createList('test_list_remove_b');

        list.unshift(['a','b','a','b','c'], function () {
            list.remove('a', -1, function () {
                list.values(function (err, values) {
                    assert.equal(4, values.length);
                    assert.equal('a', values.shift());
                    assert.equal('b', values.shift());
                    assert.equal('b', values.shift());
                    assert.equal('c', values.shift());
                });
            });
        });
    },

    'test list remove C': function () {
        var list = redback.createList('test_list_remove_c');

        list.unshift(['a','b','a','b','c'], function () {
            list.remove('b', 2, function () {
                list.values(function (err, values) {
                    assert.equal(3, values.length);
                    assert.equal('a', values.shift());
                    assert.equal('a', values.shift());
                    assert.equal('c', values.shift());
                });
            });
        });
    },

    'test popshift': function () {
        var src = redback.createList('test_list_popshift_a');
        var dest = redback.createList('test_list_popshift_b');

        src.unshift(['a','b','c'], function () {
            src.popShift(dest, function () {
                src.values(function (err, values) {
                    assert.equal(2, values.length);
                    assert.equal('a', values.shift());
                    assert.equal('b', values.shift());
                });

                dest.values(function (err, values) {
                    assert.equal(1, values.length);
                    assert.equal('c', values.shift());
                });
            });
        });
    },

    'test popshift B': function () {
        var src = redback.createList('test_list_popshift_c');
        var dest = redback.createList('test_list_popshift_d');

        src.unshift(['a','b','c'], function () {
            //popShift can also take the actual key string
            src.popShift('test_list_popshift_d', function () {
                src.values(function (err, values) {
                    assert.equal(2, values.length);
                    assert.equal('a', values.shift());
                    assert.equal('b', values.shift());
                });

                dest.values(function (err, values) {
                    assert.equal(1, values.length);
                    assert.equal('c', values.shift());
                });
            });
        });
    },

/*
    'test blocking list operations - pop': function () {
        var list = redback.createList('test_list_blocking_pop'), added = false;

        list.pop(1, function (err, value) {
            if (!added) return assert.ok(false);
            assert.equal('foo', value);
        });

        setTimeout(function () {
            list.push('foo');
            added = true;
        }, 100);
    },

    'test blocking list operations - shift': function () {
        var list = redback.createList('test_list_blocking_shift'), added = false;

        list.shift(1, function (err, value) {
            if (!added) return assert.ok(false);
            assert.equal('foo', value);
        });

        setTimeout(function () {
            list.push('foo');
            added = true;
        }, 100);
    }
*/
}

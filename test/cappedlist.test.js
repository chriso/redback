var redback = require('redback').createClient(),
    assert = require('assert');

//Flush the DB and close the Redis connection after 500ms
setTimeout(function () {
    redback.client.flushdb(function (err) {
        redback.client.quit();
    });
}, 500);

module.exports = {

    'test capped list keeping the latest': function() {
        var list = redback.createCappedList('test_cappedlist', 3);

        //Only the latest 3 items are kept
        list.push(['a','b','c','d','e','f'], function (err) {
            list.values(function (err, values) {
                assert.equal(3, values.length);
                assert.equal('d', values.shift());
                assert.equal('e', values.shift());
                assert.equal('f', values.shift());

                list.push(['g','h'], function (err) {
                    list.values(function (err, values) {
                        assert.equal(3, values.length);
                        assert.equal('f', values.shift());
                        assert.equal('g', values.shift());
                        assert.equal('h', values.shift());
                    });
                });
            });
        });
    },

    'test capped list length': function () {
        var list = redback.createCappedList('test_cappedlist_foo', 3);

        list.push(['a','b','c'], function (err) {
            for (var i = 0; i < 10; i++) {
                list.push(i, function (err) {
                    list.values(function (err, values) {
                        assert.equal(3, values.length);
                    });
                });
            }
        });
    },

    'test capped list insert before': function () {
        var list = redback.createCappedList('test_cappedlist_insertbefore', 3);

        list.push(['a','b','c'], function (err) {
            list.insertBefore('a', 'z', function (err) {
                list.values(function (err, values) {
                    assert.equal(3, values.length);
                    assert.equal('a', values.shift());
                    assert.equal('b', values.shift());
                    assert.equal('c', values.shift());

                    list.insertBefore('c', 'x', function (err) {
                        list.values(function (err, values) {
                            assert.equal(3, values.length);
                            assert.equal('b', values.shift());
                            assert.equal('x', values.shift());
                            assert.equal('c', values.shift());
                        });
                    });

                });
            });
        });
    },

    'test capped list insert after': function () {
        var list = redback.createCappedList('test_cappedlist_insertafter', 3);

        list.push(['a','b','c'], function (err) {
            list.insertAfter('a', 'z', function (err) {
                list.values(function (err, values) {
                    assert.equal(3, values.length);
                    assert.equal('z', values.shift());
                    assert.equal('b', values.shift());
                    assert.equal('c', values.shift());

                    list.insertAfter('c', 'x', function (err) {
                        list.values(function (err, values) {
                            assert.equal(3, values.length);
                            assert.equal('b', values.shift());
                            assert.equal('c', values.shift());
                            assert.equal('x', values.shift());
                        });
                    });
                });
            });
        });
    },

    'test capped list unshift': function () {
        var list = redback.createCappedList('test_cappedlist_unshift', 3);

        list.unshift(['a','b'], function (err) {
            list.unshift('c', function (err) {
                list.values(function (err, values) {
                    assert.equal(3, values.length);
                    assert.equal('c', values.shift());
                    assert.equal('a', values.shift());
                    assert.equal('b', values.shift());

                    list.unshift('z', function (err) {
                        list.values(function (err, values) {
                            assert.equal(3, values.length);
                            assert.equal('c', values.shift());
                            assert.equal('a', values.shift());
                            assert.equal('b', values.shift());
                        });
                    });
                });
            });
        });
    }

}

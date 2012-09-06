var redback = require('../'),
    assert = require('assert'),
    Structure = redback.Structure,
    Hash = redback.Hash,
    List = redback.List;

redback = redback.createClient();

//Flush the DB and close the Redis connection after 500ms
setTimeout(function () {
    redback.client.flushdb(function (err) {
        redback.client.quit();
    });
}, 500);

var hash = new Hash(null, 'hash'), list = new List(null, 'list'), structure = new Structure(null, 'structure');

module.exports = {

    'test structure prototypal inheritance': function() {
        assert.ok(typeof structure.ttl === 'function');

        //These methods are inherited from Structure
        assert.ok(typeof hash.ttl === 'function');
        assert.ok(typeof list.ttl === 'function');
    },

    'test modifying the base prototype': function () {
        assert.ok(typeof structure.foo === 'undefined');
        assert.ok(typeof list.foo === 'undefined');
        assert.ok(typeof list.foo === 'undefined');

        //All structures inherit from Structure
        Structure.prototype.foo = function() {
            return 'foo';
        };

        //..so all children will inherit its methods
        assert.equal('foo', hash.foo());
        assert.equal('foo', list.foo());
    },

    'test modifying a childs prototype': function () {
        assert.ok(typeof structure.bar === 'undefined');
        assert.ok(typeof list.bar === 'undefined');
        assert.ok(typeof hash.bar === 'undefined');

        //Adding to a structure's prototype should not affect other structures
        Hash.prototype.bar = function() {
            return 'bar';
        }

        assert.equal('bar', hash.bar());
        assert.ok(typeof structure.bar === 'undefined');
        assert.ok(typeof list.bar === 'undefined');
    },

    'test creating a structure with no key': function () {
        var structures = [
            'List','Hash','Set','SortedSet','CappedList','DensitySet',
            'Channel','KeyPair','SocialGraph'
        ];

        structures.forEach(function (structure) {
            assert.throws(function () {
                redback['create' + structure]();
            });
        });

        //Cache doesn't require a key..
        redback.createCache();
    },

    'test adding a custom structure': function () {
        redback.addStructure('TestQueue', {
            init: function (is_fifo) {
                this.fifo = is_fifo;
            },
            add: function (value, callback) {
                this.client.lpush(this.key, value, callback);
            },
            next: function (callback) {
                var method = this.fifo ? 'rpop' : 'lpop';
                this.client[method](this.key, callback);
            }
        });

        var lifo = redback.createTestQueue('test_addstructure_lifo_queue');

        lifo.add('foo', function (err) {
            lifo.add('bar', function (err) {
                lifo.next(function (err, value) {
                    assert.equal('bar', value);
                    lifo.next(function (err, value) {
                        assert.equal('foo', value);
                        lifo.next(function (err, value) {
                            assert.equal(null, value);
                        });
                    });
                });
            });
        });

        var fifo = redback.createTestQueue('test_addstructure_fifo_queue', true);

        fifo.add('foo', function (err) {
            fifo.add('bar', function (err) {
                fifo.next(function (err, value) {
                    assert.equal('foo', value);
                    fifo.next(function (err, value) {
                        assert.equal('bar', value);
                        fifo.next(function (err, value) {
                            assert.equal(null, value);
                        });
                    });
                });
            });
        });
    },

    'test structure (bg)save and destroy': function () {
        var hash = redback.createHash('test_structure_destroy');

        redback.save(function (err) {
            assert.ok(!err);
        });
        redback.save(true, function (err) {
            assert.ok(!err);
        });

        hash.set('foo', 'bar', function (err) {
            hash.get('foo', function (err, value) {
                assert.equal('bar', value);
                hash.destroy(function (err) {
                    hash.get('foo', function (err, value) {
                        assert.equal(null, value);
                    });
                });
            });
        });
    },

    'test an array key': function () {
        var hash = redback.createHash(['user', 1]);
        assert.equal('user:1', hash.key);
    },

    'test get type': function () {
        var hash = redback.createHash('test_get_type');

        hash.type(function (err, type) {
            assert.equal('none', type);
            hash.set('foo', 'bar', function (err) {
                hash.type(function (err, type) {
                    assert.equal('hash', type);
                });
            });
        });
    },

    'test renaming a structure': function () {
        var hash = redback.createHash('test_rename_hash1'),
            hash2 = redback.createHash('test_rename_hash2');

        hash.set('foo', 'bar', function (err) {
            hash.rename('test_rename_hash2', function (err) {
                hash2.get('foo', function (err, value) {
                    assert.equal('bar', value);
                });
            });
        });
    }

/*
    'test structure expiries': function () {
        var hash = redback.createHash('test_structure_expiry');
        hash.expire(1, function (err) {
            hash.ttl(function (err, ttl) {
                assert.equal(1, ttl);

                hash.persist(function (err) {
                    hash.ttl(function (err, ttl) {
                        assert.equal(-1, ttl);
                    });
                });
            });
        });

        var set = redback.createSet('test_structure_expiry2');
        var when = new Date();
        set.expireAt(when, function (err) {
            set.ttl(function (err, ttl) {
                assert.equal(1, ttl);
            });
        });
    }
*/
}

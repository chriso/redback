var redback = require('redback'),
    assert = require('assert'),
    Structure = redback.Structure,
    Hash = redback.Hash,
    List = redback.List;

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
                redback['create' + Structure]();
            });
        });
    }

}

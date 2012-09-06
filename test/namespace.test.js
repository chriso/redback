var redback = require('../'),
    assert = require('assert');

module.exports = {

    'test namespaces': function() {
        var client = redback.createClient(null, null, {namespace:'foo'});
        assert.equal('foo', client.namespace);

        var channel = client.createChannel('channel__');
        assert.equal('foo:channel__', channel.name);

        var cache = client.createCache('cache__');
        assert.equal('foo:cache__', cache.namespace);

        var list = client.createList('list__');
        assert.equal('foo', list.namespace);
        assert.equal('foo:bar', list.namespaceKey('bar'));

        client.client.quit();
    },

}

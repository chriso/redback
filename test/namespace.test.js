var redback = require('redback'),
    assert = require('assert');

module.exports = {

    'test namespaces': function() {
        var client = redback.createClient(null, null, {namespace:'foo'});
        assert.equal('foo', client.namespace);
        assert.equal('foo:bar', client.namespaceKey('bar'));

        var channel = client.createChannel('channel__');
        assert.equal('foo:channel__', channel.name);

        var cache = client.createCache('cache__');
        assert.equal('foo:cache__', cache.namespace);

        client.client.quit();
    },

}

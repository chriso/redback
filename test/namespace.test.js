var redback = require('./common').createClient({namespace: 'foo'}),
    assert = require('assert');

module.exports = {

    'test namespaces': function() {
        assert.equal('foo', redback.namespace);

        var channel = redback.createChannel('channel__');
        assert.equal('foo:channel__', channel.name);

        var cache = redback.createCache('cache__');
        assert.equal('foo:cache__', cache.namespace);

        var list = redback.createList('list__');
        assert.equal('foo', list.namespace);
        assert.equal('foo:bar', list.namespaceKey('bar'));

        redback.client.quit();
    },

}

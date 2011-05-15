var redback = require('redback').createClient(),
    assert = require('assert');

//Flush the DB and close the Redis connection after 500ms
setTimeout(function () {
    redback.client.flushdb(function (err) {
        redback.client.quit();
    });
}, 500);

module.exports = {

    'test social graph': function () {
        var lifo = redback.createQueue('test_addstructure_lifo_queue');

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

        var fifo = redback.createQueue('test_queue_fifo', true);

        fifo.enqueue('foo', function (err) {
            fifo.enqueue('bar', function (err) {
                fifo.dequeue(function (err, value) {
                    assert.equal('foo', value);
                    fifo.dequeue(function (err, value) {
                        assert.equal('bar', value);
                        fifo.dequeue(function (err, value) {
                            assert.equal(null, value);
                        });
                    });
                });
            });
        });
    },

}

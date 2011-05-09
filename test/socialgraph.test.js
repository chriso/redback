var redback = require('redback').createClient(),
    assert = require('assert');

//Flush the DB and close the Redis connection after 500ms
setTimeout(function () {
    redback.client.flushdb(function (err) {
        redback.client.quit();
    });
}, 500);

module.exports = {

    'test ..': function () {
        //
    }

}

var redback = require('../').createClient(),
    assert = require('assert');

// Flush the DB and close the Redis connection after 2 seconds
setTimeout(function () {
    // Ensure we completed all tests
    assert.strictEqual(_testsCompleted, Object.keys(module.exports).length);
    redback.client.flushdb(function (err) {
        redback.client.quit();
    });
}, 2000);

var TEST_LOCK = 'test lock';

var _testsCompleted = 0;
var _complete = function() {
    _testsCompleted++;
};

module.exports = {

    'test lock cannot be stolen': function() {
        var key = 'test-lock-cannot-be-stolen';
        var lock = redback.createLock(TEST_LOCK);

        lock.acquire(key, 1, function(err, token) {
            assert.ok(!err);
            assert.ok(token);

            // Ensure we don't get a token the next time we try and acquire
            lock.acquire(key, 1, function(err, token) {
                assert.ok(!err);
                assert.ok(!token);
                _complete();
            });
        });
    },

    'test lock can be re-acquired after release': function() {
        var key = 'test-lock-can-be-re-acquired-after-released';
        var lock = redback.createLock(TEST_LOCK);

        lock.acquire(key, 1, function(err, token) {
            assert.ok(!err);
            assert.ok(token);

            lock.release(key, token, function(err, hadLock) {
                assert.ok(!err);
                assert.ok(hadLock);

                // Ensure we do get a token the next time we try and acquire
                lock.acquire(key, 1, function(err, token) {
                    assert.ok(!err);
                    assert.ok(token);
                    _complete();
                });
            });
        });
    },

    'test lock release indicates when releasing with invalid token': function() {
        var key = 'test-lock-release-indicates-when-releasing-with-invalid-token';
        var lock = redback.createLock(TEST_LOCK);

        lock.acquire(key, 1, function(err, token) {
            assert.ok(!err);
            assert.ok(token);

            // Ensure that releasing with an invalid token indicates we did not
            // have the lock
            lock.release(key, 'not the token', function(err, hadLock) {
                assert.ok(!err);
                assert.ok(!hadLock);

                lock.release(key, token, function(err, hadLock) {
                    assert.ok(!err);
                    assert.ok(hadLock);

                    // Ensure re-release indicates something is wrong
                    lock.release(key, token, function(err, hadLock) {
                        assert.ok(!err);
                        assert.ok(!hadLock);
                        _complete();
                    });
                });
            });
        });
    },

    'test lock can be re-acquired after expiry': function() {
        var key = 'test-lock-can-be-re-acquired-after-expiry';
        var lock = redback.createLock(TEST_LOCK);

        lock.acquire(key, 1, function(err, firstToken) {
            assert.ok(!err);
            assert.ok(firstToken);

            setTimeout(function() {

                // Ensure we can acquire the lock again
                lock.acquire(key, 1, function(err, secondToken) {
                    assert.ok(!err);
                    assert.ok(secondToken);

                    // Ensure we cannot release it with the old token
                    lock.release(key, firstToken, function(err, hadLock) {
                        assert.ok(!err);
                        assert.ok(!hadLock);

                        // Ensure we cannot re-acquire since it is still held
                        // by secondToken
                        lock.acquire(key, 1, function(err, thirdToken) {
                            assert.ok(!err);
                            assert.ok(!thirdToken);

                            // Ensure we can successfully release the lock with
                            // the `secondToken`
                            lock.release(key, secondToken, function(err, hadLock) {
                                assert.ok(!err);
                                assert.ok(hadLock);
                                _complete();
                            });
                        });
                    });
                });

            }, 1250);
        });
    },

    'test concurrent locks results in only one acquisition': function() {
        var key = 'test-concurrent-locks-results-in-only-one-acquisition';
        var lock = redback.createLock(TEST_LOCK);

        var numAcquired = 0;
        var numCompleted = 0;
        var iterations = 10;
        var acquireComplete = function(err, token) {
            numCompleted++;
            if (token) {
                numAcquired++;
            }

            if (numCompleted === iterations) {
                 assert.strictEqual(numAcquired, 1);
                 _complete();
            }
        };

        for (var i = 0; i < iterations; i++) {
            lock.acquire(key, 1, acquireComplete);
        }
    }
};

var redback = require('../').createClient(),
    assert = require('assert');

//Flush the DB and close the Redis connection after 500ms
setTimeout(function () {
    redback.client.flushdb(function (err) {
        redback.client.quit();
    });
}, 500);

module.exports = {

    'test social graph': function () {
        var user1 = redback.createSocialGraph(1, 'test_social_graph'),
            user2 = redback.createSocialGraph(2, 'test_social_graph'),
            user3 = redback.createSocialGraph(3, 'test_social_graph');

        user1.follow(user2, user3, function (err) {
            user3.follow(1, 2, function (err) {
                user2.follow([1], function (err) {

                    user1.getFollowers(function (err, followers) {
                        var expected = [2,3], l = expected.length;
                        while (l--) assert.equal(expected.shift(), followers.shift());
                    });

                    user1.countFollowers(function (err, count) {
                        assert.equal(2, count);
                    });

                    user1.getFollowing(function (err, followers) {
                        var expected = [2,3], l = expected.length;
                        while (l--) assert.equal(expected.shift(), followers.shift());
                    });

                    user1.countFollowing(function (err, count) {
                        assert.equal(2, count);
                    });

                    user2.getFollowers(function (err, followers) {
                        var expected = [1,3], l = expected.length;
                        while (l--) assert.equal(expected.shift(), followers.shift());
                    });

                    user2.countFollowers(function (err, count) {
                        assert.equal(2, count);
                    });

                    user2.getFollowing(function (err, followers) {
                        var expected = [1], l = expected.length;
                        while (l--) assert.equal(expected.shift(), followers.shift());
                    });

                    user2.countFollowing(function (err, count) {
                        assert.equal(1, count);
                    });

                    user3.getFollowers(function (err, followers) {
                        var expected = [1], l = expected.length;
                        while (l--) assert.equal(expected.shift(), followers.shift());
                    });

                    user3.countFollowers(function (err, count) {
                        assert.equal(1, count);
                    });

                    user3.getFollowing(function (err, followers) {
                        var expected = [1,2], l = expected.length;
                        while (l--) assert.equal(expected.shift(), followers.shift());
                    });

                    user3.countFollowing(function (err, count) {
                        assert.equal(2, count);
                    });

                    user3.hasFollower(1, function (err, has) {
                        assert.ok(has);
                    });

                    user3.hasFollower(2, function (err, has) {
                        assert.ok(!has);
                    });

                    user3.isFollowing(1, function (err, following) {
                        assert.ok(following);
                    });

                    user3.isFollowing(2, function (err, following) {
                        assert.ok(following);
                    });

                    user3.isFollowing(4, function (err, following) {
                        assert.ok(!following);
                    });
                });
            });
        });
    },

    'test social graph unfollow': function () {
        var user1 = redback.createSocialGraph(1, 'test_social_graph_rem'),
            user2 = redback.createSocialGraph(2, 'test_social_graph_rem'),
            user3 = redback.createSocialGraph(3, 'test_social_graph_rem');

        user1.follow([2,3,4,5,6,7], function (err) {
            user3.follow(1, 2, 4, 5, 6, function (err) {
                user2.follow([1], function (err) {
                    user2.unfollow(1, function (err) {
                        user2.getFollowing(function (err, following) {
                            assert.equal(0, following);
                        });
                    });

                    user3.unfollow(4, 5, 6, function (err) {
                        user3.getFollowing(function (err, following) {
                            var expected = [1,2], l = expected.length;
                            while (l--) assert.equal(expected.shift(), following.shift());

                            user1.unfollow([user2, user3, 4, 5], function (err) {
                                user1.getFollowing(function (err, following) {
                                    var expected = [6,7], l = expected.length;
                                    while (l--) assert.equal(expected.shift(), following.shift());

                                    user2.getFollowers(function (err, followers) {
                                        assert.equal(1, followers.length);
                                        assert.equal(3, followers[0]);
                                    });
                                });
                            });
                        });
                    });

                });
            });
        });
    },

    'test social graph get commong followers/following': function () {
        var user1 = redback.createSocialGraph(1, 'test_social_graph_common'),
            user2 = redback.createSocialGraph(2, 'test_social_graph_common'),
            user3 = redback.createSocialGraph(3, 'test_social_graph_common'),
            user8 = redback.createSocialGraph(8, 'test_social_graph_common'),
            user9 = redback.createSocialGraph(9, 'test_social_graph_common');

        user1.follow([2,3,4,5,6,7,8,9,10], function (err) {
            user2.follow([1,3,5,7,9], function (err) {
                user3.follow([2,5,6,7,8], function (err) {

                    user1.getCommonFollowing(user2, function (err, common) {
                        var expected = [3,5,7], l = expected.length;
                        while (l--) assert.equal(expected.shift(), common.shift());
                    });

                    user1.getCommonFollowing([user2, 3], function (err, common) {
                        var expected = [5,7], l = expected.length;
                        while (l--) assert.equal(expected.shift(), common.shift());
                    });

                    user1.getCommonFollowers(9, function (err, common) {
                        var expected = [2], l = expected.length;
                        while (l--) assert.equal(expected.shift(), common.shift());
                    });

                    user2.getDifferentFollowing(user3, function (err, diff) {
                        var expected = [1,3], l = expected.length;
                        while (l--) assert.equal(expected.shift(), diff.shift());
                    });

                    user2.getDifferentFollowers(9, function (err, diff) {
                        var expected = [3], l = expected.length;
                        while (l--) assert.equal(expected.shift(), diff.shift());
                    });
                });
            });
        });
    }

}

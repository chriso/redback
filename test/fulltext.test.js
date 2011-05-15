var redback = require('redback').createClient(),
    assert = require('assert');

//Flush the DB and close the Redis connection after 500ms
setTimeout(function () {
    redback.client.flushdb(function (err) {
        redback.client.quit();
    });
}, 500);

module.exports = {

    'test full text': function() {
        var text = redback.createFullText('test_fulltext');

        var doc1 = 'This is a sentence containing some words',
            doc2 = 'This contains some punctuation? and StRaNge CaSiNg Issues which won\' affect the index',
            doc3 = 'This contains punctuation too@*& !&@*(&(      and some excess whitespace';

        text.index(1, doc1, function (err, added) {
            text.index(2, doc2, function (err, added) {
                text.index(3, doc3, function (err, added) {
                    text.search('contains', function (err, results) {
                        var expected = [1,2,3], l = expected.length;
                        while (l--) assert.equal(expected.shift(), results.shift());
                    });
                    text.search('-whitespace', function (err, results) {
                        var expected = [1,2], l = expected.length;
                        while (l--) assert.equal(expected.shift(), results.shift());
                    });
                    text.search('contains -punctuation', function (err, results) {
                        var expected = [1], l = expected.length;
                        while (l--) assert.equal(expected.shift(), results.shift());
                    });
                    text.search('containing -excess', function (err, results) {
                        var expected = [1, 2], l = expected.length;
                        while (l--) assert.equal(expected.shift(), results.shift());
                    });
                    text.search('containing -excess -issue', function (err, results) {
                        var expected = [1], l = expected.length;
                        while (l--) assert.equal(expected.shift(), results.shift());
                    });
                    text.search('nothere', function (err, results) {
                        assert.equal(0, results.length);
                    });
                    text.search('-contains', function (err, results) {
                        assert.equal(0, results.length);
                    });
                });
            });
        });
    },

    'test file index': function () {
        var text = redback.createFullText('test_fulltext_file_index');

        text.indexFile(1, __dirname + '/files/doc1.txt', function (err, added) {
            text.indexFile(2, __dirname + '/files/doc2.txt', function (err, added) {
                text.indexFile(3, __dirname + '/files/doc3.txt', function (err, added) {
                    text.search('contains', function (err, results) {
                        var expected = [1,2,3], l = expected.length;
                        while (l--) assert.equal(expected.shift(), results.shift());
                    });
                    text.search('-whitespace', function (err, results) {
                        var expected = [1,2], l = expected.length;
                        while (l--) assert.equal(expected.shift(), results.shift());
                    });
                    text.search('contains -punctuation', function (err, results) {
                        var expected = [1], l = expected.length;
                        while (l--) assert.equal(expected.shift(), results.shift());
                    });
                    text.search('containing -excess', function (err, results) {
                        var expected = [1, 2], l = expected.length;
                        while (l--) assert.equal(expected.shift(), results.shift());
                    });
                    text.search('containing -excess -issue', function (err, results) {
                        var expected = [1], l = expected.length;
                        while (l--) assert.equal(expected.shift(), results.shift());
                    });
                    text.search('nothere', function (err, results) {
                        assert.equal(0, results.length);
                    });
                    text.search('-contains', function (err, results) {
                        assert.equal(0, results.length);
                    });
                });
            });
        });
    },

    'test indexing many': function () {
        var text = redback.createFullText('test_fulltext_many');

        var documents = {
            1: 'This is a sentence containing some words',
            2: 'This contains some punctuation? and StRaNge CaSiNg Issues which won\' affect the index',
            3: 'This contains punctuation too@*& !&@*(&(      and some excess whitespace'
        }

        text.index(documents, function (err, added) {
            text.search('contains', function (err, results) {
                var expected = [1,2,3], l = expected.length;
                while (l--) assert.equal(expected.shift(), results.shift());
            });
            text.search('-whitespace', function (err, results) {
                var expected = [1,2], l = expected.length;
                while (l--) assert.equal(expected.shift(), results.shift());
            });
            text.search('contains -punctuation', function (err, results) {
                var expected = [1], l = expected.length;
                while (l--) assert.equal(expected.shift(), results.shift());
            });
            text.search('containing -excess', function (err, results) {
                var expected = [1, 2], l = expected.length;
                while (l--) assert.equal(expected.shift(), results.shift());
            });
            text.search('containing -excess -issue', function (err, results) {
                var expected = [1], l = expected.length;
                while (l--) assert.equal(expected.shift(), results.shift());
            });
            text.search('nothere', function (err, results) {
                assert.equal(0, results.length);
            });
            text.search('-contains', function (err, results) {
                assert.equal(0, results.length);
            });
        });
    },

    'test file index using obj': function () {
        var text = redback.createFullText('test_fulltext_file_index_many');

        var files = {
            1: __dirname + '/files/doc1.txt',
            2: __dirname + '/files/doc2.txt',
            3: __dirname + '/files/doc3.txt'
        }

        text.indexFiles(files, function (err, added) {
            text.search('contains', function (err, results) {
                var expected = [1,2,3], l = expected.length;
                while (l--) assert.equal(expected.shift(), results.shift());
            });
            text.search('-whitespace', function (err, results) {
                var expected = [1,2], l = expected.length;
                while (l--) assert.equal(expected.shift(), results.shift());
            });
            text.search('contains -punctuation', function (err, results) {
                var expected = [1], l = expected.length;
                while (l--) assert.equal(expected.shift(), results.shift());
            });
            text.search('containing -excess', function (err, results) {
                var expected = [1, 2], l = expected.length;
                while (l--) assert.equal(expected.shift(), results.shift());
            });
            text.search('containing -excess -issue', function (err, results) {
                var expected = [1], l = expected.length;
                while (l--) assert.equal(expected.shift(), results.shift());
            });
            text.search('nothere', function (err, results) {
                assert.equal(0, results.length);
            });
            text.search('-contains', function (err, results) {
                assert.equal(0, results.length);
            });
        });
    },

    'test clearing the index': function () {
    var text = redback.createFullText('test_fulltext_clear');

        var documents = {
            1: 'This is a sentence containing some words',
            2: 'This contains some punctuation? and StRaNge CaSiNg Issues which won\' affect the index',
            3: 'This contains punctuation too@*& !&@*(&(      and some excess whitespace'
        }

        text.index(documents, function (err, added) {
            text.search('contains', function (err, results) {
                var expected = [1,2,3], l = expected.length;
                while (l--) assert.equal(expected.shift(), results.shift());
            });

            text.clear(function (err) {
                text.search('contains', function (err, results) {
                    assert.equal(0, results.length);

                    text.index(documents, function (err, added) {
                        text.search('contains', function (err, results) {
                            var expected = [1,2,3], l = expected.length;
                            while (l--) assert.equal(expected.shift(), results.shift());
                        });
                    });
                });
            });
        });
    }

}

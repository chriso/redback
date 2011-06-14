/*!
 * Redback
 * Copyright(c) 2011 Chris O'Hara <cohara87@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Structure = require('../Structure'),
    EventEmitter = require('events').EventEmitter,
    fs = require('fs');

/**
 * Stop words - words that shouldn't be indexed.
 */

var stopwords = {
    'a':1,'able':1,'about':1,'across':1,'after':1,'all':1,'almost':1,'also':1,'am':1,'among':1,
    'an':1,'and':1,'any':1,'are':1,'as':1,'at':1,'be':1,'because':1,'been':1,'but':1,'by':1,'can':1,
    'cannot':1,'could':1,'dear':1,'did':1,'do':1,'does':1,'either':1,'else':1,'ever':1,'every':1,
    'for':1,'from':1,'get':1,'got':1,'had':1,'has':1,'have':1,'he':1,'her':1,'hers':1,'him':1,'his':1,
    'how':1,'however':1,'i':1,'if':1,'in':1,'into':1,'is':1,'it':1,'its':1,'just':1,'least':1,'let':1,
    'like':1,'likely':1,'may':1,'me':1,'might':1,'most':1,'must':1,'my':1,'neither':1,'no':1,
    'nor':1,'not':1,'of':1,'off':1,'often':1,'on':1,'only':1,'or':1,'other':1,'our':1,'own':1,
    'rather':1,'said':1,'say':1,'says':1,'she':1,'should':1,'since':1,'so':1,'some':1,'than':1,
    'that':1,'the':1,'their':1,'them':1,'then':1,'there':1,'these':1,'they':1,'this':1,'tis':1,
    'to':1,'too':1,'twas':1,'us':1,'wants':1,'was':1,'we':1,'were':1,'what':1,'when':1,'where':1,
    'which':1,'while':1,'who':1,'whom':1,'why':1,'will':1,'with':1,'would':1,'yet':1,'you':1,
    'your':1,'':1
}

/**
 * A full text index with support for stop words, stemming and
 * a basic boolean search syntax.
 *
 * Usage:
 *    `redback.createFullText(key);`
 *
 * Reference:
 *    http://redis.io/topics/data-types#sets
 *
 * Redis Structure:
 *    `(namespace:)key:<word1> = set(docs)`
 *    `(namespace:)key:<word2> = set(docs)`
 *    `(namespace:)key:<wordN> = set(docs)`
 */

var FullText = exports.FullText = Structure.new();

/**
 * Initialise the index. libstemmer bindings are required.
 *
 * @api private
 */

FullText.prototype.init = function () {
    this.indexed_bytes = 0;
    try {
        this.stem = require('stem').stem;
    } catch (e) {
        console.error('Full text requires the libstemmer bindings: `npm install -g stem`');
        process.exit(1);
    }
}

/**
 * Index one or more documents.
 *
 * Index One Document:
 *    `text.indexFile(1, 'document string ...', callback);`
 *
 * Index Many Documents:
 *    `text.indexFile({1:'docstr1', 2:'docstr2'}, callback);`
 *
 * @param {int|string} id - the document's unique identifier
 * @param {string|ReadableStream|Buffer} document
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

FullText.prototype.index = function (id, document, callback) {
    if (typeof id === 'object') {
        return this.indexAll(id, document);
    } else if (document instanceof EventEmitter &&
            typeof document.readable !== 'undefined' && document.readable === true) {
        return this.indexStream(id, document, callback);
    } else if (document instanceof Buffer) {
        document = document.toString();
    }
    this.indexed_bytes += document.length;
    var stemmed = this.stemWords(this.extractWords(document));
    this.buildIndex(id, stemmed, callback || function () {});
}

/**
 * Index multiple documents.
 *
 * @param {Array} documents
 * @param {Function} callback (optional)
 * @return this
 * @api private
 */

FullText.prototype.indexAll = function (documents, callback) {
    var self = this, ids = Object.keys(documents),
        failed = false, remaining = ids.length;
    ids.forEach(function (id) {
        self.index(id, documents[id], function (err) {
            if (failed) {
                return;
            } else if (err) {
                return callback(err);
            } else {
                if (!--remaining) {
                    callback();
                }
            }
        });
    });
    return this;
}

/**
 * Index one or more files.
 *
 * Index One Document:
 *    `text.indexFile(1, '/path/to/file', callback);`
 *
 * Index Many Documents:
 *    `text.indexFile({1:'file1', 2:'file2'}, callback);`
 *
 * @param {int|string|Object} id
 * @param {string} filename (optional)
 * @param {Function} callback (optional)
 * @return this
 * @api public
 */

FullText.prototype.indexFile =
FullText.prototype.indexFiles = function (id, filename, callback) {
    if (typeof id === 'object') {
        callback = filename;
        var self = this, files = id, ids = Object.keys(files),
            failed = false, remaining = ids.length;
        ids.forEach(function (id) {
            self.indexStream(id, fs.createReadStream(files[id]), function (err) {
                if (failed) {
                    return;
                } else if (err) {
                    return callback(err);
                } else {
                    if (!--remaining) callback();
                }
            });
        });
        return this;
    } else {
        return this.indexStream(id, fs.createReadStream(filename), callback);
    }
}

/**
 * Split a string into an array of words. Also strip punctuation and
 * lowercase all words.
 *
 * @param {string} str
 * @return {Array} words
 * @api private
 */

FullText.prototype.extractWords = function (str) {
    return str.toLowerCase()
              .replace(/[^a-zA-Z0-9'\s\r\n\t-]/g, '')
              .split(/[\s\r\n\t]/);
}

/**
 * Given an array of words, remove stop words and stem the remaining.
 *
 * @param {Array} words
 * @param {Array} stemmed (optional) - the array to add to
 * @return {Array} stemmed_words
 * @api private
 */

FullText.prototype.stemWords = function (words, stemmed) {
    stemmed = stemmed || [];
    for (var i = 0, l = words.length; i < l; i++) {
        if (typeof stopwords[words[i]] === 'undefined') {
            stemmed.push(this.stem(words[i]));
        }
    }
    return stemmed;
}

/**
 * Index a readable stream.
 *
 * @param {int} id
 * @param {string} document
 * @param {Function} callback (optional)
 * @api private
 */

FullText.prototype.indexStream = function (id, stream, callback) {
    var self = this, indexChunk, words, stemmed = [], i, l, last = '';
    indexChunk = function (chunk, end) {
        words = self.extractWords(chunk);
        if (!end) last += words.pop();
        self.stemWords(words, stemmed);
    }
    stream.setEncoding('utf8');
    stream.on('data', function (chunk) {
        self.indexed_bytes += chunk.length;
        indexChunk(last + chunk);
    });
    stream.on('end', function () {
        indexChunk(last, true);
        self.buildIndex(id, stemmed, callback || function () {});
    });
}

/**
 * Builds the reverse index of a document.
 *
 * @param {int|string} id
 * @param {Array} words
 * @param {Function} callback
 * @api private
 */

FullText.prototype.buildIndex = function (id, words, callback) {
    words.push('__documents');
    var self = this,
        remaining = words.length,
        failed = false,
        word_count = 0;
    words.forEach(function (word) {
        self.client.sadd(self.key + ':' + word, id, function (err, added) {
            if (failed) {
                return;
            } else if (err) {
                failed = true;
                return callback(err);
            } else {
                if (added) word_count++;
                if (!--remaining) callback(null, word_count);
            }
        });
    });
    return this;
}

/**
 * Search the full text index. Words will be extracted from the
 * search string and used to filter search results. To exclude certain
 * words, prefix them with a hyphen "-".
 *
 * Basic Search:
 *    `index.search('foo bar', callback);`
 *
 * Excluding Words:
 *    `index.search('foo -bar -cool', callback);`
 *
 * @param {string} search
 * @param {Function} callback
 * @api public
 */

FullText.prototype.search = function (search, callback) {
    var include = [], exclude = [];
    this.stemWords(this.extractWords(search)).forEach(function (word) {
        if (word[0] === '-') {
            exclude.push(word.substr(1));
        } else {
            include.push(word);
        }
    });
    return this._search(include, exclude, callback);
}

/**
 * Execute a search based on two arrays: a list of stemmed words to include,
 * and a list of stemmed words to exclude.
 *
 * @param {Array} include
 * @param {Array} exclude
 * @param {Function} callback
 * @api private
 */

FullText.prototype._search = function (include, exclude, callback) {
    if (include.length === 0) {
        include = ['__documents']; //A set containing all doc IDs
    }
    var multi = this.client.multi(), i, l, result_offset = 0;
    for (i = 0, l = include.length; i < l; i++) {
        include[i] = this.key + ':' + include[i];
    }
    l = exclude.length;
    if (l === 0) {
        multi.sinter.apply(multi, include);
    } else {
        var tmp_key = this.randomKey();
        include.unshift(tmp_key);
        multi.sinterstore.apply(multi, include);
        for (i = 0; i < l; i++) {
            exclude[i] = this.key + ':' + exclude[i];
        }
        exclude.unshift(tmp_key);
        multi.sdiff.apply(multi, exclude);
        multi.del(tmp_key);
        result_offset = 1;
    }
    multi.exec(function (err, results) {
        if (err) return callback(err, null);
        return callback(null, results[result_offset]);
    });
    return this;
}

/**
 * Clear the index.
 *
 * @param {Function} callback (optional)
 * @api public
 */

FullText.prototype.clear = function (callback) {
    var self = this;
    callback = callback || function () {};
    this.client.keys(this.key + ':*', function (err, keys) {
        if (err) return callback(err, null);
        var rem_count = 0, failed = false, remaining = keys.length;
        keys.forEach(function (key) {
            self.client.del(key, function (err, removed) {
                if (failed) {
                    return;
                } else if (err) {
                    failed = true;
                    return callback(err);
                } else {
                    if (removed) rem_count++;
                    if (!--remaining) callback(null, rem_count);
                }
            });
        });
    });
    return this;
}

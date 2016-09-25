# Redback

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads][downloads-image]][npm-url]

A high-level Redis library.

```sh
$ npm install redback
```

## Introduction

Redback provides an accessible and extensible interface to the Redis
[data types](http://redis.io/topics/data-types) and allows you to create
your own structures with ease. Redback comes with the following built-in
structures: **List**,  **Set**, **SortedSet**, **Hash**, **Channel**, **Cache**

It also comes with the following advanced data structures:

- **DensitySet** - A sorted set where adding an element increments its score and removing it decrements it
- **KeyPair** - Uses two hash structures and an auto-incrementing key to assign an ID to each unique value
- **SocialGraph** - Similar to Twitter's (following vs. followers)
- **CappedList** - A list with a fixed length
- **Queue** - A simple FIFO or LIFO queue
- **RateLimit** - Count the number of times an event occurs over an interval. See [this introduction](https://gist.github.com/chriso/54dd46b03155fcf555adccea822193da).
- **BloomFilter** - A probabilistic structure used to test whether an an element exists in a set

## Usage

```javascript
var redback = require('redback').createClient();

// or

var redis = require('redis').createClient();
var redback = require('redback').use(redis);
```

```javascript
var user3 = redback.createSocialGraph(3);
user3.follow(1, callback);

var log = redback.createCappedList('log', 1000);
log.push('Log message ...');

var user = redback.createHash('user1');
user.set({username: 'chris', password: 'foobar'}, callback);
```

## Creating your own structures

Use `addStructure(name, methods)` to create your own structure.

Let's create a queue that can be either FIFO or LIFO:

```javascript
redback.addStructure('SimpleQueue', {
    init: function (options) {
        options = options || {};
        this.fifo = options.fifo;
    },
    add: function (value, callback) {
        this.client.lpush(this.key, value, callback);
    },
    next: function (callback) {
        var method = this.fifo ? 'rpop' : 'lpop';
        this.client[method](this.key, callback);
    }
});
```

Call `createSimpleQueue(key, options)` to use the queue:

```javascript
var queue = redback.createSimpleQueue('my_queue', {fifo: true});
queue.add('awesome!');
```

Structures have access to a Redis key `this.key` and the Redis client
`this.client`. If an `init()` method is defined then it is called after
the structure is instantiated. Also note that `init()` receives any extra parameters
from `create<structure>()`.

## Other uses

**Cache backend**

```javascript
var cache = redback.createCache(namespace);
cache.set('foo', 'bar', callback);
cache.get('foo', function (err, foo) {
    console.log(foo); //bar
});
```

**Pub/sub provider**

```javascript
var channel = redback.createChannel('chat').subscribe();

//To received messages
channel.on('message', function (msg) {
   console.log(msg);
});

//To send messages
channel.publish(msg);
```

## Documentation

See the [annotated source](http://chriso.github.io/redback/api.html) (currently out of date).

## Tests

The tests require a local redis instance running on `localhost:6379`. Note that
the redis database will be flushed prior to each test invocation.

```sh
$ npm test
```

## Credits

- Matt Ranney for his [node_redis](https://github.com/mranney/node_redis) library.
- GitHub user [sreeix](https://github.com/sreeix) for the bloom filter implementation.

## License

MIT


[downloads-image]: http://img.shields.io/npm/dm/redback.svg
[npm-url]: https://npmjs.org/package/redback
[npm-image]: http://img.shields.io/npm/v/redback.svg
[travis-url]: https://travis-ci.org/chriso/redback
[travis-image]: http://img.shields.io/travis/chriso/redback.svg

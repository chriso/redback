**redback** - A high-level Redis library for Node.JS.

Follow [redbackjs.com](http://redbackjs.com/) and [@chris6F](http://twitter.com/chris6F) for updates.

    npm install -g redback

## What is it?

Redback provides an accessible and extensible interface to the Redis
[data types](http://redis.io/topics/data-types) and allows you to roll
your own structures with ease. Redback comes with the following built-in
structures: **List**,  **Set**, **SortedSet**, **Hash**, **Channel**, **Cache**

It also comes with the following advanced data structures:

- **DensitySet** - A sorted set where adding an element increments its score and removing it decrements it.
- **KeyPair** - Uses two hash structures and an auto-incrementing key to assign an ID to each unique value
- **SocialGraph** - Similar to Twitter's (following vs. followers)
- **CappedList** - A list with a fixed length
- **FullText** - A full text index with support for stop words, stemming and basic boolean search
- **Queue** - A simple FIFO or LIFO queue
- **RateLimit** - Count the number of times an event occurs over an interval. Can be used for IP rate limiting. See [this blog post](http://chris6f.com/rate-limiting-with-redis)
- **BloomFilter** - A probabilistic structure used to test whether an an element exists in a set. Contributed by user [sreeix](https://github.com/sreeix)

*Have an idea for an advanced structure? Send a pull request and I'll add you as a contributor.*

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

var text = redback.createFullText('my_index');
text.indexFile({1: 'file1.txt', 2: 'file2.txt'}, callback);
text.search('foo bar -exclude -these -words', callback);

var user1 = redback.createHash('user1');
user.set({username:'chris', password:'redisisawesome'}, callback);

var log = redback.createCappedList('log', 1000);
log.push('Log message ...');
```

## Creating your own structures

To create your own structure, use `addStructure(name, methods)`.

Let's create a queue that can be either FIFO or LIFO

```javascript
redback.addStructure('SimpleQueue', {
    init: function (is_fifo) {
        this.fifo = is_fifo;
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

To use the queue, call `createSimpleQueue(key, is_fifo)`

```javascript
var queue = redback.createSimpleQueue('my_queue', true);
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

## Want to learn more?

For now, see the [annotated source](http://redbackjs.com/api.html) for more information.

## Credits

- Matt Ranney for his awesome [node_redis](https://github.com/mranney/node_redis) library.

## License

(MIT License)

Copyright (c) 2010 Chris O'Hara <cohara87@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

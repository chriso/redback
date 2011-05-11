**redback** - [Redis](http://redis.io/)-backed persistence for [Node.JS](http://nodejs.org/)

Follow [redbackjs.com](http://redbackjs.com/) and [@chris6F](twitter.com/chris6F) for updates.

### What is it?

Redback is a high-level library for Redis. It provides an accessible and extensible interface to the Redis [data types](http://redis.io/topics/data-types) and allows you to roll your own structures with ease. Redback comes with the following built-in structures:

- List
- Set
- SortedSet
- Hash
- Channel
- Cache

There's also some more advanced structures available:

- *DensitySet*
- *KeyPair*
- *SocialGraph*
- *CappedList*

### Usage

    var redback = require('redback').createClient();

    //Call: redback.create<structure>(key); where <structure> is any of the structures listed above

    var list = redback.createList('my_list');

    list.push(['foo','bar'], callback);

### Creating your own structures

To create your own structure, use `addStructure(name, methods)`.
Structures have access to a Redis key `this.key` and the Redis client
`this.client`. If an `init()` method is defined, then it is called after
the structure is instantiated - `init()` receives an extra parameters
when calling `create<structure>()`

Let's create a queue that can be either FIFO or LIFO

    redback.addStructure('Queue', {
        init: function (is_fifo) {
            this.fifo = is_fifo;
        },
        add: function (value, callback) {
            this.client.lpush(this.key, value, callback);
        },
        next: function (callback) {
            var method = this.fifo ? 'lpop' : 'rpop';
            this.client[method](this.key, callback);
        }
    });

To use the queue, call `createQueue(key, is_fifo)`

    var queue = redback.createQueue('my_queue', true);

    queue.add('awesome!', callback);

### Other uses

You can also use Redis as a cache backend or as a pub/sub provider

**Cache backend**

    var cache = redback.createCache();
    cache.set('foo', 'bar', callback);

**Pub/sub provider**

    var channel = redback.createChannel('chat');

    channel.subscribe();

    //To received messages
    channel.on('message', function (msg) {
       console.log(msg);
    });

    //To send messages
    channel.publish(msg);

### Installation

    npm install -g redback

If you don't have Node.JS or NPM, see [this page](https://github.com/chriso/redback/wiki/Node.JS-and-NPM).

### License

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

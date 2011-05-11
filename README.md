**redback** - A high-level Redis library for Node.JS.

Follow [redbackjs.com](http://redbackjs.com/) and [@chris6F](twitter.com/chris6F) for updates.

    npm install -g redback

## What is it?

Redback provides an accessible and extensible interface to the Redis [data types](http://redis.io/topics/data-types) and allows you to roll your own structures with ease. Redback comes with the following built-in structures:

- **List**
- **Set**
- **SortedSet**
- **Hash**
- **Channel**
- **Cache**

It also comes with the following advanced data structures:

- **DensitySet** - A sorted set where adding an element increments its score and removing it decrements it.
- **KeyPair** - Uses two hash structures and an auto-incrementing key to assign an ID to each unique value
- **SocialGraph** - Similar to Twitter's (following vs. followers)
- **CappedList** - A list with a fixed length

## Usage

    var redback = require('redback').createClient();

    //redback.create<Structure>(key)

    var user1 = redback.createHash('user1');
    user.set({username:'chris', password:'redisisawesome'}, callback);

    var log = redback.createCappedList('log', 1000);
    log.push('Log message ...');

    var user3 = redback.createSocialGraph(3);
    user3.follow(1, callback);

## Creating your own structures

To create your own structure, use `addStructure(name, methods)`.

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

Structures have access to a Redis key `this.key` and the Redis client
`this.client`. If an `init()` method is defined then it is called after
the structure is instantiated. Also note that `init()` receives any extra parameters
from `create<structure>()`.

## Other uses

**Cache backend**

    var cache = redback.createCache(namespace);
    cache.set('foo', 'bar', callback);
    cache.get('foo', function (err, foo) {
        console.log(foo); //bar
    });

**Pub/sub provider**

    var channel = redback.createChannel('chat').subscribe();

    //To received messages
    channel.on('message', function (msg) {
       console.log(msg);
    });

    //To send messages
    channel.publish(msg);

## Want to learn more?

For now, see the [annotated source](http://redbackjs.com/api.html) for more information.

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

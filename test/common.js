var redback = require('../');

exports.createClient = function (options) {
    return redback.createClient('redis://localhost/11', options);
};

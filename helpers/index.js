var mutability = require('./mutability'),
    cb = require('./cb'),
    build = require('./build'),
    userAgent = require('./userAgent'),
    query = require('./query'),
    config = require('./config'),
    time = require('./time'),
    _ = require('lodash')

module.exports = _.assign(module.exports, {
    cb: cb,
    build: build,
    userAgent: userAgent,
    query: query,
    config: config,
    time: time
}, mutability)
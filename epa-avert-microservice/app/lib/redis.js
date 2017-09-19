const Redis = require('redis');
const bluebird = require('bluebird');
const coRedis = require('co-redis');

bluebird.promisifyAll(Redis.RedisClient.prototype);
bluebird.promisifyAll(Redis.Multi.prototype);

const config = require('../config/redis');
const db = Redis.createClient(config.port, config.hostname);
// provide authentication when connecting to cloud foundry redis service
if (process.env.WEB_SERVICE !== 'local') {
  db.auth(config.password);
}

db.on('error', function (err) {
  console.error('error', 'node-redis', 'lib/redis.js', err);
});

const dbCo = coRedis(db);

module.exports = {
  incr: function* (key) {
    return dbCo.incr(key);
  },
  set: function* (key, value) {
    return dbCo.hset('avert', key, value);
  },
  get: function* (key) {
    return dbCo.hget('avert', key);
  },
  del: function* (key) {
    return dbCo.hdel('avert', key);
  },
};

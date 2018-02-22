const { promisify } = require('util');
const redis = require('redis');

const redisConfig = require('../config/redis');

const db = redis.createClient(redisConfig.port, redisConfig.hostname);
// provide authentication when connecting to cloud foundry redis service
if (process.env.WEB_SERVICE !== 'local') db.auth(redisConfig.password);

db.on('error', (err) => console.error('lib/redis.js', err));

const incAsync = promisify(db.incr).bind(db);
const setAsync = promisify(db.hset).bind(db);
const getAsync = promisify(db.hget).bind(db);
const delAsync = promisify(db.hdel).bind(db);

module.exports = {
  inc: (key) => {
    return incAsync(key);
  },
  set: (key, value) => {
    return setAsync('avert', key, value);
  },
  get: (key) => {
    return getAsync('avert', key);
  },
  del: (key) => {
    return delAsync('avert', key);
  },
};

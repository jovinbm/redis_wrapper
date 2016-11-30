# Redis Wrapper

This is a simple Promise based wrapper around some redis methods found in ioredis. Check `lib/**/*.test.js` files to see how each function works. I created this so that I can have a consistent api no matter what happens to any of the core engines I use for redis.

## Initialize
`const Redis = require('redis_wrapper')`

`const redis = new Redis(opts)`

## opts
See `index.js` Redis JSDOC params for all options.


## Before you continue
All api is prefixed with `r` e.g `set->rset`, `zadd->rzadd`
You can access the default redis client provided by io-redis using `redis.client`. You can use this in other places e.g. session middleware or to call methods that are not yet supported. Check io-redis for more details.

Makes use of ioredis library in the background. 

## Perks
Consistent return values e.g. 
* (a) What happens when I `hmget` using a `hash_name` that does not exist and keys `a` and `b` and `c`?
* (b) What happens when I `hmget` using a `hash_name` that exists and keys `a` and `b` and `c` where `a` and `b` exists but not `c`?

In both these cases, this library api will always return an object of form:

Case (a) `{a: null, b: null, c: null}`

Case (b) `{a: value, b: value, c: null}`

## Expiring hash fields
You can set an expiration on any hash field (not supported by normal redis api).

e.g.
 
```
redis.rhset({
  hash_name: 'hash_name',
  key_name : 'field_name',
  data     : 'data_string',
  max_life_seconds: 'seconds to last'
})
```
**Expiring hash keys is not automatic** You will need to call `redis.removeExpiredHashKeys()` to remove any hash keys that have expired. You can do this by attaching this to a `setInterval` function or even better, make this part of your background tasks/crons e.t.c. The consistency is accurate to this interval. You can call the function as many times as you like. 


#Testing
`npm test`
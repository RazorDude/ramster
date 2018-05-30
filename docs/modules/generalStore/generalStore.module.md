<a name="generalStore.module_module"></a>

## module
The generalStore module. Contains the GeneralStore class.


* [module](#generalStore.module_module)
    * [~GeneralStore](#generalStore.module_module..GeneralStore)
        * [new GeneralStore()](#new_generalStore.module_module..GeneralStore_new)
        * [.config](#generalStore.module_module..GeneralStore+config) : <code>object</code>
        * [.client](#generalStore.module_module..GeneralStore+client) : <code>redis.RedisClient</code>

<a name="generalStore.module_module..GeneralStore"></a>

### module~GeneralStore
**Kind**: inner class of [<code>module</code>](#generalStore.module_module)  

* [~GeneralStore](#generalStore.module_module..GeneralStore)
    * [new GeneralStore()](#new_generalStore.module_module..GeneralStore_new)
    * [.config](#generalStore.module_module..GeneralStore+config) : <code>object</code>
    * [.client](#generalStore.module_module..GeneralStore+client) : <code>redis.RedisClient</code>

<a name="new_generalStore.module_module..GeneralStore_new"></a>

#### new GeneralStore()
The GeneralStore class. It creates a redis client and wraps with promises the redis module's hget, hset and hdel methods.

<a name="generalStore.module_module..GeneralStore+config"></a>

#### generalStore.config : <code>object</code>
The project config object.

**Kind**: instance property of [<code>GeneralStore</code>](#generalStore.module_module..GeneralStore)  
<a name="generalStore.module_module..GeneralStore+client"></a>

#### generalStore.client : <code>redis.RedisClient</code>
An instance of the redis client, connected to a redis server.

**Kind**: instance property of [<code>GeneralStore</code>](#generalStore.module_module..GeneralStore)  

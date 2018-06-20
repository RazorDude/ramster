'use strict'
/**
 * The generalStore module. Contains the GeneralStore class.
 * @module generalStore.module
 */

const
	redis = require('redis'),
	spec = require('./generalStore.module.spec')

/**
 * The GeneralStore class. It creates a redis client and wraps with promises the redis module's hget, hset and hdel methods.
 * @class GeneralStore
 */
class GeneralStore {
	/**
	 * Creates an instance of GeneralStore, sets the config and the test methods from the accompanying .spec.js file.
	 * @param {object} config The project config object.
	 * @memberof GeneralStore
	 */
	constructor(config) {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		/**
		 * The project config object.
		 * @type {object}
		 */
		this.config = config
		/**
		 * Thee project-specific key to add to all other keys. Using this, we make sure we're not mixing up the data values with other project's store on a centralized redis server.
		 * @type {string}
		 */
		this.projectKeyPrefix = ''
		if (config.redis.addProjectKeyPrefixToHandles) {
			if (config.projectName) {
				this.projectKeyPrefix += `${config.projectName}-`
			}
			if (config.projectVersion) {
				this.projectKeyPrefix += `v${config.projectVersion}-`
			}
		}
		/**
		 * An instance of the redis client, connected to a redis server.
		 * @type {redis.RedisClient}
		 */
		this.client = undefined
	}

	/**
	 * Creates a redis client, connecting it to the redis server described in the config, and sets it to instance.client.
	 * @returns {Promise<boolean>} A promise which wraps the redis.createClient method.
	 * @memberof GeneralStore
	 */
	createClient() {
		return new Promise((resolve, reject) => {
			let options = {}
			if (this.config.redis.password) {
				options.password = this.config.redis.password
			}
			this.client = redis.createClient(this.config.redis.port, this.config.redis.host, options)
			this.client.on('ready', () => {
				resolve(true)
			})
			this.client.on('error', (err) => {
				reject(err)
			})
		})
	}

	/**
	 * Retrieves an entry from the redis store.
	 * @param {string} handle The key to search for in the store.
	 * @returns {Promise<any>} A promise which wraps the redisClient.hget method. When resolved, returns the value stored against the provdided key (handle), or null if it doesn't exist.
	 * @memberof GeneralStore
	 */
	getStoredEntry(handle) {
		return new Promise((resolve, reject) => {
			if ((typeof handle !== 'string') || !handle.length) {
				reject({customMessage: 'Invalid handle provided.'})
				return
			}
			this.client.hget('general_store', `${this.projectKeyPrefix }${handle}`, (err, reply) => {
				if (err) {
					reject(err)
					return
				}
				resolve(reply)
			})
		})
	}

	/**
	 * Creates or replaces an entry in the redis store.
	 * @param {string} handle The key to store the value under.
	 * @param {any} entry The value to store.
	 * @returns {Promise<any>} A promise which wraps the redisClient.hset method.
	 * @memberof GeneralStore
	 */
	storeEntry(handle, entry) {
		return new Promise((resolve, reject) => {
			if ((typeof handle !== 'string') || !handle.length) {
				reject({customMessage: 'Invalid handle provided.'})
				return
			}
			if (typeof entry === 'undefined') {
				reject({customMessage: 'No entry value provided.'})
				return
			}
			this.client.hset('general_store', `${this.projectKeyPrefix }${handle}`, entry, (err, reply) => {
				if (err) {
					reject(err)
					return
				}
				resolve(reply)
			})
		})
	}

	/**
	 * Removes an entry from the redis store.
	 * @param {string} handle The key to remove from the store.
	 * @returns {Promise<any>} A promise which wraps the redisClient.hdel method.
	 * @memberof GeneralStore
	 */
	removeEntry(handle) {
		return new Promise((resolve, reject) => {
			if ((typeof handle !== 'string') || !handle.length) {
				reject({customMessage: 'Invalid handle provided.'})
				return
			}
			this.client.hdel('general_store', `${this.projectKeyPrefix }${handle}`, (err, reply) => {
				if (err) {
					reject(err)
					return
				}
				resolve(reply)
			})
		})
	}
}

module.exports = GeneralStore

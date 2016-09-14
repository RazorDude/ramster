'use strict'
let redis = require('redis')

class GeneralStore {
	constructor(settings) {
		this.settings = settings
		this.redisClient = redis.createClient(this.settings.redis.port, this.settings.redis.host)
	}

	getStoredEntry(handle) {
		return new Promise((resolve, reject) => {
			this.redisClient.hget('general_store', handle, (err, reply) => {
				if (err) {
					reject(err)
					return;
				}
				resolve(reply)
			})
		})
	}

	storeEntry(handle, entry) {
		return new Promise((resolve, reject) => {
			this.redisClient.hset('general_store', handle, entry, (err, reply) => {
				if (err) {
					reject(err)
					return;
				}
				resolve(reply)
			})
		})
	}

	removeEntry(handle) {
		return new Promise((resolve, reject) => {
			this.redisClient.hdel('general_store', handle, (err, reply) => {
				if (err) {
					reject(err)
					return;
				}
				resolve(reply)
			})
		})
	}
}

module.exports = GeneralStore

'use strict'
const
	redis = require('redis'),
	spec = require('./index.spec')

class GeneralStore {
	constructor(config) {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		this.config = config
	}

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

	getStoredEntry(handle) {
		return new Promise((resolve, reject) => {
			if ((typeof handle !== 'string') || !handle.length) {
				reject({customMessage: 'Invalid handle provided.'})
				return
			}
			this.client.hget('general_store', handle, (err, reply) => {
				if (err) {
					reject(err)
					return
				}
				resolve(reply)
			})
		})
	}

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
			this.client.hset('general_store', handle, entry, (err, reply) => {
				if (err) {
					reject(err)
					return
				}
				resolve(reply)
			})
		})
	}

	removeEntry(handle) {
		return new Promise((resolve, reject) => {
			if ((typeof handle !== 'string') || !handle.length) {
				reject({customMessage: 'Invalid handle provided.'})
				return
			}
			this.client.hdel('general_store', handle, (err, reply) => {
				if (err) {
					console.log(e)
					reject(err)
					return
				}
				resolve(reply)
			})
		})
	}
}

module.exports = GeneralStore

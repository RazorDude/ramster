'use strict'

const
	csv = require('csv'),
	spec = require('./index.spec')

class CSVPromise {
	constructor() {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
	}

	parse(data, options) {
		return new Promise((res, rej) => {
			try {
				if ((typeof data !== 'string') || !data.length) {
					throw {customMessage: 'Invalid data string provided.'}
				}
				let actualOptions = options || {}
				csv.parse(data, actualOptions, (err, csvData) => {
					if (err) {
						rej(err)
						return
					}
					res(csvData)
				})
			} catch (e) {
				rej(e)
			}
		})
	}

	stringify(data, options) {
		return new Promise((res, rej) => {
			try {
				if (!(data instanceof Array)) {
					throw {customMessage: 'Invalid data array provided.'}
				}
				let actualOptions = options || {}
				csv.stringify(data, actualOptions, (err, result) => {
					if (err) {
						rej(err)
						return
					}
					res(result)
				})
			} catch (e) {
				rej(e)
			}
		})
	}
}

module.exports = CSVPromise

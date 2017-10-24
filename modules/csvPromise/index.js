'use strict'

const csv = require('csv')

class CSVPromise {
	constructor() {
	}

	parse({data, options}) {
		return new Promise((res, rej) => {
			try {
				options = options || {}
				csv.parse(data, options, (err, csvData) => {
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

	stringify({data, options}) {
		return new Promise((res, rej) => {
			try {
				if (!options) {
					options = {}
				}
				csv.stringify(data, options, (err, result) => {
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

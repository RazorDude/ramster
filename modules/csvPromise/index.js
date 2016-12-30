'use strict'

let csv = require('csv')

let csvPromise = class CSVPromise {
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

	stringify({data}) {
		return new Promise((res, rej) => {
			try {
				csv.stringify(data, (err, result) => {
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
module.exports = csvPromise

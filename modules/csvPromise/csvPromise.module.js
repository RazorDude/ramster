'use strict'
/**
 * The csvPromise module. Contains the CSVPromise class.
 * @module csvPromiseModule
 */

const
	csv = require('csv'),
	spec = require('./csvPromise.module.spec')

/**
 * The CSVPromise class - a promise wrapper around the "csv" npm package's parse and stringify methods.
 * @class CSVPromise
 */
class CSVPromise {
	/**
	 * Creates an instance of CSVPromise and sets the test methods (defined in the accompanying .spec.js file).
	 * @memberof CSVPromise
	 */
	constructor() {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
	}

	/**
	 * Parses a string or Buffer that's expected to contain CSV data and returns arrays of data if it's valid.
	 * @param {string|Buffer} data The string/Buffer data to parse.
	 * @param {object} options (optional) The options object to pass to the csv module, see the csv module's docs for more info.
	 * @param {string} options.delmiter (optional) The column delimiter to use when parsing the file.
	 * @returns {Promise<array>} A promise which wraps the "csv" module's "parse" method.
	 * @memberof CSVPromise
	 */
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

	/**
	 * Stringifies an array of data for direct insertion into a csv file.
	 * @param {Array.<Array.<string>>} data The array to stringify. An error will be thrown id the provided arg is not an array
	 * @param {object} options (optional) The options object to pass to the csv module, see the csv module's docs for more info.
	 * @param {string} options.delmiter (optional) The column delimiter to use when parsing the file.
	 * @returns {Promise<string>} A promise which wraps the "csv" module's "stringify" method.
	 * @memberof CSVPromise
	 */
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

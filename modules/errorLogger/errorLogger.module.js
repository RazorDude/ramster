'use strict'
/**
 * The errorLogger module. Contains the Logger class.
 * @module errorLogger.module
 */
const
	path = require('path'),
	spec = require('./errorLogger.module.spec'),
	winston = require('winston')

/**
 * The Logger class. Displays errors in the console and writes them in a file.
 * @class Logger
 */
class Logger {
	/**
	 * Creates an instance of Logger, sets config and loads the test methods in the accompanying .spec.js file.
	 * @param {object} config The project config object.
	 * @memberof Logger
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
		 * A winston Logger instance.
		 * @type {winston~Logger}
		 */
		this.logger = new winston.Logger({
			transports: [
				new winston.transports.File({
					level: 'error',
					filename: path.join(this.config.logsPath, 'error.log'),
					handleExceptions: true,
					json: true,
					maxsize: 5242880, //5MB
					maxFiles: 5,
					colorize: true
				}),
			]
		})
		this.logger.stream = {
			write: (message, encoding) => this.logger.info(message)
		}
	}

	/**
	 * Logs an error on the console and writes it to a log file.
	 * @param {object} e The error to log.
	 * @returns {void}
	 * @memberof Logger
	 */
	error(e) {
		let stack = e && e.stack || e || '',
			stackString = stack.toString()
		console.log(stack)
		this.logger.log('error', stackString)
	}
}

module.exports = Logger

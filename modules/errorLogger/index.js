'use strict'
const
	path = require('path'),
	spec = require('./index.spec'),
	winston = require('winston')

class Logger {
	constructor(config) {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		this.config = config
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

	error(e) {
		let stack = e && e.stack || e || '',
			stackString = stack.toString()
		console.log(stack)
		this.logger.log('error', stackString)
	}
}

module.exports = Logger

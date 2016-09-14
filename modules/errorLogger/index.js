'use strict'
let winston = require('winston'),
    path = require('path')

class Logger {
    constructor(cfg) {
		this.cfg = cfg
        this.logger = new winston.Logger({
            transports: [
                new winston.transports.File({
                    level: 'error',
                    filename: path.join(this.cfg.logsPath, 'error.log'),
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
        let stack = e.stack || e,
            stackString = e.stack && e.stack.toString() || e.toString()
        console.log(stack)
        this.logger.log('error', stackString)
    }
}

module.exports = Logger

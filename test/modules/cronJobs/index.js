'use strict'

const
	co = require('co'),
	moment = require('moment')
	

const getJobs = (options, mockMode) => [{
		cronTime: '0 * * * * *',
		onTick: () => {
			let jobInfo = '',
				jobTick = co(function*() {
					return true
				})
			if (mockMode) {
				return jobTick
			}
			jobTick.then(
				(res) => true /*console.log('[CRON]', jobInfo, ' - completed successfully.')*/,
				(err) => {
					console.log('[CRON]', jobInfo, ' - error:')
					options.logger.error(err)
				}
			)
		}
	}
]

module.exports = {getJobs}

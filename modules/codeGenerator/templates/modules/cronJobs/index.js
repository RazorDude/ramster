'use strict'

const
	co = require('co'),
	moment = require('moment')
	

const getJobs = (locals) => [{
		cronTime: '0 * * * * *',
		onTick: () => {
			let jobInfo = ''
			co(function*() {
				return true
			}).then(
				(res) => true /*console.log('[CRON]', jobInfo, ' - completed successfully.')*/,
				(err) => {
					console.log('[CRON]', jobInfo, ' - error:')
					locals.logger.error(err)
				}
			)
		}
	}
]

module.exports = {getJobs}

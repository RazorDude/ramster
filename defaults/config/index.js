let deepmerge = require('deepmerge'),
	localProfileConfig = require('./local'),
	path = require('path'),
	commonConfig = {
		clientModulesPath: path.join(__dirname, '../../../modules/clients'),
		clientModulesPublicSourcesPath: path.join(__dirname, '../../../clients'),
		apiModulesPath: path.join(__dirname, '../../../modules/apis'),
		globalUploadPath: path.join(__dirname, '../../../storage/tmp'),
		logsPath: path.join(__dirname, '../../../logs'),
		emails: {
			sendgridApiKey: 'test',
			emailSender: 'noreply@ramster.com',
			bcc: 'admin@ramster.com'
		},
		db: {
			modulePath: path.join(__dirname, '../../../modules/db'),
			seedingOrder: [],
		},
		sampleClientModule: {
			publicPath: path.join(__dirname, '../../../public/sampleClientModule')
		}
	}

module.exports = deepmerge(commonConfig, localProfileConfig)

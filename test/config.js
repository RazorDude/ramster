let path = require('path'),
	hostAddress = '127.0.0.1',
	sampleClientModule = {
		port: 667,
		webpackDevserverPort: 668
	},
	sampleApiModule = {
		port: 669
	}

module.exports = {
	name: 'local',
	postgres: {
		user: 'postgres',
		pass: 'postgres',
		host: '127.0.0.1',
		port: '5432',
		database: 'staffed',
		logging: true
	},
	redis: {
		host: '127.0.0.1',
		port: '6379'
	},
	clientModulesPath: path.join(__dirname, './modules/clients'),
	clientModulesPublicSourcesPath: path.join(__dirname, './clients'),
	apiModulesPath: path.join(__dirname, './modules/apis'),
	globalUploadPath: path.join(__dirname, './storage/tmp'),
	logsPath: path.join(__dirname, './logs'),
	emails: {
		sendgridApiKey: 'test',
		emailSender: 'noreply@ramster.com',
		bcc: 'admin@ramster.com'
	},
	db: {
		modulePath: path.join(__dirname, './modules/db'),
		seedingOrder: [],
		schema: 'public'
	},
	sampleClientModule: {
		serverPort: sampleClientModule.port,
		hostAddress,
		host: `http://${hostAddress}:${sampleClientModule.port}`,
		webpackDevserverPort: sampleClientModule.webpackDevserverPort,
		webpackHost: `http://${hostAddress}:${sampleClientModule.webpackDevserverPort}`,
		session: {
			key: 'sessionkey',
			secret: 'sessionsecret'
		},
		publicPath: path.join(__dirname, './public/sampleClientModule')
	},
	sampleApiModule: {
		serverPort: sampleApiModule.port,
		hostAddress,
		host: `http://${hostAddress}:${sampleApiModule.port}`,
		jwt: {
			secret: 'jwtsecret'
		}
	}
}

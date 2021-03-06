const
	path = require('path')

module.exports = {
	projectName: 'ramster_v1',
	clientModulesPath: path.join(__dirname, '../modules/clients'),
	clientModulesPublicSourcesPath: path.join(__dirname, '../clients'),
	clientModulesPublicPath: path.resolve(__dirname, '../public'),
	apiModulesPath: path.join(__dirname, '../modules/apis'),
	globalStoragePath: path.join(__dirname, '../storage'),
	globalUploadPath: path.join(__dirname, '../storage/tmp'),
	logsPath: path.join(__dirname, '../logs'),
	webserver: 'nginx',
	mountGlobalStorageInWebserver: true,
	addDistToStaticConfigInWebserver: true,
	csvFileDelimiter: ',',
	redis: {addProjectKeyPrefixToHandles: true},
	emails: {
		emailServiceProvider: 'sendgrid',
		sendgridApiKey: process.env.NODE_RAMSTER_SG_API_KEY,
		emailSender: 'noreply@ramster.com',
		// customModulePath: path.join(__dirname, '../modules/emails'),
		templatesPath: path.join(__dirname, '../modules/emails/templates'),
		useClientModule: 'site'
	},
	cronJobs: {
		path: path.join(__dirname, '../modules/cronJobs')
	},
	migrations: {
		startAPI: true,
		baseMigrationsPath: path.join(__dirname, '../modules/migrations'),
		seedFilesPath: path.join(__dirname, '../modules/migrations/seedFiles'),
		syncHistoryPath: path.join(__dirname, '../modules/migrations/syncHistory'),
		backupPath: path.join(__dirname, '../modules/migrations/backup'),
		staticDataPath: path.join(__dirname, '../modules/migrations/staticData')
	},
	db: {
		modulePath: path.join(__dirname, '../modules/db'),
		injectableModulesPath: path.join(__dirname, '../modules'),
		injectModules: ['testModule'],
		dbType: 'postgreSQL',
		schema: 'public'
	},
	clients: {
		site: {
			uploadPath: path.resolve(__dirname, '../storage/tmp'),
			anonymousAccessRoutes: ['/', '/four-oh-four', '/login', '/users/login', '/users/tokenLogin', '/users/sendPasswordResetRequest', '/users/loggedInUserData', '/users/checkEmail', '/globalConfig/readList'],
			doNotLogRequestDataRoutes: ['/users/login', '/users/password'],
			nonLayoutDirectRoutes: [],
			unauthorizedPageRedirectRoute: '/login',
			notFoundRedirectRoutes: {
				default: '/four-oh-four',
				authenticated: '/four-oh-four'
			},
			redirectUnauthorizedPagesToNotFound: true,
			// useApiModuleConfigForAuthTokens: 'mobile',
			passErrorToNext: true
		}
	},
	apis: {
		mobile: {
			anonymousAccessRoutes: ['/users/getCredentials', '/users/create', '/users/forgotPassword'],
			doNotLogRequestDataRoutes: ['/users/login', '/users/password'],
			responseType: 'serviceName',
			jwt: {
				accessTokenExpiresInMinutes: 1440
			},
			allowOrigins: '*'
		}
	}
}

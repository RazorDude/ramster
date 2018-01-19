'use strict'
'use strict'

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
	csvFileDelimiter: ',',
	emails: {
		emailServiceProvider: 'sendgrid',
		sendgridApiKey: 'sg.key',
		emailSender: 'noreply@ramster.com',
		// customModulePath: path.join(__dirname, '../modules/emails'),
		templatesPath: path.join(__dirname, '../modules/emails/templates'),
		useClientModule: 'site'
	},
	// cronJobs: {
		// path: path.join(__dirname, '../modules/cronJobs')
	// },
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
		dbType: 'postgres',
		seedingOrder: [
			'modules', 'roles', 'keyAccessPoints', 'users'
		]
	},
	clients: {
		site: {
			uploadPath: path.resolve(__dirname, '../public/site/assets/uploads'),
			anonymousAccessRoutes: ['/', '/four-oh-four', '/login', '/tokenLogin', '/users/resetPassword', '/users/loadLoggedInUserData', '/globalConfig/readList'],
			nonLayoutDirectRoutes: ['/salesOrders/changeStatus/:orderId/:statusId'],
			unauthorizedPageRedirectRoute: '/login',
			notFoundRedirectRoutes: {
				default: '/four-oh-four',
				authenticated: '/four-oh-four'
			},
			redirectUnauthorizedPagesToNotFound: true,
			prependWSServerConfigFromFiles: [
				path.join(__dirname, '../nginx/siteAPIRedirect.conf'),
				path.join(__dirname, '../nginx/swaggerUI.conf'),
				path.join(__dirname, '../nginx/images.conf'),
				path.join(__dirname, '../nginx/distToStatic.conf')
			],
			useApiModuleConfigForAuthTokens: 'mobile',
			passErrorToNext: true,
			startWebpackDevserver: true
		}
	},
	apis: {
		mobile: {
			anonymousAccessRoutes: ['/users/getCredentials', '/users/create', '/users/forgotPassword'],
			responseType: 'serviceName',
			jwt: {
				accessTokenExpiresInMinutes: 1440
			},
			allowOrigins: '*'
		}
	}
}

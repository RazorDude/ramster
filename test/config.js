'use strict'

const
	merge = require('deepmerge'),
	path = require('path')

let site = {
		port: 7302,
		wsPort: 7301,
		webpackDevserverPort: 7309
	},
	mobile = {
		port: 7306
	},
	hostProtocol = 'http',
	hostAddress = '127.0.0.1'

let commonConfig = {
	projectName: 'nyetimberStockedV3',
	clientModulesPath: path.join(__dirname, './modules/clients'),
	clientModulesPublicSourcesPath: path.join(__dirname, './clients'),
	clientModulesPublicPath: path.resolve(__dirname, './public'),
	apiModulesPath: path.join(__dirname, './modules/apis'),
	globalStoragePath: path.join(__dirname, './storage'),
	globalUploadPath: path.join(__dirname, './storage/tmp'),
	logsPath: path.join(__dirname, './logs'),
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
		baseMigrationsPath: path.join(__dirname, './modules/migrations'),
		seedFilesPath: path.join(__dirname, './modules/migrations/seedFiles'),
		syncHistoryPath: path.join(__dirname, './modules/migrations/syncHistory'),
		backupPath: path.join(__dirname, './modules/migrations/backup'),
		staticDataPath: path.join(__dirname, './modules/migrations/staticData')
	},
	db: {
		modulePath: path.join(__dirname, '../modules/db'),
		dbType: 'postgres',
		seedingOrder: [
			'modules', 'roles', 'keyAccessPoints', 'users' //TODO: test if the seeding order is correct
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
				path.join(__dirname, './nginx/siteAPIRedirect.conf'),
				path.join(__dirname, './nginx/swaggerUI.conf'),
				path.join(__dirname, './nginx/images.conf'),
				path.join(__dirname, './nginx/distToStatic.conf')
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

let profileConfig = {
	name: 'test',
	hostProtocol,
	hostAddress,
	wsPort: site.wsPort,
	wsConfigFolderPath: 'c:\\programs\\nginx\\conf',
	postgres: {
		user: 'postgres',
		password: 'postgres',
		host: '127.0.0.1',
		port: 5432,
		database: 'ramster_v1',
		schema: 'public',
		logging: true
	},
	redis: {
		host: '127.0.0.1',
		port: 6379
	},
	migrations: {
		serverPort: 7377
	},
	clients: {
		site: {
			serverPort: site.port,
			hostAddress,
			host: `${hostProtocol}://${hostAddress}:${site.wsPort || site.port}`,
			webpackDevserverPort: site.webpackDevserverPort,
			webpackHost: `http://${hostAddress}:${site.webpackDevserverPort}`,
			session: {
				key: 'sessionKey',
				secret: 'sessionSecret'
			}
		}
	},
	apis: {
		mobile: {
			serverPort: mobile.port,
			hostAddress,
			host: `${hostProtocol}://${hostAddress}:${mobile.port}`,
			jwt: {
				secret: 'jwtSecret'
			}
		}
	}
}

module.exports = merge(commonConfig, profileConfig)

'use strict'

const path = require('path')

let site = {
		port: 1102,
		wsPort: 1101,
		webpackDevserverPort: 1109
	},
	mobile = {
		port: 1106
	},
	hostProtocol = 'http',
	hostAddress = '127.0.0.1'

module.exports = {
	name: 'local',
	hostProtocol,
	hostAddress,
	wsPort: site.wsPort,
	// wsConfigFolderPath: '/etc/nginx/conf-avail.d',
	wsConfigFolderPath: path.join(__dirname, '../'),
	postgreSQL: {
		user: 'postgres',
		password: 'postgres',
		host: '127.0.0.1',
		port: 5432,
		database: 'ramster_v1',
		mockDatabase: 'ramster_v1_mock',
		schema: 'public',
		logging: false
	},
	redis: {
		host: '127.0.0.1',
		port: 6379,
		password: 'redis',
		mockModePrefix: 'mockMode'
	},
	migrations: {
		serverPort: 1177
	},
	db: {
		tokensSecret: 'jwtSecret'
	},
	clients: {
		site: {
			serverPort: site.port,
			hostAddress,
			host: `${hostProtocol}://${hostAddress}:${site.wsPort || site.port}`,
			webpackDevserverPort: site.webpackDevserverPort,
			webpackHost: `http://${hostAddress}:${site.webpackDevserverPort}`,
			startWebpackDevserver: true,
			session: {
				key: 'sessionKey',
				secret: 'sessionSecret'
			},
			prependWSServerConfigFromFiles: [
				path.join(__dirname, '../nginx/images.conf')
			]
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

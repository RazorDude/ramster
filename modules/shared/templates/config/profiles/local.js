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
	wsConfigFolderPath: 'c:\\programs\\nginx\\conf',
	postgreSQL: {
		user: 'postgres',
		password: 'postgres',
		host: '127.0.0.1',
		port: 5432,
		database: 'ramster_v1',
		mockDatabase: 'ramster_v1',
		schema: 'public',
		logging: true
	},
	redis: {
		host: '127.0.0.1',
		port: 6379
	},
	migrations: {
		serverPort: 1177
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

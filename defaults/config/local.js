'use strict'

let hostAddress = '127.0.0.1',
	sampleClientModule = {
		port: 667,
		webpackDevserverPort: 668
	},
	sampleApiModule = {
		port: 669
	},
	migrations = {
		port: 700
	}

module.exports = {
	name: 'local',
	postgres: {
		user: 'postgres',
		pass: 'ramster',
		host: '127.0.0.1',
		port: '5432',
		database: 'ramster',
		logging: true
	},
	redis: { host: '127.0.0.1', port: '6379' },
	sampleClientModule: {
		serverPort: sampleClientModule.port,
		hostAddress,
		host: `http://${hostAddress}:${sampleClientModule.port}`,
		webpackDevserverPort: sampleClientModule.webpackDevserverPort,
		webpackHost: `http://${hostAddress}:${sampleClientModule.webpackDevserverPort}`,
		session: {
			key: 'sessionkey',
			secret: 'sessionsecret'
		}
	},
	sampleApiModule: {
		serverPort: sampleApiModule.port,
		hostAddress,
		host: `http://${hostAddress}:${sampleApiModule.port}`,
		jwt: {
			secret: 'jwtsecret'
		}
	},
	migrations: {
		serverPort: migrations.port,
		hostAddress,
		host: `http://127.0.0.1:${migrations.port}`,
		passKey: 'SUPERSECRET'
	}
}

const
	assert = require('assert'),
	co = require('co'),
	{describeSuiteConditionally, runTestConditionally} = require('../toolbelt'),
	fs = require('fs-extra'),
	path = require('path'),
	moment = require('moment')

module.exports = {
	testMe: function() {
		const instance = this
		describe('core.modules.db', function() {
			it('should execute testLoadComponents successfully', function() {
				instance.testLoadComponents()
				assert(true)
			})
		})
	},
	testLoadComponents: function() {
		const instance = this,
			{config, moduleConfig} = this,
			originalConfig = JSON.parse(JSON.stringify(config))
		let changeableInstance = this
		describe('core.modules.db.loadComponents', function() {
			it('should throw an error with the correct message if an invalid dbType is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					changeableInstance.config.db.dbType = 'invalidDBType'
					try {
						yield instance.loadComponents()
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid dbType.')
					}
					changeableInstance.config.db.dbType = originalConfig.db.dbType
					assert(didThrowAnError)
					return true
				})
			})
			describeSuiteConditionally(moduleConfig.dbType === 'postgreSQL', 'postgreSQL dialect', function() {
				const originalPostgreSQLConfig = originalConfig.postgreSQL
				let postgreSQLConfig = changeableInstance.config.postgreSQL
				it('should throw a SequelizeHostNotFoundError error if an invalid postgreSQL server host address is provided', function() {
					return co(function*() {
						let didThrowAnError = false
						postgreSQLConfig.host = `absolutelyFakeHostAddress_${moment.utc().valueOf()}`
						try {
							yield instance.loadComponents()
						} catch(e) {
							didThrowAnError = e && (e.name === 'SequelizeHostNotFoundError')
						}
						postgreSQLConfig.host = originalPostgreSQLConfig.host
						assert(didThrowAnError)
						return true
					})
				})
				it('should throw a RangeError error if an invalid postgreSQL server port is provided', function() {
					return co(function*() {
						let didThrowAnError = false
						postgreSQLConfig.port = `absolutelyFakeServerPort_${moment.utc().valueOf()}`
						try {
							yield instance.loadComponents()
						} catch(e) {
							didThrowAnError = e && (e.name === 'RangeError')
						}
						postgreSQLConfig.port = originalPostgreSQLConfig.port
						assert(didThrowAnError)
						return true
					})
				})
				it('should throw a SequelizeConnectionError error if an invalid postgreSQL user is provided for a running postgreSQL server on the provided host and port', function() {
					return co(function*() {
						let didThrowAnError = false
						postgreSQLConfig.user = `absolutelyFakeUsername_${moment.utc().valueOf()}`
						try {
							yield instance.loadComponents()
						} catch(e) {
							didThrowAnError = e && (e.name === 'SequelizeConnectionError')
						}
						postgreSQLConfig.user = originalPostgreSQLConfig.user
						assert(didThrowAnError)
						return true
					})
				})
				it('should throw a SequelizeConnectionError error if an invalid postgreSQL password is provided for a running postgreSQL server on the provided host and port', function() {
					return co(function*() {
						let didThrowAnError = false
						postgreSQLConfig.password = `absolutelyFakePassword_${moment.utc().valueOf()}`
						try {
							yield instance.loadComponents()
						} catch(e) {
							didThrowAnError = e && (e.name === 'SequelizeConnectionError')
						}
						
						postgreSQLConfig.password = originalPostgreSQLConfig.password
						assert(didThrowAnError)
						return true
					})
				})
				it('should throw a SequelizeConnectionError error if an invalid postgreSQL database name is provided for a running postgreSQL server on the provided host and port', function() {
					return co(function*() {
						let didThrowAnError = false
						postgreSQLConfig.database = `absolutelyFakeDatabaseName_${moment.utc().valueOf()}`
						try {
							yield instance.loadComponents()
						} catch(e) {
							didThrowAnError = e && (e.name === 'SequelizeConnectionError')
						}
						postgreSQLConfig.database = originalPostgreSQLConfig.database
						assert(didThrowAnError)
						return true
					})
				})
				it('should execute successfully if all paramters are correct', function() {
					return co(function*() {
						yield instance.loadComponents()
						assert(true)
						return true
					})
				})
			})
		})
	}
}

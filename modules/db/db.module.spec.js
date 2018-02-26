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
		this.config.postgreSQL.logging = false
		describe('core.modules.db', function() {
			it('should execute testConnectToDB successfully', function() {
				instance.testConnectToDB()
				assert(true)
			})
			it('should execute testLoadComponents successfully', function() {
				instance.testLoadComponents()
				assert(true)
			})
			it('should execute testCreateAssociations successfully', function() {
				instance.testCreateAssociations()
				assert(true)
			})
			it('should execute testSetComponentsProperties successfully', function() {
				instance.testSetComponentsProperties()
				assert(true)
			})
		})
	},
	testConnectToDB: function() {
		const instance = this,
			{config, moduleConfig} = this,
			originalConfig = JSON.parse(JSON.stringify(config))
		let changeableInstance = this
		describe('core.modules.db.connectToDB', function() {
			it('should throw an error with the correct message if an invalid dbType is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					changeableInstance.config.db.dbType = 'invalidDBType'
					try {
						yield instance.connectToDB()
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
							yield instance.connectToDB()
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
							yield instance.connectToDB()
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
							yield instance.connectToDB()
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
							yield instance.connectToDB()
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
							yield instance.connectToDB()
						} catch(e) {
							didThrowAnError = e && (e.name === 'SequelizeConnectionError')
						}
						postgreSQLConfig.database = originalPostgreSQLConfig.database
						assert(didThrowAnError)
						return true
					})
				})
				it('should execute successfully if all paramters are correct and mockMode is set to true', function() {
					return co(function*() {
						yield instance.connectToDB(true)
						assert(instance.runningInMockMode)
						return true
					})
				})
				it('should execute successfully if all paramters are correct and mockMode is not set to true', function() {
					return co(function*() {
						yield instance.connectToDB()
						assert(true)
						return true
					})
				})
			})
		})
	},
	testLoadComponents: function() {
		const instance = this,
			{config, moduleConfig} = this,
			originalConfig = JSON.parse(JSON.stringify(config))
		let changeableInstance = this
		describe('core.modules.db.loadComponents', function() {
			it('should throw an error if moduleConfig.modulePath is undefined', function() {
				return co(function*() {
					let didThrowAnError = false
					changeableInstance.config.db.modulePath = undefined
					try {
						yield instance.loadComponents()
					} catch(e) {
						didThrowAnError = true
					}
					changeableInstance.config.db.modulePath = originalConfig.db.modulePath
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error if moduleConfig.modulePath is null', function() {
				return co(function*() {
					let didThrowAnError = false
					changeableInstance.config.db.modulePath = null
					try {
						yield instance.loadComponents()
					} catch(e) {
						didThrowAnError = true
					}
					changeableInstance.config.db.modulePath = originalConfig.db.modulePath
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error if moduleConfig.modulePath does not point to a valid directory', function() {
				return co(function*() {
					let didThrowAnError = false
					changeableInstance.config.db.modulePath = 'notAValidDirectoryByFar'
					try {
						yield instance.loadComponents()
					} catch(e) {
						didThrowAnError = true
					}
					changeableInstance.config.db.modulePath = originalConfig.db.modulePath
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if a component\'s class does not contain a model object', function() {
				return co(function*() {
					let didThrowAnError = false,
						componentName = `absolutelyFakeModule_${moment.utc().valueOf()}`,
						componentPath = path.join(moduleConfig.modulePath, componentName)
					yield fs.mkdirp(componentPath)
					let fd = yield fs.open(path.join(componentPath, 'index.js'), 'w')
					yield fs.writeFile(fd, 'class DBComponent {constructor() {}}; module.exports = DBComponent;')
					yield fs.close(fd)
					try {
						yield instance.loadComponents()
					} catch(e) {
						didThrowAnError = e && (e.customMessage === `DB module component "${componentName}" loaded, does not have a valid model.`)
					}
					yield fs.remove(componentPath)
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if a component has a spec file, but it is invalid', function() {
				return co(function*() {
					let didThrowAnError = false,
						componentName = `absolutelyFakeModule_${moment.utc().valueOf()}`,
						componentPath = path.join(moduleConfig.modulePath, componentName)
					yield fs.mkdirp(componentPath)
					let fd = yield fs.open(path.join(componentPath, 'index.js'), 'w')
					yield fs.writeFile(fd, 'class DBComponent {constructor() {this.model = function() {}}}; module.exports = DBComponent;')
					yield fs.close(fd)
					fd = yield fs.open(path.join(componentPath, 'index.spec.js'), 'w')
					yield fs.writeFile(fd, 'invalid')
					yield fs.close(fd)
					try {
						yield instance.loadComponents()
					} catch(e) {
						didThrowAnError = e && (e.customMessage === `Invalid spec file for DB module component "${componentName}".`)
					}
					yield fs.remove(componentPath)
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully if all paramters are correct and doSync isn\'t enabled', function() {
				return co(function*() {
					yield instance.loadComponents()
					assert(true)
					return true
				})
			})
			it('should have loaded all components after it has executed successfully', function() {
				return co(function*() {
					const components = instance.components
					let moduleDirData = yield fs.readdir(moduleConfig.modulePath),
						allLoaded = true
					for (const i in moduleDirData) {
						let componentName = moduleDirData[i]
						if ((componentName.indexOf('.') === -1) && !components[componentName]){
							allLoaded = false
							break
						}
					}
					assert(allLoaded)
					return true
				})
			})
			it('should have set the correct componentName for all components after it has executed successfully', function() {
				const components = instance.components
				let allHaveCorrectComponentNames = true
				for (const componentName in components) {
					const component = components[componentName]
					if (!component.componentName || (component.componentName !== componentName)) {
						allHaveCorrectComponentNames = false
						break
					}
				}
				assert(allHaveCorrectComponentNames)
			})
			it('should have set the db property, with the component removed individually to avoid circularization, for all components after it has executed successfully', function() {
				const components = instance.components
				let allHaveTheValidDBProperty = true
				for (const componentName in components) {
					const component = components[componentName]
					if (!component.db || component.db.components[componentName]) {
						allHaveTheValidDBProperty = false
						break
					}
				}
				assert(allHaveTheValidDBProperty)
			})
			it('should have loaded the fieldCaseMap successfully, if a valid one was present in the module directory', function() {
				return co(function*() {
					let moduleDirData = yield fs.readdir(moduleConfig.modulePath),
						hasFieldCaseMap = true
					for (const i in moduleDirData) {
						let componentName = moduleDirData[i]
						if (componentName === 'fieldCaseMap.js') {
							if (!instance.fieldCaseeMap) {
								hasFieldCaseMap = false
							}
							break
						}
					}
					assert(hasFieldCaseMap)
					return true
				})
			})
		})
	},
	testCreateAssociations: function() {
		const instance = this,
			{config, moduleConfig} = this,
			originalConfig = JSON.parse(JSON.stringify(config))
		let changeableInstance = this
		describe('core.modules.db.createAssociations', function() {
			it('should execute successfully if all paramters are correct and doSync is enabled', function() {
				return co(function*() {
					yield instance.createAssociations()
					assert(true)
					return true
				})
			})
			it('should have generated the correct seeding order', function() {
				const seedingOrder = instance.seedingOrder
				let correctSeedingOrder = ['globalConfig', 'moduleCategories', 'modules', 'moduleAccessPoints', 'userTypes', 'users']
				// console.log(correctSeedingOrder, seedingOrder)
				for (const i in correctSeedingOrder) {
					if (correctSeedingOrder[i] !== seedingOrder[i]) {
						assert(false)
						return
					}
				}
				assert(true)
			})
		})
	},
	testSetComponentsProperties: function() {
		const instance = this,
			{config, moduleConfig} = this,
			originalConfig = JSON.parse(JSON.stringify(config))
		let changeableInstance = this
		describe('core.modules.db.setComponentsProperties', function() {
			it('should throw an error with the correct message if the properties argument is not a valid object', function() {
				let didThrowAnError = false
				try {
					instance.setComponentsProperties()
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid properties object provided.')
				}
				assert(didThrowAnError)
			})
			it('should set the provided properties to all components correctly', function() {
				const components = instance.components
				let allHaveTheCorrectProperties = true
				instance.setComponentsProperties({test1: 'correct', test2: 'properties'})
				for (const componentName in components) {
					const component = components[componentName]
					if ((component.test1 !== 'correct') || (component.test2 !== 'properties')) {
						allHaveTheCorrectProperties = false
						break
					}
				}
				assert(allHaveTheCorrectProperties)
			})
		})
	}
}

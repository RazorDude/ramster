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
			})
			it('should execute testLoadComponents successfully', function() {
				instance.testLoadComponents()
			})
			it('should execute testCreateAssociations successfully', function() {
				instance.testCreateAssociations()
			})
			it('should execute testSetComponentsProperties successfully', function() {
				instance.testSetComponentsProperties()
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
						if (e && (e.customMessage === 'Invalid dbType.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					changeableInstance.config.db.dbType = originalConfig.db.dbType
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
							if (e && (e.name === 'SequelizeHostNotFoundError')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						postgreSQLConfig.host = originalPostgreSQLConfig.host
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
							if (e && (e.name === 'RangeError')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						postgreSQLConfig.port = originalPostgreSQLConfig.port
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
							if (e && (e.name === 'SequelizeConnectionError')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						postgreSQLConfig.user = originalPostgreSQLConfig.user
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
						return true
					})
				})
				it.skip('should throw a SequelizeConnectionError error if an invalid postgreSQL password is provided for a running postgreSQL server on the provided host and port', function() {
					return co(function*() {
						let didThrowAnError = false
						postgreSQLConfig.password = `absolutelyFakePassword_${moment.utc().valueOf()}`
						try {
							yield instance.connectToDB()
						} catch(e) {
							if (e && (e.name === 'SequelizeConnectionError')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						
						postgreSQLConfig.password = originalPostgreSQLConfig.password
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
							if (e && (e.name === 'SequelizeConnectionError')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						postgreSQLConfig.database = originalPostgreSQLConfig.database
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
						return true
					})
				})
				it('should execute successfully if all paramters are correct and mockMode is set to true', function() {
					return co(function*() {
						yield instance.connectToDB(true)
						assert.strictEqual(instance.runningInMockMode, true, `bad value ${instance.runningInMockMode} for instance.runningInMockMode, expected true`)
						return true
					})
				})
				it('should execute successfully if all paramters are correct and mockMode is not set to true', function() {
					return co(function*() {
						yield instance.connectToDB()
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
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
						if (e && (e.customMessage === `DB module component "${componentName}" loaded, does not have a valid model.`)) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					yield fs.remove(componentPath)
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
						if (e && (e.customMessage === `Invalid spec file for DB module component "${componentName}".`)) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					yield fs.remove(componentPath)
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should execute successfully if all paramters are correct and doSync isn\'t enabled', function() {
				return co(function*() {
					yield instance.loadComponents()
					return true
				})
			})
			it('should have loaded all components after it has executed successfully', function() {
				return co(function*() {
					const components = instance.components
					let moduleDirData = yield fs.readdir(moduleConfig.modulePath)
					for (const i in moduleDirData) {
						let componentName = moduleDirData[i]
						if (componentName.indexOf('.') === -1){
							assert(components[componentName], `expected component ${componentName} to exist, got ${components[componentName]}`)
						}
					}
					return true
				})
			})
			it('should have set the correct componentName for all components after it has executed successfully', function() {
				const components = instance.components
				for (const componentName in components) {
					const component = components[componentName]
					assert.strictEqual(component.componentName, componentName, `bad value ${componentName.componentName} for componentName, expected ${componentName}`)
				}
			})
			it('should have set the db property, with the component removed individually to avoid circularization, for all components after it has executed successfully', function() {
				const components = instance.components
				for (const componentName in components) {
					const component = components[componentName]
					assert(component.db, `expected component.db to exist, got ${component.db}`)
					const typeOf = typeof component.db.components[componentName]
					assert.strictEqual(typeOf, 'undefined', `bad value ${typeOf} for typeof component.db.components[componentName], expected unefined`)
				}
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
					assert.strictEqual(hasFieldCaseMap, true, 'no fieldCaseMap loaded')
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
					return true
				})
			})
			it('should have generated the correct seeding order', function() {
				const seedingOrder = instance.seedingOrder
				let correctSeedingOrder = ['globalConfig', 'moduleCategories', 'modules', 'moduleAccessPoints', 'userTypes', 'users']
				for (const i in correctSeedingOrder) {
					assert.strictEqual(seedingOrder[i], correctSeedingOrder[i], `bad value ${seedingOrder[i]} at index ${i}, expected ${correctSeedingOrder[i]}`)
				}
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
					if (e && (e.customMessage === 'Invalid properties object provided.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error thrown')
			})
			it('should set the provided properties to all components correctly', function() {
				const components = instance.components
				instance.setComponentsProperties({test1: 'correct', test2: 'properties'})
				for (const componentName in components) {
					const component = components[componentName]
					assert.strictEqual(component.test1, 'correct', `bad value ${component.test1} for component.test1, expected 'correct'`)
					assert.strictEqual(component.test2, 'properties', `bad value ${component.test2} for component.test2, expected 'properties'`)
				}
			})
		})
	}
}

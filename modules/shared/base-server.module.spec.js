const
	assert = require('assert'),
	co = require('co'),
	fs = require('fs-extra'),
	path = require('path'),
	moment = require('moment')

module.exports = {
	testMe: function() {
		const instance = this
		describe('base-server.module', function() {
			let req = {
					locals: {
						moduleName: 'mobile',
						moduleType: 'client'
					},
					queryValues: {}
				},
				res = {
					headers: {},
					set: function(headerName, headerValue) {
						res.fakeVar = true
						if (!res.headers) {
							res.headers = {}
						}
						res.headers[headerName] = headerValue
					},
					status: function(statusCode) {
						res.fakeVar = true
						if (typeof res.response === 'undefined') {
							res.response = {}
						}
						res.response.statusCode = statusCode
						return res
					},
					jsonTemplate: function(resolvePromise, jsonObject) {
						res.fakeVar = true
						if (typeof res.response === 'undefined') {
							res.response = {}
						}
						res.response.jsonBody = jsonObject
						if (typeof resolvePromise === 'function') {
							resolvePromise()
							return
						}
						return res
					},
					endTemplate: function(resolvePromise) {
						if (typeof resolvePromise === 'function') {
							resolvePromise()
							return
						}
					},
					redirectTemplate: function(resolvePromise, statusCode, route) {
						res.fakeVar = true
						if (typeof res.response === 'undefined') {
							res.response = {}
						}
						res.response.statusCode = statusCode
						res.response.redirectRoute = route
						if (typeof resolvePromise === 'function') {
							resolvePromise()
							return
						}
						return res
					}
				},
				next = function(resolvePromise, errorObject) {
					next.fakeVar = true
					if (errorObject) {
						next.fail = true
						next.errorStatus = errorObject.status
						next.errorMessage = errorObject.message
					} else {
						next.fail = false
					}
					if (typeof resolvePromise === 'function') {
						resolvePromise()
					}
				}
			it('should execute testLoadComponents successfully', function() {
				instance.testLoadComponents()
			})
			it('should execute testSetModuleInComponents successfully', function() {
				instance.testSetModuleInComponents()
			})
			it('should execute testAccessControlAllowOrigin successfully', function() {
				instance.testAccessControlAllowOrigin(req, res, next)
			})
			it('should execute testChangeFieldCase successfully', function() {
				instance.testChangeFieldCase(req, res, next)
			})
			it('should execute testHandleNextAfterRoutes successfully', function() {
				instance.testHandleNextAfterRoutes(req, res, next)
			})
		})
	},
	testLoadComponents: function() {
		const instance = this,
			{config, moduleConfig} = this,
			originalConfig = JSON.parse(JSON.stringify(config))
		let changeableInstance = this
		describe('base-server.module.loadComponents', function() {
			it('should throw an error if config.clientModulesPath is undefined', function() {
				return co(function*() {
					let didThrowAnError = false
					changeableInstance.config.clientModulesPath = undefined
					try {
						yield instance.loadComponents()
					} catch(e) {
						didThrowAnError = true
					}
					changeableInstance.config.clientModulesPath = originalConfig.clientModulesPath
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error if config.clientModulesPath is null', function() {
				return co(function*() {
					let didThrowAnError = false
					changeableInstance.config.clientModulesPath = null
					try {
						yield instance.loadComponents()
					} catch(e) {
						didThrowAnError = true
					}
					changeableInstance.config.clientModulesPath = originalConfig.clientModulesPath
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error if config.clientModulesPath does not point to a valid directory', function() {
				return co(function*() {
					let didThrowAnError = false
					changeableInstance.config.clientModulesPath = 'notAValidDirectoryByFar'
					try {
						yield instance.loadComponents()
					} catch(e) {
						didThrowAnError = true
					}
					changeableInstance.config.clientModulesPath = originalConfig.clientModulesPath
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if a component has a spec file, but it is invalid', function() {
				return co(function*() {
					let didThrowAnError = false,
						componentName = `absolutelyFakeModule_${moment.utc().valueOf()}`,
						componentPath = path.join(config.clientModulesPath, instance.moduleName, componentName)
					yield fs.mkdirp(componentPath)
					let fd = yield fs.open(path.join(componentPath, 'index.js'), 'w')
					yield fs.writeFile(fd, 'class ClientComponent {constructor() {}}; module.exports = ClientComponent;')
					yield fs.close(fd)
					fd = yield fs.open(path.join(componentPath, 'index.spec.js'), 'w')
					yield fs.writeFile(fd, 'invalid')
					yield fs.close(fd)
					try {
						yield instance.loadComponents()
					} catch(e) {
						if (e && (e.customMessage === `Invalid spec file for "${instance.moduleName}" client module component "${componentName}".`)) {
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
			it('should execute successfully if all paramters are correct', function() {
				return co(function*() {
					yield instance.loadComponents()
					return true
				})
			})
			it('should have loaded all components after it has executed successfully', function() {
				return co(function*() {
					const components = instance.components
					let moduleDirData = yield fs.readdir(path.join(config.clientModulesPath, instance.moduleName))
					for (const i in moduleDirData) {
						let componentName = moduleDirData[i]
						if (componentName.indexOf('.') === -1) {
							assert(components[componentName], `bad value ${components[componentName]} for component ${componentName}, expected it to exist`)
						}
					}
					return true
				})
			})
			it('should have set the correct componentName for all components after it has executed successfully', function() {
				const components = instance.components
				for (const componentName in components) {
					const component = components[componentName]
					assert.strictEqual(component.componentName, componentName, `bad value ${component.componentName} for the component name, expected ${componentName}`)
				}
			})
			it('should have set the module property, with the component removed individually to avoid circularization, for all components after it has executed successfully', function() {
				const components = instance.components
				for (const componentName in components) {
					const component = components[componentName]
					assert(component.module, `bad value ${component.module} for component.module, expected it to exist`)
					let typeOfThisComponent = typeof component.module.components[componentName]
					assert.strictEqual(typeOfThisComponent, 'undefined', `bad value ${typeOfThisComponent} for typeof component.module.components[componentName], expected undefined`)
				}
			})
			it('should have loaded the fieldCaseMap successfully, if a valid one was present in the module directory', function() {
				return co(function*() {
					let moduleDirData = yield fs.readdir(path.join(config.clientModulesPath, instance.moduleName))
					for (const i in moduleDirData) {
						let componentName = moduleDirData[i]
						if (componentName === 'fieldCaseMap.js') {
							assert(instance.fieldCaseMap, `bad value ${instance.fieldCaseMap} for instance.fieldCaseMap, expected it to exist`)
						}
					}
					return true
				})
			})
		})
	},
	testSetModuleInComponents: function() {
		const instance = this
		let {components} = this
		describe('base-server.module.setModuleInComponents', function() {
			it('should have set the module property, with the component removed individually to avoid circularization, for all components after it has executed successfully', function() {
				for (const componentName in components) {
					delete components[componentName].module
				}
				instance.setModuleInComponents()
				for (const componentName in components) {
					const component = components[componentName]
					assert(component.module, `bad value ${component.module} for component.module, expected it to exist`)
					let typeOfThisComponent = typeof component.module.components[componentName]
					assert.strictEqual(typeOfThisComponent, undefined, `bad value ${typeOfThisComponent} for typeof component.module.components[componentName], expected undefined`)
					assert(component.dbComponent, `bad value ${component.dbComponent} for component.dbComponent, expected it to exist`)
				}
			})
		})
	},
	testAccessControlAllowOrigin: function(req, res, next) {
		const instance = this,
			originalModuleConfig = JSON.parse(JSON.stringify(this.moduleConfig)),
			accessControlAllowOrigin = this.accessControlAllowOrigin.bind(this)
		let {moduleConfig} = this,
			changeableInstance = this
		describe('base-server.module.accessControlAllowOrigin', function() {
			it('should execute successfully and set the access-control-related headers correctly if the request is of type options', function() {
				return co(function*() {
					req.method = 'OPTIONS'
					delete res.headers['Access-Control-Allow-Origin']
					delete res.headers['Access-Control-Allow-Headers']
					delete res.headers.Allow
					next.fail = null
					moduleConfig.allowOrigins = 'testAllowOrigins'
					yield (new Promise((resolve, reject) => {
						res.end = res.endTemplate.bind(res, resolve)
						accessControlAllowOrigin()(req, res, next.bind(next, resolve))
					}))
					moduleConfig.allowOrigins = originalModuleConfig.allowOrigins
					assert.strictEqual(next.fail, null, `bad value ${next.fail} for next.fail, expected null`)
					assert.strictEqual(res.response.statusCode, 200, `bad value ${res.response.statusCode} for res.response.statusCode, expected 200`)
					const headersShouldBe = {
						'Access-Control-Allow-Origin': 'testAllowOrigins',
						'Access-Control-Allow-Headers': 'accept, accept-encoding, accept-language, authorization, connection, content-type, host, origin, referer, user-agent',
						Allow: 'OPTIONS, GET, POST, PUT, PATCH, DELETE'
					}
					let headers = res.headers
					for (const key in headers) {
						assert.strictEqual(headers[key], headersShouldBe[key], `bad value ${headers[key]} for headers[key], expected ${headersShouldBe[key]}`)
					}
					return true
				})
			})
			it('should execute successfully and set the access-control-related headers correctly if the request is not of type options', function() {
				return co(function*() {
					req.method = 'GET'
					delete res.headers['Access-Control-Allow-Origin']
					delete res.headers['Access-Control-Allow-Headers']
					delete res.headers.Allow
					next.fail = null
					moduleConfig.allowOrigins = 'testAllowOrigins'
					yield (new Promise((resolve, reject) => {
						res.end = res.endTemplate.bind(res, resolve)
						accessControlAllowOrigin()(req, res, next.bind(next, resolve))
					}))
					moduleConfig.allowOrigins = originalModuleConfig.allowOrigins
					assert.strictEqual(next.fail, false, `bad value ${next.fail} for next.fail, expected false`)
					const headersShouldBe = {
						'Access-Control-Allow-Origin': 'testAllowOrigins',
						'Access-Control-Allow-Headers': 'accept, accept-encoding, accept-language, authorization, connection, content-type, host, origin, referer, user-agent',
						Allow: 'OPTIONS, GET, POST, PUT, PATCH, DELETE'
					}
					let headers = res.headers
					for (const key in headers) {
						assert.strictEqual(headers[key], headersShouldBe[key], `bad value ${headers[key]} for headers[key], expected ${headersShouldBe[key]}`)
					}
					return true
				})
			})
		})
	},
	testChangeFieldCase: function(req, res, next) {
		const instance = this,
			changeFieldCase = this.changeFieldCase.bind(this)
		let fieldCaseMap = [{upper: 'Test1', lower: 'test1'}, {upper: 'Test2', lower: 'test2'}, {upper: 'Test3', lower: 'test3'}, {upper: 'Test4', lower: 'test4'}]
		describe('base-server.module.changeFieldCase', function() {
			it('should execute successfully and change the field case of keys in the query from upper to lower', function() {
				return co(function*() {
					req.query = {Test1: '1', Test2: '2', test3: '3', Test4: '4'}
					next.fail = null
					yield (new Promise((resolve, reject) => {
						res.end = res.endTemplate.bind(res, resolve)
						changeFieldCase('query', fieldCaseMap, 'lower')(req, res, next.bind(next, resolve))
					}))
					const query = req.query,
						queryShouldBe = {
							test1: '1',
							test2: '2',
							test3: '3',
							test4: '4'
						}
					assert.strictEqual(next.fail, false, `bad value ${next.fail} for next.fail, expected false`)
					for (const key in query) {
						assert.strictEqual(query[key], queryShouldBe[key], `bad value ${query[key]} for query[key], expected ${queryShouldBe[key]}`)
					}
					return true
				})
			})
			it('should execute successfully and change the field case of keys in the body from lower to upper', function() {
				return co(function*() {
					req.query = {test1: '1', test2: '2', Test3: '3', test4: '4'}
					next.fail = null
					yield (new Promise((resolve, reject) => {
						res.end = res.endTemplate.bind(res, resolve)
						changeFieldCase('query', fieldCaseMap, 'upper')(req, res, next.bind(next, resolve))
					}))
					const query = req.query,
						queryShouldBe = {
							Test1: '1',
							Test2: '2',
							Test3: '3',
							Test4: '4'
						}
					assert.strictEqual(next.fail, false, `bad value ${next.fail} for next.fail, expected false`)
					for (const key in query) {
						assert.strictEqual(query[key], queryShouldBe[key], `bad value ${query[key]} for query[${key}], expected ${queryShouldBe[key]}`)
					}
					return true
				})
			})
		})
	},
	testHandleNextAfterRoutes: function(req, res) {
		const instance = this,
			originalModuleConfig = JSON.parse(JSON.stringify(this.moduleConfig)),
			handleNextAfterRoutes = this.handleNextAfterRoutes.bind(this)
		let {moduleConfig} = this
		describe('base-server.module.handleNextAfterRoutes', function() {
			it('should execute successfully and return 404 and the correct error message if there\'s no error and notFoundRedirectRoutes is not set', function() {
				return co(function*() {
					delete req.locals.error
					delete moduleConfig.notFoundRedirectRoutes
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						handleNextAfterRoutes()(req, res)
					}))
					moduleConfig.notFoundRedirectRoutes = originalModuleConfig.notFoundRedirectRoutes
					assert.strictEqual(res.response.statusCode, 404, `bad value ${res.response.statusCode} for res.response.statusCode, expected 404`)
					assert.strictEqual(res.response.jsonBody.error, 'Not found.', `bad value ${res.response.jsonBody.error} for res.response.jsonBody.error, expected Not found.`)
					return true
				})
			})
			it('should execute successfully and return 404 and the correct error message if there\'s no error, only notFoundRedirectRoutes.default is set and the user is not authenticated', function() {
				return co(function*() {
					delete req.locals.error
					req.isAuthenticated = () => false
					moduleConfig.notFoundRedirectRoutes = {default: '/testRoute'}
					yield (new Promise((resolve, reject) => {
						res.redirect = res.redirectTemplate.bind(res, resolve)
						handleNextAfterRoutes()(req, res)
					}))
					delete req.isAuthenticated
					moduleConfig.notFoundRedirectRoutes = originalModuleConfig.notFoundRedirectRoutes
					assert.strictEqual(res.response.statusCode, 302, `bad value ${res.response.statusCode} for res.response.statusCode, expected 302`)
					assert.strictEqual(res.response.redirectRoute, '/testRoute', `bad value ${res.response.redirectRoute} for res.response.redirectRoute, expected /testRoute`)
					return true
				})
			})
			it('should execute successfully and return 404 and the correct error message if there\'s no error, only notFoundRedirectRoutes.default is set and the user is authenticated', function() {
				return co(function*() {
					delete req.locals.error
					req.isAuthenticated = () => true
					moduleConfig.notFoundRedirectRoutes = {default: '/testRoute'}
					yield (new Promise((resolve, reject) => {
						res.redirect = res.redirectTemplate.bind(res, resolve)
						handleNextAfterRoutes()(req, res)
					}))
					delete req.isAuthenticated
					moduleConfig.notFoundRedirectRoutes = originalModuleConfig.notFoundRedirectRoutes
					assert.strictEqual(res.response.statusCode, 302, `bad value ${res.response.statusCode} for res.response.statusCode, expected 302`)
					assert.strictEqual(res.response.redirectRoute, '/testRoute', `bad value ${res.response.redirectRoute} for res.response.redirectRoute, expected /testRoute`)
					return true
				})
			})
			it('should execute successfully and return 404 and the correct error message if there\'s no error, notFoundRedirectRoutes.authenticated is set and the user is authenticated', function() {
				return co(function*() {
					delete req.locals.error
					req.isAuthenticated = () => true
					moduleConfig.notFoundRedirectRoutes = {authenticated: '/authenticatedTestRoute', default: '/testRoute'}
					yield (new Promise((resolve, reject) => {
						res.redirect = res.redirectTemplate.bind(res, resolve)
						handleNextAfterRoutes()(req, res)
					}))
					delete req.isAuthenticated
					moduleConfig.notFoundRedirectRoutes = originalModuleConfig.notFoundRedirectRoutes
					assert.strictEqual(res.response.statusCode, 302, `bad value ${res.response.statusCode} for res.response.statusCode, expected 302`)
					assert.strictEqual(res.response.redirectRoute, '/authenticatedTestRoute', `bad value ${res.response.redirectRoute} for res.response.redirectRoute, expected /authenticatedTestRoute`)
					return true
				})
			})
		})
	}
}

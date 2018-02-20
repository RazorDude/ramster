const
	assert = require('assert'),
	co = require('co'),
	fs = require('fs-extra'),
	path = require('path'),
	moment = require('moment'),
	wrap = require('co-express')

module.exports = {
	testMe: function() {
		const instance = this
		let req = {
				locals: {
					moduleName: 'mobile',
					moduleType: 'client'
				},
				headers: {}
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
		this.componentName = 'users'
		this.dbComponent = this.module.db.components[this.componentName]
		describe('base-server.component', function() {
			it('should execute testDecodeQueryValues successfully', function() {
				instance.testDecodeQueryValues()
				assert(true)
			})
			it('should execute testSetRoutes successfully', function() {
				instance.testSetRoutes()
				assert(true)
			})
			it('should execute testAccessFilter successfully', function() {
				instance.testAccessFilter(req, res, next)
				assert(true)
			})
			it('should execute testCreate successfully', function() {
				instance.testCreate(req, res, next)
				assert(true)
			})
			it('should execute testRead successfully', function() {
				instance.testRead(req, res, next)
				assert(true)
			})
			it('should execute testReadList successfully', function() {
				instance.testReadList(req, res, next)
				assert(true)
			})
			it('should execute testReadSelectList successfully', function() {
				instance.testReadSelectList(req, res, next)
				assert(true)
			})
			it('should execute testBulkUpsert successfully', function() {
				instance.testBulkUpsert(req, res, next)
				assert(true)
			})
			it('should execute testDelete successfully', function() {
				instance.testDelete(req, res, next)
				assert(true)
			})
		})
	},
	testDecodeQueryValues: function() {
		const instance = this
		let {components} = this
		describe('base-server.component.decodeQueryValues', function() {
			it('should execute successfully and return null if the provided object is undefined', function() {
				assert(instance.decodeQueryValues() === null)
			})
			it('should execute successfully and return the provided item as-is, if it is null', function() {
				assert(instance.decodeQueryValues(null) === null)
			})
			it('should execute successfully and return the provided item as-is, if it is a string', function() {
				assert(instance.decodeQueryValues('test') === 'test')
			})
			it('should execute successfully and return the provided item as-is, if it is a number', function() {
				assert(instance.decodeQueryValues(12) === 12)
			})
			it('should execute successfully and return the provided item as-is, if it is a boolean', function() {
				assert(instance.decodeQueryValues(true) === true)
			})
			it('should execute successfully and return the decoded object', function() {
				let decodedObject = instance.decodeQueryValues({
					justAKey: 'testValue',
					[encodeURIComponent('AKey&ASpecialValue%')]: {
						12: true,
						a: encodeURIComponent('some%test&123=6059testValue'),
						b: [1, 2, 3, 4, encodeURIComponent('Te&s=%t')]
					}
				})
				// console.log(
				// 	decodedObject.justAKey === 'testValue',
				// 	typeof decodedObject['AKey&ASpecialValue%'] === 'object',
				// 	!(decodedObject['AKey&ASpecialValue%'] instanceof Array),
				// 	decodedObject['AKey&ASpecialValue%']['12'] === true,
				// 	decodedObject['AKey&ASpecialValue%'].a === 'some%test&123=6059testValue',
				// 	decodedObject['AKey&ASpecialValue%'].b instanceof Array,
				// 	decodedObject['AKey&ASpecialValue%'].b[0] === 1,
				// 	decodedObject['AKey&ASpecialValue%'].b[1] === 2,
				// 	decodedObject['AKey&ASpecialValue%'].b[2] === 3,
				// 	decodedObject['AKey&ASpecialValue%'].b[3] === 4,
				// 	decodedObject['AKey&ASpecialValue%'].b[4] === 'Te&s=%t'
				// )
				assert(
					(decodedObject.justAKey === 'testValue') &&
					(typeof decodedObject['AKey&ASpecialValue%'] === 'object') &&
					!(decodedObject['AKey&ASpecialValue%'] instanceof Array) &&
					(decodedObject['AKey&ASpecialValue%']['12'] === true) &&
					(decodedObject['AKey&ASpecialValue%'].a === 'some%test&123=6059testValue') &&
					(decodedObject['AKey&ASpecialValue%'].b instanceof Array) &&
					(decodedObject['AKey&ASpecialValue%'].b[0] === 1) &&
					(decodedObject['AKey&ASpecialValue%'].b[1] === 2) &&
					(decodedObject['AKey&ASpecialValue%'].b[2] === 3) &&
					(decodedObject['AKey&ASpecialValue%'].b[3] === 4) &&
					(decodedObject['AKey&ASpecialValue%'].b[4] === 'Te&s=%t')
				)
			})
		})
	},
	testSetRoutes: function() {
		const instance = this
		let changeableInstance = this
		describe('base-server.component.setRoutes', function() {
			it('should execute successfully and set this.routes to an empty array if no routes are provided', function() {
				delete changeableInstance.routes
				instance.setRoutes({})
				assert((instance.routes instanceof Array) && !instance.routes.length)
			})
			it('should throw an error with the correct message if a route method is not valid', function() {
				delete changeableInstance.routes
				let routes = [
						{method: 'getty', path: '/test0', func: 'func0'}
					],
					didThrowAnError = false
				try {
					instance.setRoutes({routes})
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid HTTP method "getty" for route "/test0" in component "users".')
				}
				assert(didThrowAnError)
			})
			it('should throw an error with the correct message if a route func does not exist in the component', function() {
				delete changeableInstance.routes
				let routes = [
						{method: 'get', path: '/test0', func: 'func0'}
					],
					didThrowAnError = false
				try {
					instance.setRoutes({routes})
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Method "func0" (GET route to "/test0") does not exist in component "users".')
				}
				assert(didThrowAnError)
			})
			it('should throw an error with the correct message if an additionalDefaultRoute method is invalid', function() {
				delete changeableInstance.routes
				let didThrowAnError = false
				try {
					instance.setRoutes({
						addDefaultRoutes: [],
						additionalDefaultRoutes: {
							additionalDefaultRoute1: {method: 'posty', path: '/additionalDefaultRoute1', func: 'additionalDefaultRouteFunc1'}
						}
					})
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid HTTP method "posty" for route "/additionalDefaultRoute1" in component "users".')
				}
				assert(didThrowAnError)
			})
			it('should throw an error with the correct message if an additionalDefaultRoute func does not exist in the component', function() {
				delete changeableInstance.routes
				let didThrowAnError = false
				try {
					instance.setRoutes({
						addDefaultRoutes: [],
						additionalDefaultRoutes: {
							additionalDefaultRoute1: {method: 'post', path: '/additionalDefaultRoute1', func: 'additionalDefaultRouteFunc1'}
						}
					})
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Method "additionalDefaultRouteFunc1" (POST route to "/additionalDefaultRoute1") does not exist in component "users".')
				}
				assert(didThrowAnError)
			})
			it('should execute successfully and set the routes as provided if no other options are passed, all parameters are correct and appendComponentNameToRoutes is not set', function() {
				delete changeableInstance.routes
				changeableInstance.func0 = () => {}
				changeableInstance.func1 = () => {}
				changeableInstance.func2 = () => {}
				changeableInstance.func3 = () => {}
				changeableInstance.func4 = () => {}
				let routes = [
						{method: 'get', path: '/test0', func: 'func0'},
						{method: 'post', path: '/test1', func: 'func1'},
						{method: 'put', path: '/test2', func: 'func2'},
						{method: 'patch', path: '/test3', func: 'func3'},
						{method: 'delete', path: '/test4', func: 'func4'}
					],
					dataIsGood = true
				instance.setRoutes({routes})
				for (const i in routes) {
					const processedRoute = instance.routes[i],
						route = routes[i]
					for (const key in route) {
						if (route[key] !== processedRoute[key]) {
							console.log(`Bad value "${processedRoute[key]}" for key "${key}" in route path "${route.path}" (index ${i}), component "users"`)
							dataIsGood = false
							break
						}
					}
				}
				assert(dataIsGood)
			})
			it('should execute successfully, set the provided routes and the specified default routes, if all paramteres are correct and appendComponentNameToRoutes is not set', function() {
				delete changeableInstance.routes
				changeableInstance.func0 = () => {}
				changeableInstance.func1 = () => {}
				changeableInstance.func2 = () => {}
				changeableInstance.func3 = () => {}
				changeableInstance.func4 = () => {}
				changeableInstance.additionalDefaultRouteFunc1 = () => {}
				changeableInstance.additionalDefaultRouteFunc2 = () => {}
				let routes = [
						{method: 'get', path: '/test0', func: 'func0'},
						{method: 'post', path: '/test1', func: 'func1'},
						{method: 'put', path: '/test2', func: 'func2'},
						{method: 'patch', path: '/test3', func: 'func3'},
						{method: 'delete', path: '/test4', func: 'func4'}
					],
					defaultRoutesShouldBe = [
						{method: 'post', path: '/users', func: 'create'},
						{method: 'get', path: '/users/item', func: 'read'},
						{method: 'get', path: '/users', func: 'readList'},
						{method: 'put', path: '/users', func: 'bulkUpsert'},
						{method: 'get', path: '/users/checkImportFile', func: 'checkImportFile'},
						{method: 'post', path: '/users/importFile', func: 'importFile'},
						{method: 'delete', path: '/users/:id', func: 'delete'},
						{method: 'post', path: '/users/additionalDefaultRoute1', func: 'additionalDefaultRouteFunc1'},
						{method: 'patch', path: '/users/additionalDefaultRoute2', func: 'additionalDefaultRouteFunc2'}
					]
					dataIsGood = true
				instance.setRoutes({
					addDefaultRoutes: [
						'create',
						'read',
						'readList',
						'fakeRouteThatShouldBeSkipped',
						'bulkUpsert',
						'checkImportFile',
						'fakeRouteThatShouldBeSkipped',
						'importFile',
						'delete',
						'additionalDefaultRoute1',
						'additionalDefaultRoute2'
					],
					additionalDefaultRoutes: {
						additionalDefaultRoute1: {method: 'post', path: '/additionalDefaultRoute1', func: 'additionalDefaultRouteFunc1'},
						additionalDefaultRoute2: {method: 'patch', path: '/additionalDefaultRoute2', func: 'additionalDefaultRouteFunc2'}
					},
					routes
				})
				for (let i = 0; i < 5; i++) {
					const processedRoute = instance.routes[i],
						route = routes[i]
					for (const key in route) {
						if (route[key] !== processedRoute[key]) {
							console.log(`Bad value "${processedRoute[key]}" for key "${key}" in route path "${route.path}" (index ${i}), component "users".`)
							dataIsGood = false
							break
						}
					}
				}
				if (dataIsGood) {
					let length = instance.routes.length
					for (let i = 5; i < length; i++) {
						const processedRoute = instance.routes[i],
							route = defaultRoutesShouldBe[i - 5]
						for (const key in route) {
							if (route[key] !== processedRoute[key]) {
								console.log(`Bad value "${processedRoute[key]}" for key "${key}" in route path "${route.path}" (index ${i}), component "users".`)
								dataIsGood = false
								break
							}
						}
						if (!dataIsGood) {
							break
						}
					}
					if (dataIsGood) {
						for (const i in instance.addedDefaultRoutes) {
							const processedRoute = instance.addedDefaultRoutes[i],
								route = defaultRoutesShouldBe[i]
							for (const key in route) {
								if (route[key] !== processedRoute[key]) {
									console.log(`Bad value "${processedRoute[key]}" for key "${key}" in route path "${route.path}" (index ${i}), component "users".`)
									dataIsGood = false
									break
								}
							}
							if (!dataIsGood) {
								break
							}
						}
					}
				}
				assert(dataIsGood)
			})
			it('should execute successfully, set the provided routes and the specified default routes, if all paramteres are correct and appendComponentNameToRoutes is set to true', function() {
				delete changeableInstance.routes
				changeableInstance.func0 = () => {}
				changeableInstance.func1 = () => {}
				changeableInstance.func2 = () => {}
				changeableInstance.func3 = () => {}
				changeableInstance.func4 = () => {}
				changeableInstance.additionalDefaultRouteFunc1 = () => {}
				changeableInstance.additionalDefaultRouteFunc2 = () => {}
				let routes = [
						{method: 'get', path: '/test0', func: 'func0'},
						{method: 'post', path: '/test1', func: 'func1'},
						{method: 'put', path: '/test2', func: 'func2'},
						{method: 'patch', path: '/test3', func: 'func3'},
						{method: 'delete', path: '/test4', func: 'func4'}
					],
					defaultRoutesShouldBe = [
						{method: 'post', path: '/users', func: 'create'},
						{method: 'get', path: '/users/item', func: 'read'},
						{method: 'get', path: '/users', func: 'readList'},
						{method: 'put', path: '/users', func: 'bulkUpsert'},
						{method: 'get', path: '/users/checkImportFile', func: 'checkImportFile'},
						{method: 'post', path: '/users/importFile', func: 'importFile'},
						{method: 'delete', path: '/users/:id', func: 'delete'},
						{method: 'post', path: '/users/additionalDefaultRoute1', func: 'additionalDefaultRouteFunc1'},
						{method: 'patch', path: '/users/additionalDefaultRoute2', func: 'additionalDefaultRouteFunc2'}
					]
					dataIsGood = true
				instance.setRoutes({
					addDefaultRoutes: [
						'create',
						'read',
						'readList',
						'fakeRouteThatShouldBeSkipped',
						'bulkUpsert',
						'checkImportFile',
						'fakeRouteThatShouldBeSkipped',
						'importFile',
						'delete',
						'additionalDefaultRoute1',
						'additionalDefaultRoute2'
					],
					additionalDefaultRoutes: {
						additionalDefaultRoute1: {method: 'post', path: '/additionalDefaultRoute1', func: 'additionalDefaultRouteFunc1'},
						additionalDefaultRoute2: {method: 'patch', path: '/additionalDefaultRoute2', func: 'additionalDefaultRouteFunc2'}
					},
					appendComponentNameToRoutes: true,
					routes
				})
				for (let i = 0; i < 5; i++) {
					const processedRoute = instance.routes[i],
						route = routes[i]
					route.path = `/users${route.path}`
					for (const key in route) {
						if (route[key] !== processedRoute[key]) {
							console.log(`Bad value "${processedRoute[key]}" for key "${key}" in route path "${route.path}" (index ${i}), component "users".`)
							dataIsGood = false
							break
						}
					}
				}
				if (dataIsGood) {
					let length = instance.routes.length
					for (let i = 5; i < length; i++) {
						const processedRoute = instance.routes[i],
							route = defaultRoutesShouldBe[i - 5]
						for (const key in route) {
							if (route[key] !== processedRoute[key]) {
								console.log(`Bad value "${processedRoute[key]}" for key "${key}" in route path "${route.path}" (index ${i}), component "users".`)
								dataIsGood = false
								break
							}
						}
					}
					if (dataIsGood) {
						for (const i in instance.addedDefaultRoutes) {
							const processedRoute = instance.addedDefaultRoutes[i],
								route = defaultRoutesShouldBe[i]
							for (const key in route) {
								if (route[key] !== processedRoute[key]) {
									console.log(`Bad value "${processedRoute[key]}" for key "${key}" in route path "${route.path}" (index ${i}), component "users".`)
									dataIsGood = false
									break
								}
							}
						}
					}
				}
				assert(dataIsGood)
			})
		})
	},
	testAccessFilter: function(req, res, next) {
		const instance = this
		let changeableInstance = this
		describe('base-server.component.accessFilter', function() {
			it('should throw an error with the correct message if req.user is not a non-null object', function() {
				return co(function*() {
					req.user = null
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter())(req, res, next.bind(next, resolve))
					}))
					assert(
						(req.locals.error.status === 401) &&
						(req.locals.error.customMessage === 'Unauthorized.')
					)
					return true
				})
			})
			it('should throw an error with the correct message if req.user.type is not a non-null object', function() {
				return co(function*() {
					req.user = {}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter())(req, res, next.bind(next, resolve))
					}))
					assert(
						(req.locals.error.status === 401) &&
						(req.locals.error.customMessage === 'Unauthorized.')
					)
					return true
				})
			})
			it('should throw an error with the correct message if req.user.type.accessPoints is not an array', function() {
				return co(function*() {
					req.user = {type: {}}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter())(req, res, next.bind(next, resolve))
					}))
					assert(
						(req.locals.error.status === 401) &&
						(req.locals.error.customMessage === 'Unauthorized.')
					)
					return true
				})
			})
			it('should throw an error with the correct message if the user does not have access to the method', function() {
				return co(function*() {
					req.user = {type: {accessPoints: [{id: 1}]}}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [2], next: () => {}}))(req, res, next.bind(next, resolve))
					}))
					assert(
						(req.locals.error.status === 401) &&
						(req.locals.error.customMessage === 'Unauthorized.')
					)
					return true
				})
			})
			it('should throw an error with the correct message if the user has access to less than all access points and requireAllAPs is set to true', function() {
				return co(function*() {
					req.user = {type: {accessPoints: [{id: 1}]}}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1, 2], next: () => {}, requireAllAPs: true}))(req, res, next.bind(next, resolve))
					}))
					assert(
						(req.locals.error.status === 401) &&
						(req.locals.error.customMessage === 'Unauthorized.')
					)
					return true
				})
			})
			it('should executeSuccessfully if the user has access to the route and requireAllAPs is set to false', function() {
				return co(function*() {
					req.user = {type: {accessPoints: [{id: 1}]}}
					let result = yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1, 2], next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert(result.success === true)
					return true
				})
			})
			it('should executeSuccessfully if the user has access to the route and requireAllAPs is set to true', function() {
				return co(function*() {
					req.user = {type: {accessPoints: [{id: 1}, {id: 2}]}}
					let result = yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1, 2], next: function*(){resolve({success: true})}, requireAllAPs: true}))(req, res, next.bind(next, resolve))
					}))
					assert(result.success === true)
					return true
				})
			})
		})
	},
	testCreate: function(req, res, next) {
		const instance = this,
			db = instance.module.db,
			dbComponents = db.components
		let changeableInstance = this
		describe('base-server.component.create', function() {
			it('should execute successfully and return the newly created object if all paramteres are correct', function() {
				return co(function*() {
					yield dbComponents.userTypes.create({name: 'type1', description: 'description1', status: true})
					delete req.locals.error
					req.user = {id: 1}
					req.body = {typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', password: '1234', status: true}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.create())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let result = res.response.jsonBody.result,
						item = {id:2, typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', status: true},
						dataIsGood = true
					for (const key in item) {
						if (result[key] !== item[key]) {
							console.log(`Bad value '${result[key]}' for field "${key}".`)
							dataIsGood = false
							break
						}
					}
					assert(dataIsGood)
					return true
				})
			})
			it('should clean up users and userTypes after it finishes testing', function() {
				return co(function*() {
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
					assert(true)
					return true
				})
			})
		})
	},
	testRead: function(req, res, next) {
		const instance = this,
			db = instance.module.db,
			dbComponents = db.components
		let changeableInstance = this
		describe('base-server.component.read', function() {
			it('should execute successfully and return the found object if all paramteres are correct', function() {
				return co(function*() {
					yield dbComponents.userTypes.create({name: 'type1', description: 'description1', status: true})
					yield dbComponents.users.create({typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', password: '1234', status: true})
					delete req.locals.error
					req.query = {filters: {id: 2}}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.read())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let result = res.response.jsonBody.result,
						item = {id:2, typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', status: true},
						dataIsGood = true
					for (const key in item) {
						if (result[key] !== item[key]) {
							console.log(`Bad value '${result[key]}' for field "${key}".`)
							dataIsGood = false
							break
						}
					}
					assert(dataIsGood)
					return true
				})
			})
			it('should clean up users and userTypes after it finishes testing', function() {
				return co(function*() {
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
					assert(true)
					return true
				})
			})
		})
	},
	testReadList: function(req, res, next) {
		const instance = this,
			db = instance.module.db,
			dbComponents = db.components
		let changeableInstance = this
		describe('base-server.component.readList', function() {
			it('should execute successfully and return the found object if all paramteres are correct', function() {
				return co(function*() {
					yield dbComponents.userTypes.create({name: 'type1', description: 'description1', status: true})
					yield dbComponents.users.create({typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', password: '1234', status: true})
					delete req.locals.error
					req.query = {filters: {id: 2}}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.readList())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let returnedData = res.response.jsonBody,
						result = returnedData.results[0],
						item = {id:2, typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', status: true},
						dataIsGood = true
					for (const key in item) {
						if (result[key] !== item[key]) {
							console.log(`Bad value '${result[key]}' for field "${key}".`)
							dataIsGood = false
							break
						}
					}
					assert(
						dataIsGood &&
						(returnedData.results.length === 1) &&
						(returnedData.page === 1) &&
						(returnedData.perPage === 10) &&
						(returnedData.totalPages === 1) &&
						(returnedData.more === false)
					)
					return true
				})
			})
			it('should clean up users and userTypes after it finishes testing', function() {
				return co(function*() {
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
					assert(true)
					return true
				})
			})
		})
	},
	testReadSelectList: function(req, res, next) {
		const instance = this,
			db = instance.module.db,
			dbComponents = db.components
		let changeableInstance = this
		describe('base-server.component.readSelectList', function() {
			it('should throw an error with the correct message if no filters are provided is not a non-null object', function() {
				return co(function*() {
					req.query = {}
					yield (new Promise((resolve, reject) => {
						wrap(instance.readSelectList())(req, res, next.bind(next, resolve))
					}))
					assert((req.locals.error.customMessage === 'No filters provided.'))
					return true
				})
			})
			it('should execute successfully and return the list if only titleField and filters are provided', function() {
				return co(function*() {
					yield dbComponents.userTypes.create({name: 'type1', description: 'description1', status: true})
					yield dbComponents.users.bulkCreate([
						{typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', password: '1234', status: true},
						{typeId: 2, firstName: 'fn2', lastName: 'ln2', email: 'email2@ramster.com', password: '1234', status: true},
						{typeId: 2, firstName: 'fn3', lastName: 'ln3', email: 'email3@ramster.com', password: '1234', status: true}
					])
					delete req.locals.error
					req.query = {titleField: 'firstName', filters: {id: {$gt: 0}}}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.readSelectList())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let results = res.response.jsonBody,
						resultsShouldBe = [
							{value: 2, text: 'fn1'},
							{value: 3, text: 'fn2'},
							{value: 4, text: 'fn3'}
						],
						dataIsGood = true
					for (const i in resultsShouldBe) {
						const sbItem = resultsShouldBe[i],
							item = results[i]
						for (const key in sbItem) {
							if (sbItem[key] !== item[key]) {
								console.log(`Bad value '${item[key]}' for field "${key}" in item index ${i}.`)
								dataIsGood = false
								break
							}
						}
						if (!dataIsGood) {
							break
						}
					}
					assert(dataIsGood)
					return true
				})
			})
			it('should execute successfully and return the list if titleField, prependString, appendString and filters are provided', function() {
				return co(function*() {
					delete req.locals.error
					req.query = {titleField: 'firstName', prependString: 'prefix', appendString: 'suffix', filters: {id: {$gt: 0}}}
					yield (new Promise((resolve, reject) => {
							res.json = res.jsonTemplate.bind(res, resolve)
							wrap(instance.readSelectList())(req, res, next.bind(next, resolve))
						}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let results = res.response.jsonBody,
						resultsShouldBe = [
							{value: 2, text: 'prefixfn1suffix'},
							{value: 3, text: 'prefixfn2suffix'},
							{value: 4, text: 'prefixfn3suffix'}
						],
						dataIsGood = true
					for (const i in resultsShouldBe) {
						const sbItem = resultsShouldBe[i],
							item = results[i]
						for (const key in sbItem) {
							if (sbItem[key] !== item[key]) {
								console.log(`Bad value '${item[key]}' for field "${key}" in item index ${i}.`)
								dataIsGood = false
								break
							}
						}
						if (!dataIsGood) {
							break
						}
					}
					assert(dataIsGood)
					return true
				})
			})
			it('should execute successfully and return the list if titleFields, prependString, appendString and filters are provided', function() {
				return co(function*() {
					delete req.locals.error
					req.query = {titleFields: ['firstName', 'lastName'], prependString: 'prefix', appendString: ' suffix', filters: {id: {$gt: 0}}}
					yield (new Promise((resolve, reject) => {
							res.json = res.jsonTemplate.bind(res, resolve)
							wrap(instance.readSelectList())(req, res, next.bind(next, resolve))
						}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let results = res.response.jsonBody,
						resultsShouldBe = [
							{value: 2, text: 'prefixfn1 ln1 suffix'},
							{value: 3, text: 'prefixfn2 ln2 suffix'},
							{value: 4, text: 'prefixfn3 ln3 suffix'}
						],
						dataIsGood = true
					for (const i in resultsShouldBe) {
						const sbItem = resultsShouldBe[i],
							item = results[i]
						for (const key in sbItem) {
							if (sbItem[key] !== item[key]) {
								console.log(`Bad value '${item[key]}' for field "${key}" in item index ${i}.`)
								dataIsGood = false
								break
							}
						}
						if (!dataIsGood) {
							break
						}
					}
					assert(dataIsGood)
					return true
				})
			})
			it('should execute successfully and return the list if titleFields, prependString, appendString and filters are provided', function() {
				return co(function*() {
					delete req.locals.error
					req.query = {titleFields: ['firstName', 'lastName'], prependString: 'prefix', appendString: ' suffix', filters: {id: {$gt: 0}}}
					yield (new Promise((resolve, reject) => {
							res.json = res.jsonTemplate.bind(res, resolve)
							wrap(instance.readSelectList())(req, res, next.bind(next, resolve))
						}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let results = res.response.jsonBody,
						resultsShouldBe = [
							{value: 2, text: 'prefixfn1 ln1 suffix'},
							{value: 3, text: 'prefixfn2 ln2 suffix'},
							{value: 4, text: 'prefixfn3 ln3 suffix'}
						],
						dataIsGood = true
					for (const i in resultsShouldBe) {
						const sbItem = resultsShouldBe[i],
							item = results[i]
						for (const key in sbItem) {
							if (sbItem[key] !== item[key]) {
								console.log(`Bad value '${item[key]}' for field "${key}" in item index ${i}.`)
								dataIsGood = false
								break
							}
						}
						if (!dataIsGood) {
							break
						}
					}
					assert(dataIsGood)
					return true
				})
			})
			it('should execute successfully and return the list if titleFields, prependString, appendString, orderBy and filters are provided', function() {
				return co(function*() {
					delete req.locals.error
					req.query = {titleFields: ['firstName', 'lastName'], prependString: 'prefix', appendString: ' suffix', orderBy: 'id', filters: {id: {$gt: 0}}}
					yield (new Promise((resolve, reject) => {
							res.json = res.jsonTemplate.bind(res, resolve)
							wrap(instance.readSelectList())(req, res, next.bind(next, resolve))
						}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let results = res.response.jsonBody,
						resultsShouldBe = [
							{value: 2, text: 'prefixfn1 ln1 suffix'},
							{value: 3, text: 'prefixfn2 ln2 suffix'},
							{value: 4, text: 'prefixfn3 ln3 suffix'}
						],
						dataIsGood = true
					for (const i in resultsShouldBe) {
						const sbItem = resultsShouldBe[i],
							item = results[i]
						for (const key in sbItem) {
							if (sbItem[key] !== item[key]) {
								console.log(`Bad value '${item[key]}' for field "${key}" in item index ${i}.`)
								dataIsGood = false
								break
							}
						}
						if (!dataIsGood) {
							break
						}
					}
					assert(dataIsGood)
					return true
				})
			})
			it('should execute successfully and return the list if titleFields, prependString, appendString, orderBy, orderDirection and filters are provided', function() {
				return co(function*() {
					delete req.locals.error
					req.query = {titleFields: ['firstName', 'lastName'], prependString: 'prefix', appendString: ' suffix', orderBy: 'id', orderDirection: 'desc', filters: {id: {$gt: 0}}}
					yield (new Promise((resolve, reject) => {
							res.json = res.jsonTemplate.bind(res, resolve)
							wrap(instance.readSelectList())(req, res, next.bind(next, resolve))
						}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let results = res.response.jsonBody,
						resultsShouldBe = [
							{value: 4, text: 'prefixfn3 ln3 suffix'},
							{value: 3, text: 'prefixfn2 ln2 suffix'},
							{value: 2, text: 'prefixfn1 ln1 suffix'}
						],
						dataIsGood = true
					for (const i in resultsShouldBe) {
						const sbItem = resultsShouldBe[i],
							item = results[i]
						for (const key in sbItem) {
							if (sbItem[key] !== item[key]) {
								console.log(`Bad value '${item[key]}' for field "${key}" in item index ${i}.`)
								dataIsGood = false
								break
							}
						}
						if (!dataIsGood) {
							break
						}
					}
					assert(dataIsGood)
					return true
				})
			})
			it('should execute successfully and return the list if titleFields, prependString, appendString, concatenateWith and filters are provided', function() {
				return co(function*() {
					delete req.locals.error
					req.query = {titleFields: ['firstName', 'lastName'], prependString: 'prefix', appendString: ', suffix', concatenateWith: ', ', filters: {id: {$gt: 0}}}
					yield (new Promise((resolve, reject) => {
							res.json = res.jsonTemplate.bind(res, resolve)
							wrap(instance.readSelectList())(req, res, next.bind(next, resolve))
						}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let results = res.response.jsonBody,
						resultsShouldBe = [
							{value: 2, text: 'prefixfn1, ln1, suffix'},
							{value: 3, text: 'prefixfn2, ln2, suffix'},
							{value: 4, text: 'prefixfn3, ln3, suffix'}
						],
						dataIsGood = true
					for (const i in resultsShouldBe) {
						const sbItem = resultsShouldBe[i],
							item = results[i]
						for (const key in sbItem) {
							if (sbItem[key] !== item[key]) {
								console.log(`Bad value '${item[key]}' for field "${key}" in item index ${i}.`)
								dataIsGood = false
								break
							}
						}
						if (!dataIsGood) {
							break
						}
					}
					assert(dataIsGood)
					return true
				})
			})
			it('should execute successfully and return the list if titleFields, processTitleFields, prependString, appendString, concatenateWith and filters are provided', function() {
				return co(function*() {
					delete req.locals.error
					req.query = {titleFields: ['firstName', 'lastName'], processTitleFields: ['yesNo', null], prependString: 'prefix ', appendString: ', suffix', concatenateWith: ', ', filters: {id: {$gt: 0}}}
					yield (new Promise((resolve, reject) => {
							res.json = res.jsonTemplate.bind(res, resolve)
							wrap(instance.readSelectList())(req, res, next.bind(next, resolve))
						}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let results = res.response.jsonBody,
						resultsShouldBe = [
							{value: 2, text: 'prefix Yes, ln1, suffix'},
							{value: 3, text: 'prefix Yes, ln2, suffix'},
							{value: 4, text: 'prefix Yes, ln3, suffix'}
						],
						dataIsGood = true
					for (const i in resultsShouldBe) {
						const sbItem = resultsShouldBe[i],
							item = results[i]
						for (const key in sbItem) {
							if (sbItem[key] !== item[key]) {
								console.log(`Bad value '${item[key]}' for field "${key}" in item index ${i}.`)
								dataIsGood = false
								break
							}
						}
						if (!dataIsGood) {
							break
						}
					}
					assert(dataIsGood)
					return true
				})
			})
			it('should clean up users and userTypes after it finishes testing', function() {
				return co(function*() {
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
					assert(true)
					return true
				})
			})
		})
	},
	testBulkUpsert: function(req, res, next) {
		const instance = this,
			{dbComponent, module} = this,
			db = module.db,
			dbComponents = db.components
		let changeableInstance = this
		describe('base-server.component.bulkUpsert', function() {
			it('should execute successfully, pass the request data on to dbComponent.update and return the update result if all paramteres are correct and where is present in req.body', function() {
				return co(function*() {
					yield dbComponents.userTypes.create({name: 'type1', description: 'description1', status: true})
					yield dbComponent.create({typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', password: '1234', status: true})
					delete req.locals.error
					req.user = {id: 1}
					req.body = {
						dbObject: {firstName: 'updatedFirstName1', status: false},
						where: {id: 2}
					}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.bulkUpsert())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let result = res.response.jsonBody,
						resultItem = result[1][0],
						item = {id: 2, typeId: 2, firstName: 'updatedFirstName1', lastName: 'ln1', email: 'email1@ramster.com', status: false},
						dataIsGood = true
					for (const key in item) {
						if (resultItem[key] !== item[key]) {
							console.log(`Bad value '${resultItem[key]}' for field "${key}".`)
							dataIsGood = false
							break
						}
					}
					assert(dataIsGood && (result.length === 2) && (result[1].length === 1))
					return true
				})
			})
			it('should execute successfully, pass the request data on to dbComponent.bulkUpsert, return the {success: true} and create and update the provided items if all paramteres are correct and an array is present in req.body', function() {
				return co(function*() {
					delete req.locals.error
					req.user = {id: 1}
					req.body = [
						{id: 2, firstName: 'properlyUpdatedFirstName1', status: true},
						{typeId: 2, firstName: 'fn2', lastName: 'ln2', email: 'email2@ramster.com', password: '1234', status: true}
					]
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.bulkUpsert())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let result = res.response.jsonBody,
						resultItems = yield dbComponent.model.findAll({order: [['id', 'asc']]}),
						items = [
							{id: 2, typeId: 2, firstName: 'properlyUpdatedFirstName1', lastName: 'ln1', email: 'email1@ramster.com', status: true},
							{id: 3, typeId: 2, firstName: 'fn2', lastName: 'ln2', email: 'email2@ramster.com', status: true}
						],
						dataIsGood = true
					for (const i in items) {
						const item = items[i],
							resultItem = resultItems[i].dataValues
						for (const key in item) {
							if (resultItem[key] !== item[key]) {
								console.log(`Bad value '${resultItem[key]}' for field "${key}" in item no. ${i}.`)
								dataIsGood = false
								break
							}
						}
						if (!dataIsGood) {
							break
						}
					}
					assert(dataIsGood && (result.success === true))
					return true
				})
			})
			it('should clean up users and userTypes after it finishes testing', function() {
				return co(function*() {
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
					assert(true)
					return true
				})
			})
		})
	},
	testDelete: function(req, res, next) {
		const instance = this,
			{dbComponent, module} = this,
			db = module.db,
			dbComponents = db.components
		let changeableInstance = this
		describe('base-server.component.delete', function() {
			it('should execute successfully and return {success: true} if all parameters are correct', function() {
				return co(function*() {
					yield dbComponents.userTypes.create({name: 'type1', description: 'description1', status: true})
					yield dbComponent.create({typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', password: '1234', status: true})
					delete req.locals.error
					req.user = {id: 1}
					delete req.body
					req.params = {id: 2}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.delete())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let result = res.response.jsonBody,
						resultItem = yield dbComponent.model.findOne({where: {id: 2}}),
						dataIsGood = true
					assert((resultItem === null) && (result.success === true))
					return true
				})
			})
			it('should clean up users and userTypes after it finishes testing', function() {
				return co(function*() {
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
					assert(true)
					return true
				})
			})
		})
	}
}

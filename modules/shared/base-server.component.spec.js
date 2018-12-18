const
	assert = require('assert'),
	co = require('co'),
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
			})
			it('should execute testSetRoutes successfully', function() {
				instance.testSetRoutes()
			})
			it('should execute testAccessFilter successfully', function() {
				instance.testAccessFilter(req, res, next)
			})
			it('should execute testCreate successfully', function() {
				instance.testCreate(req, res, next)
			})
			it('should execute testRead successfully', function() {
				instance.testRead(req, res, next)
			})
			it('should execute testReadList successfully', function() {
				instance.testReadList(req, res, next)
			})
			it('should execute testReadSelectList successfully', function() {
				instance.testReadSelectList(req, res, next)
			})
			it('should execute testBulkUpsert successfully', function() {
				instance.testBulkUpsert(req, res, next)
			})
			it('should execute testDelete successfully', function() {
				instance.testDelete(req, res, next)
			})
		})
	},
	testDecodeQueryValues: function() {
		const instance = this
		describe('base-server.component.decodeQueryValues', function() {
			it('should execute successfully and return null if the provided object is undefined', function() {
				let result = instance.decodeQueryValues()
				assert.strictEqual(result, null, `bad value ${result} for result, expected null`)
			})
			it('should execute successfully and return the provided item as-is, if it is null', function() {
				let result = instance.decodeQueryValues(null)
				assert.strictEqual(result, null, `bad value ${result} for result, expected null`)
			})
			it('should execute successfully and return the provided item as-is, if it is a string', function() {
				let result = instance.decodeQueryValues('test')
				assert.strictEqual(result, 'test', `bad value ${result} for result, expected test`)
			})
			it('should execute successfully and return the provided item as-is, if it is a number', function() {
				let result = instance.decodeQueryValues(12)
				assert.strictEqual(result, 12, `bad value ${result} for result, expected 12`)
			})
			it('should execute successfully and return the provided item as-is, if it is a boolean', function() {
				let result = instance.decodeQueryValues(true)
				assert.strictEqual(result, true, `bad value ${result} for result, expected true`)
			})
			it('should execute successfully and return the decoded object', function() {
				let decodedObject = instance.decodeQueryValues({
						justAKey: 'testValue',
						[encodeURIComponent('AKey&ASpecialValue%')]: {
							12: true,
							a: encodeURIComponent('some%test&123=6059testValue'),
							b: [1, 2, 3, 4, encodeURIComponent('Te&s=%t')]
						}
					}),
					innerObject = decodedObject['AKey&ASpecialValue%'],
					innerObjectB = innerObject.b,
					innerObjectBValuesShouldBe = [1, 2, 3, 4, 'Te&s=%t']
				assert.strictEqual(decodedObject.justAKey, 'testValue', `bad value ${decodedObject.justAKey} for decodedObject.justAKey, expected testValue`)
				assert.strictEqual(typeof innerObject, 'object', `bad value ${typeof innerObject} for typeof innerObject, expected object`)
				assert.strictEqual(innerObject instanceof Array, false, `bad value ${innerObject instanceof Array} for innerObject instanceof Array, expected false`)
				assert.strictEqual(innerObject.a, 'some%test&123=6059testValue', `bad value ${innerObject.a} for innerObject.a, expected some%test&123=6059testValue`)
				assert.strictEqual(innerObjectB instanceof Array, true, `bad value ${innerObjectB instanceof Array} for innerObjectB instanceof Array, expected true`)
				for (const i in innerObjectB) {
					const isValue = innerObjectB[i],
						sbValue = innerObjectBValuesShouldBe[i]
					assert.strictEqual(isValue, sbValue, `bad value ${isValue} for innerObjectB[${i}], expected ${sbValue}`)
				}
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
				let isArray = instance.routes instanceof Array
				assert.strictEqual(isArray, true, `bad value ${isArray} for isArray, expected true`)
				assert.strictEqual(instance.routes.length, 0, `bad value ${instance.routes.length} for instance.routes.length, expected 0`)
			})
			it('should throw an error with the correct message and status if a route method is not valid', function() {
				delete changeableInstance.routes
				let routes = [
						{method: 'getty', path: '/test0', func: 'func0'}
					],
					didThrowAnError = false
				try {
					instance.setRoutes({routes})
				} catch(e) {
					if (e && (e.customMessage === 'Invalid HTTP method "getty" for route "/test0" in component "users".')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
					if (e && (e.customMessage === 'Method "func0" (GET route to "/test0") does not exist in component "users".')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
					if (e && (e.customMessage === 'Invalid HTTP method "posty" for route "/additionalDefaultRoute1" in component "users".')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
					if (e && (e.customMessage === 'Method "additionalDefaultRouteFunc1" (POST route to "/additionalDefaultRoute1") does not exist in component "users".')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
				]
				instance.setRoutes({routes})
				for (const i in routes) {
					const processedRoute = instance.routes[i],
						route = routes[i]
					for (const key in route) {
						assert.strictEqual(
							processedRoute[key],
							route[key],
							`Bad value "${processedRoute[key]}" for key "${key}" in route path "${route.path}", index ${i}, component "users", expected ${route[key]}`
						)
					}
				}
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
						assert.strictEqual(
							processedRoute[key],
							route[key],
							`Bad value "${processedRoute[key]}" for key "${key}" in route path "${route.path}", index ${i}, component "users", expected ${route[key]}`
						)
					}
				}
				let length = instance.routes.length
				for (let i = 5; i < length; i++) {
					const processedRoute = instance.routes[i],
						route = defaultRoutesShouldBe[i - 5]
					for (const key in route) {
						assert.strictEqual(
							processedRoute[key],
							route[key],
							`Bad value "${processedRoute[key]}" for key "${key}" in route path "${route.path}", index ${i}, component "users", expected ${route[key]}`
						)
					}
				}
				for (const i in instance.addedDefaultRoutes) {
					const processedRoute = instance.addedDefaultRoutes[i],
						route = defaultRoutesShouldBe[i]
					for (const key in route) {
						assert.strictEqual(
							processedRoute[key],
							route[key],
							`Bad value "${processedRoute[key]}" for key "${key}" in route path "${route.path}", index ${i}, component "users", expected ${route[key]}`
						)
					}
				}
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
						assert.strictEqual(
							processedRoute[key],
							route[key],
							`Bad value "${processedRoute[key]}" for key "${key}" in route path "${route.path}", index ${i}, component "users", expected ${route[key]}`
						)
					}
				}
				let length = instance.routes.length
				for (let i = 5; i < length; i++) {
					const processedRoute = instance.routes[i],
						route = defaultRoutesShouldBe[i - 5]
					for (const key in route) {
						assert.strictEqual(
							processedRoute[key],
							route[key],
							`Bad value "${processedRoute[key]}" for key "${key}" in route path "${route.path}", index ${i}, component "users", expected ${route[key]}`
						)
					}
				}
				for (const i in instance.addedDefaultRoutes) {
					const processedRoute = instance.addedDefaultRoutes[i],
						route = defaultRoutesShouldBe[i]
					for (const key in route) {
						assert.strictEqual(
							processedRoute[key],
							route[key],
							`Bad value "${processedRoute[key]}" for key "${key}" in route path "${route.path}", index ${i}, component "users", expected ${route[key]}`
						)
					}
				}
			})
		})
	},
	testAccessFilter: function(req, res, next) {
		const instance = this
		describe('base-server.component.accessFilter', function() {
			it('should throw an error with the correct message and status if req.user is not a non-null object', function() {
				return co(function*() {
					req.user = null
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter())(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.status, 401, `bad value ${req.locals.error.status} for req.locals.error.status, expected 401`) &&
					assert.strictEqual(req.locals.error.customMessage, 'Unauthorized.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected Unauthorized.`)
					return true
				})
			})
			it('should throw an error with the correct message and status if req.user.type is not a non-null object', function() {
				return co(function*() {
					req.user = {}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter())(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.status, 403, `bad value ${req.locals.error.status} for req.locals.error.status, expected 403`) &&
					assert.strictEqual(req.locals.error.customMessage, 'You do not have access to this resource.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected You do not have access to this resource.`)
					return true
				})
			})
			it('should throw an error with the correct message and status if req.user.type.accessPoints is not an array', function() {
				return co(function*() {
					req.user = {type: {}}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter())(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.status, 403, `bad value ${req.locals.error.status} for req.locals.error.status, expected 403`) &&
					assert.strictEqual(req.locals.error.customMessage, 'You do not have access to this resource.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected You do not have access to this resource.`)
					return true
				})
			})
			it('should throw an error with the correct message and status if the user does not have access to the method', function() {
				return co(function*() {
					req.user = {type: {accessPoints: [{id: 1, active: true}]}}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [2], next: () => {}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.status, 403, `bad value ${req.locals.error.status} for req.locals.error.status, expected 403`) &&
					assert.strictEqual(req.locals.error.customMessage, 'You do not have access to this resource.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected You do not have access to this resource.`)
					return true
				})
			})
			it('should throw an error with the correct message and status if the user has access to less than all access points and requireAllAPs is set to true', function() {
				return co(function*() {
					req.user = {type: {accessPoints: [{id: 1, active: true}]}}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1, 2], next: () => {}, requireAllAPs: true}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.status, 403, `bad value ${req.locals.error.status} for req.locals.error.status, expected 403`) &&
					assert.strictEqual(req.locals.error.customMessage, 'You do not have access to this resource.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected You do not have access to this resource.`)
					return true
				})
			})
			it('should execute successfully if the user has access to the route and requireAllAPs is set to false', function() {
				return co(function*() {
					req.user = {type: {accessPoints: [{id: 1, active: true}]}}
					req.locals.error = null
					let result = yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1, 2], next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error, null, `bad value ${JSON.stringify(req.locals.error)} for req.locals.error, expected null`)
					assert.strictEqual(result.success, true, `bad value ${result.success} for result.success, expected true`)
					return true
				})
			})
			it('should execute successfully if the user has access to the route and requireAllAPs is set to true', function() {
				return co(function*() {
					req.user = {type: {accessPoints: [{id: 1, active: true}, {id: 2, active: true}]}}
					req.locals.error = null
					let result = yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1, 2], next: function*(){resolve({success: true})}, requireAllAPs: true}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error, null, `bad value ${JSON.stringify(req.locals.error)} for req.locals.error, expected null`)
					assert.strictEqual(result.success, true, `bad value ${result.success} for result.success, expected true`)
					return true
				})
			})
			it('should throw an error with the correct message if the user does not have one of the required userField values because they do not exist in the user data and requireAllAPs is not set', function() {
				return co(function*() {
					req.user = {type: {accessPoints: [{id: 1, active: true, userFieldName: 'someField', searchForUserFieldIn: 'body.someFieldContainer.someField'}]}}
					req.body = {}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.status, 403, `bad value ${req.locals.error.status} for req.locals.error.status, expected 403`) &&
					assert.strictEqual(req.locals.error.customMessage, 'You do not have access to this resource. Please check your data and try again if you think this is a mistake.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected You do not have access to this resource. Please check your data and try again if you think this is a mistake.`)
					return true
				})
			})
			it('should throw an error with the correct message if the user does not have one of the required userField values because they do not exist in the request data and requireAllAPs is not set', function() {
				return co(function*() {
					req.user = {someField: 'someValue', type: {accessPoints: [{id: 1, active: true, userFieldName: 'someField', searchForUserFieldIn: 'body.someFieldContainer.someField'}]}}
					req.body = {}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.status, 403, `bad value ${req.locals.error.status} for req.locals.error.status, expected 403`) &&
					assert.strictEqual(req.locals.error.customMessage, 'You do not have access to this resource. Please check your data and try again if you think this is a mistake.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected You do not have access to this resource. Please check your data and try again if you think this is a mistake.`)
					return true
				})
			})
			it('should throw an error with the correct message if the user does not have one of the required userField values because there is no match with the field in the provided in the request data and requireAllAPs is not set', function() {
				return co(function*() {
					req.user = {someField: 'someValue', type: {accessPoints: [{id: 1, active: true, userFieldName: 'someField', searchForUserFieldIn: 'body.someFieldContainer.someField'}]}}
					req.body = {someFieldContainer: {someField: 'otherValue'}}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.status, 403, `bad value ${req.locals.error.status} for req.locals.error.status, expected 403`) &&
					assert.strictEqual(req.locals.error.customMessage, 'You do not have access to this resource. Please check your data and try again if you think this is a mistake.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected You do not have access to this resource. Please check your data and try again if you think this is a mistake.`)
					return true
				})
			})
			it('should throw an error with the correct message if the user does not have one of the required userField values because they do not exist in the array provided in the request data and requireAllAPs is not set', function() {
				return co(function*() {
					req.user = {someField: 'someValue', type: {accessPoints: [{id: 1, active: true, userFieldName: 'someField', searchForUserFieldIn: 'body.someFieldContainer.someField'}]}}
					req.body = {someFieldContainer: {someField: ['otherValue']}}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.status, 403, `bad value ${req.locals.error.status} for req.locals.error.status, expected 403`) &&
					assert.strictEqual(req.locals.error.customMessage, 'You do not have access to this resource. Please check your data and try again if you think this is a mistake.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected You do not have access to this resource. Please check your data and try again if you think this is a mistake.`)
					return true
				})
			})
			it('should execute successfully if the user has one of the required userField vaues in the provided request data and setUserFieldValueIn is not set in the access point and requireAllAPs is not set', function() {
				return co(function*() {
					req.user = {someField: 'someValue', type: {accessPoints: [{id: 1, active: true, userFieldName: 'someField', searchForUserFieldIn: 'body.someFieldContainer.someField'}]}}
					req.body = {someFieldContainer: {someField: 'someValue'}}
					req.locals.error = null
					let result = yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error, null, `bad value ${JSON.stringify(req.locals.error)} for req.locals.error, expected null`)
					assert.strictEqual(result.success, true, `bad value ${result.success} for result.success, expected true`)
					return true
				})
			})
			it('should execute successfully if the user has one of the required userField vaues in the provided request data (as an array) and setUserFieldValueIn is not set in the access point and requireAllAPs is not set', function() {
				return co(function*() {
					req.user = {someField: 'someValue', type: {accessPoints: [{id: 1, active: true, userFieldName: 'someField', searchForUserFieldIn: 'body.someFieldContainer.someField'}]}}
					req.body = {someFieldContainer: {someField: ['someValue']}}
					req.locals.error = null
					let result = yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error, null, `bad value ${JSON.stringify(req.locals.error)} for req.locals.error, expected null`)
					assert.strictEqual(result.success, true, `bad value ${result.success} for result.success, expected true`)
					return true
				})
			})
			it('should throw an error with the correct message if the container that the userField value has to be set in does not exist in the request data and requireAllAPs is not set', function() {
				return co(function*() {
					req.user = {someField: 'someValue', type: {accessPoints: [{id: 1, active: true, userFieldName: 'someField', searchForUserFieldIn: 'body.someFieldContainer.someField', setUserFieldValueIn: 'body.nonExistingContainer.someField'}]}}
					req.body = {someFieldContainer: {someField: ['otherValue']}}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.status, 403, `bad value ${req.locals.error.status} for req.locals.error.status, expected 403`) &&
					assert.strictEqual(req.locals.error.customMessage, 'You do not have access to this resource. Please check your data and try again if you think this is a mistake.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected You do not have access to this resource. Please check your data and try again if you think this is a mistake.`)
					return true
				})
			})
			it('should throw an error with the correct message if one of the containers that the userField value has to be set in does not exist in the request data and requireAllAPs is not set', function() {
				return co(function*() {
					req.user = {someField: 'someValue', type: {accessPoints: [{id: 1, active: true, userFieldName: 'someField', searchForUserFieldIn: 'body.someFieldContainer.someField', setUserFieldValueIn: 'body.nonExistingContainer[]someField'}]}}
					req.body = {someFieldContainer: {someField: ['otherValue']}}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.status, 403, `bad value ${req.locals.error.status} for req.locals.error.status, expected 403`) &&
					assert.strictEqual(req.locals.error.customMessage, 'You do not have access to this resource. Please check your data and try again if you think this is a mistake.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected You do not have access to this resource. Please check your data and try again if you think this is a mistake.`)
					return true
				})
			})
			it('should throw an error with the correct message if the user does not have one of the required userField values because they do not exist in the user data and requireAllAPs is set', function() {
				return co(function*() {
					req.user = {type: {accessPoints: [{id: 1, active: true, userFieldName: 'someField', searchForUserFieldIn: 'body.someFieldContainer.someField'}]}}
					req.body = {}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], requireAllAPs: true, next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.status, 403, `bad value ${req.locals.error.status} for req.locals.error.status, expected 403`) &&
					assert.strictEqual(req.locals.error.customMessage, 'You do not have access to this resource.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected You do not have access to this resource.`)
					return true
				})
			})
			it('should throw an error with the correct message if the user does not have one of the required userField values because they do not exist in the request data and requireAllAPs is set', function() {
				return co(function*() {
					req.user = {someField: 'someValue', type: {accessPoints: [{id: 1, active: true, userFieldName: 'someField', searchForUserFieldIn: 'body.someFieldContainer.someField'}]}}
					req.body = {}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], requireAllAPs: true, next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.status, 403, `bad value ${req.locals.error.status} for req.locals.error.status, expected 403`) &&
					assert.strictEqual(req.locals.error.customMessage, 'You do not have access to this resource.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected You do not have access to this resource.`)
					return true
				})
			})
			it('should throw an error with the correct message if the user does not have one of the required userField values because there is no match with the field in the provided in the request data and requireAllAPs is set', function() {
				return co(function*() {
					req.user = {someField: 'someValue', type: {accessPoints: [{id: 1, active: true, userFieldName: 'someField', searchForUserFieldIn: 'body.someFieldContainer.someField'}]}}
					req.body = {someFieldContainer: {someField: 'otherValue'}}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], requireAllAPs: true, next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.status, 403, `bad value ${req.locals.error.status} for req.locals.error.status, expected 403`) &&
					assert.strictEqual(req.locals.error.customMessage, 'You do not have access to this resource.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected You do not have access to this resource.`)
					return true
				})
			})
			it('should throw an error with the correct message if the user does not have one of the required userField values because they do not exist in the array provided in the request data and requireAllAPs is set', function() {
				return co(function*() {
					req.user = {someField: 'someValue', type: {accessPoints: [{id: 1, active: true, userFieldName: 'someField', searchForUserFieldIn: 'body.someFieldContainer.someField'}]}}
					req.body = {someFieldContainer: {someField: ['otherValue']}}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], requireAllAPs: true, next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.status, 403, `bad value ${req.locals.error.status} for req.locals.error.status, expected 403`) &&
					assert.strictEqual(req.locals.error.customMessage, 'You do not have access to this resource.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected You do not have access to this resource.`)
					return true
				})
			})
			it('should execute successfully if the user has one of the required userField vaues in the provided request data and setUserFieldValueIn is not set in the access point and requireAllAPs is set', function() {
				return co(function*() {
					req.user = {someField: 'someValue', type: {accessPoints: [{id: 1, active: true, userFieldName: 'someField', searchForUserFieldIn: 'body.someFieldContainer.someField'}]}}
					req.body = {someFieldContainer: {someField: 'someValue'}}
					req.locals.error = null
					let result = yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], requireAllAPs: true, next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error, null, `bad value ${JSON.stringify(req.locals.error)} for req.locals.error, expected null`)
					assert.strictEqual(result.success, true, `bad value ${result.success} for result.success, expected true`)
					return true
				})
			})
			it('should execute successfully if the user has one of the required userField vaues in the provided request data (as an array) and setUserFieldValueIn is not set in the access point and requireAllAPs is set', function() {
				return co(function*() {
					req.user = {someField: 'someValue', type: {accessPoints: [{id: 1, active: true, userFieldName: 'someField', searchForUserFieldIn: 'body.someFieldContainer.someField'}]}}
					req.body = {someFieldContainer: {someField: ['someValue']}}
					req.locals.error = null
					let result = yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], requireAllAPs: true, next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error, null, `bad value ${JSON.stringify(req.locals.error)} for req.locals.error, expected null`)
					assert.strictEqual(result.success, true, `bad value ${result.success} for result.success, expected true`)
					return true
				})
			})
			it('should throw an error with the correct message if the container that the userField value has to be set in does not exist in the request data and requireAllAPs is set', function() {
				return co(function*() {
					req.user = {someField: 'someValue', type: {accessPoints: [{id: 1, active: true, userFieldName: 'someField', searchForUserFieldIn: 'body.someFieldContainer.someField', setUserFieldValueIn: 'body.nonExistingContainer.someField'}]}}
					req.body = {someFieldContainer: {someField: ['someValue']}}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], requireAllAPs: true, next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.customMessage, 'Could not set access-related field values in the request data object. Please check your data and try again.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected Could not set access-related field values in the request data object. Please check your data and try again.`)
					assert.strictEqual(req.locals.error.status, 400, `bad value ${req.locals.error.status} for req.locals.error.status, expected 400`)
					return true
				})
			})
			it('should throw an error with the correct message if one of the containers that the userField value has to be set in does not exist in the request data and requireAllAPs is set', function() {
				return co(function*() {
					req.user = {someField: 'someValue', type: {accessPoints: [{id: 1, active: true, userFieldName: 'someField', searchForUserFieldIn: 'body.someFieldContainer.someField', setUserFieldValueIn: 'body.nonExistingContainer[]someField'}]}}
					req.body = {someFieldContainer: {someField: ['someValue']}}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], requireAllAPs: true, next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.customMessage, 'Could not set access-related field values in the request data object. Please check your data and try again.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected Could not set access-related field values in the request data object. Please check your data and try again.`)
					assert.strictEqual(req.locals.error.status, 400, `bad value ${req.locals.error.status} for req.locals.error.status, expected 400`)
					return true
				})
			})
			it('should throw an error with the correct message if all access points are inactive and requireAllAPs is not set', function() {
				return co(function*() {
					req.user = {type: {accessPoints: [{id: 1, active: false}]}}
					req.body = {}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.customMessage, 'You do not have access to this resource.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected You do not have access to this resource.`)
					assert.strictEqual(req.locals.error.status, 403, `bad value ${req.locals.error.status} for req.locals.error.status, expected 403`)
					return true
				})
			})
			it('should throw an error with the correct message if one of the access points is inactive and requireAllAPs is set', function() {
				return co(function*() {
					req.user = {type: {accessPoints: [{id: 1, active: false}]}}
					req.body = {}
					yield (new Promise((resolve, reject) => {
						wrap(instance.accessFilter({accessPointIds: [1], requireAllAPs: true, next: function*(){resolve({success: true})}}))(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(req.locals.error.customMessage, 'You do not have access to this resource.', `bad value ${req.locals.error.customMessage} for req.locals.error.customMessage, expected You do not have access to this resource.`)
					assert.strictEqual(req.locals.error.status, 403, `bad value ${req.locals.error.status} for req.locals.error.status, expected 403`)
					return true
				})
			})
		})
	},
	testCreate: function(req, res, next) {
		const instance = this,
			db = instance.module.db,
			dbComponents = db.components
		describe('base-server.component.create', function() {
			it('should execute successfully and return the newly created object if all paramteres are correct', function() {
				return co(function*() {
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
					yield dbComponents.userTypes.create({name: 'type1', description: 'description1', active: true})
					delete req.locals.error
					req.user = {id: 1}
					req.body = {typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', password: '1234', active: true}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.create())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let result = res.response.jsonBody.result,
						item = {id: 2, typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', active: true}
					for (const key in item) {
						assert.strictEqual(result[key], item[key], `Bad value ${result[key]} for field "${key}", expected ${item[key]}.`)
					}
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
					return true
				})
			})
		})
	},
	testRead: function(req, res, next) {
		const instance = this,
			db = instance.module.db,
			dbComponents = db.components
		describe('base-server.component.read', function() {
			it('should execute successfully and return the found object if all paramteres are correct', function() {
				return co(function*() {
					yield dbComponents.userTypes.create({name: 'type1', description: 'description1', active: true})
					yield dbComponents.users.create({typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', password: '1234', active: true})
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
						item = {id:2, typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', active: true}
					for (const key in item) {
						assert.strictEqual(result[key], item[key], `Bad value ${result[key]} for field "${key}", expected ${item[key]}.`)
					}
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
					return true
				})
			})
		})
	},
	testReadList: function(req, res, next) {
		const instance = this,
			db = instance.module.db,
			dbComponents = db.components
		describe('base-server.component.readList', function() {
			it('should execute successfully and return the found object if all paramteres are correct', function() {
				return co(function*() {
					yield dbComponents.userTypes.create({name: 'type1', description: 'description1', active: true})
					yield dbComponents.users.create({typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', password: '1234', active: true})
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
						item = {id:2, typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', active: true}
					for (const key in item) {
						assert.strictEqual(result[key], item[key], `Bad value ${result[key]} for field "${key}", expected ${item[key]}.`)
					}
					assert.strictEqual(returnedData.results.length, 1, `Bad value ${returnedData.results.length} for returnedData.results.length, expected 1.`)
					assert.strictEqual(returnedData.page, 1, `Bad value ${returnedData.page} for returnedData.page, expected 1.`)
					assert.strictEqual(returnedData.perPage, 10, `Bad value ${returnedData.perPage} for returnedData.perPage, expected 10.`)
					assert.strictEqual(returnedData.totalPages, 1, `Bad value ${returnedData.totalPages} for returnedData.totalPages, expected 1.`)
					assert.strictEqual(returnedData.more, false, `Bad value ${returnedData.more} for returnedData.more, expected false.`)
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
					return true
				})
			})
		})
	},
	testReadSelectList: function(req, res, next) {
		const instance = this,
			db = instance.module.db,
			dbComponents = db.components
		describe('base-server.component.readSelectList', function() {
			it('should execute successfully and return the list if only titleField and filters are provided', function() {
				return co(function*() {
					yield dbComponents.userTypes.create({name: 'type1', description: 'description1', active: true})
					yield dbComponents.users.bulkCreate([
						{typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', password: '1234', active: true},
						{typeId: 2, firstName: 'fn2', lastName: 'ln2', email: 'email2@ramster.com', password: '1234', active: true},
						{typeId: 2, firstName: 'fn3', lastName: 'ln3', email: 'email3@ramster.com', password: '1234', active: true}
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
						]
					for (const i in resultsShouldBe) {
						const sbItem = resultsShouldBe[i],
							item = results[i]
						for (const key in sbItem) {
							assert.strictEqual(item[key], sbItem[key], `Bad value ${item[key]} for field "${key}", expected ${sbItem[key]}.`)
						}
					}
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
						]
					for (const i in resultsShouldBe) {
						const sbItem = resultsShouldBe[i],
							item = results[i]
						for (const key in sbItem) {
							assert.strictEqual(item[key], sbItem[key], `Bad value ${item[key]} for field "${key}", expected ${sbItem[key]}.`)
						}
					}
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
						]
					for (const i in resultsShouldBe) {
						const sbItem = resultsShouldBe[i],
							item = results[i]
						for (const key in sbItem) {
							assert.strictEqual(item[key], sbItem[key], `Bad value ${item[key]} for field "${key}", expected ${sbItem[key]}.`)
						}
					}
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
						]
					for (const i in resultsShouldBe) {
						const sbItem = resultsShouldBe[i],
							item = results[i]
						for (const key in sbItem) {
							assert.strictEqual(item[key], sbItem[key], `Bad value ${item[key]} for field "${key}", expected ${sbItem[key]}.`)
						}
					}
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
						]
					for (const i in resultsShouldBe) {
						const sbItem = resultsShouldBe[i],
							item = results[i]
						for (const key in sbItem) {
							assert.strictEqual(item[key], sbItem[key], `Bad value ${item[key]} for field "${key}", expected ${sbItem[key]}.`)
						}
					}
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
						]
					for (const i in resultsShouldBe) {
						const sbItem = resultsShouldBe[i],
							item = results[i]
						for (const key in sbItem) {
							assert.strictEqual(item[key], sbItem[key], `Bad value ${item[key]} for field "${key}", expected ${sbItem[key]}.`)
						}
					}
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
						]
					for (const i in resultsShouldBe) {
						const sbItem = resultsShouldBe[i],
							item = results[i]
						for (const key in sbItem) {
							assert.strictEqual(item[key], sbItem[key], `Bad value ${item[key]} for field "${key}", expected ${sbItem[key]}.`)
						}
					}
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
						]
					for (const i in resultsShouldBe) {
						const sbItem = resultsShouldBe[i],
							item = results[i]
						for (const key in sbItem) {
							assert.strictEqual(item[key], sbItem[key], `Bad value ${item[key]} for field "${key}", expected ${sbItem[key]}.`)
						}
					}
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
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
		describe('base-server.component.bulkUpsert', function() {
			it('should execute successfully, pass the request data on to dbComponent.update and return the update result if all paramteres are correct and where is present in req.body', function() {
				return co(function*() {
					yield dbComponents.userTypes.create({name: 'type1', description: 'description1', active: true})
					yield dbComponent.create({typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', password: '1234', active: true})
					req.locals.error = null
					req.user = {id: 1}
					req.body = {
						dbObject: {firstName: 'updatedFirstName1', active: false},
						where: {id: 2}
					}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.bulkUpsert())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					const resultItems = res.response.jsonBody,
						item = {id: 2, typeId: 2, firstName: 'updatedFirstName1', lastName: 'ln1', email: 'email1@ramster.com', active: false}
					assert.strictEqual(resultItems[0], 1, `Bad value ${resultItems[0]} for resultItems[0], expected 1.`)
					assert.strictEqual(resultItems[1].length, 1, `Bad value ${resultItems[1].length} for resultItems[1].length, expected 1.`)
					const resultItem = resultItems[1][0]
					for (const key in item) {
						assert.strictEqual(resultItem[key], item[key], `Bad value ${resultItem[key]} for field "${key}", expected ${item[key]}.`)
					}
					return true
				})
			})
			it('should execute successfully, pass the request data on to dbComponent.bulkUpsert, return the {success: true} and create and update the provided items if all paramteres are correct and an array is present in req.body', function() {
				return co(function*() {
					req.locals.error = null
					req.user = {id: 1}
					req.body = [
						{id: 2, firstName: 'properlyUpdatedFirstName1', active: true},
						{typeId: 2, firstName: 'fn2', lastName: 'ln2', email: 'email2@ramster.com', password: '1234', active: true}
					]
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.bulkUpsert())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					const result = res.response.jsonBody,
						resultItems = yield dbComponent.model.findAll({order: [['id', 'asc']]}),
						items = [
							{id: 2, typeId: 2, firstName: 'properlyUpdatedFirstName1', lastName: 'ln1', email: 'email1@ramster.com', active: true},
							{id: 3, typeId: 2, firstName: 'fn2', lastName: 'ln2', email: 'email2@ramster.com', active: true}
						]
					assert.strictEqual(result.success, true, `Bad value ${result.success} for result.success, expected true.`)
					for (const i in items) {
						const item = items[i],
							resultItem = resultItems[i].dataValues
						for (const key in item) {
							assert.strictEqual(resultItem[key], item[key], `Bad value ${resultItem[key]} for field "${key}" in item no. ${i}, expected ${item[key]}.`)
						}
					}
					assert.strictEqual(req.locals.error, null, `bad value ${JSON.stringify(req.locals.error)} for req.locals.error, expected null`)
					return true
				})
			})
			it('should execute successfully, pass the request data on to dbComponent.bulkUpsert, return the {success: true} and create and update the provided items if all paramteres are correct and an object in the format {additionalCreateFields, dbObjects, updateFilters} is provided', function() {
				return co(function*() {
					req.locals.error = null
					req.user = {id: 1}
					req.body = {
						additionalCreateFields: {active: false},
						dbObjects: [
							{id: 2, firstName: 'properlyUpdatedFirstName1', active: true},
							{typeId: 2, firstName: 'fnn2', lastName: 'lnn2', email: 'emailn2@ramster.com', password: '1234', active: true}
						],
						updateFilters: {deletedAt: null}
					}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.bulkUpsert())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					const result = res.response.jsonBody,
						resultItems = yield dbComponent.model.findAll({where: {id: [2, 4]}, order: [['id', 'asc']]}),
						items = [
							{id: 2, typeId: 2, firstName: 'properlyUpdatedFirstName1', lastName: 'ln1', email: 'email1@ramster.com', active: true},
							{id: 4, typeId: 2, firstName: 'fnn2', lastName: 'lnn2', email: 'emailn2@ramster.com', active: false}
						]
					assert.strictEqual(result.success, true, `Bad value ${result.success} for result.success, expected true.`)
					for (const i in items) {
						const item = items[i],
							resultItem = resultItems[i].dataValues
						for (const key in item) {
							assert.strictEqual(resultItem[key], item[key], `Bad value ${resultItem[key]} for field "${key}" in item no. ${i}, expected ${item[key]}.`)
						}
					}
					assert.strictEqual(req.locals.error, null, `bad value ${JSON.stringify(req.locals.error)} for req.locals.error, expected null`)
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
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
		describe('base-server.component.delete', function() {
			it('should execute successfully and return {success: true} if all parameters are correct', function() {
				return co(function*() {
					yield dbComponents.userTypes.create({name: 'type1', description: 'description1', active: true})
					yield dbComponent.create({typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', password: '1234', active: true})
					req.locals.error = null
					req.body = {}
					req.params = {id: 2}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.delete())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let result = res.response.jsonBody,
						resultItem = yield dbComponent.model.findOne({where: {id: 2}})
					assert.strictEqual(req.locals.error, null, `bad value ${JSON.stringify(req.locals.error)} for req.locals.error, expected null`)
					assert.strictEqual(resultItem, null, `bad value ${resultItem} for resultItem, expected null`)
					assert.strictEqual(result.success, true, `bad value ${result.success} for result.success, expected true`)
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
					return true
				})
			})
		})
	}
}

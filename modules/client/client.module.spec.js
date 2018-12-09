const
	assert = require('assert'),
	co = require('co'),
	express = require('express'),
	http = require('http'),
	request = require('request-promise-native')

module.exports = {
	testMe: function() {
		const instance = this
		describe('client.module', function() {
			before(function() {
				return co(function*() {
					let app = express()
					app.use((req, res, next) => {
						req.isAuthenticated = () => req.query.isAuthenticated === 'true'
						next()
					})
					app.use(instance.setDefaultsBeforeRequest.bind(instance)())
					app.use([
							'/',
							'/testRoute',
							'/authenticatedTestRoute',
							'/unauthorizedRoute',
							'/unauthorizedNonLayoutDirectRoute',
							'/unauthorizedPageRedirectRoute'
						],
						(req, res) => res.status(200).end()
					)
					let server = http.createServer(app)
					yield new Promise((resolve, reject) => {
						server.listen(1110, () => {
							resolve(true)
						})
					})
					return true
				})
			})
			it('should execute testSetDefaultsBeforeRequest successfully', function() {
				instance.testSetDefaultsBeforeRequest()
			})
		})
	},
	testSetDefaultsBeforeRequest: function() {
		const originalModuleConfig = JSON.parse(JSON.stringify(this.moduleConfig))
		let {moduleConfig} = this,
			changeableInstance = this,
			originalPaths = []
		describe('client.module.setDefaultsBeforeRequest', function() {
			before(function() {
				originalPaths = changeableInstance.paths
				moduleConfig.anonymousAccessRoutes = ['/', '/testRoute', '/unauthorizedPageRedirectRoute']
				changeableInstance.paths = ['/', '/testRoute', '/authenticatedTestRoute', '/unauthorizedRoute', '/unauthorizedNonLayoutDirectRoute', '/unauthorizedPageRedirectRoute']
				moduleConfig.nonLayoutDirectRoutes = ['/unauthorizedNonLayoutDirectRoute']
				delete moduleConfig.notFoundRedirectRoutes
				delete moduleConfig.layoutRoutes
				delete moduleConfig.unauthorizedPageRedirectRoute
				delete moduleConfig.redirectUnauthorizedPagesToNotFound
			})
			it('should execute successfully and return 404 if the route is not found and notFoundRedirectRoutes is not set', function() {
				return co(function*() {
					let res = null
					try {
						yield request('http://127.0.0.1:1110/notFoundRoute', {resolveWithFullResponse: true})
					} catch(e) {
						res = e
					}
					assert.strictEqual(res.response.statusCode, 404, `bad value ${res.response.statusCode} res.response.statusCode, expected 404`)
					return true
				})
			})
			it('should execute successfully, return 200 and redirect to the correct route if the route is not found, only notFoundRedirectRoutes.default is set, the request is GET and the user is not authenticated', function() {
				return co(function*() {
					moduleConfig.notFoundRedirectRoutes = {default: '/testRoute'}
					let res = yield request('http://127.0.0.1:1110/notFoundRoute', {resolveWithFullResponse: true})
					assert.strictEqual(res.statusCode, 200, `bad value ${res.statusCode} res.statusCode, expected 200`)
					assert.strictEqual(res.request.href, 'http://127.0.0.1:1110/testRoute', `bad value ${res.request.href} for res.request.href, expected 'http://127.0.0.1:1110/testRoute'`)
					return true
				})
			})
			it('should execute successfully, return 200 and redirect to the correct route if the route is not found, only notFoundRedirectRoutes.default is set, the request is GET and the user is authenticated', function() {
				return co(function*() {
					let res = yield request('http://127.0.0.1:1110/notFoundRoute?isAuthenticated=true', {resolveWithFullResponse: true})
					assert.strictEqual(res.statusCode, 200, `bad value ${res.statusCode} res.statusCode, expected 200`)
					assert.strictEqual(res.request.href, 'http://127.0.0.1:1110/testRoute?isAuthenticated=true', `bad value ${res.request.href} for res.request.href, expected 'http://127.0.0.1:1110/testRoute?isAuthenticated=true'`)
					return true
				})
			})
			it('should execute successfully and return 200 and redirect to the correct route if the route is not found, notFoundRedirectRoutes.authenticated is set, the request is get and the user is authenticated', function() {
				return co(function*() {
					moduleConfig.notFoundRedirectRoutes = {authenticated: '/authenticatedTestRoute', default: '/testRoute'}
					let res = yield request('http://127.0.0.1:1110/notFoundRoute?isAuthenticated=true', {resolveWithFullResponse: true})
					assert.strictEqual(res.statusCode, 200, `bad value ${res.statusCode} res.statusCode, expected 200`)
					assert.strictEqual(res.request.href, 'http://127.0.0.1:1110/authenticatedTestRoute?isAuthenticated=true', `bad value ${res.request.href} for res.request.href, expected 'http://127.0.0.1:1110/authenticatedTestRoute?isAuthenticated=true'`)
					return true
				})
			})
			it('should execute successfully and return 404 if the route is not found, the request is POST and the user is not authenticated', function() {
				return co(function*() {
					let res = null
					try {
						yield request('http://127.0.0.1:1110/notFoundRoute', {method: 'POST', resolveWithFullResponse: true})
					} catch(e) {
						res = e
					}
					assert.strictEqual(res.response.statusCode, 404, `bad value ${res.response.statusCode} res.response.statusCode, expected 404`)
					return true
				})
			})
			it('should execute successfully and return 404 if the route is not found, the request is POST and the user is authenticated', function() {
				return co(function*() {
					let res = null
					try {
						yield request('http://127.0.0.1:1110/notFoundRoute?isAuthenticated=true', {method: 'POST', resolveWithFullResponse: true})
					} catch(e) {
						res = e
					}
					assert.strictEqual(res.response.statusCode, 404, `bad value ${res.response.statusCode} res.response.statusCode, expected 404`)
					return true
				})
			})
			it('should execute successfully and return 401 if the user is not authenticated, the route is not anonymous, the route is not a layout one and the route is not a non-layout direct one', function() {
				return co(function*() {
					let res = null
					try {
						yield request('http://127.0.0.1:1110/unauthorizedRoute', {resolveWithFullResponse: true})
					} catch(e) {
						res = e
					}
					assert.strictEqual(res.response.statusCode, 401, `bad value ${res.response.statusCode} res.response.statusCode, expected 401`)
					return true
				})
			})
			it('should execute successfully and return 401 if the user is not authenticated, the route is not anonymous, the route is a non-layout direct one, unauthorizedPageRedirectRoute is not set and redirectUnauthorizedPagesToNotFound is not true', function() {
				return co(function*() {
					let res = null
					try {
						yield request('http://127.0.0.1:1110/unauthorizedNonLayoutDirectRoute', {resolveWithFullResponse: true})
					} catch(e) {
						res = e
					}
					assert.strictEqual(res.response.statusCode, 401, `bad value ${res.response.statusCode} res.response.statusCode, expected 401`)
					return true
				})
			})
			it('should execute successfully and return 401 if the user is not authenticated, the route is not anonymous, the route is a layout one, unauthorizedPageRedirectRoute is not set and redirectUnauthorizedPagesToNotFound is not true', function() {
				return co(function*() {
					changeableInstance.layoutRoutes = ['/unauthorizedRoute']
					let res = null
					try {
						yield request('http://127.0.0.1:1110/unauthorizedRoute', {resolveWithFullResponse: true})
					} catch(e) {
						res = e
					}
					assert.strictEqual(res.response.statusCode, 401, `bad value ${res.response.statusCode} res.response.statusCode, expected 401`)
					return true
				})
			})
			it('should execute successfully, return 200 and redirect to the correct route if the user is not authenticated, the route is not anonymous, the route is a layout one and unauthorizedPageRedirectRoute is set', function() {
				return co(function*() {
					moduleConfig.unauthorizedPageRedirectRoute = '/unauthorizedPageRedirectRoute'
					let res = yield request('http://127.0.0.1:1110/unauthorizedRoute', {resolveWithFullResponse: true})
					assert.strictEqual(res.statusCode, 200, `bad value ${res.statusCode} res.statusCode, expected 200`)
					assert.strictEqual(
						res.request.href,
						'http://127.0.0.1:1110/unauthorizedPageRedirectRoute',
						`bad value ${res.request.href} for res.request.href, expected 'http://127.0.0.1:1110/unauthorizedPageRedirectRoute'`
					)
					return true
				})
			})
			it('should execute successfully, return 200 and redirect to the correct route if the user is not authenticated, the route is not anonymous, the route is a non-layout direct one and unauthorizedPageRedirectRoute is set', function() {
				return co(function*() {
					let res = yield request('http://127.0.0.1:1110/unauthorizedNonLayoutDirectRoute', {resolveWithFullResponse: true})
					assert.strictEqual(res.statusCode, 200, `bad value ${res.statusCode} res.statusCode, expected 200`)
					assert.strictEqual(
						res.request.href,
						'http://127.0.0.1:1110/unauthorizedPageRedirectRoute',
						`bad value ${res.request.href} for res.request.href, expected 'http://127.0.0.1:1110/unauthorizedPageRedirectRoute'`
					)
					return true
				})
			})
			it('should execute successfully, return 200 and redirect to the correct route if the user is not authenticated, the route is not anonymous, the route is a layout one, unauthorizedPageRedirectRoute is not set and redirectUnauthorizedPagesToNotFound is true', function() {
				return co(function*() {
					delete moduleConfig.unauthorizedPageRedirectRoute
					moduleConfig.redirectUnauthorizedPagesToNotFound = true
					let res = yield request('http://127.0.0.1:1110/unauthorizedRoute', {resolveWithFullResponse: true})
					assert.strictEqual(res.statusCode, 200, `bad value ${res.statusCode} res.statusCode, expected 200`)
					assert.strictEqual(res.request.href, 'http://127.0.0.1:1110/testRoute', `bad value ${res.request.href} for res.request.href, expected 'http://127.0.0.1:1110/testRoute'`)
					return true
				})
			})
			it('should execute successfully, return 200 and redirect to the correct route if the user is not authenticated, the route is not anonymous, the route is a non-layout direct one, unauthorizedPageRedirectRoute is not set and redirectUnauthorizedPagesToNotFound is true', function() {
				return co(function*() {
					let res = yield request('http://127.0.0.1:1110/unauthorizedNonLayoutDirectRoute', {resolveWithFullResponse: true})
					assert.strictEqual(res.statusCode, 200, `bad value ${res.statusCode} res.statusCode, expected 200`)
					assert.strictEqual(
						res.request.href,
						'http://127.0.0.1:1110/testRoute',
						`bad value ${res.request.href} for res.request.href, expected 'http://127.0.0.1:1110/testRoute'`
					)
					return true
				})
			})
			it('should execute successfully and continue to next if the user is not authenticated, but the route is anonymous', function() {
				return co(function*() {
					let res = yield request('http://127.0.0.1:1110/', {resolveWithFullResponse: true})
					assert.strictEqual(res.statusCode, 200, `bad value ${res.statusCode} res.statusCode, expected 200`)
					return true
				})
			})
			after(function() {
				changeableInstance.paths = originalPaths
				moduleConfig.anonymousAccessRoutes = originalModuleConfig.anonymousAccessRoutes
				moduleConfig.notFoundRedirectRoutes = originalModuleConfig.notFoundRedirectRoutes
				moduleConfig.layoutRoutes = originalModuleConfig.layoutRoutes
				moduleConfig.nonLayoutDirectRoutes = originalModuleConfig.nonLayoutDirectRoutes
				moduleConfig.unauthorizedPageRedirectRoute = originalModuleConfig.unauthorizedPageRedirectRoute
				moduleConfig.redirectUnauthorizedPagesToNotFound = originalModuleConfig.redirectUnauthorizedPagesToNotFound
			})
		})
	}
}

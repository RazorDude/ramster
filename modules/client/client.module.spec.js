const
	assert = require('assert'),
	co = require('co'),
	fs = require('fs-extra'),
	path = require('path')

module.exports = {
	testMe: function() {
		const instance = this
		describe('client.module', function() {
			let req = {
					headers: {},
					connection: {}
				},
				res = {
					headers: {},
					getHeader: function(headerName) {
					},
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
			it('should execute testSetDefaultsBeforeRequest successfully', function() {
				instance.testSetDefaultsBeforeRequest(req, res, next)
				assert(true)
			})
		})
	},
	testSetDefaultsBeforeRequest: function(req, res, next) {
		const instance = this,
			originalModuleConfig = JSON.parse(JSON.stringify(this.moduleConfig)),
			setDefaultsBeforeRequest = this.setDefaultsBeforeRequest.bind(this)
		let {moduleConfig} = this,
			changeableInstance = this
		describe('client.module.setDefaultsBeforeRequest', function() {
			it('should execute successfully and return 404 if the route is not found and notFoundRedirectRoutes is not set', function() {
				return co(function*() {
					delete moduleConfig.notFoundRedirectRoutes
					changeableInstance.paths = []
					req.originalUrl = '/notFoundRoute'
					yield (new Promise((resolve, reject) => {
						res.end = res.endTemplate.bind(res, resolve)
						setDefaultsBeforeRequest()(req, res, next.bind(next, resolve))
					}))
					moduleConfig.notFoundRedirectRoutes = originalModuleConfig.notFoundRedirectRoutes
					assert(res.response.statusCode === 404)
					return true
				})
			})
			it('should execute successfully and return 404 if the route is not found, only notFoundRedirectRoutes.default is set and the user is not authenticated', function() {
				return co(function*() {
					req.originalUrl = '/notFoundRoute'
					req.isAuthenticated = () => false
					moduleConfig.notFoundRedirectRoutes = {default: '/testRoute'}
					yield (new Promise((resolve, reject) => {
						res.redirect = res.redirectTemplate.bind(res, resolve)
						setDefaultsBeforeRequest()(req, res, next.bind(next, resolve))
					}))
					delete req.isAuthenticated
					moduleConfig.notFoundRedirectRoutes = originalModuleConfig.notFoundRedirectRoutes
					assert(
						(res.response.statusCode === 302) &&
						(res.response.redirectRoute === '/testRoute')
					)
					return true
				})
			})
			it('should execute successfully and return 404 if the route is not found, only notFoundRedirectRoutes.default is set and the user is authenticated', function() {
				return co(function*() {
					req.originalUrl = '/notFoundRoute'
					req.isAuthenticated = () => true
					moduleConfig.notFoundRedirectRoutes = {default: '/testRoute'}
					yield (new Promise((resolve, reject) => {
						res.redirect = res.redirectTemplate.bind(res, resolve)
						setDefaultsBeforeRequest()(req, res, next.bind(next, resolve))
					}))
					delete req.isAuthenticated
					moduleConfig.notFoundRedirectRoutes = originalModuleConfig.notFoundRedirectRoutes
					assert(
						(res.response.statusCode === 302) &&
						(res.response.redirectRoute === '/testRoute')
					)
					return true
				})
			})
			it('should execute successfully and return 404 if the route is not found, notFoundRedirectRoutes.authenticated is set and the user is authenticated', function() {
				return co(function*() {
					req.originalUrl = '/notFoundRoute'
					req.isAuthenticated = () => true
					moduleConfig.notFoundRedirectRoutes = {authenticated: '/authenticatedTestRoute', default: '/testRoute'}
					yield (new Promise((resolve, reject) => {
						res.redirect = res.redirectTemplate.bind(res, resolve)
						setDefaultsBeforeRequest()(req, res, next.bind(next, resolve))
					}))
					delete req.isAuthenticated
					moduleConfig.notFoundRedirectRoutes = originalModuleConfig.notFoundRedirectRoutes
					assert(
						(res.response.statusCode === 302) &&
						(res.response.redirectRoute === '/authenticatedTestRoute')
					)
					return true
				})
			})
			it('should execute successfully and return 401 if the user is not authenticated, the route is not anonymous, the route is not a layout one and the route is not a non-layout direct one', function() {
				return co(function*() {
					delete moduleConfig.anonymousAccessRoutes
					delete moduleConfig.layoutRoutes
					delete moduleConfig.nonLayoutDirectRoutes
					req.originalUrl = '/unathorizedRoute'
					changeableInstance.paths = ['/unathorizedRoute']
					req.isAuthenticated = () => false
					yield (new Promise((resolve, reject) => {
						res.end = res.endTemplate.bind(res, resolve)
						setDefaultsBeforeRequest()(req, res, next.bind(next, resolve))
					}))
					delete req.isAuthenticated
					moduleConfig.anonymousAccessRoutes = originalModuleConfig.anonymousAccessRoutes
					moduleConfig.layoutRoutes = originalModuleConfig.layoutRoutes
					moduleConfig.nonLayoutDirectRoutes = originalModuleConfig.nonLayoutDirectRoutes
					delete changeableInstance.paths
					assert(res.response.statusCode === 401)
					return true
				})
			})
			it('should execute successfully and return 401 if the user is not authenticated, the route is not anonymous, the route is a layout one, unauthorizedPageRedirectRoute is not set and redirectUnauthorizedPagesToNotFound is not true', function() {
				return co(function*() {
					delete moduleConfig.anonymousAccessRoutes
					delete moduleConfig.layoutRoutes
					delete moduleConfig.nonLayoutDirectRoutes
					delete moduleConfig.unauthorizedPageRedirectRoute
					delete moduleConfig.redirectUnauthorizedPagesToNotFound
					req.originalUrl = '/unathorizedRoute'
					req.method = 'GET'
					changeableInstance.paths = ['/unathorizedRoute']
					changeableInstance.layoutRoutes = ['/unathorizedRoute']
					req.isAuthenticated = () => false
					yield (new Promise((resolve, reject) => {
						res.end = res.endTemplate.bind(res, resolve)
						setDefaultsBeforeRequest()(req, res, next.bind(next, resolve))
					}))
					delete req.isAuthenticated
					moduleConfig.anonymousAccessRoutes = originalModuleConfig.anonymousAccessRoutes
					moduleConfig.layoutRoutes = originalModuleConfig.layoutRoutes
					moduleConfig.nonLayoutDirectRoutes = originalModuleConfig.nonLayoutDirectRoutes
					moduleConfig.unauthorizedPageRedirectRoute = originalModuleConfig.unauthorizedPageRedirectRoute
					moduleConfig.redirectUnauthorizedPagesToNotFound = originalModuleConfig.redirectUnauthorizedPagesToNotFound
					delete changeableInstance.paths
					delete changeableInstance.layoutRoutes
					assert(res.response.statusCode === 401)
					return true
				})
			})
			it('should execute successfully and return 302 if the user is not authenticated, the route is not anonymous, the route is a layout one and unauthorizedPageRedirectRoute is set', function() {
				return co(function*() {
					delete moduleConfig.anonymousAccessRoutes
					delete moduleConfig.layoutRoutes
					delete moduleConfig.nonLayoutDirectRoutes
					moduleConfig.unauthorizedPageRedirectRoute = '/unauthrozidPageRedirectRoute'
					delete moduleConfig.redirectUnauthorizedPagesToNotFound
					req.originalUrl = '/unathorizedRoute'
					req.method = 'GET'
					changeableInstance.paths = ['/unathorizedRoute']
					changeableInstance.layoutRoutes = ['/unathorizedRoute']
					req.isAuthenticated = () => false
					yield (new Promise((resolve, reject) => {
						res.redirect = res.redirectTemplate.bind(res, resolve)
						setDefaultsBeforeRequest()(req, res, next.bind(next, resolve))
					}))
					delete req.isAuthenticated
					moduleConfig.anonymousAccessRoutes = originalModuleConfig.anonymousAccessRoutes
					moduleConfig.layoutRoutes = originalModuleConfig.layoutRoutes
					moduleConfig.nonLayoutDirectRoutes = originalModuleConfig.nonLayoutDirectRoutes
					moduleConfig.unauthorizedPageRedirectRoute = originalModuleConfig.unauthorizedPageRedirectRoute
					moduleConfig.redirectUnauthorizedPagesToNotFound = originalModuleConfig.redirectUnauthorizedPagesToNotFound
					delete changeableInstance.paths
					delete changeableInstance.layoutRoutes
					assert(
						(res.response.statusCode === 302) &&
						(res.response.redirectRoute === '/unauthrozidPageRedirectRoute')
					)
					return true
				})
			})
			it('should execute successfully and return 302 if the user is not authenticated, the route is not anonymous, the route is a layout one, unauthorizedPageRedirectRoute is not set and redirectUnauthorizedPagesToNotFound is true', function() {
				return co(function*() {
					delete moduleConfig.anonymousAccessRoutes
					delete moduleConfig.layoutRoutes
					delete moduleConfig.nonLayoutDirectRoutes
					delete moduleConfig.unauthorizedPageRedirectRoute
					moduleConfig.redirectUnauthorizedPagesToNotFound = true
					moduleConfig.notFoundRedirectRoutes = {default: '/testRoute'}
					req.originalUrl = '/unathorizedRoute'
					req.method = 'GET'
					changeableInstance.paths = ['/unathorizedRoute']
					changeableInstance.layoutRoutes = ['/unathorizedRoute']
					req.isAuthenticated = () => false
					yield (new Promise((resolve, reject) => {
						res.redirect = res.redirectTemplate.bind(res, resolve)
						setDefaultsBeforeRequest()(req, res, next.bind(next, resolve))
					}))
					delete req.isAuthenticated
					moduleConfig.anonymousAccessRoutes = originalModuleConfig.anonymousAccessRoutes
					moduleConfig.layoutRoutes = originalModuleConfig.layoutRoutes
					moduleConfig.nonLayoutDirectRoutes = originalModuleConfig.nonLayoutDirectRoutes
					moduleConfig.unauthorizedPageRedirectRoute = originalModuleConfig.unauthorizedPageRedirectRoute
					moduleConfig.redirectUnauthorizedPagesToNotFound = originalModuleConfig.redirectUnauthorizedPagesToNotFound
					moduleConfig.notFoundRedirectRoutes = originalModuleConfig.notFoundRedirectRoutes
					delete changeableInstance.paths
					delete changeableInstance.layoutRoutes
					assert(
						(res.response.statusCode === 302) &&
						(res.response.redirectRoute === '/testRoute')
					)
					return true
				})
			})
			it('should execute successfully and continue to next if the user is not authenticated, but the route is not anonymous', function() {
				return co(function*() {
					moduleConfig.anonymousAccessRoutes = ['/unathorizedRoute']
					changeableInstance.paths = ['/unathorizedRoute']
					req.originalUrl = '/unathorizedRoute'
					req.isAuthenticated = () => false
					next.fail = null
					yield (new Promise((resolve, reject) => {
						setDefaultsBeforeRequest()(req, res, next.bind(next, resolve))
					}))
					delete req.isAuthenticated
					moduleConfig.anonymousAccessRoutes = originalModuleConfig.anonymousAccessRoutes
					delete changeableInstance.paths
					assert(
						(next.fail === false) &&
						(req.locals.error === null) &&
						(req.locals.errorStatus === 500) &&
						(req.locals.originalUrl === '/unathorizedRoute')
					)
					return true
				})
			})
		})
	}
}

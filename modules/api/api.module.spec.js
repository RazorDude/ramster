const
	assert = require('assert'),
	co = require('co'),
	fs = require('fs-extra'),
	path = require('path')

module.exports = {
	testMe: function() {
		const instance = this
		describe('api.module', function() {
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
			it('should execute testPrepareServiceNameTypeResponse successfully', function() {
				instance.testPrepareServiceNameTypeResponse(req, res, next)
				assert(true)
			})
		})
	},
	testSetDefaultsBeforeRequest: function(req, res, next) {
		const instance = this
		describe('api.module.setDefaultsBeforeRequest', function() {
			it('should execute successfully and continue to next, setting the correct req.locals parameters', function() {
				return co(function*() {
					next.fail = null
					req.originalUrl = '/someRoute'
					yield (new Promise((resolve, reject) => {
						instance.setDefaultsBeforeRequest()(req, res, next.bind(next, resolve))
					}))
					assert(
						(next.fail === false) &&
						(req.locals.error === null) &&
						(req.locals.errorStatus === 500) &&
						(req.locals.originalUrl === '/someRoute')
					)
					return true
				})
			})
		})
	},
	testPrepareServiceNameTypeResponse: function(req, res, next) {
		const instance = this
		describe('api.module.prepareServiceNameTypeResponse', function() {
			it('should execute successfully and set the serviceName to null if the route is completely paramterized', function() {
				return co(function*() {
					next.fail = null
					req.locals.originalUrl = '/1/2/3/4/5'
					yield (new Promise((resolve, reject) => {
						instance.prepareServiceNameTypeResponse()(req, res, next.bind(next, resolve))
					}))
					assert((next.fail === false) && (req.locals.serviceName === null))
					return true
				})
			})
			it('should execute successfully and set the serviceName to itself if there are no parameters', function() {
				return co(function*() {
					next.fail = null
					req.locals.originalUrl = '/read'
					yield (new Promise((resolve, reject) => {
						instance.prepareServiceNameTypeResponse()(req, res, next.bind(next, resolve))
					}))
					assert((next.fail === false) && (req.locals.serviceName === 'read'))
					return true
				})
			})
			it('should execute successfully and set the serviceName correctly if there are is only one non-parameter item', function() {
				return co(function*() {
					next.fail = null
					req.locals.originalUrl = '/1/read/2'
					yield (new Promise((resolve, reject) => {
						instance.prepareServiceNameTypeResponse()(req, res, next.bind(next, resolve))
					}))
					assert((next.fail === false) && (req.locals.serviceName === 'read'))
					return true
				})
			})
			it('should execute successfully and set the serviceName correctly if there are multiple items and no parameters', function() {
				return co(function*() {
					next.fail = null
					req.locals.originalUrl = '/users/read'
					yield (new Promise((resolve, reject) => {
						instance.prepareServiceNameTypeResponse()(req, res, next.bind(next, resolve))
					}))
					assert((next.fail === false) && (req.locals.serviceName === 'users/read'))
					return true
				})
			})
			it('should execute successfully and set the serviceName correctly if there are multiple items and parameters', function() {
				return co(function*() {
					next.fail = null
					req.locals.originalUrl = '3/users/2/read/1'
					yield (new Promise((resolve, reject) => {
						instance.prepareServiceNameTypeResponse()(req, res, next.bind(next, resolve))
					}))
					assert((next.fail === false) && (req.locals.serviceName === 'users/read'))
					return true
				})
			})
		})
	}
}

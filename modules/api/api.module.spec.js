const
	assert = require('assert'),
	co = require('co')

module.exports = {
	testMe: function() {
		const instance = this
		describe('api.module', function() {
			let req = {
					headers: {},
					connection: {},
					method: ''
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
					assert.strictEqual(next.fail, false, `bad value ${next.fail} for next.fail, expected false`)
					assert.strictEqual(req.locals.error, null, `bad value ${req.locals.error} for req.locals.error, expected null`)
					assert.strictEqual(req.locals.originalUrl, '/someRoute', `bad value ${req.locals.originalUrl} for req.locals.originalUrl, expected '/someRoute'`)
					return true
				})
			})
		})
	}
}

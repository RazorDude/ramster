'use strict'

const
	assert = require('assert'),
	co = require('co')

module.exports = {
	testMe: function() {
		const instance = this
		describe('tokenManager', function() {
			it('should execute testSignToken successfully', function() {
				instance.testSignToken()
				assert(true)
			})
			it('should execute testVerifyToken successfully', function() {
				instance.testVerifyToken()
				assert(true)
			})
			it('should execute testCreateToken successfully', function() {
				instance.testCreateToken()
				assert(true)
			})
			it('should execute testValidate successfully', function() {
				instance.testValidate()
				assert(true)
			})
			it('should execute testDeleteTokens successfully', function() {
				instance.testDeleteTokens()
				assert(true)
			})
		})
	},
	testSignToken: function() {
		const instance = this,
			{config} = this
		describe('tokenManager.signToken', function() {
			it('should throw an error if userData is undefined', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.signToken()
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if userData is not an object', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.signToken(null)
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if userData is an empty object', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.signToken({})
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if secret is undefined', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.signToken({id: -1})
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if secret is not a string', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.signToken({id: -1}, null)
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if secret is an empty string', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.signToken({id: -1}, '')
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if expiresInMinutes is not greater than 0', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.signToken({id: -1}, 'testSecret', -1)
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should execute successfully if all parameters are correct', function() {
				return co(function*() {
					yield instance.signToken({id: -1}, 'testSecret')
					assert(true)
					return true
				})
			})
		})
	},
	testVerifyToken: function() {
		const instance = this,
			{config} = this
		describe('tokenManager.verifyToken', function() {
			it('should throw an error if the token is undefined', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.verifyToken()
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if the token is not a string', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.verifyToken(null)
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if the token is an empty string', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.verifyToken('')
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if secret is undefined', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.verifyToken('fakeToken')
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if secret is not a string', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.verifyToken('fakeToken', null)
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if secret is an empty string', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.verifyToken('fakeToken', '')
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if the token is invalid', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.verifyToken('fakeToken', 'testSecret')
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if the token has expired', function() {
				return new Promise((resolve, reject) => {
					instance.signToken({id: -1}, 'testSecret', 1 / 60).then((token) => {
						setTimeout(() => {
							instance.verifyToken(token, 'testSecret').then((promiseResult) => {
								reject('Token did not expire.')
							}, (err) => {
								resolve(true)
							})
						}, 1500)
					}, (err) => {
						reject(err)
					})
				})
			})
			it('should return the correct decoded token object if all parameters are correct', function() {
				return co(function*() {
					let token = yield instance.signToken({id: -1}, 'testSecret'),
						decoded = yield instance.verifyToken(token, 'testSecret')
					assert((typeof decoded === 'object') && (decoded !== null) && (Object.keys(decoded).length === 2) && (decoded.id === -1) && (typeof decoded.iat !== 'undefined'))
					return true
				})
			})
		})
	},
	testCreateToken: function() {
		const instance = this,
			{config} = this
		describe('tokenManager.createToken', function() {
			it('should throw an error if type is not "access" or "refresh"', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.createToken()
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if userData is undefined', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.createToken('access')
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if userData is not an object', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.createToken('access', null)
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if userData is an empty object', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.createToken('access', {})
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if secret is undefined', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.createToken('access', {id: -1})
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if secret is not a string', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.createToken('access', {id: -1}, null)
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if secret is an empty string', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.createToken('access', {id: -1}, '')
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if moduleName is undefined', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.createToken('access', {id: -1}, 'testSecret')
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if moduleName is not a string', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.createToken('access', {id: -1}, 'testSecret', null)
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if moduleName is an empty string', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.createToken('access', {id: -1}, 'testSecret', '')
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should create and store a valid access token if all parameters are correct', function() {
				return co(function*() {
					let token = yield instance.createToken('access', {id: -1}, 'testSecret', 'testModuleName'),
						tokenFromRedis = yield instance.generalStore.getStoredEntry('testModuleNameuser-1AccessToken'),
						decoded = yield instance.verifyToken(token, 'testSecret')
					assert((token === tokenFromRedis) && (typeof decoded === 'object') && (decoded !== null) && (Object.keys(decoded).length === 2) && (decoded.id === -1) && (typeof decoded.iat !== 'undefined'))
					return true
				})
			})
			it('should add the existing access token to the blacklist if all parameters are correct', function() {
				return co(function*() {
					let oldTokenFromRedis = yield instance.generalStore.getStoredEntry('testModuleNameuser-1AccessToken'),
						token = yield instance.createToken('access', {id: -1}, 'testSecret', 'testModuleName'),
						oldTokenIsInBlacklist = yield instance.generalStore.getStoredEntry(`testModuleNameaccessTokenBlacklist-${oldTokenFromRedis}`)
					assert(oldTokenIsInBlacklist)
					return true
				})
			})
			it('should throw an error when creating a refresh token if there is no access token for the user and module', function() {
				return co(function*() {
					let hasThrownAnError = false,
						currentAccessToken = yield instance.generalStore.getStoredEntry('testModuleNameuser-1AccessToken')
					yield instance.generalStore.removeEntry('testModuleNameuser-1AccessToken')
					try {
						yield instance.createToken('refresh', {id: -1}, 'testSecret', 'testModuleName')
					} catch(e) {
						hasThrownAnError = true
					}
					yield instance.generalStore.storeEntry('testModuleNameuser-1AccessToken', currentAccessToken)
					assert(hasThrownAnError)
					return true
				})
			})
			it('should create and store a valid refresh token if all parameters are correct', function() {
				return co(function*() {
					let token = yield instance.createToken('refresh', {id: -1}, 'testSecret', 'testModuleName'),
						currentAccessToken = yield instance.generalStore.getStoredEntry('testModuleNameuser-1AccessToken'),
						tokenFromRedis = yield instance.generalStore.getStoredEntry(`testModuleNameuser-1RefreshTokenForAccessToken${currentAccessToken}`),
						decoded = yield instance.verifyToken(token, 'testSecret')
					assert((token === tokenFromRedis) && (typeof decoded === 'object') && (decoded !== null) && (Object.keys(decoded).length === 2) && (decoded.id === -1) && (typeof decoded.iat !== 'undefined'))
					return true
				})
			})
			it('should add the existing access refresh to the blacklist if all parameters are correct', function() {
				return co(function*() {
					let currentAccessToken = yield instance.generalStore.getStoredEntry('testModuleNameuser-1AccessToken'),
						oldTokenFromRedis = yield instance.generalStore.getStoredEntry(`testModuleNameuser-1RefreshTokenForAccessToken${currentAccessToken}`),
						token = yield instance.createToken('refresh', {id: -1}, 'testSecret', 'testModuleName'),
						oldTokenIsInBlacklist = yield instance.generalStore.getStoredEntry(`testModuleNamerefreshTokenBlacklist-${oldTokenFromRedis}`)
					assert(oldTokenIsInBlacklist)
					return true
				})
			})
		})
	},
	testValidate: function() {
		const instance = this,
			{config, errorLogger, generalStore} = this,
			validate = this.validate()
		let req = {
				locals: {
					moduleName: 'mobile',
					moduleType: 'apis',
					config: JSON.parse(JSON.stringify(config)),
					tokenManager: instance,
					logger: {error: (e) => e}
				},
				headers: {
					authorization: ''
				}
			},
			res = {
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
				json: function(resolvePromise, jsonObject) {
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
		describe('tokenManager.validate', function() {
			it('should throw a status 401 error with the correct message and pass it to "next" if no "authorization" header is provided and moduleConfig.passErrorToNext is true', function() {
				return co(function*() {
					delete req.headers.authorization
					req.locals.config.apis.mobile.passErrorToNext = true
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						validate(req, res, next.bind(next, resolve))
					}))
					assert(next.fail && (next.errorStatus === 401) && (next.errorMessage === 'No access token provided.'))
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if no "authorization" header is provided and moduleConfig.passErrorToNext is false', function() {
				req.locals.config.apis.mobile.passErrorToNext = false
				res.json = res.jsonTemplate.bind(res, null)
				validate(req, res, next.bind(next, null))
				assert(res.response && (res.response.statusCode === 401) && res.response.jsonBody && (res.response.jsonBody.message === 'No access token provided.'))
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an ill-formed "authorization" header is provided and moduleConfig.passErrorToNext is true', function() {
				return co(function*() {
					req.headers.authorization = 'NotBearer NotToken'
					req.locals.config.apis.mobile.passErrorToNext = true
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						validate(req, res, next.bind(next, resolve))
					}))
					assert(next.fail && (next.errorStatus === 401) && (next.errorMessage === 'No access token provided.'))
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an ill-formed "authorization" header is provided and moduleConfig.passErrorToNext is false', function() {
				req.headers.authorization = 'NotBearer NotToken'
				req.locals.config.apis.mobile.passErrorToNext = false
				res.json = res.jsonTemplate.bind(res, null)
				validate(req, res, next.bind(next, null))
				assert(res.response && (res.response.statusCode === 401) && res.response.jsonBody && (res.response.jsonBody.message === 'No access token provided.'))
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an invalid access token is provided and moduleConfig.passErrorToNext is true', function() {
				return co(function*() {
					req.headers.authorization = 'Bearer invalidAccessToken'
					req.locals.config.apis.mobile.passErrorToNext = true
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						validate(req, res, next.bind(next, resolve))
					}))
					assert(next.fail && (next.errorStatus === 401) && (next.errorMessage === 'Failed to verify token.'))
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an invalid access token is provided and moduleConfig.passErrorToNext is false', function() {
				return co(function*() {
					req.headers.authorization = 'Bearer invalidAccessToken'
					req.locals.config.apis.mobile.passErrorToNext = false
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						validate(req, res, next.bind(next, resolve))
					}))
					assert(res.response && (res.response.statusCode === 401) && res.response.jsonBody && (res.response.jsonBody.message === 'Failed to verify token.'))
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an ill-formed access token is provided and moduleConfig.passErrorToNext is true', function() {
				return co(function*() {
					let token = yield instance.signToken({someRandomKey: true}, req.locals.config.apis.mobile.jwt.secret)
					req.headers.authorization = `Bearer ${token}`
					req.locals.config.apis.mobile.passErrorToNext = true
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						validate(req, res, next.bind(next, resolve))
					}))
					assert(next.fail && (next.errorStatus === 401) && (next.errorMessage === 'Invalid access token.'))
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an ill-formed access token is provided and moduleConfig.passErrorToNext is false', function() {
				return co(function*() {
					let token = yield instance.signToken({someRandomKey: true}, req.locals.config.apis.mobile.jwt.secret)
					req.headers.authorization = `Bearer ${token}`
					req.locals.config.apis.mobile.passErrorToNext = false
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						validate(req, res, next.bind(next, resolve))
					}))
					assert(res.response && (res.response.statusCode === 401) && res.response.jsonBody && (res.response.jsonBody.message === 'Invalid access token.'))
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if a blacklisted access token is provided and moduleConfig.passErrorToNext is true', function() {
				return co(function*() {
					let blacklistedToken = yield instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile')
					yield instance.createToken('access', {id: -1, someRandomKey: true}, req.locals.config.apis.mobile.jwt.secret, 'mobile')
					req.headers.authorization = `Bearer ${blacklistedToken}`
					req.locals.config.apis.mobile.passErrorToNext = true
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						validate(req, res, next.bind(next, resolve))
					}))
					assert(next.fail && (next.errorStatus === 401) && (next.errorMessage === 'Invalid access token.'))
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if a blacklisted access token is provided and moduleConfig.passErrorToNext is false', function() {
				return co(function*() {
					let blacklistedToken = yield instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile')
					yield instance.createToken('access', {id: -1, someRandomKey: true}, req.locals.config.apis.mobile.jwt.secret, 'mobile')
					req.headers.authorization = `Bearer ${blacklistedToken}`
					req.locals.config.apis.mobile.passErrorToNext = false
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						validate(req, res, next.bind(next, resolve))
					}))
					assert(res.response && (res.response.statusCode === 401) && res.response.jsonBody && (res.response.jsonBody.message === 'Invalid access token.'))
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if a valid access token, which is not the user\'s current one, is provided and moduleConfig.passErrorToNext is true', function() {
				return co(function*() {
					let nonCurrentToken = yield instance.signToken({id: -1, someRandomKey: true}, req.locals.config.apis.mobile.jwt.secret)
					yield instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile')
					req.headers.authorization = `Bearer ${nonCurrentToken}`
					req.locals.config.apis.mobile.passErrorToNext = true
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						validate(req, res, next.bind(next, resolve))
					}))
					assert(next.fail && (next.errorStatus === 401) && (next.errorMessage === 'Invalid access token.'))
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if a valid access token, which is not the user\'s current one, is provided and moduleConfig.passErrorToNext is false', function() {
				return co(function*() {
					let nonCurrentToken = yield instance.signToken({id: -1, someRandomKey: true}, req.locals.config.apis.mobile.jwt.secret)
					yield instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile')
					req.headers.authorization = `Bearer ${nonCurrentToken}`
					req.locals.config.apis.mobile.passErrorToNext = false
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						validate(req, res, next.bind(next, resolve))
					}))
					assert(res.response && (res.response.statusCode === 401) && res.response.jsonBody && (res.response.jsonBody.message === 'Invalid access token.'))
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an expired access token is provided, moduleConfig.passErrorToNext is true and moduleConfig.jwt.useRefreshTokens is false', function() {
				return new Promise((resolve, reject) => {
					instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60).then((token) => {
						req.headers.authorization = `Bearer ${token}`
						req.locals.config.apis.mobile.passErrorToNext = true
						setTimeout(() => {
							(new Promise((innerResolve, innerReject) => {
								res.json = res.jsonTemplate.bind(res, innerResolve)
								validate(req, res, next.bind(next, innerResolve))
							})).then((promiseResult) => {
								if (next.fail && (next.errorStatus === 401) && (next.errorMessage === 'Access token expired.')) {
									resolve()
									return
								}
								reject({hasFailed: next.fail, errorStatus: next.errorStatus, errorMessage: next.errorMessage})
							}, (err) => {
								reject(err)
							})
						}, 1500)
					}, (err) => {
						reject(err)
					})
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an expired access token is provided, moduleConfig.passErrorToNext is false and moduleConfig.jwt.useRefreshTokens is false', function() {
				return new Promise((resolve, reject) => {
					instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60).then((token) => {
						req.headers.authorization = `Bearer ${token}`
						req.locals.config.apis.mobile.passErrorToNext = false
						setTimeout(() => {
							(new Promise((innerResolve, innerReject) => {
								res.json = res.jsonTemplate.bind(res, innerResolve)
								validate(req, res, next.bind(next, innerResolve))
							})).then((promiseResult) => {
								if (res.response && (res.response.statusCode === 401) && res.response.jsonBody && (res.response.jsonBody.message === 'Access token expired.')) {
									resolve()
									return
								}
								reject({response: res.response})
							}, (err) => {
								reject(err)
							})
						}, 1500)
					}, (err) => {
						reject(err)
					})
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an expired access token is provided, moduleConfig.passErrorToNext is true, moduleConfig.jwt.useRefreshTokens is true and no refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60).then((token) => {
						req.headers.authorization = `Bearer ${token}`
						req.locals.config.apis.mobile.passErrorToNext = true
						req.locals.config.apis.mobile.jwt.useRefreshTokens = true
						setTimeout(() => {
							(new Promise((innerResolve, innerReject) => {
								res.json = res.jsonTemplate.bind(res, innerResolve)
								validate(req, res, next.bind(next, innerResolve))
							})).then((promiseResult) => {
								req.locals.config.apis.mobile.jwt.useRefreshTokens = false
								if (next.fail && (next.errorStatus === 401) && (next.errorMessage === 'Access token expired. No refresh token provided.')) {
									resolve()
									return
								}
								reject({hasFailed: next.fail, errorStatus: next.errorStatus, errorMessage: next.errorMessage})
							}, (err) => {
								req.locals.config.apis.mobile.jwt.useRefreshTokens = false
								reject(err)
							})
						}, 1500)
					}, (err) => {
						req.locals.config.apis.mobile.jwt.useRefreshTokens = false
						reject(err)
					})
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an expired access token is provided, moduleConfig.passErrorToNext is false, moduleConfig.jwt.useRefreshTokens is true and no refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60).then((token) => {
						req.headers.authorization = `Bearer ${token}`
						req.locals.config.apis.mobile.passErrorToNext = false
						req.locals.config.apis.mobile.jwt.useRefreshTokens = true
						setTimeout(() => {
							(new Promise((innerResolve, innerReject) => {
								res.json = res.jsonTemplate.bind(res, innerResolve)
								validate(req, res, next.bind(next, innerResolve))
							})).then((promiseResult) => {
								req.locals.config.apis.mobile.jwt.useRefreshTokens = false
								if (res.response && (res.response.statusCode === 401) && res.response.jsonBody && (res.response.jsonBody.message === 'Access token expired. No refresh token provided.')) {
									resolve()
									return
								}
								reject({response: res.response})
							}, (err) => {
								req.locals.config.apis.mobile.jwt.useRefreshTokens = false
								reject(err)
							})
						}, 1500)
					}, (err) => {
						req.locals.config.apis.mobile.jwt.useRefreshTokens = false
						reject(err)
					})
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an expired access token is provided, moduleConfig.passErrorToNext is true, moduleConfig.jwt.useRefreshTokens is true and an invalid refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60).then((token) => {
						req.headers.authorization = `Bearer ${token} invalidRefreshToken`
						req.locals.config.apis.mobile.passErrorToNext = true
						req.locals.config.apis.mobile.jwt.useRefreshTokens = true
						setTimeout(() => {
							(new Promise((innerResolve, innerReject) => {
								res.json = res.jsonTemplate.bind(res, innerResolve)
								validate(req, res, next.bind(next, innerResolve))
							})).then((promiseResult) => {
								req.locals.config.apis.mobile.jwt.useRefreshTokens = false
								if (next.fail && (next.errorStatus === 401) && (next.errorMessage === 'Access token expired. Failed to verify token.')) {
									resolve()
									return
								}
								reject({hasFailed: next.fail, errorStatus: next.errorStatus, errorMessage: next.errorMessage})
							}, (err) => {
								req.locals.config.apis.mobile.jwt.useRefreshTokens = false
								reject(err)
							})
						}, 1500)
					}, (err) => {
						req.locals.config.apis.mobile.jwt.useRefreshTokens = false
						reject(err)
					})
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an expired access token is provided, moduleConfig.passErrorToNext is false, moduleConfig.jwt.useRefreshTokens is true and an invalid refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60).then((token) => {
						req.headers.authorization = `Bearer ${token} invalidRefreshToken`
						req.locals.config.apis.mobile.passErrorToNext = false
						req.locals.config.apis.mobile.jwt.useRefreshTokens = true
						setTimeout(() => {
							(new Promise((innerResolve, innerReject) => {
								res.json = res.jsonTemplate.bind(res, innerResolve)
								validate(req, res, next.bind(next, innerResolve))
							})).then((promiseResult) => {
								req.locals.config.apis.mobile.jwt.useRefreshTokens = false
								if (res.response && (res.response.statusCode === 401) && res.response.jsonBody && (res.response.jsonBody.message === 'Access token expired. Failed to verify token.')) {
									resolve()
									return
								}
								reject({response: res.response})
							}, (err) => {
								req.locals.config.apis.mobile.jwt.useRefreshTokens = false
								reject(err)
							})
						}, 1500)
					}, (err) => {
						req.locals.config.apis.mobile.jwt.useRefreshTokens = false
						reject(err)
					})
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an expired access token is provided, moduleConfig.passErrorToNext is true, moduleConfig.jwt.useRefreshTokens is true and an ill-formed refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60)
						req.headers.authorization = `Bearer ${accessToken} ${yield instance.signToken({someRandomKey: true}, req.locals.config.apis.mobile.jwt.secret)}`
						req.locals.config.apis.mobile.passErrorToNext = true
						req.locals.config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									validate(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									if (next.fail && (next.errorStatus === 401) && (next.errorMessage === 'Access token expired. Invalid refresh token.')) {
										resolve()
										return
									}
									reject({hasFailed: next.fail, errorStatus: next.errorStatus, errorMessage: next.errorMessage})
								}, (err) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							req.locals.config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an expired access token is provided, moduleConfig.passErrorToNext is false, moduleConfig.jwt.useRefreshTokens is true and an ill-formed refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60)
						req.headers.authorization = `Bearer ${accessToken} ${yield instance.signToken({someRandomKey: true}, req.locals.config.apis.mobile.jwt.secret)}`
						req.locals.config.apis.mobile.passErrorToNext = false
						req.locals.config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									validate(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									if (res.response && (res.response.statusCode === 401) && res.response.jsonBody && (res.response.jsonBody.message === 'Access token expired. Invalid refresh token.')) {
										resolve()
										return
									}
									reject({hasFailed: next.fail, errorStatus: next.errorStatus, errorMessage: next.errorMessage})
								}, (err) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							req.locals.config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an expired access token is provided, moduleConfig.passErrorToNext is true, moduleConfig.jwt.useRefreshTokens is true and a blacklisted refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60),
							blacklistedRefreshToken = yield instance.createToken('refresh', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile')
						yield instance.createToken('refresh', {id: -1, someRandomKey: true}, req.locals.config.apis.mobile.jwt.secret, 'mobile')
						req.headers.authorization = `Bearer ${accessToken} ${blacklistedRefreshToken}`
						req.locals.config.apis.mobile.passErrorToNext = true
						req.locals.config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									validate(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									if (next.fail && (next.errorStatus === 401) && (next.errorMessage === 'Access token expired. Invalid refresh token.')) {
										resolve()
										return
									}
									reject({hasFailed: next.fail, errorStatus: next.errorStatus, errorMessage: next.errorMessage})
								}, (err) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							req.locals.config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an expired access token is provided, moduleConfig.passErrorToNext is false, moduleConfig.jwt.useRefreshTokens is true and a blacklisted refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60),
							blacklistedRefreshToken = yield instance.createToken('refresh', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile')
						yield instance.createToken('refresh', {id: -1, someRandomKey: true}, req.locals.config.apis.mobile.jwt.secret, 'mobile')
						req.headers.authorization = `Bearer ${accessToken} ${blacklistedRefreshToken}`
						req.locals.config.apis.mobile.passErrorToNext = false
						req.locals.config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									validate(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									if (res.response && (res.response.statusCode === 401) && res.response.jsonBody && (res.response.jsonBody.message === 'Access token expired. Invalid refresh token.')) {
										resolve()
										return
									}
									reject({hasFailed: next.fail, errorStatus: next.errorStatus, errorMessage: next.errorMessage})
								}, (err) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							req.locals.config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an expired access token is provided, moduleConfig.passErrorToNext is true, moduleConfig.jwt.useRefreshTokens is true and a valid refresh token, which is not the user\'s current one, is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60)
						yield instance.createToken('refresh', {id: -1, someRandomKey: true}, req.locals.config.apis.mobile.jwt.secret, 'mobile')
						req.headers.authorization = `Bearer ${accessToken} ${yield instance.signToken({id: -1}, req.locals.config.apis.mobile.jwt.secret)}`
						req.locals.config.apis.mobile.passErrorToNext = true
						req.locals.config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									validate(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									if (next.fail && (next.errorStatus === 401) && (next.errorMessage === 'Access token expired. Invalid refresh token.')) {
										resolve()
										return
									}
									reject({hasFailed: next.fail, errorStatus: next.errorStatus, errorMessage: next.errorMessage})
								}, (err) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							req.locals.config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an expired access token is provided, moduleConfig.passErrorToNext is false, moduleConfig.jwt.useRefreshTokens is true and a valid refresh token, which is not the user\'s current one, is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60)
						yield instance.createToken('refresh', {id: -1, someRandomKey: true}, req.locals.config.apis.mobile.jwt.secret, 'mobile')
						req.headers.authorization = `Bearer ${accessToken} ${yield instance.signToken({id: -1}, req.locals.config.apis.mobile.jwt.secret)}`
						req.locals.config.apis.mobile.passErrorToNext = false
						req.locals.config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									validate(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									if (res.response && (res.response.statusCode === 401) && res.response.jsonBody && (res.response.jsonBody.message === 'Access token expired. Invalid refresh token.')) {
										resolve()
										return
									}
									reject({hasFailed: next.fail, errorStatus: next.errorStatus, errorMessage: next.errorMessage})
								}, (err) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							req.locals.config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an expired access token is provided, moduleConfig.passErrorToNext is true, moduleConfig.jwt.useRefreshTokens is true and an expired refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60),
							refreshToken = yield instance.createToken('refresh', {id: -1, someRandomKey: true}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60)
						req.headers.authorization = `Bearer ${accessToken} ${refreshToken}`
						req.locals.config.apis.mobile.passErrorToNext = true
						req.locals.config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									validate(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									if (next.fail && (next.errorStatus === 401) && (next.errorMessage === 'Access token expired. Refresh token expired.')) {
										resolve()
										return
									}
									reject({hasFailed: next.fail, errorStatus: next.errorStatus, errorMessage: next.errorMessage})
								}, (err) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							req.locals.config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an expired access token is provided, moduleConfig.passErrorToNext is false, moduleConfig.jwt.useRefreshTokens is true and an expired refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60),
							refreshToken = yield instance.createToken('refresh', {id: -1, someRandomKey: true}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60)
						req.headers.authorization = `Bearer ${accessToken} ${refreshToken}`
						req.locals.config.apis.mobile.passErrorToNext = false
						req.locals.config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									validate(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									if (res.response && (res.response.statusCode === 401) && res.response.jsonBody && (res.response.jsonBody.message === 'Access token expired. Refresh token expired.')) {
										resolve()
										return
									}
									reject({hasFailed: next.fail, errorStatus: next.errorStatus, errorMessage: next.errorMessage})
								}, (err) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							req.locals.config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should execute "next" with no arguments sucessfully and set "req.user" to the valid decoded object if a valid access token is provided', function() {
				return co(function*() {
					req.headers.authorization = `Bearer ${yield instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile')}`
					req.locals.config.apis.mobile.passErrorToNext = true
					delete req.user
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						validate(req, res, next.bind(next, resolve))
					}))
					assert(!next.fail && req.user && (Object.keys(req.user).length === 2) && (req.user.id === -1) && (typeof req.user.iat !== 'undefined'))
					return true
				})
			})
			it('should execute "next" with no arguments sucessfully, set "req.user" to the valid decoded object if an expired access token is provided, moduleConfig.jwt.useRefreshTokens is true a valid refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60),
							refreshToken = yield instance.createToken('refresh', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile')
						req.headers.authorization = `Bearer ${accessToken} ${refreshToken}`
						req.locals.config.apis.mobile.passErrorToNext = false
						req.locals.config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									validate(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									if (!next.fail && req.user && (Object.keys(req.user).length === 2) && (req.user.id === -1) && (typeof req.user.iat !== 'undefined')) {
										resolve()
										return
									}
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									reject({hasFailed: next.fail, errorStatus: next.errorStatus, errorMessage: next.errorMessage})
								}, (err) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							req.locals.config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should execute "next" with no arguments sucessfully, set "authorization-newaccesstoken" to the new access token and set the current refresh token for it if an expired access token is provided, moduleConfig.jwt.useRefreshTokens is true a valid refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile', 1 / 60),
							refreshToken = yield instance.createToken('refresh', {id: -1}, req.locals.config.apis.mobile.jwt.secret, 'mobile')
						req.headers.authorization = `Bearer ${accessToken} ${refreshToken}`
						req.locals.config.apis.mobile.passErrorToNext = false
						req.locals.config.apis.mobile.jwt.useRefreshTokens = true
						return refreshToken
					}).then((refreshToken) => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									validate(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									co(function*() {
										req.locals.config.apis.mobile.jwt.useRefreshTokens = false
										if (!next.fail && req.user && (Object.keys(req.user).length === 2) && (req.user.id === -1) && (typeof req.user.iat !== 'undefined')) {
											if (res.headers && res.headers['authorization-newaccesstoken']) {
												let newAccessToken = res.headers['authorization-newaccesstoken'],
													newAccessTokenFromRedis = yield generalStore.getStoredEntry('mobileuser-1AccessToken')
												if (newAccessToken !== newAccessTokenFromRedis) {
													reject('Incorrect "authorization-newaccesstoken" header set by the validate method.')
													return
												}
												let refreshTokenFromRedis = yield generalStore.getStoredEntry(`mobileuser-1RefreshTokenForAccessToken${newAccessToken}`)
												if (refreshToken !== refreshTokenFromRedis) {
													reject('Incorrect refresh token set for the new access token.')
													return
												}
												resolve()
												return
											}
										}
										req.locals.config.apis.mobile.jwt.useRefreshTokens = false
										reject({hasFailed: next.fail, errorStatus: next.errorStatus, errorMessage: next.errorMessage})
									}).then(() => {
									}, (err) => {
										req.locals.config.apis.mobile.jwt.useRefreshTokens = false
										reject(err)
									})
								}, (err) => {
									req.locals.config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							req.locals.config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
		})
	},
	testDeleteTokens: function() {
		const instance = this,
			{config} = this
		describe('tokenManager.deleteTokens', function() {
			it('should throw an error if userId is undefined', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.deleteTokens()
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if userId cannot be parsed to an interger', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.deleteTokens('naynay')
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if moduleName is undefined', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.deleteTokens(-1)
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if moduleName is not a string', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.deleteTokens(-1, null)
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should throw an error if moduleName is an empty string', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.deleteTokens(-1, '')
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
				})
			})
			it('should execute successfully if all parameters are correct', function() {
				return co(function*() {
					yield instance.deleteTokens(-1, 'mobile')
					assert(true)
					return true
				})
			})
		})
	}
}

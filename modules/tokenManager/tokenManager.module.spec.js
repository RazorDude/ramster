const
	assert = require('assert'),
	co = require('co'),
	wrap = require('co-express')

module.exports = {
	testMe: function() {
		const instance = this
		describe('tokenManager', function() {
			it('should execute testSignToken successfully', function() {
				instance.testSignToken()
			})
			it('should execute testVerifyToken successfully', function() {
				instance.testVerifyToken()
			})
			it('should execute testCreateToken successfully', function() {
				instance.testCreateToken()
			})
			it('should execute testValidate successfully', function() {
				instance.testValidate()
			})
			it('should execute testDeleteTokens successfully', function() {
				instance.testDeleteTokens()
			})
		})
	},
	testSignToken: function() {
		const instance = this
		describe('tokenManager.signToken', function() {
			it('should throw an error if userData is undefined', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.signToken()
					} catch(e) {
						hasThrownAnError = true
					}
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
					return true
				})
			})
			it('should execute successfully if all parameters are correct', function() {
				return co(function*() {
					yield instance.signToken({id: -1}, 'testSecret')
					return true
				})
			})
		})
	},
	testVerifyToken: function() {
		const instance = this
		describe('tokenManager.verifyToken', function() {
			it('should throw an error if the token is undefined', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.verifyToken()
					} catch(e) {
						hasThrownAnError = true
					}
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error if the token has expired', function() {
				return new Promise((resolve, reject) => {
					instance.signToken({id: -1}, 'testSecret', 1 / 60).then((token) => {
						setTimeout(() => {
							instance.verifyToken(token, 'testSecret').then(() => {
								reject('Token did not expire.')
							}, () => {
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
						decoded = yield instance.verifyToken(token, 'testSecret'),
						typeofDecoded = typeof decoded,
						decodedKeysLength = Object.keys(decoded).length,
						typeOfIat = typeof decoded.iat
					assert.strictEqual(typeofDecoded, 'object', `bad value ${typeofDecoded} for typeof decoded, expected object`)
					assert(decoded !== null, `bad value null for decoded, expected it to be non-null`)
					assert.strictEqual(decodedKeysLength, 2, `bad value ${decodedKeysLength} for decodedKeysLength, expected 2`)
					assert.strictEqual(decoded.id, -1, `bad value ${decoded.id} for decoded.id, expected -1`)
					assert(typeOfIat !== 'undefined', `bad value undefined for typeOfIat, expected it to exist`)
					return true
				})
			})
		})
	},
	testCreateToken: function() {
		const instance = this
		describe('tokenManager.createToken', function() {
			it('should throw an error if type is not "access" or "refresh"', function() {
				return co(function*() {
					let hasThrownAnError = false
					try {
						yield instance.createToken()
					} catch(e) {
						hasThrownAnError = true
					}
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
					return true
				})
			})
			it('should create and store a valid access token if all parameters are correct', function() {
				return co(function*() {
					let token = yield instance.createToken('access', {id: -1}, 'testSecret', 'testModuleName'),
						tokenFromRedis = yield instance.generalStore.getStoredEntry('module-testModuleName-userId--1-accessToken'),
						decoded = yield instance.verifyToken(token, 'testSecret'),
						typeofDecoded = typeof decoded,
						decodedKeysLength = Object.keys(decoded).length,
						typeOfIat = typeof decoded.iat
					assert.strictEqual(tokenFromRedis, token, `bad value ${tokenFromRedis} for token, expected ${token}`)
					assert.strictEqual(typeofDecoded, 'object', `bad value ${typeofDecoded} for typeof decoded, expected object`)
					assert(decoded !== null, `bad value null for decoded, expected it to be non-null`)
					assert.strictEqual(decodedKeysLength, 2, `bad value ${decodedKeysLength} for decodedKeysLength, expected 2`)
					assert.strictEqual(decoded.id, -1, `bad value ${decoded.id} for decoded.id, expected -1`)
					assert(typeOfIat !== 'undefined', `bad value undefined for typeOfIat, expected it to exist`)
					return true
				})
			})
			it('should add the existing access token to the blacklist if all parameters are correct', function() {
				return co(function*() {
					let oldTokenFromRedis = yield instance.generalStore.getStoredEntry('module-testModuleName-userId--1-accessToken'),
						token = yield instance.createToken('access', {id: -1}, 'testSecret', 'testModuleName'),
						oldTokenIsInBlacklist = yield instance.generalStore.getStoredEntry(`module-testModuleName-accessTokenBlacklist-${oldTokenFromRedis}`)
					assert.strictEqual(oldTokenIsInBlacklist, 'true', `bad value ${oldTokenIsInBlacklist} for oldTokenIsInBlacklist, expected 'true'`)
					return true
				})
			})
			it('should throw an error when creating a refresh token if there is no access token for the user and module', function() {
				return co(function*() {
					let hasThrownAnError = false,
						currentAccessToken = yield instance.generalStore.getStoredEntry('module-testModuleName-userId--1-accessToken')
					yield instance.generalStore.removeEntry('module-testModuleName-userId--1-accessToken')
					try {
						yield instance.createToken('refresh', {id: -1}, 'testSecret', 'testModuleName')
					} catch(e) {
						hasThrownAnError = true
					}
					yield instance.generalStore.storeEntry('module-testModuleName-userId--1-accessToken', currentAccessToken)
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
					return true
				})
			})
			it('should create and store a valid refresh token if all parameters are correct', function() {
				return co(function*() {
					let token = yield instance.createToken('refresh', {id: -1}, 'testSecret', 'testModuleName'),
						currentAccessToken = yield instance.generalStore.getStoredEntry('module-testModuleName-userId--1-accessToken'),
						tokenFromRedis = yield instance.generalStore.getStoredEntry(`module-testModuleName-userId--1-refreshTokenForAccessToken-${currentAccessToken}`),
						decoded = yield instance.verifyToken(token, 'testSecret'),
						typeofDecoded = typeof decoded,
						decodedKeysLength = Object.keys(decoded).length,
						typeOfIat = typeof decoded.iat
					assert.strictEqual(tokenFromRedis, token, `bad value ${tokenFromRedis} for token, expected ${token}`)
					assert.strictEqual(typeofDecoded, 'object', `bad value ${typeofDecoded} for typeof decoded, expected object`)
					assert(decoded !== null, `bad value null for decoded, expected it to be non-null`)
					assert.strictEqual(decodedKeysLength, 2, `bad value ${decodedKeysLength} for decodedKeysLength, expected 2`)
					assert.strictEqual(decoded.id, -1, `bad value ${decoded.id} for decoded.id, expected -1`)
					assert(typeOfIat !== 'undefined', `bad value undefined for typeOfIat, expected it to exist`)
					return true
				})
			})
			it('should add the existing access refresh to the blacklist if all parameters are correct', function() {
				return co(function*() {
					let currentAccessToken = yield instance.generalStore.getStoredEntry('module-testModuleName-userId--1-accessToken'),
						oldTokenFromRedis = yield instance.generalStore.getStoredEntry(`module-testModuleName-userId--1-refreshTokenForAccessToken-${currentAccessToken}`),
						token = yield instance.createToken('refresh', {id: -1}, 'testSecret', 'testModuleName'),
						oldTokenIsInBlacklist = yield instance.generalStore.getStoredEntry(`module-testModuleName-refreshTokenBlacklist-${oldTokenFromRedis}`)
					assert.strictEqual(oldTokenIsInBlacklist, 'true', `bad value ${oldTokenIsInBlacklist} for oldTokenIsInBlacklist, expected 'true'`)
					return true
				})
			})
		})
	},
	testValidate: function() {
		const instance = this,
			{errorLogger, generalStore} = this,
			validate = this.validate()
		let {config} = this,
			req = {
				locals: {
					moduleName: 'mobile',
					moduleType: 'api'
					// logger: {error: (e) => e}
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
			it('should append the correct req.isAuthenticated method at the start of execution, regardless of execution outcome', function() {
				return co(function*() {
					delete req.headers.authorization
					config.apis.mobile.passErrorToNext = true
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(validate)(req, res, next.bind(next, resolve))
					}))
					let typeOf = typeof req.isAuthenticated
					assert.strictEqual(typeOf, 'function', `bad value ${typeOf} for typeof req.isAuthenticated, expected function`)
					assert.strictEqual(req.isAuthenticated(), false, `bad value ${req.isAuthenticated()} for req.isAuthenticated(), expected false`)
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if no "authorization" header is provided and moduleConfig.passErrorToNext is true', function() {
				return co(function*() {
					delete req.headers.authorization
					config.apis.mobile.passErrorToNext = true
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(validate)(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(next.fail, true, `bad value ${next.fail} for next.fail, expected true`)
					assert.strictEqual(next.errorStatus, 401, `bad value ${next.errorStatus} for next.errorStatus, expected 401`)
					assert.strictEqual(next.errorMessage, 'No access token provided.', `bad value ${next.errorMessage} for next.errorMessage, expected No access token provided.`)
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if no "authorization" header is provided and moduleConfig.passErrorToNext is false', function() {
				return co(function*() {
					config.apis.mobile.passErrorToNext = false
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(validate)(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(res.response.statusCode, 401, `bad value ${res.response.statusCode} for res.response.statusCode, expected 401`)
					assert.strictEqual(
						res.response.jsonBody.message,
						'No access token provided.',
						`bad value ${res.response.jsonBody.message} for res.response.jsonBody.message, expected No access token provided.`
					)
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an ill-formed "authorization" header is provided and moduleConfig.passErrorToNext is true', function() {
				return co(function*() {
					req.headers.authorization = 'NotBearer NotToken'
					config.apis.mobile.passErrorToNext = true
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(validate)(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(next.fail, true, `bad value ${next.fail} for next.fail, expected true`)
					assert.strictEqual(next.errorStatus, 401, `bad value ${next.errorStatus} for next.errorStatus, expected 401`)
					assert.strictEqual(next.errorMessage, 'No access token provided.', `bad value ${next.errorMessage} for next.errorMessage, expected No access token provided.`)
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an ill-formed "authorization" header is provided and moduleConfig.passErrorToNext is false', function() {
				return co(function*() {
					req.headers.authorization = 'NotBearer NotToken'
					config.apis.mobile.passErrorToNext = false
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(validate)(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(res.response.statusCode, 401, `bad value ${res.response.statusCode} for res.response.statusCode, expected 401`)
					assert.strictEqual(
						res.response.jsonBody.message,
						'No access token provided.',
						`bad value ${res.response.jsonBody.message} for res.response.jsonBody.message, expected No access token provided.`
					)
					return true
				})
			})
			it('should throw a status 400 error with the correct message and pass it to "next" if an invalid access token is provided and moduleConfig.passErrorToNext is true', function() {
				return co(function*() {
					req.headers.authorization = 'Bearer invalidAccessToken'
					config.apis.mobile.passErrorToNext = true
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(validate)(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(next.fail, true, `bad value ${next.fail} for next.fail, expected true`)
					assert.strictEqual(next.errorStatus, 400, `bad value ${next.errorStatus} for next.errorStatus, expected 400`)
					assert.strictEqual(next.errorMessage, 'Failed to verify token.', `bad value ${next.errorMessage} for next.errorMessage, expected Failed to verify token.`)
					return true
				})
			})
			it('should throw a status 400 error with the correct message and pass it to "res" (.status and .json) if an invalid access token is provided and moduleConfig.passErrorToNext is false', function() {
				return co(function*() {
					req.headers.authorization = 'Bearer invalidAccessToken'
					config.apis.mobile.passErrorToNext = false
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(validate)(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(res.response.statusCode, 400, `bad value ${res.response.statusCode} for res.response.statusCode, expected 400`)
					assert.strictEqual(
						res.response.jsonBody.message,
						'Failed to verify token.',
						`bad value ${res.response.jsonBody.message} for res.response.jsonBody.message, expected Failed to verify token.`
					)
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an ill-formed access token is provided and moduleConfig.passErrorToNext is true', function() {
				return co(function*() {
					let token = yield instance.signToken({someRandomKey: true}, config.apis.mobile.jwt.secret)
					req.headers.authorization = `Bearer ${token}`
					config.apis.mobile.passErrorToNext = true
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(validate)(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(next.fail, true, `bad value ${next.fail} for next.fail, expected true`)
					assert.strictEqual(next.errorStatus, 401, `bad value ${next.errorStatus} for next.errorStatus, expected 401`)
					assert.strictEqual(next.errorMessage, 'Invalid access token.', `bad value ${next.errorMessage} for next.errorMessage, expected Invalid access token.`)
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an ill-formed access token is provided and moduleConfig.passErrorToNext is false', function() {
				return co(function*() {
					let token = yield instance.signToken({someRandomKey: true}, config.apis.mobile.jwt.secret)
					req.headers.authorization = `Bearer ${token}`
					config.apis.mobile.passErrorToNext = false
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(validate)(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(
						res.response.jsonBody.message,
						'Invalid access token.',
						`bad value ${res.response.jsonBody.message} for res.response.jsonBody.message, expected Invalid access token.`
					)
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if a blacklisted access token is provided and moduleConfig.passErrorToNext is true', function() {
				return co(function*() {
					let blacklistedToken = yield instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile')
					yield instance.createToken('access', {id: -1, someRandomKey: true}, config.apis.mobile.jwt.secret, 'mobile')
					req.headers.authorization = `Bearer ${blacklistedToken}`
					config.apis.mobile.passErrorToNext = true
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(validate)(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(next.fail, true, `bad value ${next.fail} for next.fail, expected true`)
					assert.strictEqual(next.errorStatus, 401, `bad value ${next.errorStatus} for next.errorStatus, expected 401`)
					assert.strictEqual(next.errorMessage, 'Invalid access token.', `bad value ${next.errorMessage} for next.errorMessage, expected Invalid access token.`)
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if a blacklisted access token is provided and moduleConfig.passErrorToNext is false', function() {
				return co(function*() {
					let blacklistedToken = yield instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile')
					yield instance.createToken('access', {id: -1, someRandomKey: true}, config.apis.mobile.jwt.secret, 'mobile')
					req.headers.authorization = `Bearer ${blacklistedToken}`
					config.apis.mobile.passErrorToNext = false
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(validate)(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(
						res.response.jsonBody.message,
						'Invalid access token.',
						`bad value ${res.response.jsonBody.message} for res.response.jsonBody.message, expected Invalid access token.`
					)
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if a valid access token, which is not the user\'s current one, is provided and moduleConfig.passErrorToNext is true', function() {
				return co(function*() {
					let nonCurrentToken = yield instance.signToken({id: -1, someRandomKey: true}, config.apis.mobile.jwt.secret)
					yield instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile')
					req.headers.authorization = `Bearer ${nonCurrentToken}`
					config.apis.mobile.passErrorToNext = true
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(validate)(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(next.fail, true, `bad value ${next.fail} for next.fail, expected true`)
					assert.strictEqual(next.errorStatus, 401, `bad value ${next.errorStatus} for next.errorStatus, expected 401`)
					assert.strictEqual(next.errorMessage, 'Invalid access token.', `bad value ${next.errorMessage} for next.errorMessage, expected Invalid access token.`)
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if a valid access token, which is not the user\'s current one, is provided and moduleConfig.passErrorToNext is false', function() {
				return co(function*() {
					let nonCurrentToken = yield instance.signToken({id: -1, someRandomKey: true}, config.apis.mobile.jwt.secret)
					yield instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile')
					req.headers.authorization = `Bearer ${nonCurrentToken}`
					config.apis.mobile.passErrorToNext = false
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(validate)(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(
						res.response.jsonBody.message,
						'Invalid access token.',
						`bad value ${res.response.jsonBody.message} for res.response.jsonBody.message, expected Invalid access token.`
					)
					return true
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an expired access token is provided, moduleConfig.passErrorToNext is true and moduleConfig.jwt.useRefreshTokens is false', function() {
				return new Promise((resolve, reject) => {
					instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60).then((token) => {
						req.headers.authorization = `Bearer ${token}`
						config.apis.mobile.passErrorToNext = true
						setTimeout(() => {
							(new Promise((innerResolve, innerReject) => {
								res.json = res.jsonTemplate.bind(res, innerResolve)
								wrap(validate)(req, res, next.bind(next, innerResolve))
							})).then((promiseResult) => {
								try {
									assert.strictEqual(next.fail, true, `bad value ${next.fail} for next.fail, expected true`)
									assert.strictEqual(next.errorStatus, 401, `bad value ${next.errorStatus} for next.errorStatus, expected 401`)
									assert.strictEqual(next.errorMessage, 'Access token expired.', `bad value ${next.errorMessage} for next.errorMessage, expected Access token expired.`)
									resolve()
								} catch(e) {
									reject(e)
								}
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
					instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60).then((token) => {
						req.headers.authorization = `Bearer ${token}`
						config.apis.mobile.passErrorToNext = false
						setTimeout(() => {
							(new Promise((innerResolve, innerReject) => {
								res.json = res.jsonTemplate.bind(res, innerResolve)
								wrap(validate)(req, res, next.bind(next, innerResolve))
							})).then((promiseResult) => {
								try {
									assert.strictEqual(
										res.response.jsonBody.message,
										'Access token expired.',
										`bad value ${res.response.jsonBody.message} for res.response.jsonBody.message, expected Access token expired.`
									)
								} catch(e) {
									reject(e)
								}
								resolve()
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
					instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60).then((token) => {
						req.headers.authorization = `Bearer ${token}`
						config.apis.mobile.passErrorToNext = true
						config.apis.mobile.jwt.useRefreshTokens = true
						setTimeout(() => {
							(new Promise((innerResolve, innerReject) => {
								res.json = res.jsonTemplate.bind(res, innerResolve)
								wrap(validate)(req, res, next.bind(next, innerResolve))
							})).then((promiseResult) => {
								config.apis.mobile.jwt.useRefreshTokens = false
								try {
									assert.strictEqual(next.fail, true, `bad value ${next.fail} for next.fail, expected true`)
									assert.strictEqual(next.errorStatus, 401, `bad value ${next.errorStatus} for next.errorStatus, expected 401`)
									assert.strictEqual(next.errorMessage, 'Access token expired. No refresh token provided.', `bad value ${next.errorMessage} for next.errorMessage, expected Access token expired. No refresh token provided.`)
									resolve()
								} catch(e) {
									reject(e)
								}
							}, (err) => {
								config.apis.mobile.jwt.useRefreshTokens = false
								reject(err)
							})
						}, 1500)
					}, (err) => {
						config.apis.mobile.jwt.useRefreshTokens = false
						reject(err)
					})
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an expired access token is provided, moduleConfig.passErrorToNext is false, moduleConfig.jwt.useRefreshTokens is true and no refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60).then((token) => {
						req.headers.authorization = `Bearer ${token}`
						config.apis.mobile.passErrorToNext = false
						config.apis.mobile.jwt.useRefreshTokens = true
						setTimeout(() => {
							(new Promise((innerResolve, innerReject) => {
								res.json = res.jsonTemplate.bind(res, innerResolve)
								wrap(validate)(req, res, next.bind(next, innerResolve))
							})).then((promiseResult) => {
								config.apis.mobile.jwt.useRefreshTokens = false
								try {
									assert.strictEqual(
										res.response.jsonBody.message,
										'Access token expired. No refresh token provided.',
										`bad value ${res.response.jsonBody.message} for res.response.jsonBody.message, expected Access token expired. No refresh token provided.`
									)
									resolve()
								} catch(e) {
									reject(e)
								}
							}, (err) => {
								config.apis.mobile.jwt.useRefreshTokens = false
								reject(err)
							})
						}, 1500)
					}, (err) => {
						config.apis.mobile.jwt.useRefreshTokens = false
						reject(err)
					})
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an expired access token is provided, moduleConfig.passErrorToNext is true, moduleConfig.jwt.useRefreshTokens is true and an invalid refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60).then((token) => {
						req.headers.authorization = `Bearer ${token} invalidRefreshToken`
						config.apis.mobile.passErrorToNext = true
						config.apis.mobile.jwt.useRefreshTokens = true
						setTimeout(() => {
							(new Promise((innerResolve, innerReject) => {
								res.json = res.jsonTemplate.bind(res, innerResolve)
								wrap(validate)(req, res, next.bind(next, innerResolve))
							})).then((promiseResult) => {
								config.apis.mobile.jwt.useRefreshTokens = false
								try {
									assert.strictEqual(next.fail, true, `bad value ${next.fail} for next.fail, expected true`)
									assert.strictEqual(next.errorStatus, 401, `bad value ${next.errorStatus} for next.errorStatus, expected 401`)
									assert.strictEqual(next.errorMessage, 'Access token expired. Failed to verify token.', `bad value ${next.errorMessage} for next.errorMessage, expected Access token expired. Failed to verify token.`)
									resolve()
								} catch(e) {
									reject(e)
								}
							}, (err) => {
								config.apis.mobile.jwt.useRefreshTokens = false
								reject(err)
							})
						}, 1500)
					}, (err) => {
						config.apis.mobile.jwt.useRefreshTokens = false
						reject(err)
					})
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an expired access token is provided, moduleConfig.passErrorToNext is false, moduleConfig.jwt.useRefreshTokens is true and an invalid refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60).then((token) => {
						req.headers.authorization = `Bearer ${token} invalidRefreshToken`
						config.apis.mobile.passErrorToNext = false
						config.apis.mobile.jwt.useRefreshTokens = true
						setTimeout(() => {
							(new Promise((innerResolve, innerReject) => {
								res.json = res.jsonTemplate.bind(res, innerResolve)
								wrap(validate)(req, res, next.bind(next, innerResolve))
							})).then((promiseResult) => {
								config.apis.mobile.jwt.useRefreshTokens = false
								try {
									assert.strictEqual(
										res.response.jsonBody.message,
										'Access token expired. Failed to verify token.',
										`bad value ${res.response.jsonBody.message} for res.response.jsonBody.message, expected Access token expired. Failed to verify token.`
									)
									resolve()
								} catch(e) {
									reject(e)
								}
							}, (err) => {
								config.apis.mobile.jwt.useRefreshTokens = false
								reject(err)
							})
						}, 1500)
					}, (err) => {
						config.apis.mobile.jwt.useRefreshTokens = false
						reject(err)
					})
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an expired access token is provided, moduleConfig.passErrorToNext is true, moduleConfig.jwt.useRefreshTokens is true and an ill-formed refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60)
						req.headers.authorization = `Bearer ${accessToken} ${yield instance.signToken({someRandomKey: true}, config.apis.mobile.jwt.secret)}`
						config.apis.mobile.passErrorToNext = true
						config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									wrap(validate)(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									try {
										assert.strictEqual(next.fail, true, `bad value ${next.fail} for next.fail, expected true`)
										assert.strictEqual(next.errorStatus, 401, `bad value ${next.errorStatus} for next.errorStatus, expected 401`)
										assert.strictEqual(next.errorMessage, 'Access token expired. Invalid refresh token.', `bad value ${next.errorMessage} for next.errorMessage, expected Access token expired. Invalid refresh token.`)
										resolve()
									} catch(e) {
										reject(e)
									}
								}, (err) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an expired access token is provided, moduleConfig.passErrorToNext is false, moduleConfig.jwt.useRefreshTokens is true and an ill-formed refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60)
						req.headers.authorization = `Bearer ${accessToken} ${yield instance.signToken({someRandomKey: true}, config.apis.mobile.jwt.secret)}`
						config.apis.mobile.passErrorToNext = false
						config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									wrap(validate)(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									try {
										assert.strictEqual(
											res.response.jsonBody.message,
											'Access token expired. Invalid refresh token.',
											`bad value ${res.response.jsonBody.message} for res.response.jsonBody.message, expected Access token expired. Invalid refresh token.`
										)
										resolve()
									} catch(e) {
										reject(e)
									}
								}, (err) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an expired access token is provided, moduleConfig.passErrorToNext is true, moduleConfig.jwt.useRefreshTokens is true and a blacklisted refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60),
							blacklistedRefreshToken = yield instance.createToken('refresh', {id: -1}, config.apis.mobile.jwt.secret, 'mobile')
						yield instance.createToken('refresh', {id: -1, someRandomKey: true}, config.apis.mobile.jwt.secret, 'mobile')
						req.headers.authorization = `Bearer ${accessToken} ${blacklistedRefreshToken}`
						config.apis.mobile.passErrorToNext = true
						config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									wrap(validate)(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									try {
										assert.strictEqual(next.fail, true, `bad value ${next.fail} for next.fail, expected true`)
										assert.strictEqual(next.errorStatus, 401, `bad value ${next.errorStatus} for next.errorStatus, expected 401`)
										assert.strictEqual(next.errorMessage, 'Access token expired. Invalid refresh token.', `bad value ${next.errorMessage} for next.errorMessage, expected Access token expired. Invalid refresh token.`)
										resolve()
									} catch(e) {
										reject(e)
									}
								}, (err) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an expired access token is provided, moduleConfig.passErrorToNext is false, moduleConfig.jwt.useRefreshTokens is true and a blacklisted refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60),
							blacklistedRefreshToken = yield instance.createToken('refresh', {id: -1}, config.apis.mobile.jwt.secret, 'mobile')
						yield instance.createToken('refresh', {id: -1, someRandomKey: true}, config.apis.mobile.jwt.secret, 'mobile')
						req.headers.authorization = `Bearer ${accessToken} ${blacklistedRefreshToken}`
						config.apis.mobile.passErrorToNext = false
						config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									wrap(validate)(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									try {
										assert.strictEqual(
											res.response.jsonBody.message,
											'Access token expired. Invalid refresh token.',
											`bad value ${res.response.jsonBody.message} for res.response.jsonBody.message, expected Access token expired. Invalid refresh token.`
										)
										resolve()
									} catch(e) {
										reject(e)
									}
								}, (err) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an expired access token is provided, moduleConfig.passErrorToNext is true, moduleConfig.jwt.useRefreshTokens is true and a valid refresh token, which is not the user\'s current one, is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60)
						yield instance.createToken('refresh', {id: -1, someRandomKey: true}, config.apis.mobile.jwt.secret, 'mobile')
						req.headers.authorization = `Bearer ${accessToken} ${yield instance.signToken({id: -1}, config.apis.mobile.jwt.secret)}`
						config.apis.mobile.passErrorToNext = true
						config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									wrap(validate)(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									try {
										assert.strictEqual(next.fail, true, `bad value ${next.fail} for next.fail, expected true`)
										assert.strictEqual(next.errorStatus, 401, `bad value ${next.errorStatus} for next.errorStatus, expected 401`)
										assert.strictEqual(next.errorMessage, 'Access token expired. Invalid refresh token.', `bad value ${next.errorMessage} for next.errorMessage, expected Access token expired. Invalid refresh token.`)
										resolve()
									} catch(e) {
										reject(e)
									}
								}, (err) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an expired access token is provided, moduleConfig.passErrorToNext is false, moduleConfig.jwt.useRefreshTokens is true and a valid refresh token, which is not the user\'s current one, is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60)
						yield instance.createToken('refresh', {id: -1, someRandomKey: true}, config.apis.mobile.jwt.secret, 'mobile')
						req.headers.authorization = `Bearer ${accessToken} ${yield instance.signToken({id: -1}, config.apis.mobile.jwt.secret)}`
						config.apis.mobile.passErrorToNext = false
						config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									wrap(validate)(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									try {
										assert.strictEqual(
											res.response.jsonBody.message,
											'Access token expired. Invalid refresh token.',
											`bad value ${res.response.jsonBody.message} for res.response.jsonBody.message, expected Access token expired. Invalid refresh token.`
										)
										resolve()
									} catch(e) {
										reject(e)
									}
								}, (err) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "next" if an expired access token is provided, moduleConfig.passErrorToNext is true, moduleConfig.jwt.useRefreshTokens is true and an expired refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60),
							refreshToken = yield instance.createToken('refresh', {id: -1, someRandomKey: true}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60)
						req.headers.authorization = `Bearer ${accessToken} ${refreshToken}`
						config.apis.mobile.passErrorToNext = true
						config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									wrap(validate)(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									try {
										assert.strictEqual(next.fail, true, `bad value ${next.fail} for next.fail, expected true`)
										assert.strictEqual(next.errorStatus, 401, `bad value ${next.errorStatus} for next.errorStatus, expected 401`)
										assert.strictEqual(next.errorMessage, 'Access token expired. Refresh token expired.', `bad value ${next.errorMessage} for next.errorMessage, expected Access token expired. Refresh token expired.`)
										resolve()
									} catch(e) {
										reject(e)
									}
								}, (err) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should throw a status 401 error with the correct message and pass it to "res" (.status and .json) if an expired access token is provided, moduleConfig.passErrorToNext is false, moduleConfig.jwt.useRefreshTokens is true and an expired refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60),
							refreshToken = yield instance.createToken('refresh', {id: -1, someRandomKey: true}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60)
						req.headers.authorization = `Bearer ${accessToken} ${refreshToken}`
						config.apis.mobile.passErrorToNext = false
						config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									wrap(validate)(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									try {
										assert.strictEqual(
											res.response.jsonBody.message,
											'Access token expired. Refresh token expired.',
											`bad value ${res.response.jsonBody.message} for res.response.jsonBody.message, expected Access token expired. Refresh token expired.`
										)
										resolve()
									} catch(e) {
										reject(e)
									}
								}, (err) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should execute "next" with no arguments sucessfully and set "req.user" to the valid decoded object if a valid access token is provided', function() {
				return co(function*() {
					req.headers.authorization = `Bearer ${yield instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile')}`
					config.apis.mobile.passErrorToNext = true
					delete req.user
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(validate)(req, res, next.bind(next, resolve))
					}))
					assert.strictEqual(next.fail, false, `bad value ${next.fail} for next.fail, expected false`)
					let userKeysLength = Object.keys(req.user).length,
						typeOfIat = typeof req.user.iat
					assert.strictEqual(userKeysLength, 2, `bad value ${userKeysLength} for userKeysLength, expected 2`)
					assert.strictEqual(req.user.id, -1, `bad value ${req.user.id} for req.user.id, expected -1`)
					assert.notStrictEqual(typeOfIat, 'undefined', `bad value ${typeOfIat} for typeOfIat, expected not undefined`)
					return true
				})
			})
			it('should execute "next" with no arguments sucessfully, set "req.user" to the valid decoded object if an expired access token is provided, moduleConfig.jwt.useRefreshTokens is true a valid refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60),
							refreshToken = yield instance.createToken('refresh', {id: -1}, config.apis.mobile.jwt.secret, 'mobile')
						req.headers.authorization = `Bearer ${accessToken} ${refreshToken}`
						delete req.isAuthenticated
						config.apis.mobile.passErrorToNext = false
						config.apis.mobile.jwt.useRefreshTokens = true
						return true
					}).then(() => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									wrap(validate)(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									assert.strictEqual(next.fail, false, `bad value ${next.fail} for next.fail, expected false`)
									let userKeysLength = Object.keys(req.user).length,
										typeOfIat = typeof req.user.iat
									assert.strictEqual(userKeysLength, 2, `bad value ${userKeysLength} for userKeysLength, expected 2`)
									assert.strictEqual(req.user.id, -1, `bad value ${req.user.id} for req.user.id, expected -1`)
									assert.notStrictEqual(typeOfIat, 'undefined', `bad value ${typeOfIat} for typeOfIat, expected not undefined`)
									assert.strictEqual(req.isAuthenticated(), true, `bad value ${req.isAuthenticated()} for req.isAuthenticated(), expected true`)
									resolve()
								}, (err) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							config.apis.mobile.jwt.useRefreshTokens = false
							reject(err)
						}
					)
				})
			})
			it('should execute "next" with no arguments sucessfully, set "authorization-newaccesstoken" to the new access token and set the current refresh token for it if an expired access token is provided, moduleConfig.jwt.useRefreshTokens is true a valid refresh token is provided', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let accessToken = yield instance.createToken('access', {id: -1}, config.apis.mobile.jwt.secret, 'mobile', 1 / 60),
							refreshToken = yield instance.createToken('refresh', {id: -1}, config.apis.mobile.jwt.secret, 'mobile')
						req.headers.authorization = `Bearer ${accessToken} ${refreshToken}`
						delete req.isAuthenticated
						config.apis.mobile.passErrorToNext = false
						config.apis.mobile.jwt.useRefreshTokens = true
						return refreshToken
					}).then((refreshToken) => {
							setTimeout(() => {
								(new Promise((innerResolve, innerReject) => {
									res.json = res.jsonTemplate.bind(res, innerResolve)
									wrap(validate)(req, res, next.bind(next, innerResolve))
								})).then((promiseResult) => {
									co(function*() {
										config.apis.mobile.jwt.useRefreshTokens = false
										assert.strictEqual(next.fail, false, `bad value ${next.fail} for next.fail, expected false`)
										let userKeysLength = Object.keys(req.user).length,
											typeOfIat = typeof req.user.iat,
											newAccessToken = res.headers['authorization-newaccesstoken'],
											newAccessTokenFromRedis = yield generalStore.getStoredEntry('module-mobile-userId--1-accessToken'),
											refreshTokenFromRedis = yield generalStore.getStoredEntry(`module-mobile-userId--1-refreshTokenForAccessToken-${newAccessToken}`)
										assert.strictEqual(userKeysLength, 2, `bad value ${userKeysLength} for userKeysLength, expected 2`)
										assert.strictEqual(req.user.id, -1, `bad value ${req.user.id} for req.user.id, expected -1`)
										assert.notStrictEqual(typeOfIat, 'undefined', `bad value ${typeOfIat} for typeOfIat, expected not undefined`)
										assert.strictEqual(req.isAuthenticated(), true, `bad value ${req.isAuthenticated()} for req.isAuthenticated(), expected true`)
										assert.strictEqual(newAccessToken, newAccessTokenFromRedis, `bad value ${newAccessToken} for newAccessToken, expected ${newAccessTokenFromRedis}`)
										assert.strictEqual(refreshToken, refreshTokenFromRedis, `bad value ${refreshToken} for refreshToken, expected ${refreshTokenFromRedis}`)
										resolve()
									}).then(() => {
									}, (err) => {
										config.apis.mobile.jwt.useRefreshTokens = false
										reject(err)
									})
								}, (err) => {
									config.apis.mobile.jwt.useRefreshTokens = false
									reject(err)
								})
							}, 1500)
						}, (err) => {
							config.apis.mobile.jwt.useRefreshTokens = false
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
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
					assert.strictEqual(hasThrownAnError, true, 'no error thrown')
					return true
				})
			})
			it('should execute successfully if all parameters are correct', function() {
				return co(function*() {
					yield instance.deleteTokens(-1, 'mobile')
					return true
				})
			})
		})
	}
}

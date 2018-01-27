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
			it.skip('should throw an error if the token has expired', function() {
				const itContext = this
				return co(function*() {
					let hasThrownAnError = false,
						token = yield instance.signToken({id: -1}, 'testSecret', 1 / 60)
					itContext.timeout(1500)
					try {
						yield instance.verifyToken(token, 'testSecret')
					} catch(e) {
						hasThrownAnError = true
					}
					assert(hasThrownAnError)
					return true
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
	}
}

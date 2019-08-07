/**
 * The tokenManager.module module. Contains the TokenManager class.
 * @module tokenManagerModule
 */

const
	co = require('co'),
	GeneralStore = require('../generalStore/generalStore.module'),
	Logger = require('../errorLogger/errorLogger.module'),
	jwt = require('jsonwebtoken'),
	spec = require('./tokenManager.module.spec')

/**
 * This class is used to create, validate and delete JWTs.
 * @class TokenManager
 */
class TokenManager{
	/**
	 * Creates an instance of TokenManager.
	 * @param {object} config The project config object.
	 * @see module:configModule
	 * @param {GeneralStore} generalStore An instance of the GeneralStore class.
	 * @param {Logger} errorLogger An instance of the Logger class.
	 * @memberof TokenManager
	 */
	constructor(config, generalStore, errorLogger) {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		/**
		 * The project config object.
		 * @type {object}
		 */
		this.config = config
		/**
		 * An instance of the GeneralStore class.
		 * @type {GeneralStore}
		 */
		this.generalStore = generalStore
		/**
		 * An instance of the Logger class.
		 * @type {Logger}
		 */
		this.errorLogger = errorLogger
	}

	/**
	 * Generates a new token based on the provided arguments.
	 * @param {Object.<string, any>} userData The user data object to encode in the token. Must contain an "id" key with a valid database user id.
	 * @param {string} secret The secret "salt" to use for encrypting the token data.
	 * @param {number} expiresInMinutes (optional) The time from its creation, in minutes, in which the token will expire.
	 * @returns {Promise<string>} A promise, which resolves with the generated token.
	 * @memberof TokenManager
	 */
	signToken(userData, secret, expiresInMinutes) {
		return new Promise((resolve, reject) => {
			if ((typeof userData !== 'object') || (userData === null) || !Object.keys(userData).length) {
				throw {customMessage: 'Invalid userData object provided.'}
			}
			if ((typeof secret !== 'string') || !secret.length) {
				throw {customMessage: 'Invalid secret string provided.'}
			}
			if (expiresInMinutes) {
				let expiresInMinutesFloat = parseFloat(expiresInMinutes)
				if (expiresInMinutesFloat <= 0) {
					throw {customMessage: 'The token expiry time must be greater than 0.'}
				}
				jwt.sign(userData, secret, { expiresIn: expiresInMinutes * 60 }, (err, token) => {
					if (err) {
						this.errorLogger.error(err)
						reject({customMessage: 'Failed to sign token.'})
						return
					}
					resolve(token)
				})
			}
			jwt.sign(userData, secret, null, (err, token) => {
				if (err) {
					this.errorLogger.error(err)
					reject({customMessage: 'Failed to sign token.'})
					return
				}
				resolve(token)
			})
		})
	}

	/**
	 * Verifies that a token is valid an non-expired and returns its decoded data.
	 * @param {string} token The jwt token to verify and decode.
	 * @param {string} secret The secret "salt" to use for encrypting the token data.
	 * @returns {Promise<object>} A promise, which resolves with the decoded token data.
	 * @memberof TokenManager
	 */
	verifyToken(token, secret) {
		return new Promise((resolve, reject) => {
			if ((typeof token !== 'string') || !token.length) {
				reject({customMessage: 'Invalid token provided.'})
			}
			if ((typeof secret !== 'string') || !secret.length) {
				reject({customMessage: 'Invalid secret string provided.'})
			}
			jwt.verify(token, secret, (err, decoded) => {
				if (err) {
					if (err.name === 'TokenExpiredError') {
						reject({decodedData: decoded, tokenExpired: true})
						return
					}
					reject({customMessage: 'Failed to verify token.'})
					return
				}
				resolve(decoded)
			})
		})
	}

	/**
	 * Creates a new token for a particular user and records it in the general store.
	 * @param {string} type The type of the token - can be 'access' or 'refresh'.
	 * @param {Object.<string, any>} userData The user data object to encode in the token. Must contain an "id" key with a valid database user id.
	 * @param {string} secret The secret "salt" to use for encrypting the token data.
	 * @param {string} moduleName The name of the module to generate the token for.
	 * @param {number} expiresInMinutes (optional) The time from its creation, in minutes, in which the token will expire.
	 * @returns {Promise<string>} A promise which wraps a generator function. When resolved, it returns the created token.
	 * @memberof TokenManager
	 */
	createToken(type, userData, secret, moduleName, expiresInMinutes) {
		const instance = this
		return co(function* () {
			if ((typeof userData !== 'object') || (userData === null) || !Object.keys(userData).length || !userData.id) {
				throw {customMessage: 'Invalid userData object provided.'}
			}
			if ((typeof secret !== 'string') || !secret.length) {
				throw {customMessage: 'Invalid secret string provided.'}
			}
			if ((typeof moduleName !== 'string') || !moduleName.length) {
				throw {customMessage: 'Invalid moduleName string provided.'}
			}
			let userId = userData.id
			if (type === 'access') {
				let token = yield instance.signToken(userData, secret, expiresInMinutes),
					currentToken = yield instance.generalStore.getStoredEntry(`module-${moduleName}-userId-${userId}-accessToken`)
				if (currentToken) {
					yield instance.generalStore.removeEntry(`module-${moduleName}-userId-${userId}-accessToken`)
					yield instance.generalStore.storeEntry(`module-${moduleName}-accessTokenBlacklist-${currentToken}`, true)
				}
				yield instance.generalStore.storeEntry(`module-${moduleName}-userId-${userId}-accessToken`, token)
				return token
			}

			if (type === 'refresh') {
				let currentAccessToken = yield instance.generalStore.getStoredEntry(`module-${moduleName}-userId-${userId}-accessToken`)
				if (!currentAccessToken) {
					throw {customMessage: 'No access token to create a refresh token for.'}
				}

				let token = yield instance.signToken(userData, secret, expiresInMinutes),
					currentToken = yield instance.generalStore.getStoredEntry(`module-${moduleName}-userId-${userId}-refreshTokenForAccessToken-${currentAccessToken}`)
				if (currentToken) {
					yield instance.generalStore.storeEntry(`module-${moduleName}-refreshTokenBlacklist-${currentToken}`, true)
					yield instance.generalStore.removeEntry(`module-${moduleName}-userId-${userId}-refreshTokenForAccessToken-${currentAccessToken}`)
				}
				yield instance.generalStore.storeEntry(`module-${moduleName}-userId-${userId}-refreshTokenForAccessToken-${currentAccessToken}`, token)
				return token
			}

			throw {customMessage: 'Invalid token type provided.'}
		})
	}

	/**
	 * Returns an expressJS-style function, which validates then tokens in the request's authorization header. Throws errors if the tokens aren't valid in any form, for calls next() if everything is ok.
	 * @returns {IterableIterator} An expressJS-style generator function.
	 * @memberof TokenManager
	 */
	validate() {
		const instance = this,
			{generalStore, errorLogger} = this
		return function*(req, res, next) {
			let moduleName = '',
				moduleType = '',
				config = {},
				originalModuleName = '',
				originalConfig = ''
			try {
				req.isAuthenticated = function() {
					return this.user ? true : false
				}
				// all the JSON.parse is just making sure we break all references and don't change anything in the locals and configs
				moduleName = JSON.parse(JSON.stringify(req.locals.moduleName))
				moduleType = JSON.parse(JSON.stringify(req.locals.moduleType))
				originalModuleName = JSON.parse(JSON.stringify(req.locals.moduleName))
				config = JSON.parse(JSON.stringify(instance.config[`${moduleType}s`][moduleName]))
				originalConfig = JSON.parse(JSON.stringify(instance.config[`${moduleType}s`][moduleName]))
				if (!req.headers.authorization) {
					throw {customMessage: 'No access token provided.', status: 401}
				}
				if (config.useApiModuleConfigForAuthTokens) {
					moduleName = JSON.parse(JSON.stringify(instance.config.useApiModuleConfigForAuthTokens))
					config = JSON.parse(JSON.stringify(instance.config.apis[config.useApiModuleConfigForAuthTokens]))
				}

				let tokens = req.headers.authorization.split(' ')
				if ((tokens[0] !== 'Bearer') || (tokens[1] === 'undefined')) {
					throw {customMessage: 'No access token provided.', status: 401}
				}

				try {
					let decoded = yield instance.verifyToken(tokens[1], config.jwt.secret)
					if (!decoded.id) {
						throw {customMessage: 'Invalid access token.', status: 401}
					}

					let currentAccessToken = yield instance.generalStore.getStoredEntry(`module-${moduleName}-userId-${decoded.id}-accessToken`),
						currentAccessTokenBlacklisted = yield instance.generalStore.getStoredEntry(`module-${moduleName}-accessTokenBlacklist-${currentAccessToken}`)
					if ((currentAccessToken !== tokens[1]) || currentAccessTokenBlacklisted) {
						throw {customMessage: 'Invalid access token.', status: 401}
					}

					req.user = decoded
					next()
				} catch(e) {
					try {
						if (!e.tokenExpired) {
							throw e
						}

						if (typeof tokens[2] === 'undefined') {
							throw {customMessage: `Access token expired.${config.jwt.useRefreshTokens ? ' No refresh token provided.' : ''}`, status: 401}
						}

						let decoded = yield instance.verifyToken(tokens[2], config.jwt.secret)
						if (!decoded.id) {
							throw {customMessage: 'Access token expired. Invalid refresh token.', status: 401}
						}

						let currentAccessToken = yield instance.generalStore.getStoredEntry(`module-${moduleName}-userId-${decoded.id}-accessToken`),
							currentRefreshToken = yield instance.generalStore.getStoredEntry(`module-${moduleName}-userId-${decoded.id}-refreshTokenForAccessToken-${currentAccessToken}`),
							currentRefreshTokenBlacklisted = yield instance.generalStore.getStoredEntry(`module-${moduleName}-refreshTokenBlacklist-${currentRefreshToken}`)
						if ((currentRefreshToken !== tokens[2]) || currentRefreshTokenBlacklisted) {
							throw {customMessage: 'Access token expired. Invalid refresh token.', status: 401}
						}

						let newAccessToken = yield instance.createToken('access', decoded, config.jwt.secret, moduleName, config.jwt.accessTokenExpiresInMinutes)
						yield instance.generalStore.removeEntry(`module-${moduleName}-userId-${decoded.id}-refreshTokenForAccessToken-${currentAccessToken}`)
						yield instance.generalStore.storeEntry(`module-${moduleName}-userId-${decoded.id}-refreshTokenForAccessToken-${newAccessToken}`, currentRefreshToken)

						req.user = decoded
						res.set('authorization-newaccesstoken', newAccessToken)
						next()
					} catch (innerError) {
						req.user = null
						errorLogger.error(innerError)
						let status = innerError.status || 400,
							message = innerError.customMessage || 'An error has occurred.'
						if (innerError.tokenExpired) {
							status = 401
							message = 'Access token expired. Refresh token expired.'
						} else if ((e.tokenExpired) && (message.substr(0, 21) !== 'Access token expired.')) {
							status = 401
							message = `Access token expired. ${message}`
						}
						if (config.passErrorToNext || (originalConfig && originalConfig.passErrorToNext)) {
							next({status, message})
							return false
						}
						res.status(status).json({message})
						return false
					}
				}
			} catch(e) {
				req.user = null
				let response = {},
					status = e.status || req.locals.errorStatus || 400,
					message = e.customMessage || 'An error has occurred.'
				if (config.responseType === 'serviceName') {
					response = {serviceName: req.locals.serviceName, data: null, message}
				} else {
					response = {message}
				}
				if (config.passErrorToNext || (originalConfig && originalConfig.passErrorToNext)) {
					next({status, message})
					return
				}
				errorLogger.error(e)
				res.status(status).json(response)
			}
		}
	}

	/**
	 * Deletes all tokens for a user for a module.
	 * @param {number} userId The id of the user to delete the tokens for.
	 * @param {string} moduleName The name of the module to generate the token for.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof TokenManager
	 */
	deleteTokens(userId, moduleName) {
		const instance = this
		return co(function* () {
			if (!parseInt(userId, 10)) {
				throw {customMessage: 'Invalid userId.'}
			}
			if ((typeof moduleName !== 'string') || !moduleName.length) {
				throw {customMessage: 'Invalid moduleName string provided.'}
			}
			let currentAccessToken = yield instance.generalStore.getStoredEntry(`module-${moduleName}-userId-${userId}-accessToken`),
				currentRefreshToken = yield instance.generalStore.getStoredEntry(`module-${moduleName}-userId-${userId}-refreshTokenForAccessToken-${currentAccessToken}`)
			yield instance.generalStore.removeEntry(`module-${moduleName}-userId-${userId}-accessToken`)
			yield instance.generalStore.removeEntry(`module-${moduleName}-userId-${userId}-refreshTokenForAccessToken-${currentAccessToken}`)
			yield instance.generalStore.storeEntry(`module-${moduleName}-accessTokenBlacklist-${currentAccessToken}`, true)
			yield instance.generalStore.storeEntry(`module-${moduleName}-refreshTokenBlacklist-${currentRefreshToken}`, true)
			return true
		})
	}
}

module.exports = TokenManager

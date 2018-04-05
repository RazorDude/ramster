const
	co = require('co'),
	jwt = require('jsonwebtoken'),
	spec = require('./index.spec')

class TokenManager{
	constructor(config, generalStore, errorLogger) {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		this.config = config
		this.generalStore = generalStore
		this.errorLogger = errorLogger
	}

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
						reject({customMessage: 'Failed to sign token.', status: 401})
						return
					}
					resolve(token)
				})
			}
			jwt.sign(userData, secret, null, (err, token) => {
				if (err) {
					this.errorLogger.error(err)
					reject({customMessage: 'Failed to sign token.', status: 401})
					return
				}
				resolve(token)
			})
		})
	}

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
						reject({tokenExpired: true})
						return
					}
					reject({customMessage: 'Failed to verify token.', status: 401})
					return
				}
				resolve(decoded)
			})
		})
	}

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
					currentToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${userId}AccessToken`)
				if (currentToken) {
					yield instance.generalStore.removeEntry(`${moduleName}user${userId}AccessToken`)
					yield instance.generalStore.storeEntry(`${moduleName}accessTokenBlacklist-${currentToken}`, true)
				}
				yield instance.generalStore.storeEntry(`${moduleName}user${userId}AccessToken`, token)
				return token
			}

			if (type === 'refresh') {
				let currentAccessToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${userId}AccessToken`)
				if (!currentAccessToken) {
					throw {customMessage: 'No access token to create a refresh token for.'}
				}

				let token = yield instance.signToken(userData, secret, expiresInMinutes),
					currentToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`)
				if (currentToken) {
					yield instance.generalStore.storeEntry(`${moduleName}refreshTokenBlacklist-${currentToken}`, true)
					yield instance.generalStore.removeEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`)
				}
				yield instance.generalStore.storeEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`, token)
				return token
			}

			throw {customMessage: 'Invalid token type provided.'}
		})
	}

	validate() {
		return (req, res, next) => {
			const instance = this,
				{generalStore, errorLogger} = this
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

				co(function* () {
					try {
						let decoded = yield instance.verifyToken(tokens[1], config.jwt.secret)
						if (!decoded.id) {
							throw {customMessage: 'Invalid access token.', status: 401}
						}

						let currentAccessToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${decoded.id}AccessToken`),
							currentAccessTokenBlacklisted = yield instance.generalStore.getStoredEntry(`${moduleName}accessTokenBlacklist-${currentAccessToken}`)
						if ((currentAccessToken !== tokens[1]) || currentAccessTokenBlacklisted) {
							throw {customMessage: 'Invalid access token.', status: 401}
						}

						req.user = decoded
						return true
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

							let currentAccessToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${decoded.id}AccessToken`),
								currentRefreshToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${decoded.id}RefreshTokenForAccessToken${currentAccessToken}`),
								currentRefreshTokenBlacklisted = yield instance.generalStore.getStoredEntry(`${moduleName}refreshTokenBlacklist-${currentRefreshToken}`)
							if ((currentRefreshToken !== tokens[2]) || currentRefreshTokenBlacklisted) {
								throw {customMessage: 'Access token expired. Invalid refresh token.', status: 401}
							}

							let newAccessToken = yield instance.createToken('access', decoded, config.jwt.secret, moduleName, config.jwt.accessTokenExpiresInMinutes)
							yield instance.generalStore.removeEntry(`${moduleName}user${decoded.id}RefreshTokenForAccessToken${currentAccessToken}`)
							yield instance.generalStore.storeEntry(`${moduleName}user${decoded.id}RefreshTokenForAccessToken${newAccessToken}`, currentRefreshToken)

							req.user = decoded
							res.set('authorization-newaccesstoken', newAccessToken)
							return true
						} catch (innerError) {
							req.user = null
							errorLogger.error(innerError)
							let status = innerError.status || 500,
								message = innerError.customMessage || 'An internal server error has occurred.'
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
				}).then((result) => {
					if (result) {
						next()
					}
				}, (error) => {
					throw error
				})
			} catch(e) {
				req.user = null
				let response = {},
					status = e.status || req.locals.errorStatus || 500,
					message = e.customMessage || 'An internal server error has occurred.'
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

	deleteTokens(userId, moduleName) {
		const instance = this
		return co(function* () {
			if (!parseInt(userId, 10)) {
				throw {customMessage: 'Invalid userId.'}
			}
			if ((typeof moduleName !== 'string') || !moduleName.length) {
				throw {customMessage: 'Invalid moduleName string provided.'}
			}
			let currentAccessToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${userId}AccessToken`),
				currentRefreshToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`)
			yield instance.generalStore.removeEntry(`${moduleName}user${userId}AccessToken`)
			yield instance.generalStore.removeEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`)
			yield instance.generalStore.storeEntry(`${moduleName}accessTokenBlacklist-${currentAccessToken}`, true)
			yield instance.generalStore.storeEntry(`${moduleName}refreshTokenBlacklist-${currentRefreshToken}`, true)
			return true
		})
	}
}

module.exports = TokenManager

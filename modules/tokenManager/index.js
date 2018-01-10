const
	co = require('co'),
	jwt = require('jsonwebtoken')

class TokenManager{
	constructor({generalStore}) {
		this.generalStore = generalStore
	}

	signToken({userId, userData, secret, expiresInMinutes}) {
		return new Promise((resolve, reject) => {
			let tokenData = {}
			if ((typeof userData === 'object') && (userData !== null)) {
				tokenData = userData
			} else {
				tokenData.id = userId
			}
			if (expiresInMinutes) {
				jwt.sign(tokenData, secret, { expiresIn: expiresInMinutes * 60 }, (err, token) => {
					if (err) {
						reject({customMessage: 'Failed to sign token.', status: 401})
						return;
					}
					resolve(token)
				})
			}
			jwt.sign(tokenData, secret, null, (err, token) => {
				if (err) {
					reject({customMessage: 'Failed to sign token.', status: 401})
					return;
				}
				resolve(token)
			})
		})
	}

	verifyToken({token, secret}) {
		return new Promise((resolve, reject) => {
			jwt.verify(token, secret, (err, decoded) => {
				if (err) {
					if (err.name === 'TokenExpiredError') {
						reject({tokenExpired: true})
						return;
					}
					reject({customMessage: 'Failed to verify token.', status: 401})
					return;
				}
				resolve(decoded)
			})
		})
	}

	createToken({type, userId, userData, secret, moduleName, expiresInMinutes}) {
		let instance = this
		return co(function* () {
			if (type === 'access') {
				let token = yield instance.signToken({userId, userData, secret, expiresInMinutes}),
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

				let token = yield instance.signToken({userId, secret}),
					currentToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`)
				if (currentToken) {
					yield instance.generalStore.storeEntry(`${moduleName}refreshTokenBlacklist-${currentToken}`, true)
					yield instance.generalStore.removeEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`)
				}
				yield instance.generalStore.storeEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`, token)
				return token
			}

			return null
		})
	}

	validate() {
		return (req, res, next) => {
			let moduleName = '',
				config = {},
				originalModuleName = '',
				originalConfig = ''
			try {
				moduleName = req.locals.moduleName
				originalModuleName = req.locals.moduleName
				config = req.locals.cfg[moduleName]
				originalConfig = req.locals.cfg[moduleName]
				if (!req.headers['authorization']) {
					throw {customMessage: 'No access token provided.', status: 401}
				}
				if (config.useModuleConfigForAuthTokens) {
					moduleName = config.useModuleConfigForAuthTokens
					config = req.locals.cfg[config.useModuleConfigForAuthTokens]
				}

				let tokens = req.headers['authorization'].split(' '),
					instance = this
				if ((tokens[0] !== 'Bearer') || (tokens[1] === 'undefined')) {
					throw {customMessage: 'No access token provided.', status: 401}
				}

				co(function* () {
					try {
						let decoded = yield instance.verifyToken({token: tokens[1], secret: config.jwt.secret})
						if (!decoded.id) {
							throw {customMessage: 'Invalid access token.', status: 401}
						}

						let currentAccessToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${decoded.id}AccessToken`),
							currentAccessTokenBlacklisted = yield instance.generalStore.getStoredEntry(`${moduleName}accessTokenBlacklist-${currentAccessToken}`)
						if ((currentAccessToken !== tokens[1]) || currentAccessTokenBlacklisted) {
							throw {customMessage: 'Invalid access token.', status: 401}
						}

						req.user = {id: decoded.id}
						return true
					} catch(e) {
						try {
							if (!e.tokenExpired) {
								throw e
							}

							if (tokens[2] === 'undefined') {
								throw {customMessage: `Access token expired.${config.jwt.useRefreshTokens ? 'No refresh token provided.' : ''}`, status: 401}
							}

							let decoded = yield instance.verifyToken({token: tokens[2], secret: config.jwt.secret})
							if (!decoded.id) {
								throw {customMessage: 'Invalid access token. Invalid refresh token.', status: 401}
							}

							let currentAccessToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${decoded.id}AccessToken`),
								currentRefreshToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`),
								currentRefreshTokenBlacklisted = yield instance.generalStore.getStoredEntry(`${moduleName}refreshTokenBlacklist-${currentAccessToken}`)
							yield instance.generalStore.storeEntry(`${moduleName}accessTokenBlacklist-${currentAccessToken}`)
							if ((currentRefreshToken !== tokens[2]) || currentRefreshTokenBlacklisted) {
								throw {customMessage: 'Invalid access token. Invalid refresh token.', status: 401}
							}

							let newAccessToken = yield req.locals.tokenManager.createToken({type: 'access', userId: user.id, secret: config.jwt.secret, expiresInMinutes: config.jwt.accessTokenExpiresInMinutes})
							yield instance.generalStore.removeEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`)
							yield instance.generalStore.storeEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${newAccessToken}`, currentRefreshToken)

							req.user = {id: decoded.id}
							res.set('authorization-newaccesstoken', newAccessToken)
							return true
						} catch (innerError) {
							req.user = null
							req.locals.logger.error(innerError)
							let status = innerError.status || 500,
								message = innerError.customMessage || 'An internal server error has occurred.'
							if (innerError.tokenExpired) {
								status = 401
								message = 'Access token expired. Refresh token expired.'
							}
							if (config.passErrorToNext || (originalConfig && originalConfig.passErrorToNext)) {
								next({status, message})
								return false
							}
							res.status(status).json({error: message})
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
				if (req.locals.settings.responseType === 'serviceName') {
					response = {serviceName: req.locals.serviceName, data: null, message}
				} else {
					response = {message}
				}
				if (config.passErrorToNext || (originalConfig && originalConfig.passErrorToNext)) {
					next({status, message})
					return
				}
				req.locals.logger.error(e)
				res.status(status).json(response)
			}
		}
	}

	deleteTokens({userId, moduleName}) {
		let instance = this
		return co(function* () {
			let currentAccessToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${userId}AccessToken`),
				currentRefreshToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`)
			yield instance.generalStore.removeEntry(`${moduleName}user${userId}AccessToken`)
			yield instance.generalStore.removeEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`)
			yield instance.generalStore.storeEntry(`${moduleName}accessTokenBlacklist-${currentAccessToken}`)
			yield instance.generalStore.storeEntry(`${moduleName}refreshTokenBlacklist-${currentRefreshToken}`)
			return true
		})
	}
}

module.exports = TokenManager

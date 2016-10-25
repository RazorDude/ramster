let co = require('co'),
	jwt = require('jsonwebtoken')

class TokenManager{
	constructor({generalStore}) {
		this.generalStore = generalStore
	}

	signToken({userId, secret, expiresInMinutes}) {
		return new Promise((resolve, reject) => {
			if (expiresInMinutes) {
				jwt.sign({id: userId}, secret, { expiresIn: expiresInMinutes * 60 }, (err, token) => {
					if (err) {
						reject({customMessage: 'Failed to sign token.', status: 401})
						return;
					}
					resolve(token)
				})
			}
			jwt.sign({id: userId}, secret, null, (err, token) => {
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

	createToken({type, userId, secret, moduleName}) {
		let instance = this
		return co(function* () {
			if (type === 'access') {
				let token = yield instance.signToken({userId, secret, expiresInMinutes: 60}),
					currentToken = instance.generalStore.getStoredEntry(`${moduleName}user${userId}AccessToken`)
				if (currentToken) {
					yield instance.generalStore.removeEntry(`${moduleName}user${userId}AccessToken`)
					yield instance.generalStore.storeEntry(`${moduleName}accessTokenBlacklist-${currentToken}`)
				}
				yield instance.generalStore.storeEntry(`${moduleName}user${userId}AccessToken`, token)
				return token
			}

			if (type === 'refresh') {
				let currentAccessToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${userId}AccessToken`)
				if (!currentAccessToken) {
					throw {customMessage: 'No access token to create a refresh token for.'}
				}

				let	token = yield instance.signToken({userId, secret}),
					currentToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`)
				if (currentToken) {
					yield instance.generalStore.storeEntry(`${moduleName}refreshTokenBlacklist-${currentToken}`)
					yield instance.generalStore.removeEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`)
				}
				yield instance.generalStore.storeEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`, token)
				return token
			}

			return null
		})
	}

	validate({secret, moduleName}) {
		return (req, res, next) => {
			try {
				if (!req.headers['authorization']) {
					throw {customMessage: 'No authorization token provided.', status: 401}
				}

				let tokens = req.headers['authorization'].split(' '),
					instance = this
				if ((tokens[0] !== 'Bearer') || (tokens[1] === 'undefined')) {
					// throw {customMessage: 'Invalid header format.', status: 401}
				}

				co(function* () {
					try {
						let decoded = yield instance.verifyToken({token: tokens[1], secret})
						if (!decoded.id) {
							throw {customMessage: 'Invalid access token.'}
						}

						let currentAccessToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${decoded.id}AccessToken`),
							currentAccessTokenBlacklisted = yield instance.generalStore.getStoredEntry(`${moduleName}accessTokenBlacklist-${currentAccessToken}`)
						if ((currentAccessToken !== tokens[1]) || currentAccessTokenBlacklisted) {
							throw {customMessage: 'Invalid access token.'}
						}

						req.user = {id: decoded.id}
						return true
					} catch(e) {
						try {
							if (!e.tokenExpired) {
								throw e
							}

							if (tokens[2] === 'undefined') {
								throw {customMessage: 'Invalid access token. No refresh token provided.', status: 401}
							}

							let decoded = yield instance.verifyToken({token: tokens[2], secret})
							if (!decoded.id) {
								throw {customMessage: 'Invalid access token. Invalid refresh token.'}
							}

							let currentAccessToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${decoded.id}AccessToken`),
								currentRefreshToken = yield instance.generalStore.getStoredEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`),
								currentRefreshTokenBlacklisted = yield instance.generalStore.getStoredEntry(`${moduleName}refreshTokenBlacklist-${currentAccessToken}`)
							yield instance.generalStore.storeEntry(`${moduleName}accessTokenBlacklist-${currentAccessToken}`)
							if ((currentRefreshToken !== tokens[2]) || currentRefreshTokenBlacklisted) {
								throw {customMessage: 'Invalid access token. Invalid refresh token.'}
							}

							let newAccessToken = yield req.locals.tokenManager.createToken({type: 'access', userId: user.id, secret: req.locals.cfg.mobile.jwt.secret})
							yield instance.generalStore.removeEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${currentAccessToken}`)
							yield instance.generalStore.storeEntry(`${moduleName}user${userId}RefreshTokenForAccessToken${newAccessToken}`, currentRefreshToken)

							req.user = {id: decoded.id}
							res.set('authorization-newaccesstoken', newAccessToken)
							return true
						} catch (innerError) {
							req.user = null
							res.status(innerError.status || 500).json({error: innerError.customMessage || 'An internal server error has occurred.'})
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
				res.status(e.status || 500).json({error: e.customMessage || 'An internal server error has occurred.'})
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

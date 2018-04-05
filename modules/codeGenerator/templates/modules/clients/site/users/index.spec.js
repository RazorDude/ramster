const
	assert = require('assert'),
	bcryptjs = require('bcryptjs'),
	co = require('co'),
	request = require('request-promise-native')

module.exports = {
	testLogin: function() {
		const instance = this,
			{dbComponent} = this,
			{config, db, generalStore, moduleConfig, tokenManager} = this.module,
			{moduleAccessPoints, modules, userTypes} = db.components,
			tokensSecret = config.db.tokensSecret
		describe('client.users.login', function() {
			describe('POST /users/login with username and password', function() {
				let sessionCookie = null
				it('should throw an error if the user email and password is not provided', function() {
					return co(function*() {
						let didThrowAnError = false
						try {
							yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {},
								json: true
							})
						} catch(e) {
							if (e && e.response && e.response.body && (e.response.body.error === 'User not found.')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						assert(didThrowAnError)
						return true
					})
				})
				it('should throw an error if the user email and password is not correct', function() {
					return co(function*() {
						let didThrowAnError = false
						try {
							yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {email: 'fakeEmail', password: 'fakePassword'},
								json: true
							})
						} catch(e) {
							if (e && e.response && e.response.body && (e.response.body.error === 'Invalid email or password.')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						assert(didThrowAnError)
						return true
					})
				})
				it('should throw an error with the correct message if the user is not active', function() {
					return co(function*() {
						let didThrowAnError = false
						yield dbComponent.model.update({status: false}, {where: {id: 1}})
						try {
							yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {email: 'admin@ramster.com', password: 'fakePassword'},
								json: true
							})
						} catch(e) {
							if (e && e.response && e.response.body && (e.response.body.error === 'Your account is currently inactive.')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						assert(didThrowAnError)
						return true
					})
				})
				it('should throw an error with the correct message if the user type not active', function() {
					return co(function*() {
						let didThrowAnError = false
						yield dbComponent.model.update({status: true}, {where: {id: 1}})
						yield userTypes.model.update({status: false}, {where: {id: 1}})
						try {
							yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {email: 'admin@ramster.com', password: 'fakePassword'},
								json: true
							})
						} catch(e) {
							if (e && e.response && e.response.body && (e.response.body.error === 'Your account is currently inactive.')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						assert(didThrowAnError)
						return true
					})
				})
				it('should execute successfully, return the user data and the session cookie in the header if the email and password are correct', function() {
					return co(function*() {
						yield userTypes.model.update({status: true}, {where: {id: 1}})
						yield dbComponent.model.update({password: 'testPassword1234'}, {where: {email: 'admin@ramster.com'}})
						let didThrowAnError = false,
							result = yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {email: 'admin@ramster.com', password: 'testPassword1234'},
								json: true,
								resolveWithFullResponse: true
							}),
							userFromMethod = result.body,
							userFromDB = yield dbComponent.model.findOne({
								where: {id: 1},
								include: [{
									model: userTypes.model,
									as: 'type',
									include: [{model: moduleAccessPoints.model, as: 'accessPoints'}]
								}]
							}),
							alwaysAccessibleModules = yield modules.model.findAll({
								where: {alwaysAccessible: true},
								include: [{model: moduleAccessPoints.model, as: 'accessPoints'}]
							}),
							dataIsGood = true
						if (!userFromMethod) {
							console.log('The method did not return the user.')
							dataIsGood = false
						}
						if (dataIsGood && !userFromMethod.permissionsData) {
							console.log('The method did not return the user\'s permissions data.')
							dataIsGood = false
						}
						if (dataIsGood) {
							const permissionsData = userFromMethod.permissionsData,
								accessPoints = userFromDB.type.accessPoints
							for (const i in accessPoints) {
								const ap = accessPoints[i],
									pd = permissionsData[ap.moduleId]
								if (!pd) {
									console.log(`Missing permissions data object for module id ${ap.moduleId}.`)
									dataIsGood = false
									break
								}
								if (pd.ids.indexOf(ap.id) === -1) {
									console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for module id ${ap.moduleId} (ids array).`)
									dataIsGood = false
									break
								}
								if (!pd.text[`can${ap.name.replace(/\s/g, '')}`]) {
									console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for module id ${ap.moduleId} (text object).`)
									dataIsGood = false
									break
								}
							}
							if (dataIsGood) {
								for (const i in alwaysAccessibleModules) {
									const m = alwaysAccessibleModules[i],
										aps = m.accessPoints,
										pd = permissionsData[m.id]
									if (!pd) {
										console.log(`Missing permissions data object for always accessible module id ${m.id}.`)
										dataIsGood = false
										break
									}
									for (const j in aps) {
										const ap = aps[j]
										if (pd.ids.indexOf(ap.id) === -1) {
											console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${m.id} (ids array).`)
											dataIsGood = false
											break
										}
										if (!pd.text[`can${ap.name.replace(/\s/g, '')}`]) {
											console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${m.id} (text object).`)
											dataIsGood = false
											break
										}
									}
									if (!dataIsGood) {
										break
									}
								}
							}
						}
						if (dataIsGood && (typeof userFromMethod.password !== 'undefined')) {
							console.log('The method did not delete the user\'s password from the returned object.')
							dataIsGood = false
						}
						if (dataIsGood && (!result.headers['set-cookie'])) {
							console.log('The method did not return a set-cookie header.')
							dataIsGood = false
						}
						if (dataIsGood) {
							sessionCookie = result.headers['set-cookie']
						}
						assert(dataIsGood)
						return true
					})
				})
				it('should throw an error with the correct message if the user is already logged in', function() {
					return co(function*() {
						let didThrowAnError = false
						try {
							yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								headers: {
									cookie: sessionCookie
								},
								body: {email: 'admin@ramster.com', password: 'fakePassword'},
								json: true
							})
						} catch(e) {
							if (e && e.response && e.response.body && (e.response.body.error === 'Already logged in.')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						assert(didThrowAnError)
						return true
					})
				})
			})
			describe('POST /users/login with a token', function() {
				let sessionCookie = null
				before(function() {
					return co(function*() {
						yield dbComponent.model.update({status: false}, {where: {id: 1}})
						yield generalStore.removeEntry('user-1-dbLoginToken')
						return true
					})
				})
				it('should throw an error with the correct message if the token is invalid', function() {
					return co(function*() {
						let didThrowAnError = false
						try {
							yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {token: 'fakeToken'},
								json: true
							})
						} catch(e) {
							if (e && e.response && e.response.body && (e.response.body.error === 'Invalid or expired token.')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						assert(didThrowAnError)
						return true
					})
				})
				it('should throw an error with the correct message if the token has expired', function() {
					return new Promise((resolve, reject) => {
						tokenManager.signToken({id: 1}, tokensSecret, 1 / 60).then((token) => {
							setTimeout(() => {
								request({
									method: 'post',
									uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
									body: {token},
									json: true
								}).then((promiseResult) => {
									reject('Token did not expire.')
								}, (e) => {
									if (e && e.response && e.response.body && (e.response.body.error === 'Invalid or expired token.')) {
										resolve(true)
										return
									}
									reject(e)
								})
							}, 1500)
						}, (err) => {
							reject(err)
						})
					})
				})
				it('should throw an error with the correct message if the token does not contain an id', function() {
					return co(function*() {
						let didThrowAnError = false
						try {
							yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {token: yield tokenManager.signToken({noId: true}, tokensSecret)},
								json: true
							})
						} catch(e) {
							if (e && e.response && e.response.body && (e.response.body.error === 'Invalid or expired token.')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						assert(didThrowAnError)
						return true
					})
				})
				it('should throw an error with the correct message if no user is found for the id in the token', function() {
					return co(function*() {
						let didThrowAnError = false
						try {
							yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {token: yield tokenManager.signToken({id: 10000}, tokensSecret)},
								json: true
							})
						} catch(e) {
							if (e && e.response && e.response.body && (e.response.body.error === 'Invalid or expired token.')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						assert(didThrowAnError)
						return true
					})
				})
				it('should throw an error with the correct message if the user is inactive', function() {
					return co(function*() {
						let didThrowAnError = false
						try {
							yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {token: yield tokenManager.signToken({id: 1}, tokensSecret)},
								json: true
							})
						} catch(e) {
							if (e && e.response && e.response.body && (e.response.body.error === 'Your account is currently inactive.')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						assert(didThrowAnError)
						return true
					})
				})
				it('should throw an error with the correct message if the user type is inactive', function() {
					return co(function*() {
						let didThrowAnError = false
						yield dbComponent.model.update({status: true}, {where: {id: 1}})
						yield userTypes.model.update({status: false}, {where: {id: 1}})
						try {
							yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {token: yield tokenManager.signToken({id: 1}, tokensSecret)},
								json: true
							})
						} catch(e) {
							if (e && e.response && e.response.body && (e.response.body.error === 'Your account is currently inactive.')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						assert(didThrowAnError)
						return true
					})
				})
				it('should throw an error with the correct message if the user does not have a stored token', function() {
					return co(function*() {
						let didThrowAnError = false
						yield dbComponent.model.update({status: true}, {where: {id: 1}})
						yield userTypes.model.update({status: true}, {where: {id: 1}})
						try {
							yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {token: yield tokenManager.signToken({id: 1}, tokensSecret)},
								json: true
							})
						} catch(e) {
							if (e && e.response && e.response.body && (e.response.body.error === 'Invalid or expired token.')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						assert(didThrowAnError)
						return true
					})
				})
				it('should throw an error with the correct message if the provided token does not match the user\'s stored token', function() {
					return co(function*() {
						let didThrowAnError = false
						yield generalStore.storeEntry('user-1-dbLoginToken', `{"token": "${yield tokenManager.signToken({id: 1, anotherPieceOfData: 'test'}, tokensSecret)}", "alreadyUsedForLogin": false}`)
						try {
							yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {token: yield tokenManager.signToken({id: 1}, tokensSecret)},
								json: true
							})
						} catch(e) {
							if (e && e.response && e.response.body && (e.response.body.error === 'Invalid or expired token.')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						assert(didThrowAnError)
						return true
					})
				})
				it('should throw an error with the correct message if the token has already been used for logging in', function() {
					return co(function*() {
						let didThrowAnError = false,
							token = yield tokenManager.signToken({id: 1}, tokensSecret)
						yield generalStore.storeEntry('user-1-dbLoginToken', `{"token": "${token}", "alreadyUsedForLogin": true}`)
						try {
							yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {token},
								json: true
							})
						} catch(e) {
							if (e && e.response && e.response.body && (e.response.body.error === 'Invalid or expired token.')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						assert(didThrowAnError)
						return true
					})
				})
				it('should return the user with his permissions mapped in a permissionsData object and set the token as already used if all parameters are correct and the user is found', function() {
					return co(function*() {
						let token = yield tokenManager.signToken({id: 1}, tokensSecret)
						yield generalStore.storeEntry('user-1-dbLoginToken', `{"token": "${token}", "alreadyUsedForLogin": false}`)
						let result = yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {token},
								json: true,
								resolveWithFullResponse: true
							}),
							userFromMethod = result.body
							userFromDB = yield dbComponent.model.findOne({
								where: {id: 1},
								include: [{
									model: userTypes.model,
									as: 'type',
									include: [{model: moduleAccessPoints.model, as: 'accessPoints'}]
								}]
							}),
							alwaysAccessibleModules = yield modules.model.findAll({
								where: {alwaysAccessible: true},
								include: [{model: moduleAccessPoints.model, as: 'accessPoints'}]
							}),
							dataIsGood = true
						if (!userFromMethod) {
							console.log('The method did not return the user.')
							dataIsGood = false
						}
						if (dataIsGood && !userFromMethod.permissionsData) {
							console.log('The method did not return the user\'s permissions data.')
							dataIsGood = false
						}
						if (dataIsGood) {
							const permissionsData = userFromMethod.permissionsData,
								accessPoints = userFromDB.type.accessPoints
							for (const i in accessPoints) {
								const ap = accessPoints[i],
									pd = permissionsData[ap.moduleId]
								if (!pd) {
									console.log(`Missing permissions data object for module id ${ap.moduleId}.`)
									dataIsGood = false
									break
								}
								if (pd.ids.indexOf(ap.id) === -1) {
									console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for module id ${ap.moduleId} (ids array).`)
									dataIsGood = false
									break
								}
								if (!pd.text[`can${ap.name.replace(/\s/g, '')}`]) {
									console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for module id ${ap.moduleId} (text object).`)
									dataIsGood = false
									break
								}
							}
							if (dataIsGood) {
								for (const i in alwaysAccessibleModules) {
									const m = alwaysAccessibleModules[i],
										aps = m.accessPoints,
										pd = permissionsData[m.id]
									if (!pd) {
										console.log(`Missing permissions data object for always accessible module id ${m.id}.`)
										dataIsGood = false
										break
									}
									for (const j in aps) {
										const ap = aps[j]
										if (pd.ids.indexOf(ap.id) === -1) {
											console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${m.id} (ids array).`)
											dataIsGood = false
											break
										}
										if (!pd.text[`can${ap.name.replace(/\s/g, '')}`]) {
											console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${m.id} (text object).`)
											dataIsGood = false
											break
										}
									}
									if (!dataIsGood) {
										break
									}
								}
							}
						}
						if (dataIsGood && (typeof userFromMethod.password !== 'undefined')) {
							console.log('The method did not delete the user\'s password from the returned object.')
							dataIsGood = false
						}
						if (dataIsGood && (!result.headers['set-cookie'])) {
							console.log('The method did not return a set-cookie header.')
							dataIsGood = false
						}
						if (dataIsGood) {
							token = JSON.parse(yield generalStore.getStoredEntry('user-1-dbLoginToken'))
							if (token.alreadyUsedForLogin !== true) {
								console.log('Failed to set the alreadyUsedForLogin field in the token data.')
								dataIsGood = false
							}
						}
						if (dataIsGood) {
							sessionCookie = result.headers['set-cookie']
						}
						assert(dataIsGood)
						return true
					})
				})
				it('should throw an error with the correct message if the user is already logged in', function() {
					return co(function*() {
						let didThrowAnError = false
						try {
							yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {token: 'fakeToken'},
								headers: {
									cookie: sessionCookie
								},
								json: true
							})
						} catch(e) {
							if (e && e.response && e.response.body && (e.response.body.error === 'Already logged in.')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						assert(didThrowAnError)
						return true
					})
				})
			})
		})
	},
	testLogout: function() {
		const instance = this,
			{moduleConfig} = this.module
		describe('client.users.logout: GET /users/login', function() {
			let sessionCookie = null
			before(function() {
				return co(function*() {
					let result = yield request({
						method: 'post',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
						body: {email: 'admin@ramster.com', password: 'testPassword1234'},
						json: true,
						resolveWithFullResponse: true
					})
					sessionCookie = result.headers['set-cookie']
					return true
				})
			})
			it('should return a 401 error if the user is not logged in', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield request({
							method: 'get',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/logout`,
							json: true
						})
					} catch(e) {
						if (e && e.response && (e.response.statusCode === 401)) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully and redirect the user to /login if the user is logged in', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/logout`,
						headers: {cookie: sessionCookie},
						json: true,
						resolveWithFullResponse: true
					})
					assert(
						(result.request.headers.referer === `http://127.0.0.1:${moduleConfig.serverPort}/users/logout`) &&
						(result.request.href === `http://127.0.0.1:${moduleConfig.serverPort}/login`)
					)
					return true
				})
			})
		})
	},
	testGetLoggedInUserData: function() {
		const instance = this,
			{dbComponent} = this,
			{db, generalStore, moduleConfig} = this.module,
			{moduleAccessPoints, modules, userTypes} = db.components
		describe('client.users.getLoggedInUserData: GET /users/loggedInUserData', function() {
			let sessionCookie = null
			before(function() {
				return co(function*() {
					let result = yield request({
						method: 'post',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
						body: {email: 'admin@ramster.com', password: 'testPassword1234'},
						json: true,
						resolveWithFullResponse: true
					})
					sessionCookie = result.headers['set-cookie']
					return true
				})
			})
			it('should execute successfully and return null if the user is not logged in', function() {
				return co(function*() {
					let user = yield request({
						method: 'get',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/loggedInUserData`,
						json: true
					})
					assert(user === null)
					return true
				})
			})
			it('should execute successfully and return the user data if the user is logged in and the permissionsUpdated flag is not set', function() {
				return co(function*() {
					let userFromMethod = yield request({
							method: 'get',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/loggedInUserData`,
							headers: {cookie: sessionCookie},
							json: true
						}),
						userFromDB = yield dbComponent.model.findOne({
							where: {id: 1},
							include: [{
								model: userTypes.model,
								as: 'type',
								include: [{model: moduleAccessPoints.model, as: 'accessPoints'}]
							}]
						}),
						alwaysAccessibleModules = yield modules.model.findAll({
							where: {alwaysAccessible: true},
							include: [{model: moduleAccessPoints.model, as: 'accessPoints'}]
						}),
						dataIsGood = true
					if (!userFromMethod) {
						console.log('The method did not return the user.')
						dataIsGood = false
					}
					if (dataIsGood && !userFromMethod.permissionsData) {
						console.log('The method did not return the user\'s permissions data.')
						dataIsGood = false
					}
					if (dataIsGood) {
						const permissionsData = userFromMethod.permissionsData,
							accessPoints = userFromDB.type.accessPoints
						for (const i in accessPoints) {
							const ap = accessPoints[i],
								pd = permissionsData[ap.moduleId]
							if (!pd) {
								console.log(`Missing permissions data object for module id ${ap.moduleId}.`)
								dataIsGood = false
								break
							}
							if (pd.ids.indexOf(ap.id) === -1) {
								console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for module id ${ap.moduleId} (ids array).`)
								dataIsGood = false
								break
							}
							if (!pd.text[`can${ap.name.replace(/\s/g, '')}`]) {
								console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for module id ${ap.moduleId} (text object).`)
								dataIsGood = false
								break
							}
						}
						if (dataIsGood) {
							for (const i in alwaysAccessibleModules) {
								const m = alwaysAccessibleModules[i],
									aps = m.accessPoints,
									pd = permissionsData[m.id]
								if (!pd) {
									console.log(`Missing permissions data object for always accessible module id ${m.id}.`)
									dataIsGood = false
									break
								}
								for (const j in aps) {
									const ap = aps[j]
									if (pd.ids.indexOf(ap.id) === -1) {
										console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${m.id} (ids array).`)
										dataIsGood = false
										break
									}
									if (!pd.text[`can${ap.name.replace(/\s/g, '')}`]) {
										console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${m.id} (text object).`)
										dataIsGood = false
										break
									}
								}
								if (!dataIsGood) {
									break
								}
							}
						}
					}
					if (dataIsGood && (typeof userFromMethod.password !== 'undefined')) {
						console.log('The method did not delete the user\'s password from the returned object.')
						dataIsGood = false
					}
					assert(true)
					return true
				})
			})
			it('should execute successfully, return the updated user data and remove the permissionsUpdated flag if the user is logged in and the permissionsUpdated flag is set and this user\'s is the only entry in it', function() {
				return co(function*() {
					yield generalStore.storeEntry(`db-userTypeId-1-permissionsUpdated`, JSON.stringify([1]))
					let userFromMethod = yield request({
							method: 'get',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/loggedInUserData`,
							headers: {cookie: sessionCookie},
							json: true
						}),
						userFromDB = yield dbComponent.model.findOne({
							where: {id: 1},
							include: [{
								model: userTypes.model,
								as: 'type',
								include: [{model: moduleAccessPoints.model, as: 'accessPoints'}]
							}]
						}),
						alwaysAccessibleModules = yield modules.model.findAll({
							where: {alwaysAccessible: true},
							include: [{model: moduleAccessPoints.model, as: 'accessPoints'}]
						}),
						dataIsGood = true
					if (!userFromMethod) {
						console.log('The method did not return the user.')
						dataIsGood = false
					}
					if (dataIsGood && !userFromMethod.permissionsData) {
						console.log('The method did not return the user\'s permissions data.')
						dataIsGood = false
					}
					if (dataIsGood) {
						const permissionsData = userFromMethod.permissionsData,
							accessPoints = userFromDB.type.accessPoints
						for (const i in accessPoints) {
							const ap = accessPoints[i],
								pd = permissionsData[ap.moduleId]
							if (!pd) {
								console.log(`Missing permissions data object for module id ${ap.moduleId}.`)
								dataIsGood = false
								break
							}
							if (pd.ids.indexOf(ap.id) === -1) {
								console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for module id ${ap.moduleId} (ids array).`)
								dataIsGood = false
								break
							}
							if (!pd.text[`can${ap.name.replace(/\s/g, '')}`]) {
								console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for module id ${ap.moduleId} (text object).`)
								dataIsGood = false
								break
							}
						}
						if (dataIsGood) {
							for (const i in alwaysAccessibleModules) {
								const m = alwaysAccessibleModules[i],
									aps = m.accessPoints,
									pd = permissionsData[m.id]
								if (!pd) {
									console.log(`Missing permissions data object for always accessible module id ${m.id}.`)
									dataIsGood = false
									break
								}
								for (const j in aps) {
									const ap = aps[j]
									if (pd.ids.indexOf(ap.id) === -1) {
										console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${m.id} (ids array).`)
										dataIsGood = false
										break
									}
									if (!pd.text[`can${ap.name.replace(/\s/g, '')}`]) {
										console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${m.id} (text object).`)
										dataIsGood = false
										break
									}
								}
								if (!dataIsGood) {
									break
								}
							}
						}
					}
					if (dataIsGood && (typeof userFromMethod.password !== 'undefined')) {
						console.log('The method did not delete the user\'s password from the returned object.')
						dataIsGood = false
					}
					if (dataIsGood && ((yield generalStore.getStoredEntry(`db-userTypeId-${userFromDB.typeId}-permissionsUpdated`)) !== null)) {
						console.log('The method did not remove the permissionsUpdated flag.')
						dataIsGood = false
					}
					assert(true)
					return true
				})
			})
			it('should execute successfully, return the updated user data and update the permissionsUpdated flag if the user is logged in and the permissionsUpdated flag is set and this user\'s is not the only entry in it', function() {
				return co(function*() {
					yield generalStore.storeEntry(`db-userTypeId-1-permissionsUpdated`, JSON.stringify([1, 2]))
					let userFromMethod = yield request({
							method: 'get',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/loggedInUserData`,
							headers: {cookie: sessionCookie},
							json: true
						}),
						userFromDB = yield dbComponent.model.findOne({
							where: {id: 1},
							include: [{
								model: userTypes.model,
								as: 'type',
								include: [{model: moduleAccessPoints.model, as: 'accessPoints'}]
							}]
						}),
						alwaysAccessibleModules = yield modules.model.findAll({
							where: {alwaysAccessible: true},
							include: [{model: moduleAccessPoints.model, as: 'accessPoints'}]
						}),
						permissionsUpdatedFlag = yield generalStore.getStoredEntry(`db-userTypeId-${userFromDB.typeId}-permissionsUpdated`),
						dataIsGood = true
					if (!userFromMethod) {
						console.log('The method did not return the user.')
						dataIsGood = false
					}
					if (dataIsGood && !userFromMethod.permissionsData) {
						console.log('The method did not return the user\'s permissions data.')
						dataIsGood = false
					}
					if (dataIsGood) {
						const permissionsData = userFromMethod.permissionsData,
							accessPoints = userFromDB.type.accessPoints
						for (const i in accessPoints) {
							const ap = accessPoints[i],
								pd = permissionsData[ap.moduleId]
							if (!pd) {
								console.log(`Missing permissions data object for module id ${ap.moduleId}.`)
								dataIsGood = false
								break
							}
							if (pd.ids.indexOf(ap.id) === -1) {
								console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for module id ${ap.moduleId} (ids array).`)
								dataIsGood = false
								break
							}
							if (!pd.text[`can${ap.name.replace(/\s/g, '')}`]) {
								console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for module id ${ap.moduleId} (text object).`)
								dataIsGood = false
								break
							}
						}
						if (dataIsGood) {
							for (const i in alwaysAccessibleModules) {
								const m = alwaysAccessibleModules[i],
									aps = m.accessPoints,
									pd = permissionsData[m.id]
								if (!pd) {
									console.log(`Missing permissions data object for always accessible module id ${m.id}.`)
									dataIsGood = false
									break
								}
								for (const j in aps) {
									const ap = aps[j]
									if (pd.ids.indexOf(ap.id) === -1) {
										console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${m.id} (ids array).`)
										dataIsGood = false
										break
									}
									if (!pd.text[`can${ap.name.replace(/\s/g, '')}`]) {
										console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${m.id} (text object).`)
										dataIsGood = false
										break
									}
								}
								if (!dataIsGood) {
									break
								}
							}
						}
					}
					if (dataIsGood && (typeof userFromMethod.password !== 'undefined')) {
						console.log('The method did not delete the user\'s password from the returned object.')
						dataIsGood = false
					}
					if (dataIsGood && (permissionsUpdatedFlag === null)) {
						console.log('The method did not update the permissionsUpdated flag correctly, it removed it instead.')
						dataIsGood = false
					}
					if (dataIsGood) {
						permissionsUpdatedFlag = JSON.parse(permissionsUpdatedFlag)
						if (!(permissionsUpdatedFlag instanceof Array) || (permissionsUpdatedFlag.length !== 1) || (permissionsUpdatedFlag.indexOf(1) !== -1)) {
							console.log('The method did not update the permissionsUpdated flag correctly.')
							dataIsGood = false
						}
					}
					assert(true)
					return true
				})
			})
		})
	},
	testCheckEmail: function() {
		const instance = this,
			{moduleConfig} = this.module
		let sessionCookie = null
		describe('client.users.checkEmail: GET /users/checkEmail', function() {
			before(function() {
				return co(function*() {
					let result = yield request({
						method: 'post',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
						body: {email: 'admin@ramster.com', password: 'testPassword1234'},
						json: true,
						resolveWithFullResponse: true
					})
					sessionCookie = result.headers['set-cookie']
					return true
				})
			})
			it('should return {emailInUse: true} if the email is in use and the user is not logged in', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/checkEmail`,
						qs: {email: encodeURIComponent('admin@ramster.com')},
						json: true
					})
					assert(result.emailInUse === true)
					return true
				})
			})
			it('should return {emailInUse: true} if the email is in use and the user is logged in', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						headers: {cookie: sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/checkEmail`,
						qs: {email: encodeURIComponent('admin@ramster.com')},
						json: true
					})
					assert(result.emailInUse === true)
					return true
				})
			})
			it('should return {emailInUse: false} if the email is not in use and the user is not logged in', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/checkEmail`,
						qs: {email: encodeURIComponent('admin.not.in.use@ramster.com')},
						json: true
					})
					assert(result.emailInUse === false)
					return true
				})
			})
			it('should return {emailInUse: false} if the email is not in use and the user is logged in', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						headers: {cookie: sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/checkEmail`,
						qs: {email: encodeURIComponent('admin.not.in.use@ramster.com')},
						json: true
					})
					assert(result.emailInUse === false)
					return true
				})
			})
		})
	},
	testSendPasswordResetRequest: function() {
		const instance = this,
			{db, generalStore, moduleConfig} = this.module
		describe('client.users.sendPasswordResetRequest: GET /users/sendPasswordResetRequest', function() {
			before(function(){
				return co(function*() {
					yield generalStore.removeEntry('user-1-dbLoginToken')
					return true
				})
			})
			it('should throw an error with the correct message if the user is not found by email', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield request({
							method: 'get',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/sendPasswordResetRequest`,
							qs: {email: encodeURIComponent('emailDoesNotExist@ramster.com')},
							json: true
						})
					} catch(e) {
						if (e && e.response && e.response.body && (e.response.body.error === 'User not found.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully and set the proper token if all parameters are correct and the user is found', function() {
				return co(function*() {
					yield request({
						method: 'get',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/sendPasswordResetRequest`,
						qs: {email: encodeURIComponent('admin@ramster.com')},
						json: true
					})
					let tokenData = JSON.parse(yield generalStore.getStoredEntry('user-1-dbLoginToken')),
						dataIsGood = true
					if (!tokenData) {
						console.log('The method did not set the token data object correctly.')
						dataIsGood = false
					}
					if (dataIsGood && !tokenData.token) {
						console.log('The method did not set the token correctly.')
						dataIsGood = false
					}
					if (dataIsGood && (tokenData.alreadyUsedForLogin !== false)) {
						console.log('The method did not set the alreadyUsedForLogin property to false.')
						dataIsGood = false
					}
					assert(dataIsGood)
					return true
				})
			})
		})
	},
	testSendEmailUpdateRequest: function() {
		const instance = this,
			{db, generalStore, moduleConfig} = this.module
		let sessionCookie = null
		describe('client.users.sendEmailUpdateRequest: GET /users/sendEmailUpdateRequest', function() {
			before(function(){
				return co(function*() {
					let result = yield request({
						method: 'post',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
						body: {email: 'admin@ramster.com', password: 'testPassword1234'},
						json: true,
						resolveWithFullResponse: true
					})
					sessionCookie = result.headers['set-cookie']
					yield generalStore.removeEntry('user-1-dbLoginToken')
					return true
				})
			})
			it('should end with status 401 if the user is not logged in', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield request({
							method: 'get',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/sendEmailUpdateRequest`,
							qs: {id: 1500},
							json: true
						})
					} catch(e) {
						if (e && e.response && (e.response.statusCode === 401)) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully, set the uncofirmed email and set the proper token if all parameters are correct', function() {
				return co(function*() {
					yield request({
						method: 'get',
						headers: {cookie: sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/sendEmailUpdateRequest`,
						qs: {id: 1, newEmail: encodeURIComponent('admintest@ramster.com')},
						json: true
					})
					let user = yield instance.dbComponent.model.findOne({where: {id: 1}}),
						tokenData = JSON.parse(yield generalStore.getStoredEntry('user-1-dbLoginToken')),
						dataIsGood = true
					if (user.unconfirmedEmail !== 'admintest@ramster.com') {
						console.log('The method did not set the uncofirmed email correctly.')
						dataIsGood = false
					}
					if (dataIsGood && !tokenData) {
						console.log('The method did not set the token data object correctly.')
						dataIsGood = false
					}
					if (dataIsGood && !tokenData.token) {
						console.log('The method did not set the token correctly.')
						dataIsGood = false
					}
					if (dataIsGood && (tokenData.alreadyUsedForLogin !== false)) {
						console.log('The method did not set the alreadyUsedForLogin property to false.')
						dataIsGood = false
					}
					assert(dataIsGood)
					return true
				})
			})
		})
	},
	testUpdatePassword: function() {
		const instance = this,
			{config, db, generalStore, moduleConfig, tokenManager} = this.module
		let sessionCookie = null
		describe('client.users.updatePassword: PATCH /users/password', function() {
			before(function(){
				return co(function*() {
					let result = yield request({
						method: 'post',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
						body: {email: 'admin@ramster.com', password: 'testPassword1234'},
						json: true,
						resolveWithFullResponse: true
					})
					sessionCookie = result.headers['set-cookie']
					yield generalStore.removeEntry('user-1-dbLoginToken')
					yield instance.dbComponent.model.update({password: '1234'}, {where: {id: 1}})
					return true
				})
			})
			it('should end with status 401 if the user is not logged in', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield request({
							method: 'patch',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/password`,
							body: {},
							json: true
						})
					} catch(e) {
						if (e && e.response && (e.response.statusCode === 401)) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if no token and no current password is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield request({
							method: 'patch',
							headers: {cookie: sessionCookie},
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/password`,
							body: {},
							json: true
						})
					} catch(e) {
						if (e && e.response && e.response.body && (e.response.body.error === 'User not found, wrong current password, or an invalid or expired token.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if the provided token does not match the user\'s token', function() {
				return co(function*() {
					let didThrowAnError = false
					yield generalStore.storeEntry('user-1-dbLoginToken', JSON.stringify({token: 'theActualToken', alreadyUsedForLogin: true}))
					try {
						yield request({
							method: 'patch',
							headers: {cookie: sessionCookie},
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/password`,
							body: {passwordResetToken: 'fakeToken'},
							json: true
						})
					} catch(e) {
						if (e && e.response && e.response.body && (e.response.body.error === 'User not found, wrong current password, or an invalid or expired token.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if the provided token has expired', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let token = yield tokenManager.signToken({id: 1}, config.db.tokensSecret, 1 / 60)
						yield generalStore.storeEntry('user-1-dbLoginToken', JSON.stringify({token, alreadyUsedForLogin: true}))
						return token
					}).then((token) => {
						setTimeout(() => {
							request({
								method: 'patch',
								headers: {cookie: sessionCookie},
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/password`,
								body: {passwordResetToken: token},
								json: true
							}).then((promiseResult) => {
								reject('Token did not expire.')
							}, (e) => {
								if (e && e.response && e.response.body && (e.response.body.error === 'User not found, wrong current password, or an invalid or expired token.')) {
									resolve(true)
									return
								}
								reject(e)
							})
						}, 1500)
					}, (err) => reject(err))
				})
			})
			it('should throw an error with the correct message if the provided currentPassword does not match the user\'s current password', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield request({
							method: 'patch',
							headers: {cookie: sessionCookie},
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/password`,
							body: {currentPassword: 'fakePassword'},
							json: true
						})
					} catch(e) {
						if (e && e.response && e.response.body && (e.response.body.error === 'User not found, wrong current password, or an invalid or expired token.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully, update the password and remove the token if all parameters are correct and a valid token is provided', function() {
				return co(function*() {
					let token = yield tokenManager.signToken({id: 1}, config.db.tokensSecret)
					yield generalStore.storeEntry('user-1-dbLoginToken', JSON.stringify({token, alreadyUsedForLogin: true}))
					yield request({
						method: 'patch',
						headers: {cookie: sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/password`,
						body: {passwordResetToken: token, newPassword: 'testPassword1234'},
						json: true
					})
					let user = yield instance.dbComponent.model.scope('full').findOne({where: {id: 1}, attributes: ['password']}),
						tokenData = yield generalStore.getStoredEntry('user-1-dbLoginToken'),
						dataIsGood = true
					if (!bcryptjs.compareSync('testPassword1234', user.password)) {
						console.log('The method did not update the password correctly.')
						dataIsGood = false
					}
					if (dataIsGood && (tokenData !== null)) {
						console.log('The method did not remove the token.')
						dataIsGood = false
					}
					assert(dataIsGood)
					return true
				})
			})
			it('should execute successfully and update the password if all paramters are correct and the correct currentPassword is provided', function() {
				return co(function*() {
					yield request({
						method: 'patch',
						headers: {cookie: sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/password`,
						body: {currentPassword: 'testPassword1234', newPassword: 'testPassword4321'},
						json: true
					})
					let user = yield instance.dbComponent.model.scope('full').findOne({where: {id: 1}, attributes: ['password']})
					assert(bcryptjs.compareSync('testPassword4321', user.password))
					return true
				})
			})
			it('should throw an error if no new password is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield request({
							method: 'patch',
							headers: {cookie: sessionCookie},
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/password`,
							body: {currentPassword: 'testPassword4321'},
							json: true
						})
					} catch(e) {
						didThrowAnError = true
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if the provided new password is less than 3 characters long', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield request({
							method: 'patch',
							headers: {cookie: sessionCookie},
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/password`,
							body: {currentPassword: 'testPassword4321', newPassword: '123'},
							json: true
						})
					} catch(e) {
						if (e && e.response && e.response.body && (e.response.body.error === 'The password must be at least 4 characters long.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
		})
	},
	testUpdateEmail: function() {
		const instance = this,
			{config, db, generalStore, moduleConfig, tokenManager} = this.module
		let sessionCookie = null
		describe('client.users.updateEmail: PATCH /users/email', function() {
			before(function() {
				return co(function*() {
					let result = yield request({
						method: 'post',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
						body: {email: 'admin@ramster.com', password: 'testPassword4321'},
						json: true,
						resolveWithFullResponse: true
					})
					sessionCookie = result.headers['set-cookie']
					yield generalStore.removeEntry('user-1-dbLoginToken')
					yield instance.dbComponent.model.update({unconfirmedEmail: 'admintest@ramster.com'}, {where: {id: 1}})
					return true
				})
			})
			it('should end with status 401 if the user is not logged in', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield request({
							method: 'patch',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/email`,
							body: {},
							json: true
						})
					} catch(e) {
						if (e && e.response && (e.response.statusCode === 401)) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if no token is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield request({
							method: 'patch',
							headers: {cookie: sessionCookie},
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/email`,
							body: {},
							json: true
						})
					} catch(e) {
						if (e && e.response && e.response.body && (e.response.body.error === 'User not found, or an invalid or expired token has been provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if the provided token does not match the user\'s token', function() {
				return co(function*() {
					let didThrowAnError = false
					yield generalStore.storeEntry('user-1-dbLoginToken', JSON.stringify({token: 'theActualToken', alreadyUsedForLogin: true}))
					try {
						yield request({
							method: 'patch',
							headers: {cookie: sessionCookie},
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/email`,
							body: {token: 'fakeToken'},
							json: true
						})
					} catch(e) {
						if (e && e.response && e.response.body && (e.response.body.error === 'User not found, or an invalid or expired token has been provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if the provided token has expired', function() {
				return new Promise((resolve, reject) => {
					co(function*() {
						let token = yield tokenManager.signToken({id: 1}, config.db.tokensSecret, 1 / 60)
						yield generalStore.storeEntry('user-1-dbLoginToken', JSON.stringify({token, alreadyUsedForLogin: true}))
						return token
					}).then((token) => {
						setTimeout(() => {
							request({
								method: 'patch',
								headers: {cookie: sessionCookie},
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/email`,
								body: {token},
								json: true
							}).then((promiseResult) => {
								reject('Token did not expire.')
							}, (e) => {
								if (e && e.response && e.response.body && (e.response.body.error === 'User not found, or an invalid or expired token has been provided.')) {
									resolve(true)
									return
								}
								reject(e)
							})
						}, 1500)
					}, (err) => reject(err))
				})
			})
			it('should execute successfully, update the email and remove the token if all parameters are correct and a valid token is provided', function() {
				return co(function*() {
					let token = yield tokenManager.signToken({id: 1}, config.db.tokensSecret)
					yield generalStore.storeEntry('user-1-dbLoginToken', JSON.stringify({token, alreadyUsedForLogin: true}))
					yield request({
						method: 'patch',
						headers: {cookie: sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/email`,
						body: {token},
						json: true
					})
					let user = yield instance.dbComponent.model.scope('full').findOne({where: {id: 1}, attributes: ['email', 'unconfirmedEmail']}),
						tokenData = yield generalStore.getStoredEntry('user-1-dbLoginToken'),
						dataIsGood = true
					if (user.email !== 'admintest@ramster.com') {
						console.log('The method did not update the email correctly.')
						dataIsGood = false
					}
					if (dataIsGood && (user.unconfirmedEmail !== null)) {
						console.log('The method did not update set the unconfirmedEmail to null.')
						dataIsGood = false
					}
					if (dataIsGood && (tokenData !== null)) {
						console.log('The method did not remove the token.')
						dataIsGood = false
					}
					assert(dataIsGood)
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield instance.dbComponent.model.update({email: 'admin@ramster.com'}, {where: {id: 1}})
					return true
				})
			})
		})
	},
	testUpdateProfile: function() {
		const instance = this,
			{moduleConfig} = this.module
		let sessionCookie = null
		describe('client.users.updateProfile: PATCH /users/profile', function() {
			before(function() {
				return co(function*() {
					let result = yield request({
						method: 'post',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
						body: {email: 'admin@ramster.com', password: 'testPassword4321'},
						json: true,
						resolveWithFullResponse: true
					})
					sessionCookie = result.headers['set-cookie']
					return true
				})
			})
			it('should end with status 401 if the user is not logged in', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield request({
							method: 'patch',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/profile`,
							body: {},
							json: true
						})
					} catch(e) {
						if (e && e.response && (e.response.statusCode === 401)) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully and update only the allowed profile update fields if all parameters are correct', function() {
				return co(function*() {
					let user = yield request({
							method: 'patch',
							headers: {cookie: sessionCookie},
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/profile`,
							body: {typeId: 35, email: 'shouldNotUpdateTheEmail@ramster.com', phone: '+359888777666', gender: 'other', lastLogin: 'now'},
							json: true
						}),
						userShouldBe = {id: 1, typeId: 1, firstName: 'Admin', lastName: 'User', email: 'admin@ramster.com', phone: '+359888777666', gender: 'other', status: true}
						dataIsGood = true
					for (const i in userShouldBe) {
						const sbField = userShouldBe[i],
							isField = user[i]
						if (sbField !== isField) {
							console.log(`Bad value '${isField}' for field "${i}", expected '${sbField}'.`)
							dataIsGood = false
							break
						}
					}
					assert(dataIsGood)
					return true
				})
			})
		})
	}
}

const
	assert = require('assert'),
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
		describe('client.users.logout', function() {
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
			it.skip('should execute successfully and redirect the user to /login', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/logout`,
						headers: {cookie: sessionCookie},
						json: true,
						resolveWithFullResponse: true
					})
					console.log(result)
					assert(true)
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
		describe('client.users.getLoggedInUserData', function() {
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
	}
}

const
	assert = require('assert'),
	bcryptjs = require('bcryptjs'),
	co = require('co'),
	request = require('request-promise-native')

const checkUserData = (permissionsData, accessPoints, alwaysAccessibleModules) => {
	const {displayModuleAccessPointIds, displayModuleNames, accessPointsById} = permissionsData
	for (const i in accessPoints) {
		const ap = accessPoints[i],
			pd = displayModuleAccessPointIds[ap.displayModuleId]
		assert(pd, `Missing permissions data object for displayModule id ${ap.displayModuleId}, access point id ${ap.id}.`)
		assert(displayModuleNames[ap.displayModule.name], `Missing displayModule name for displayModule id ${ap.displayModuleId}, access point id ${ap.id}.`)
		assert.notStrictEqual(pd.indexOf(ap.id), -1, `Missing accessPoint with id ${ap.id}, displayModule id ${ap.displayModuleId}.`)
		assert(accessPointsById[ap.id], `Missing accessPoint data by id for the access point with id ${ap.id}, displayModule id ${ap.displayModuleId}.`)
	}
	for (const i in alwaysAccessibleModules) {
		const displayModule = alwaysAccessibleModules[i],
			aps = displayModule.accessPoints,
			pd = displayModuleAccessPointIds[displayModule.id]
		assert(pd, `Missing permissions data object for displayModule id ${displayModule.id}.`)
		assert(displayModuleNames[displayModule.name], `Missing displayModule name for displayModule id ${displayModule.id}.`)
		for (const j in aps) {
			const ap = aps[j]
			assert.notStrictEqual(pd.indexOf(ap.id), -1, `Missing accessPoint with id ${ap.id}, displayModule id ${ap.displayModuleId}.`)
			assert(accessPointsById[ap.id], `Missing accessPoint data by id for the access point with id ${ap.id}, displayModule id ${ap.displayModuleId}.`)
		}
	}
}

module.exports = {
	testLogin: function() {
		const {dbComponent} = this,
			{config, db, generalStore, moduleConfig, tokenManager} = this.module,
			{accessPoints, displayModules, userTypes} = db.components,
			tokensSecret = config.db.tokensSecret
		let changeableInstance = this
		describe('client.users.login', function() {
			describe('POST /users/login with email and password', function() {
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
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
						return true
					})
				})
				it('should throw an error with the correct message if the user is not active', function() {
					return co(function*() {
						let didThrowAnError = false
						yield dbComponent.model.update({active: false, password: 'testPassword1234'}, {where: {id: 1}})
						try {
							yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {email: 'admin@ramster.com', password: 'testPassword1234'},
								json: true
							})
						} catch(e) {
							if (e && e.response && e.response.body && (e.response.body.error === 'Your account is currently inactive.')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
						return true
					})
				})
				it('should throw an error with the correct message if the user type not active', function() {
					return co(function*() {
						let didThrowAnError = false
						yield dbComponent.model.update({active: true}, {where: {id: 1}})
						yield userTypes.model.update({active: false}, {where: {id: 1}})
						try {
							yield request({
								method: 'post',
								uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
								body: {email: 'admin@ramster.com', password: 'testPassword1234'},
								json: true
							})
						} catch(e) {
							if (e && e.response && e.response.body && (e.response.body.error === 'Your account is currently inactive.')) {
								didThrowAnError = true
							} else {
								throw e
							}
						}
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
						return true
					})
				})
				it('should execute successfully, return the user data and the session cookie in the header if the email and password are correct', function() {
					return co(function*() {
						yield userTypes.model.update({active: true}, {where: {id: 1}})
						let result = yield request({
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
									include: [{
										model: accessPoints.model, as: 'accessPoints',
										include: [{model: displayModules.model, as: 'displayModule', attributes: ['name']}]
									}]
								}]
							}),
							alwaysAccessibleModules = yield displayModules.model.findAll({
								where: {alwaysAccessible: true},
								include: [{model: accessPoints.model, as: 'accessPoints'}]
							})
						assert(userFromMethod, `bad value ${userFromMethod} for userFromMethod, expected it to exist`)
						const permissionsData = userFromMethod.permissionsData,
							aps = userFromDB.type.accessPoints
						assert(permissionsData, `bad value ${permissionsData} for permissionsData, expected it to exist`)
						checkUserData(permissionsData, aps, alwaysAccessibleModules)
						let typeOfPassword = typeof userFromMethod.password
						assert.strictEqual(typeOfPassword, 'undefined', `bad value ${typeOfPassword} for typeOfPassword, expected undefined`)
						assert(result.headers['set-cookie'], `expected result.headers['set-cookie'] to exist, got undefined`)
						changeableInstance.sessionCookie = result.headers['set-cookie']
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
									cookie: changeableInstance.sessionCookie
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
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
						return true
					})
				})
			})
			describe('POST /users/login with a token', function() {
				let sessionCookie = null
				before(function() {
					return co(function*() {
						yield dbComponent.model.update({active: false}, {where: {id: 1}})
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
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
						return true
					})
				})
				it('should throw an error with the correct message if the user type is inactive', function() {
					return co(function*() {
						let didThrowAnError = false
						yield dbComponent.model.update({active: true}, {where: {id: 1}})
						yield userTypes.model.update({active: false}, {where: {id: 1}})
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
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
						return true
					})
				})
				it('should throw an error with the correct message if the user does not have a stored token', function() {
					return co(function*() {
						let didThrowAnError = false
						yield dbComponent.model.update({active: true}, {where: {id: 1}})
						yield userTypes.model.update({active: true}, {where: {id: 1}})
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
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
									include: [{
										model: accessPoints.model, as: 'accessPoints',
										include: [{model: displayModules.model, as: 'displayModule', attributes: ['name']}]
									}]
								}]
							}),
							alwaysAccessibleModules = yield displayModules.model.findAll({
								where: {alwaysAccessible: true},
								include: [{model: accessPoints.model, as: 'accessPoints'}]
							})
						assert(userFromMethod, `bad value ${userFromMethod} for userFromMethod, expected it to exist`)
						const permissionsData = userFromMethod.permissionsData,
							aps = userFromDB.type.accessPoints
						assert(permissionsData, `bad value ${permissionsData} for permissionsData, expected it to exist`)
						checkUserData(permissionsData, aps, alwaysAccessibleModules)
						let typeOfPassword = typeof userFromMethod.password
						assert.strictEqual(typeOfPassword, 'undefined', `bad value ${typeOfPassword} for typeOfPassword, expected undefined`)
						assert(result.headers['set-cookie'], `expected result.headers['set-cookie'] to exist, got undefined`)
						token = JSON.parse(yield generalStore.getStoredEntry('user-1-dbLoginToken'))
						assert.strictEqual(token.alreadyUsedForLogin, true, `bad value ${token.alreadyUsedForLogin} for token.alreadyUsedForLogin, expected true`)
						sessionCookie = result.headers['set-cookie']
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
						assert.strictEqual(didThrowAnError, true, 'no error thrown')
						return true
					})
				})
			})
		})
	},
	testLogout: function() {
		const {moduleConfig} = this.module
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
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
						}),
						refererShouldBe = `http://127.0.0.1:${moduleConfig.serverPort}/users/logout`,
						hrefShouldBe = `http://127.0.0.1:${moduleConfig.serverPort}/login`
					assert.strictEqual(result.request.headers.referer, refererShouldBe, `bad value ${result.request.headers.referer} for result.request.headers.referer, expected ${refererShouldBe}`)
					assert.strictEqual(result.request.href, hrefShouldBe, `bad value ${result.request.href} for result.request.href, expected ${hrefShouldBe}`)
					return true
				})
			})
		})
	},
	testGetLoggedInUserData: function() {
		const {dbComponent} = this,
			{db, generalStore, moduleConfig} = this.module,
			{accessPoints, displayModules, userTypes} = db.components
		let changeableInstance = this
		describe('client.users.getLoggedInUserData: GET /users/loggedInUserData', function() {
			before(function() {
				return co(function*() {
					let result = yield request({
						method: 'post',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
						body: {email: 'admin@ramster.com', password: 'testPassword1234'},
						json: true,
						resolveWithFullResponse: true
					})
					changeableInstance.sessionCookie = result.headers['set-cookie']
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
					assert.strictEqual(user, null, `bad value ${user} for user, expected null`)
					return true
				})
			})
			it('should execute successfully and return the user data if the user is logged in and the permissionsUpdated flag is not set', function() {
				return co(function*() {
					let userFromMethod = yield request({
							method: 'get',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/loggedInUserData`,
							headers: {cookie: changeableInstance.sessionCookie},
							json: true
						}),
						userFromDB = yield dbComponent.model.findOne({
							where: {id: 1},
							include: [{
								model: userTypes.model,
								as: 'type',
								include: [{
									model: accessPoints.model, as: 'accessPoints',
									include: [{model: displayModules.model, as: 'displayModule', attributes: ['name']}]
								}]
							}]
						}),
						alwaysAccessibleModules = yield displayModules.model.findAll({
							where: {alwaysAccessible: true},
							include: [{model: accessPoints.model, as: 'accessPoints'}]
						})
					assert(userFromMethod, `bad value ${userFromMethod} for userFromMethod, expected it to exist`)
					const permissionsData = userFromMethod.permissionsData,
						aps = userFromDB.type.accessPoints
					assert(permissionsData, `bad value ${permissionsData} for permissionsData, expected it to exist`)
					checkUserData(permissionsData, aps, alwaysAccessibleModules)
					let typeOfPassword = typeof userFromMethod.password
					assert.strictEqual(typeOfPassword, 'undefined', `bad value ${typeOfPassword} for typeOfPassword, expected undefined`)
					return true
				})
			})
			it('should execute successfully, return the updated user data and remove the permissionsUpdated flag if the user is logged in and the permissionsUpdated flag is set and this user\'s is the only entry in it', function() {
				return co(function*() {
					yield generalStore.storeEntry(`db-userTypeId-1-permissionsUpdated`, JSON.stringify([1]))
					let userFromMethod = yield request({
							method: 'get',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/loggedInUserData`,
							headers: {cookie: changeableInstance.sessionCookie},
							json: true
						}),
						userFromDB = yield dbComponent.model.findOne({
							where: {id: 1},
							include: [{
								model: userTypes.model,
								as: 'type',
								include: [{
									model: accessPoints.model, as: 'accessPoints',
									include: [{model: displayModules.model, as: 'displayModule', attributes: ['name']}]
								}]
							}]
						}),
						alwaysAccessibleModules = yield displayModules.model.findAll({
							where: {alwaysAccessible: true},
							include: [{model: accessPoints.model, as: 'accessPoints'}]
						}),
						permissionsUpdatedFlag = yield generalStore.getStoredEntry(`db-userTypeId-${userFromDB.typeId}-permissionsUpdated`)
					assert(userFromMethod, `bad value ${userFromMethod} for userFromMethod, expected it to exist`)
					const permissionsData = userFromMethod.permissionsData,
						aps = userFromDB.type.accessPoints
					assert(permissionsData, `bad value ${permissionsData} for permissionsData, expected it to exist`)
					checkUserData(permissionsData, aps, alwaysAccessibleModules)
					let typeOfPassword = typeof userFromMethod.password
					assert.strictEqual(typeOfPassword, 'undefined', `bad value ${typeOfPassword} for typeOfPassword, expected undefined`)
					assert.strictEqual(permissionsUpdatedFlag, null, `bad value ${permissionsUpdatedFlag} for permissionsUpdatedFlag, expected null`)
					return true
				})
			})
			it('should execute successfully, return the updated user data and update the permissionsUpdated flag if the user is logged in and the permissionsUpdated flag is set and this user\'s is not the only entry in it', function() {
				return co(function*() {
					yield generalStore.storeEntry(`db-userTypeId-1-permissionsUpdated`, JSON.stringify([1, 2]))
					let userFromMethod = yield request({
							method: 'get',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/loggedInUserData`,
							headers: {cookie: changeableInstance.sessionCookie},
							json: true
						}),
						userFromDB = yield dbComponent.model.findOne({
							where: {id: 1},
							include: [{
								model: userTypes.model,
								as: 'type',
								include: [{
									model: accessPoints.model, as: 'accessPoints',
									include: [{model: displayModules.model, as: 'displayModule', attributes: ['name']}]
								}]
							}]
						}),
						alwaysAccessibleModules = yield displayModules.model.findAll({
							where: {alwaysAccessible: true},
							include: [{model: accessPoints.model, as: 'accessPoints'}]
						}),
						permissionsUpdatedFlag = JSON.parse(yield generalStore.getStoredEntry(`db-userTypeId-${userFromDB.typeId}-permissionsUpdated`))
					assert(userFromMethod, `bad value ${userFromMethod} for userFromMethod, expected it to exist`)
					const permissionsData = userFromMethod.permissionsData,
						aps = userFromDB.type.accessPoints
					assert(permissionsData, `bad value ${permissionsData} for permissionsData, expected it to exist`)
					checkUserData(permissionsData, aps, alwaysAccessibleModules)
					let typeOfPassword = typeof userFromMethod.password
					assert.strictEqual(typeOfPassword, 'undefined', `bad value ${typeOfPassword} for typeOfPassword, expected undefined`)
					assert(permissionsUpdatedFlag instanceof Array, `bad value ${permissionsUpdatedFlag} for permissionsUpdatedFlag, expected an array`)
					assert.strictEqual(permissionsUpdatedFlag.length, 1, `bad value ${permissionsUpdatedFlag.length} for permissionsUpdatedFlag.length, expected 1`)
					assert.strictEqual(permissionsUpdatedFlag.indexOf(1), -1, `bad value ${permissionsUpdatedFlag.indexOf(1)} for permissionsUpdatedFlag.indexOf(1), expected -1`)
					return true
				})
			})
		})
	},
	testCheckEmail: function() {
		const {moduleConfig} = this.module
		let changeableInstance = this
		describe('client.users.checkEmail: GET /users/checkEmail', function() {
			before(function() {
				return co(function*() {
					if (!changeableInstance.sessionCookie) {
						let result = yield request({
							method: 'post',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
							body: {email: 'admin@ramster.com', password: 'testPassword1234'},
							json: true,
							resolveWithFullResponse: true
						})
						changeableInstance.sessionCookie = result.headers['set-cookie']
					}
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
					assert.strictEqual(result.emailInUse, true, `bad value ${result.emailInUse} for result.emailInUse, expected true`)
					return true
				})
			})
			it('should return {emailInUse: true} if the email is in use and the user is logged in', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						headers: {cookie: changeableInstance.sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/checkEmail`,
						qs: {email: encodeURIComponent('admin@ramster.com')},
						json: true
					})
					assert.strictEqual(result.emailInUse, true, `bad value ${result.emailInUse} for result.emailInUse, expected true`)
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
					assert.strictEqual(result.emailInUse, false, `bad value ${result.emailInUse} for result.emailInUse, expected false`)
					return true
				})
			})
			it('should return {emailInUse: false} if the email is not in use and the user is logged in', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						headers: {cookie: changeableInstance.sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/checkEmail`,
						qs: {email: encodeURIComponent('admin.not.in.use@ramster.com')},
						json: true
					})
					assert.strictEqual(result.emailInUse, false, `bad value ${result.emailInUse} for result.emailInUse, expected false`)
					return true
				})
			})
		})
	},
	testSendPasswordResetRequest: function() {
		const {generalStore, moduleConfig} = this.module
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
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
					let tokenData = JSON.parse(yield generalStore.getStoredEntry('user-1-dbLoginToken'))
					assert(tokenData, `bad value ${tokenData} for tokenData, expected it to exist`)
					assert(tokenData.token, `bad value ${tokenData.token} for tokenData.token, expected it to exist`)
					assert.strictEqual(tokenData.alreadyUsedForLogin, false, `bad value ${tokenData.alreadyUsedForLogin} for tokenData.alreadyUsedForLogin, expected false`)
					return true
				})
			})
		})
	},
	testSendEmailUpdateRequest: function() {
		const instance = this,
			{generalStore, moduleConfig} = this.module
		let changeableInstance = this
		describe('client.users.sendEmailUpdateRequest: GET /users/sendEmailUpdateRequest', function() {
			before(function(){
				return co(function*() {
					if (!changeableInstance.sessionCookie) {
						let result = yield request({
							method: 'post',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
							body: {email: 'admin@ramster.com', password: 'testPassword1234'},
							json: true,
							resolveWithFullResponse: true
						})
						changeableInstance.sessionCookie = result.headers['set-cookie']
					}
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
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should execute successfully, set the uncofirmed email and set the proper token if all parameters are correct', function() {
				return co(function*() {
					yield request({
						method: 'get',
						headers: {cookie: changeableInstance.sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/sendEmailUpdateRequest`,
						qs: {id: 1, newEmail: encodeURIComponent('admintest@ramster.com')},
						json: true
					})
					let user = yield instance.dbComponent.model.findOne({where: {id: 1}}),
						tokenData = JSON.parse(yield generalStore.getStoredEntry('user-1-dbLoginToken'))
					assert.strictEqual(user.unconfirmedEmail, 'admintest@ramster.com', `bad value ${user.unconfirmedEmail} for user.unconfirmedEmail, expected admintest@ramster.com`)
					assert(tokenData, `bad value ${tokenData} for tokenData, expected it to exist`)
					assert(tokenData.token, `bad value ${tokenData.token} for tokenData.token, expected it to exist`)
					assert.strictEqual(tokenData.alreadyUsedForLogin, false, `bad value ${tokenData.alreadyUsedForLogin} for tokenData.alreadyUsedForLogin, expected false`)
					return true
				})
			})
		})
	},
	testUpdatePassword: function() {
		const instance = this,
			{config, generalStore, moduleConfig, tokenManager} = this.module
		let changeableInstance = this
		describe('client.users.updatePassword: PATCH /users/password', function() {
			before(function(){
				return co(function*() {
					if (!changeableInstance.sessionCookie) {
						let result = yield request({
							method: 'post',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
							body: {email: 'admin@ramster.com', password: 'testPassword1234'},
							json: true,
							resolveWithFullResponse: true
						})
						changeableInstance.sessionCookie = result.headers['set-cookie']
					}
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
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if no token and no current password is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield request({
							method: 'patch',
							headers: {cookie: changeableInstance.sessionCookie},
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
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
							headers: {cookie: changeableInstance.sessionCookie},
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
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
								headers: {cookie: changeableInstance.sessionCookie},
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
							headers: {cookie: changeableInstance.sessionCookie},
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
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should execute successfully, update the password and remove the token if all parameters are correct and a valid token is provided', function() {
				return co(function*() {
					let token = yield tokenManager.signToken({id: 1}, config.db.tokensSecret)
					yield generalStore.storeEntry('user-1-dbLoginToken', JSON.stringify({token, alreadyUsedForLogin: true}))
					yield request({
						method: 'patch',
						headers: {cookie: changeableInstance.sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/password`,
						body: {passwordResetToken: token, newPassword: 'testPassword1234'},
						json: true
					})
					let user = yield instance.dbComponent.model.scope('full').findOne({where: {id: 1}, attributes: ['password']}),
						tokenData = yield generalStore.getStoredEntry('user-1-dbLoginToken')
					assert(bcryptjs.compareSync('testPassword1234', user.password), 'The method did not update the password correctly.')
					assert.strictEqual(tokenData, null, `bad value ${tokenData} for tokenData, expected null`)
					return true
				})
			})
			it('should execute successfully and update the password if all paramters are correct and the correct currentPassword is provided', function() {
				return co(function*() {
					yield request({
						method: 'patch',
						headers: {cookie: changeableInstance.sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/password`,
						body: {currentPassword: 'testPassword1234', newPassword: 'testPassword4321'},
						json: true
					})
					let user = yield instance.dbComponent.model.scope('full').findOne({where: {id: 1}, attributes: ['password']})
					assert(bcryptjs.compareSync('testPassword4321', user.password), 'The metod did not update the password correctly.')
					return true
				})
			})
			it('should throw an error if no new password is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield request({
							method: 'patch',
							headers: {cookie: changeableInstance.sessionCookie},
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/password`,
							body: {currentPassword: 'testPassword4321'},
							json: true
						})
					} catch(e) {
						didThrowAnError = true
					}
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if the provided new password is less than 3 characters long', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield request({
							method: 'patch',
							headers: {cookie: changeableInstance.sessionCookie},
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
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
		})
	},
	testUpdateEmail: function() {
		const instance = this,
			{config, generalStore, moduleConfig, tokenManager} = this.module
		let changeableInstance = this
		describe('client.users.updateEmail: PATCH /users/email', function() {
			before(function() {
				return co(function*() {
					if (!changeableInstance.sessionCookie) {
						let result = yield request({
							method: 'post',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
							body: {email: 'admin@ramster.com', password: 'testPassword1234'},
							json: true,
							resolveWithFullResponse: true
						})
						changeableInstance.sessionCookie = result.headers['set-cookie']
					}
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
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if no token is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield request({
							method: 'patch',
							headers: {cookie: changeableInstance.sessionCookie},
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
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
							headers: {cookie: changeableInstance.sessionCookie},
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
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
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
								headers: {cookie: changeableInstance.sessionCookie},
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
						headers: {cookie: changeableInstance.sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/email`,
						body: {token},
						json: true
					})
					let user = yield instance.dbComponent.model.scope('full').findOne({where: {id: 1}, attributes: ['email', 'unconfirmedEmail']}),
						tokenData = yield generalStore.getStoredEntry('user-1-dbLoginToken')
					assert.strictEqual(user.email, 'admintest@ramster.com', `bad value ${user.email} for user.email, expected admintest@ramster.com`)
					assert.strictEqual(user.unconfirmedEmail, null, `bad value ${user.unconfirmedEmail} for user.unconfirmedEmail, expected null`)
					assert.strictEqual(tokenData, null, `bad value ${tokenData} for tokenData, expected null`)
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
		const {moduleConfig} = this.module
		let changeableInstance = this
		describe('client.users.updateProfile: PATCH /users/profile', function() {
			before(function() {
				return co(function*() {
					if (!changeableInstance.sessionCookie) {
						let result = yield request({
							method: 'post',
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
							body: {email: 'admin@ramster.com', password: 'testPassword1234'},
							json: true,
							resolveWithFullResponse: true
						})
						changeableInstance.sessionCookie = result.headers['set-cookie']
					}
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
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should execute successfully and update only the allowed profile update fields if all parameters are correct', function() {
				return co(function*() {
					let user = yield request({
							method: 'patch',
							headers: {cookie: changeableInstance.sessionCookie},
							uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/profile`,
							body: {typeId: 35, email: 'shouldNotUpdateTheEmail@ramster.com', phone: '+359888777666', gender: 'other', lastLogin: 'now'},
							json: true
						}),
						userShouldBe = {id: 1, typeId: 1, firstName: 'Admin', lastName: 'User', email: 'admin@ramster.com', phone: '+359888777666', gender: 'other', active: true}
					for (const i in userShouldBe) {
						const sbField = userShouldBe[i],
							isField = user[i]
						assert.strictEqual(isField, sbField, `Bad value '${isField}' for field "${i}", expected '${sbField}'.`)
					}
					return true
				})
			})
		})
	}
}

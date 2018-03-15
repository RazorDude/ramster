const
	assert = require('assert'),
	co = require('co')

module.exports = {
	testGetUserWithPermissionsData: function() {
		const instance = this,
			{moduleAccessPoints, modules, userTypes} = instance.db.components
		describe('users.getUserWithPermissionsData', function() {
			it('should throw an error with the correct message if no filters are provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.getUserWithPermissionsData()
					} catch(e) {
						if (e && (e.customMessage === 'The filters argument must be a non-empty object.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should return null if the user is not found by the provided filters', function() {
				return co(function*() {
					assert((yield instance.getUserWithPermissionsData({id: 1000})) === null)
					return true
				})
			})
			it('should return the user with his permissions mapped in a permissionsData object if all paramters are correct and the user is found', function() {
				return co(function*() {
					let userFromMethod = yield instance.getUserWithPermissionsData({id: 1}),
						userFromDB = yield instance.model.findOne({
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
						})
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
								const module = alwaysAccessibleModules[i],
									aps = module.accessPoints,
									pd = permissionsData[module.id]
								if (!pd) {
									console.log(`Missing permissions data object for always accessible module id ${module.id}.`)
									dataIsGood = false
									break
								}
								for (const j in aps) {
									const ap = aps[j]
									if (pd.ids.indexOf(ap.id) === -1) {
										console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${module.id} (ids array).`)
										dataIsGood = false
										break
									}
									if (!pd.text[`can${ap.name.replace(/\s/g, '')}`]) {
										console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${module.id} (text object).`)
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
					assert(dataIsGood)
					return true
				})
			})
		})
	},
	testLogin: function() {
		const instance = this,
			{moduleAccessPoints, modules, userTypes} = instance.db.components
		describe('users.login', function() {
			before(function() {
				return co(function*() {
					yield instance.model.update({password: 'test', status: false}, {where: {id: 1}})
					yield instance.db.generalStore.storeEntry('user-1-dbLoginToken', 'abcd')
					return true
				})
			})
			it('should throw an error with the correct message if the user is not found by email', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.login({email: 'emailDoesNotExist'})
					} catch(e) {
						if (e && (e.customMessage === 'Invalid email or password.')) {
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
					try {
						yield instance.login({email: 'admin@ramster.com'})
					} catch(e) {
						if (e && (e.customMessage === 'Your account is currently inactive.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if the user\'s password is incorrect', function() {
				return co(function*() {
					let didThrowAnError = false
					yield instance.model.update({status: true}, {where: {id: 1}})
					try {
						yield instance.login({email: 'admin@ramster.com', password: 'badPassword'})
					} catch(e) {
						if (e && (e.customMessage === 'Invalid email or password.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should return the user with his permissions mapped in a permissionsData object if all paramters are correct and the user is found', function() {
				return co(function*() {
					let userFromMethod = yield instance.login({email: 'admin@ramster.com', password: 'test'})
						userFromDB = yield instance.model.findOne({
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
						})
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
								const module = alwaysAccessibleModules[i],
									aps = module.accessPoints,
									pd = permissionsData[module.id]
								if (!pd) {
									console.log(`Missing permissions data object for always accessible module id ${module.id}.`)
									dataIsGood = false
									break
								}
								for (const j in aps) {
									const ap = aps[j]
									if (pd.ids.indexOf(ap.id) === -1) {
										console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${module.id} (ids array).`)
										dataIsGood = false
										break
									}
									if (!pd.text[`can${ap.name.replace(/\s/g, '')}`]) {
										console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${module.id} (text object).`)
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
					if (typeof userFromMethod.password !== 'undefined') {
						console.log('The method did not delete the user\'s password from the returned object.')
						dataIsGood = false
					}
					assert(dataIsGood)
					return true
				})
			})
		})
	},
	testTokenLogin: function() {
		const instance = this,
			{components, config, generalStore, tokenManager} = this.db,
			{moduleAccessPoints, modules, userTypes} = components,
			tokensSecret = config.db.tokensSecret
		describe('users.tokenLogin', function() {
			before(function() {
				return co(function*() {
					yield instance.model.update({status: false}, {where: {id: 1}})
					yield generalStore.removeEntry('user-1-dbLoginToken')
					return true
				})
			})
			it('should throw an error with the correct message if the token is invalid', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.tokenLogin('fakeToken')
					} catch(e) {
						if (e && (e.customMessage === 'Invalid or expired token.') && (e.stage === 1)) {
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
							instance.tokenLogin(token).then((promiseResult) => {
								reject('Token did not expire.')
							}, (err) => {
								if (err && (err.customMessage === 'Invalid or expired token.') && (err.stage === 0)) {
									resolve(true)
									return
								}
								console.log(err)
								reject('Incorrect error or error message.')
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
						yield instance.tokenLogin(yield tokenManager.signToken({noId: true}, tokensSecret))
					} catch(e) {
						if (e && (e.customMessage === 'Invalid or expired token.') && (e.stage === 2)) {
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
						yield instance.tokenLogin(yield tokenManager.signToken({id: 10000}, tokensSecret))
					} catch(e) {
						if (e && (e.customMessage === 'Invalid or expired token.') && (e.stage === 3)) {
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
						yield instance.tokenLogin(yield tokenManager.signToken({id: 1}, tokensSecret))
					} catch(e) {
						if (e && (e.customMessage === 'Your account is currently inactive.')) {
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
					yield instance.model.update({status: true}, {where: {id: 1}})
					try {
						yield instance.tokenLogin(yield tokenManager.signToken({id: 1}, tokensSecret))
					} catch(e) {
						if (e && (e.customMessage === 'Invalid or expired token.') && (e.stage === 4)) {
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
						yield instance.tokenLogin(yield tokenManager.signToken({id: 1}, tokensSecret))
					} catch(e) {
						if (e && (e.customMessage === 'Invalid or expired token.') && (e.stage === 5)) {
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
						yield instance.tokenLogin(token)
					} catch(e) {
						if (e && (e.customMessage === 'Invalid or expired token.') && (e.stage === 5)) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should return the user with his permissions mapped in a permissionsData object and set the token as already used if all paramters are correct and the user is found', function() {
				return co(function*() {
					let token = yield tokenManager.signToken({id: 1}, tokensSecret)
					yield generalStore.storeEntry('user-1-dbLoginToken', `{"token": "${token}", "alreadyUsedForLogin": false}`)
					let userFromMethod = yield instance.tokenLogin(token)
						userFromDB = yield instance.model.findOne({
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
						})
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
								const module = alwaysAccessibleModules[i],
									aps = module.accessPoints,
									pd = permissionsData[module.id]
								if (!pd) {
									console.log(`Missing permissions data object for always accessible module id ${module.id}.`)
									dataIsGood = false
									break
								}
								for (const j in aps) {
									const ap = aps[j]
									if (pd.ids.indexOf(ap.id) === -1) {
										console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${module.id} (ids array).`)
										dataIsGood = false
										break
									}
									if (!pd.text[`can${ap.name.replace(/\s/g, '')}`]) {
										console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${module.id} (text object).`)
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
					if (dataIsGood) {
						token = JSON.parse(yield generalStore.getStoredEntry('user-1-dbLoginToken'))
						if (token.alreadyUsedForLogin !== true) {
							console.log('Failed to set the alreadyUsedForLogin field in the token data.')
							dataIsGood = false
						}
					}
					assert(dataIsGood)
					return true
				})
			})
		})
	}
}

const
	assert = require('assert'),
	bcryptjs = require('bcryptjs'),
	co = require('co')

module.exports = {
	testGetUserWithPermissionsData: function() {
		const instance = this,
			{moduleAccessPoints, modules, userTypes} = instance.db.components
		describe('db.users.getUserWithPermissionsData', function() {
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
			it('should return the user with his permissions mapped in a permissionsData object if all parameters are correct and the user is found', function() {
				return co(function*() {
					let userFromMethod = yield instance.getUserWithPermissionsData({id: 1}),
						userFromDB = yield instance.model.findOne({
							where: {id: 1},
							include: [{
								model: userTypes.model,
								as: 'type',
								include: [{model: moduleAccessPoints.model, as: 'accessPoints', include: [{model: modules.model, as: 'module', attributes: ['name']}]}]
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
								pd = permissionsData[ap.moduleId],
								pdText = permissionsData[ap.module.name.replace(/\s/g, '')]
							if (!pd) {
								console.log(`Missing permissions data object for module id ${ap.moduleId} (by id).`)
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
							if (!pdText) {
								console.log(`Missing permissions data object for module id ${ap.moduleId} (by name).`)
								dataIsGood = false
								break
							}
							if (pdText.ids.indexOf(ap.id) === -1) {
								console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for module id ${ap.moduleId} (ids array).`)
								dataIsGood = false
								break
							}
							if (!pdText.text[`can${ap.name.replace(/\s/g, '')}`]) {
								console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for module id ${ap.moduleId} (text object).`)
								dataIsGood = false
								break
							}
						}
						if (dataIsGood) {
							for (const i in alwaysAccessibleModules) {
								const module = alwaysAccessibleModules[i],
									aps = module.accessPoints,
									pd = permissionsData[module.id],
									pdText = permissionsData[module.name.replace(/\s/g, '')]
								if (!pd) {
									console.log(`Missing permissions data object for always accessible module id ${module.id} (by id).`)
									dataIsGood = false
									break
								}
								if (!pdText) {
									console.log(`Missing permissions data object for always accessible module id ${module.id} (by name).`)
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
									if (pdText.ids.indexOf(ap.id) === -1) {
										console.log(`Missing accessPoint with id ${ap.id} in the permissions data object for always accessible module id ${module.id} (ids array).`)
										dataIsGood = false
										break
									}
									if (!pdText.text[`can${ap.name.replace(/\s/g, '')}`]) {
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
		describe('db.users.login', function() {
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
			it('should throw an error with the correct message if the user type not active', function() {
				return co(function*() {
					let didThrowAnError = false
					yield instance.model.update({status: true}, {where: {id: 1}})
					yield userTypes.model.update({status: false}, {where: {id: 1}})
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
					yield userTypes.model.update({status: true}, {where: {id: 1}})
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
			it('should return the user with his permissions mapped in a permissionsData object if all parameters are correct and the user is found', function() {
				return co(function*() {
					let userFromMethod = yield instance.login({email: 'admin@ramster.com', password: 'test'}),
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
		describe('db.users.tokenLogin', function() {
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
			it('should throw an error with the correct message if the user type is inactive', function() {
				return co(function*() {
					let didThrowAnError = false
					yield instance.model.update({status: true}, {where: {id: 1}})
					yield userTypes.model.update({status: false}, {where: {id: 1}})
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
					yield userTypes.model.update({status: true}, {where: {id: 1}})
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
			it('should return the user with his permissions mapped in a permissionsData object and set the token as already used if all parameters are correct and the user is found', function() {
				return co(function*() {
					let token = yield tokenManager.signToken({id: 1}, tokensSecret)
					yield generalStore.storeEntry('user-1-dbLoginToken', `{"token": "${token}", "alreadyUsedForLogin": false}`)
					let userFromMethod = yield instance.tokenLogin(token),
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
	},
	testSendPasswordResetRequest: function() {
		const instance = this
		describe('db.users.sendPasswordResetRequest', function() {
			before(function(){
				return co(function*() {
					yield instance.db.generalStore.removeEntry('user-1-dbLoginToken')
					return true
				})
			})
			it('should throw an error with the correct message if the user is not found by email', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.sendPasswordResetRequest('emailDoesNotExist')
					} catch(e) {
						if (e && (e.customMessage === 'User not found.')) {
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
					yield instance.sendPasswordResetRequest('admin@ramster.com')
					let tokenData = JSON.parse(yield instance.db.generalStore.getStoredEntry('user-1-dbLoginToken')),
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
		const instance = this
		describe('db.users.sendEmailUpdateRequest', function() {
			before(function(){
				return co(function*() {
					yield instance.db.generalStore.removeEntry('user-1-dbLoginToken')
					return true
				})
			})
			it('should throw an error with the correct message if the user is not found by id', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.sendEmailUpdateRequest({id: 1500})
					} catch(e) {
						if (e && (e.customMessage === 'User not found.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully, set the uncofirmed email and set the proper token if all parameters are correct and the user is found', function() {
				return co(function*() {
					yield instance.sendEmailUpdateRequest({id: 1, newEmail: 'admintest@ramster.com'})
					let user = yield instance.model.findOne({where: {id: 1}}),
						tokenData = JSON.parse(yield instance.db.generalStore.getStoredEntry('user-1-dbLoginToken')),
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
			db = this.db
		describe('db.users.updatePassword', function() {
			before(function() {
				return co(function*() {
					yield db.generalStore.removeEntry('user-1-dbLoginToken')
					yield instance.model.update({password: '1234'}, {where: {id: 1}})
					return true
				})
			})
			it('should throw an error with the correct message if the user is not found by id', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.updatePassword({id: 1500})
					} catch(e) {
						if (e && (e.customMessage === 'User not found, wrong current password, or an invalid or expired token.') && (e.stage === 0)) {
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
						yield instance.updatePassword({id: 1})
					} catch(e) {
						if (e && (e.customMessage === 'User not found, wrong current password, or an invalid or expired token.') && (e.stage === 4)) {
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
					yield db.generalStore.storeEntry('user-1-dbLoginToken', JSON.stringify({token: 'theActualToken', alreadyUsedForLogin: true}))
					try {
						yield instance.updatePassword({id: 1, passwordResetToken: 'fakeToken'})
					} catch(e) {
						if (e && (e.customMessage === 'User not found, wrong current password, or an invalid or expired token.') && (e.stage === 1)) {
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
						let token = yield db.tokenManager.signToken({id: 1}, db.config.db.tokensSecret, 1 / 60)
						yield db.generalStore.storeEntry('user-1-dbLoginToken', JSON.stringify({token, alreadyUsedForLogin: true}))
						return token
					}).then((token) => {
						setTimeout(() => {
							instance.updatePassword({id: 1, passwordResetToken: token}).then((promiseResult) => {
								reject('Token did not expire.')
							}, (err) => {
								if (err && (err.customMessage === 'User not found, wrong current password, or an invalid or expired token.') && (err.stage === 2)) {
									resolve(true)
									return
								}
								reject(err)
							})
						}, 1500)
					}, (err) => reject(err))
				})
			})
			it('should throw an error with the correct message if the provided currentPassword does not match the user\'s current password', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.updatePassword({id: 1, currentPassword: 'fakePassword'})
					} catch(e) {
						if (e && (e.customMessage === 'User not found, wrong current password, or an invalid or expired token.') && (e.stage === 3)) {
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
					let token = yield db.tokenManager.signToken({id: 1}, db.config.db.tokensSecret)
					yield db.generalStore.storeEntry('user-1-dbLoginToken', JSON.stringify({token, alreadyUsedForLogin: true}))
					yield instance.updatePassword({id: 1, passwordResetToken: token, newPassword: 'testPassword1234'})
					let user = yield instance.model.scope('full').findOne({where: {id: 1}, attributes: ['password']}),
						tokenData = yield db.generalStore.getStoredEntry('user-1-dbLoginToken'),
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
					yield instance.updatePassword({id: 1, currentPassword: 'testPassword1234', newPassword: 'testPassword4321'})
					let user = yield instance.model.scope('full').findOne({where: {id: 1}, attributes: ['password']})
					assert(bcryptjs.compareSync('testPassword4321', user.password))
					return true
				})
			})
			it('should throw an error if no new password is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.updatePassword({id: 1, currentPassword: 'testPassword4321'})
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
						yield instance.updatePassword({id: 1, currentPassword: 'testPassword4321', newPassword: '123'})
					} catch(e) {
						if (e && (e.customMessage === 'The password must be at least 4 characters long.')) {
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
			db = this.db
		describe('db.users.updateEmail', function() {
			before(function() {
				return co(function*() {
					yield db.generalStore.removeEntry('user-1-dbLoginToken')
					yield instance.model.update({unconfirmedEmail: 'admintest@ramster.com'}, {where: {id: 1}})
					return true
				})
			})
			it('should throw an error with the correct message if the user is not found by id', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.updateEmail({id: 1500})
					} catch(e) {
						if (e && (e.customMessage === 'User not found, or an invalid or expired token has been provided.') && (e.stage === 0)) {
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
						yield instance.updateEmail({id: 1})
					} catch(e) {
						if (e && (e.customMessage === 'User not found, or an invalid or expired token has been provided.') && (e.stage === 1)) {
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
					yield db.generalStore.storeEntry('user-1-dbLoginToken', JSON.stringify({token: 'theActualToken', alreadyUsedForLogin: true}))
					try {
						yield instance.updateEmail({id: 1, token: 'fakeToken'})
					} catch(e) {
						if (e && (e.customMessage === 'User not found, or an invalid or expired token has been provided.') && (e.stage === 2)) {
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
						let token = yield db.tokenManager.signToken({id: 1}, db.config.db.tokensSecret, 1 / 60)
						yield db.generalStore.storeEntry('user-1-dbLoginToken', JSON.stringify({token, alreadyUsedForLogin: true}))
						return token
					}).then((token) => {
						setTimeout(() => {
							instance.updateEmail({id: 1, token}).then((promiseResult) => {
								reject('Token did not expire.')
							}, (err) => {
								if (err && (err.customMessage === 'User not found, or an invalid or expired token has been provided.') && (err.stage === 3)) {
									resolve(true)
									return
								}
								reject(err)
							})
						}, 1500)
					}, (err) => reject(err))
				})
			})
			it('should execute successfully, update the email and remove the token if all parameters are correct and a valid token is provided', function() {
				return co(function*() {
					let token = yield db.tokenManager.signToken({id: 1}, db.config.db.tokensSecret)
					yield db.generalStore.storeEntry('user-1-dbLoginToken', JSON.stringify({token, alreadyUsedForLogin: true}))
					yield instance.updateEmail({id: 1, token})
					let user = yield instance.model.scope('full').findOne({where: {id: 1}, attributes: ['email', 'unconfirmedEmail']}),
						tokenData = yield db.generalStore.getStoredEntry('user-1-dbLoginToken'),
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
					yield instance.model.update({email: 'admin@ramster.com'}, {where: {id: 1}})
					return true
				})
			})
		})
	},
	testUpdateProfile: function() {
		const instance = this,
			db = this.db
		describe('db.users.updateProfile', function() {
			it('should throw an error with the correct message if the user is not found by id', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.updateProfile({id: 1500})
					} catch(e) {
						if (e && (e.customMessage === 'User not found.')) {
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
					let user = yield instance.updateProfile({id: 1, typeId: 35, email: 'shouldNotUpdateTheEmail@ramster.com', phone: '+359888777666', gender: 'other', lastLogin: 'now'}),
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

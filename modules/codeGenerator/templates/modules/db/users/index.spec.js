const
	assert = require('assert'),
	co = require('co')

module.exports = {
	testGetUserWithPermissionsData: function() {
		const instance = this,
			{moduleAccessPoints, modules, userTypes} = instance.db.components
		describe('users.getUserWithPermissionsData', function() {
			it('should return throw an error with the correct message if no filters are provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.getUserWithPermissionsData()
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'The filters argument must be a non-empty object.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should return throw an error with the correct message if an empty filters object is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.getUserWithPermissionsData({})
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'The filters argument must be a non-empty object.')
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
			it('should return the users with his permissions mapped in a permissionsData object if all paramters are correct and the user is found', function() {
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
	}
}

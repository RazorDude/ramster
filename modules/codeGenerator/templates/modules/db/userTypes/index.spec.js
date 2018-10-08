const
	assert = require('assert'),
	co = require('co')

module.exports = {
	testUpdate: function() {
		const instance = this
		describe('db.userTypes.update', function() {
			it('should throw an error with the correct message if attempting to deactivate a system-critical user type and a list of ids is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.update({dbObject: {active: false}, where: {id: [1]}})
					} catch(e) {
						if (e && (e.customMessage === 'Cannot deactivate a system-critical user type.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if attempting to deactivate a system-critical user type and a single id is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.update({dbObject: {active: false}, where: {id: 1}})
					} catch(e) {
						if (e && (e.customMessage === 'Cannot deactivate a system-critical user type.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should execute successfully and update the user type if it is a system-critical one and is not being deactivated', function() {
				return co(function*() {
					yield instance.update({dbObject: {name: 'The God'}, where: {id: 1}})
					let userType = yield instance.model.findOne({where: {id: 1}}),
						userTypeShouldBe = {id: 1, name: 'The God', description: 'God user', active: true}
					for (const i in userTypeShouldBe) {
						const sbField = userTypeShouldBe[i],
							isField = userType[i]
						assert.strictEqual(isField, sbField, `Bad value '${isField}' for field "${i}", expected '${sbField}'.`)
					}
					return true
				})
			})
			it('should execute successfully and update the user type if it is not a system-critical one and is being deactivated', function() {
				return co(function*() {
					yield instance.update({dbObject: {name: 'Inactive Regular', active: false}, where: {id: 2}})
					let userType = yield instance.model.findOne({where: {id: 2}}),
						userTypeShouldBe = {id: 2, name: 'Inactive Regular', description: 'Regular user', active: false}
					for (const i in userTypeShouldBe) {
						const sbField = userTypeShouldBe[i],
							isField = userType[i]
						assert.strictEqual(isField, sbField, `Bad value '${isField}' for field "${i}", expected '${sbField}'.`)
					}
					return true
				})
			})
		})
	},
	testUpdateAccessPoints: function() {
		const instance = this,
			db = this.db
		describe('db.userTypes.updateAccessPoints', function() {
			it('should throw an error with the correct message if the user type is not found', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.updateAccessPoints({id: 1500})
					} catch(e) {
						if (e && (e.customMessage === 'User type not found.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if attempting to update the access points of a fixed-access user type', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.updateAccessPoints({id: 1, accessPointIds: [1, 2, 3]})
					} catch(e) {
						if (e && (e.customMessage === 'Cannot update the access points of a fixed-access user type.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should execute successfully, update the access points of a non-fixed-access user type and set the permissions updated flag in the general store for it if all parameters are correct', function() {
				return co(function*() {
					yield instance.updateAccessPoints({id: 2, accessPointIds: [1, 2, 3, 4]})
					let userType = yield instance.model.findOne({
							where: {id: 2},
							include: [
								{model: db.components.accessPoints.model, as: 'accessPoints', attributes: ['id'], where: {id: [1, 2, 3, 4]}},
								{model: db.components.users.model, as: 'users', attributes: ['id']}
							]
						}),
						permissionsUpdatedFlag = JSON.parse(yield db.generalStore.getStoredEntry('db-userTypeId-2-permissionsUpdated'))
					assert.strictEqual(userType.accessPoints.length, 4, `bad value ${userType.accessPoints.length} for userType.accessPoints.length, expected 4`)
					assert(permissionsUpdatedFlag instanceof Array, `bad value ${permissionsUpdatedFlag} for permissionsUpdatedFlag, expected an array`)
					assert.strictEqual(permissionsUpdatedFlag.length, userType.users.length, `bad value ${permissionsUpdatedFlag.length} for permissionsUpdatedFlag.length, expected ${userType.users.length}`)
					return true
				})
			})
		})
	},
	testDelete: function() {
		const instance = this,
			db = this.db
		describe('db.userTypes.delete', function() {
			it('should throw an error with the correct message if the user types are not found', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.delete({id: 1500})
					} catch(e) {
						if (e && (e.customMessage === 'User types not found.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if attempting to delete a system-critical user type', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.delete({id: [1, 2]})
					} catch(e) {
						if (e && (e.customMessage === 'Cannot delete a system-critical user type.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if attempting to delete a user type that has users', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.delete({id: [2, 3]})
					} catch(e) {
						if (e && (e.customMessage === 'Cannot delete a user type that has users.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert.strictEqual(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should execute successfully and delete the user type if all parameters are correct', function() {
				return co(function*() {
					yield instance.delete({id: 3})
					let userType = yield instance.model.findOne({where: {id: 3}}),
						accessPoints = yield db.sequelize.query('select "userTypeId" from "userTypeAccessPoints" where "userTypeId" = 3 limit 1;')
					assert.strictEqual(userType, null, 'The method failed to delete the user type.')
					assert.strictEqual(accessPoints[0].length, 0, `bad value ${accessPoints[0].length} for accessPoints[0].length, expected 0`)
					return true
				})
			})
		})
	}
}

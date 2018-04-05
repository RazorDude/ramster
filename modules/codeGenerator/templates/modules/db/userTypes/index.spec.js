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
						yield instance.update({dbObject: {status: false}, where: {id: [1]}})
					} catch(e) {
						if (e && (e.customMessage === 'Cannot deactivate a system-critical user type.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if attempting to deactivate a system-critical user type and a single id is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.update({dbObject: {status: false}, where: {id: 1}})
					} catch(e) {
						if (e && (e.customMessage === 'Cannot deactivate a system-critical user type.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully and update the user type if it is a system-critical one and is not being deactivated', function() {
				return co(function*() {
					yield instance.update({dbObject: {name: 'The God'}, where: {id: 1}})
					let userType = yield instance.model.findOne({where: {id: 1}}),
						userTypeShouldBe = {id: 1, name: 'The God', description: 'God user', status: true}
						dataIsGood = true
					for (const i in userTypeShouldBe) {
						const sbField = userTypeShouldBe[i],
							isField = userType[i]
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
			it('should execute successfully and update the user type if it is not a system-critical one and is being deactivated', function() {
				return co(function*() {
					yield instance.update({dbObject: {name: 'Inactive Regular', status: false}, where: {id: 2}})
					let userType = yield instance.model.findOne({where: {id: 2}}),
						userTypeShouldBe = {id: 2, name: 'Inactive Regular', description: 'Regular user', status: false}
						dataIsGood = true
					for (const i in userTypeShouldBe) {
						const sbField = userTypeShouldBe[i],
							isField = userType[i]
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
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if attempting to update the access points of a fixed-access user type', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.updateAccessPoints({id: 1, moduleAccessPointIds: [1, 2, 3]})
					} catch(e) {
						if (e && (e.customMessage === 'Cannot update the access points of a fixed-access user type.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully, update the access points of a non-fixed-access user type and set the permissions updated flag in the general store for it if all parameters are correct', function() {
				return co(function*() {
					yield instance.updateAccessPoints({id: 2, moduleAccessPointIds: [1, 2, 3, 4]})
					let userType = yield instance.model.findOne({
							where: {id: 2},
							include: [
								{model: db.components.moduleAccessPoints.model, as: 'accessPoints', attributes: ['id'], where: {id: [1, 2, 3, 4]}},
								{model: db.components.users.model, as: 'users', attributes: ['id']}
							]
						}),
						permissionsUpdatedFlag = JSON.parse(yield db.generalStore.getStoredEntry('db-userTypeId-2-permissionsUpdated')),
						dataIsGood = true
					if (userType.accessPoints.length !== 4) {
						console.log('The method failed to update the access points correctly.')
						dataIsGood = false
					}
					if (dataIsGood && (!(permissionsUpdatedFlag instanceof Array) || (userType.users.length !== permissionsUpdatedFlag.length))) {
						console.log('The method failed to set the perimissions update flag in the general store corrrectly.')
						dataIsGood = false
					}
					assert(dataIsGood)
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
					assert(didThrowAnError)
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
					assert(didThrowAnError)
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
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully and delete the user type if all parameters are correct', function() {
				return co(function*() {
					yield instance.delete({id: 3})
					let userType = yield instance.model.findOne({where: {id: 3}}),
						accessPoints = yield db.sequelize.query('select "userTypeId" from "userTypeModuleAccessPoints" where "userTypeId" = 3 limit 1;'),
						dataIsGood = true
					if (userType) {
						console.log('The method failed to delete the user type.')
						dataIsGood = false
					}
					if (dataIsGood && accessPoints[0].length){
						console.log('THe method faield to delete the user type module access points.')
						dataIsGood = false
					}
					assert(dataIsGood)
					return true
				})
			})
		})
	}
}

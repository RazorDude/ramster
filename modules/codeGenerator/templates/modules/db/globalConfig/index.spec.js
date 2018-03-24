const
	assert = require('assert'),
	co = require('co')

module.exports = {
	testGetField: function() {
		const instance = this
		describe('db.globalConfig.getField', function() {
			it('should return null if the field is not found', function() {
				return co(function*() {
					assert((yield instance.getField('suchAFieldDoesntExist')) === null)
					return true
				})
			})
			it('should return the field data if the field is found', function() {
				return co(function*() {
					let fieldFromMethod = yield instance.getField('testField'),
						fieldFromDB = yield instance.model.findOne({where: {field: 'testField'}})
					if (!fieldFromDB) {
						throw {testError: 'Field not found in the database.'}
					}
					if (!fieldFromMethod) {
						throw {testError: 'The method did not return the field.'}
					}
					if ((fieldFromDB.value !== fieldFromMethod)) {
						throw {testError: `Bad value '${fieldFromMethod}', expected '${fieldFromDB.value}'`}
					}
					return true
				})
			})
		})
	},
	testGetFields: function() {
		const instance = this
		describe('db.globalConfig.getFields', function() {
			it('should return an empty object if no fields are found', function() {
				return co(function*() {
					let result = yield instance.getFields(['suchAFieldDoesntExist'])
					assert(result && (typeof result === 'object') && !Object.keys(result).length)
					return true
				})
			})
			it('should return the field values data object if the fields are found', function() {
				return co(function*() {
					let fieldsFromMethod = yield instance.getFields(['testField', 'testField2']),
						fieldsFromDB = yield instance.model.findAll({where: {field: ['testField', 'testField2']}})
					if (!fieldsFromDB.length) {
						throw {testError: 'Fields not found in the database.'}
					}
					if (!Object.keys(fieldsFromMethod).length) {
						throw {testError: 'The method did not return any fields.'}
					}
					for (const i in fieldsFromDB) {
						const fieldFromDB = fieldsFromDB[i].dataValues,
							fieldFromMethod = fieldsFromMethod[fieldFromDB.field]
						if (typeof fieldFromMethod === 'undefined') {
							throw {testError: `The method did not return the "${fieldFromDB.field}" field.`}
						}
						if (fieldFromMethod !== fieldFromDB.value) {
							throw {testError: `Bad value '${fieldFromMethod}' for field "${fieldFromDB.field}".`}
						}
					}
					return true
				})
			})
		})
	}
}

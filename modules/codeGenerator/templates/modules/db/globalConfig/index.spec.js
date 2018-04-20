const
	assert = require('assert'),
	co = require('co')

module.exports = {
	testGetField: function() {
		const instance = this
		describe('db.globalConfig.getField', function() {
			it('should return null if the field is not found', function() {
				return co(function*() {
					let value = yield instance.getField('suchAFieldDoesntExist')
					assert.strictEqual(value, null, `bad value ${value} for the field's suchAFieldDoesntExist value, expected null`)
					return true
				})
			})
			it('should return the field data if the field is found', function() {
				return co(function*() {
					let fieldFromMethod = yield instance.getField('testField'),
						fieldFromDB = yield instance.model.findOne({where: {field: 'testField'}})
					assert.strictEqual(fieldFromMethod, fieldFromDB.value, `bad value ${fieldFromMethod} for fieldFromMethod, expected ${fieldFromDB.value}`)
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
					let result = yield instance.getFields(['suchAFieldDoesntExist']),
						typeOfResult = typeof result
					assert.strictEqual(typeOfResult, 'object', `bad value ${typeOfResult} for typeOfResult, expected object`)
					assert.notStrictEqual(result, null, `bad value ${result} for result, expected it to be non-null`)
					let resultKeysLength = Object.keys(result).length
					assert.strictEqual(resultKeysLength, 0, `bad value ${resultKeysLength} for resultKeysLength, expected 0`)
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
					for (const i in fieldsFromDB) {
						const fieldFromDB = fieldsFromDB[i].dataValues,
							fieldFromMethod = fieldsFromMethod[fieldFromDB.field]
						assert.strictEqual(fieldFromMethod, fieldFromDB.value, `bad value ${fieldFromMethod} for ${fieldFromDB.field}, expected ${fieldFromDB.value}`)
					}
					return true
				})
			})
		})
	}
}

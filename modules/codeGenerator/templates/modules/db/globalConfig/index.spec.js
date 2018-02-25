const
	assert = require('assert'),
	co = require('co'),
	fs = require('fs-extra'),
	path = require('path')

module.exports = {
	testGetField: function() {
		const instance = this
		describe('client.module.getField', function() {
			it('should return null if the field is not found', function() {
				return co(function*() {
					assert((yield instance.getField('suchAFieldDoesntExist')) === null)
					return true
				})
			})
			it('should return the field data if the field is found', function() {
				return co(function*() {
					let fieldFromMethod = yield instance.getField('testField'),
						fieldFromDB = yield instance.model.findOne({where: {field: 'testField'}}),
						dataIsGood = true
					if (!fieldFromDB) {
						console.log('Field not found in the database.')
						dataIsGood = false
					}
					if (dataIsGood && !fieldFromMethod) {
						console.log('The method did not return the field.')
						dataIsGood = false
					}
					if (dataIsGood) {
						fieldFromDB = fieldFromDB.dataValues
						fieldFromMethod = fieldFromMethod.dataValues
						for (const i in fieldFromDB) {
							if (fieldFromDB[i] !== fieldFromMethod[i]) {
								console.log(`Bad value '${fieldFromMethod[i]}' for field "${i}".`)
								dataIsGood = false
								break
							}
						}
					}
					assert(dataIsGood)
					return true
				})
			})
		})
	},
	testGetFields: function() {
		const instance = this
		describe('client.module.getFields', function() {
			it('should return a blank array if no fields are not found', function() {
				return co(function*() {
					let result = yield instance.getFields(['suchAFieldDoesntExist'])
					assert((result instanceof Array) && !result.length)
					return true
				})
			})
			it('should return the fields data if the fields are found', function() {
				return co(function*() {
					let fieldsFromMethod = yield instance.getFields(['testField', 'testField2']),
						fieldsFromDB = yield instance.model.findAll({where: {field: ['testField', 'testField2']}}),
						dataIsGood = true
					if (!fieldsFromDB.length) {
						console.log('Fields not found in the database.')
						dataIsGood = false
					}
					if (dataIsGood && !Object.keys(fieldsFromMethod).length) {
						console.log('The method did not return any fields.')
						dataIsGood = false
					}
					if (dataIsGood) {
						for (const i in fieldsFromDB) {
							const fieldFromDB = fieldsFromDB[i].dataValues,
								fieldFromMethod = fieldsFromMethod[fieldFromDB.field]
							if (typeof fieldFromMethod === 'undefined') {
								console.log(`The method did not return the "${fieldFromDB.field}" field.`)
								dataIsGood = false
								break
							}
							if (fieldFromMethod.value !== fieldFromDB.value) {
								console.log(`Bad value '${fieldFromMethod.value}' for field "${fieldFromDB.field}".`)
								dataIsGood = false
								break
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

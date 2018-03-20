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
					if (dataIsGood && (fieldFromDB.value !== fieldFromMethod)) {
						console.log(`Bad value '${fieldFromMethod}', expected '${fieldFromDB.value}'`)
						dataIsGood = false
					}
					assert(dataIsGood)
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
							if (fieldFromMethod !== fieldFromDB.value) {
								console.log(`Bad value '${fieldFromMethod}' for field "${fieldFromDB.field}".`)
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

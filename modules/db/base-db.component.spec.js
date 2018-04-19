const
	assert = require('assert'),
	co = require('co'),
	{describeSuiteConditionally, runTestConditionally} = require('../toolbelt'),
	fs = require('fs-extra'),
	path = require('path'),
	moment = require('moment')

module.exports = {
	testMe: function() {
		const instance = this
		this.componentName = 'testComponent'
		describe('baseDBComponent', function() {
			this.componentName = 'testComponent'
			it('should execute testAssociate successfully', function() {
				instance.testAssociate()
			})
			it('should execute testMapNestedRelations successfully', function() {
				instance.testMapNestedRelations()
			})
			it('should execute testMapRelations successfully', function() {
				instance.testMapRelations()
			})
			it('should execute testCheckFilterValue successfully', function() {
				instance.testCheckFilterValue()
			})
			it('should execute testSetFilterValue successfully', function() {
				instance.testSetFilterValue()
			})
			it('should execute testGetWhereObjects successfully', function() {
				instance.testGetWhereObjects()
			})
			it('should execute testGetWhereObjects successfully', function() {
				instance.testGetWhereObjects()
			})
			it('should execute testAssignModelToDereferencedRelationRecursively successfully', function() {
				instance.testAssignModelToDereferencedRelationRecursively()
			})
			it('should execute testCreate successfully', function() {
				instance.testCreate()
			})
			it('should execute testBulkCreate successfully', function() {
				instance.testBulkCreate()
			})
			it('should execute testRead successfully', function() {
				instance.testRead()
			})
			it('should execute testReadList successfully', function() {
				instance.testReadList()
			})
			it('should execute testUpdate successfully', function() {
				instance.testUpdate()
			})
			it('should execute testBulkUpsert successfully', function() {
				instance.testBulkUpsert()
			})
			it('should execute testDelete successfully', function() {
				instance.testDelete()
			})
		})
	},
	testAssociate: function() {
		const instance = this
		let changeableInstance = this,
			model = {
				belongsToAssociations: [],
				hasOneAssociations: [],
				hasManyAssociations: [],
				belongsToManyAssociations: [],
				belongsTo: function(model, options) {
					this.belongsToAssociations.push({model, options})
				},
				hasOne: function(model, options) {
					this.hasOneAssociations.push({model, options})
				},
				hasMany: function(model, options) {
					this.hasManyAssociations.push({model, options})
				},
				belongsToMany: function(model, options) {
					this.belongsToManyAssociations.push({model, options})
				}
			},
			db = {
				components: {
					test1: {model: 'test1Model'},
					testComponent2: {model: 'testComponent2Model'},
					test3: {model: 'test3Model'},
					testComponent4: {model: 'testComponent4Model'},
					test5: {model: 'test5Model'},
					testComponent6: {model: 'testComponent6Model'},
					test7: {model: 'test7Model'},
					testComponent8: {model: 'testComponent8Model'}
				}
			}
		describe('baseDBComponent.associate', function() {
			it('should execute successfully and leave everything blank if the component\'s associationConfig is not a non-null object', function() {
				changeableInstance.model = model
				changeableInstance.db = db
				instance.associate()
				assert.strictEqual(model.belongsToAssociations.length, 0, `bad value ${model.belongsToAssociations.length} for model.belongsToAssociations.length, expected 0`)
				assert.strictEqual(model.hasOneAssociations.length, 0, `bad value ${model.hasOneAssociations.length} for model.hasOneAssociations.length, expected 0`)
				assert.strictEqual(model.hasManyAssociations.length, 0, `bad value ${model.hasManyAssociations.length} for model.hasManyAssociations.length, expected 0`)
				assert.strictEqual(model.belongsToManyAssociations.length, 0, `bad value ${model.belongsToManyAssociations.length} for model.belongsToManyAssociations.length, expected 0`)
				assert.strictEqual(Object.keys(instance.dependencyMap).length, 4, `bad value ${Object.keys(instance.dependencyMap).length} for Object.keys(instance.dependencyMap).length, expected 4`)
			})
			it('should throw an error with the correct message if an association type is not of the allowed ones (belongsTo, hasOne, hasMany, belongsToMany)', function() {
				let didThrowAnError = false
				changeableInstance.associationsConfig = {
					testAssociation: {type: 'doesNotBelongTo'}
				}
				changeableInstance.model = model
				changeableInstance.db = db
				try {
					instance.associate()
				} catch(e) {
					if (e && (e.customMessage === 'At "testComponent" component, relation "testAssociation": invalid association type.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an association config item is missing a required field for its type', function() {
				let didThrowAnError = false
				changeableInstance.associationsConfig = {
					testAssociation: {type: 'belongsTo'}
				}
				changeableInstance.model = model
				changeableInstance.db = db
				try {
					instance.associate()
				} catch(e) {
					if (e && (e.customMessage === 'At "testComponent" component, relation "testAssociation: the provided config is missing a required property - "foreignKey".')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if a component does not exist for an association config item', function() {
				let didThrowAnError = false
				changeableInstance.associationsConfig = {
					testAssociation: {type: 'belongsTo', foreignKey: 'testAssociationId'}
				}
				changeableInstance.model = model
				changeableInstance.db = db
				try {
					instance.associate()
				} catch(e) {
					if (e && (e.customMessage === 'At "testComponent" component, relation "testAssociation": invalid target component name - "testAssociation".')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should execute successfully and create valid associations and a correct dependencyMap if all paramters are correct', function() {
				let associationsObjectsShouldBe = {
						belongsToAssociations: [
							{model: 'test1Model', options: {as: 'test1', foreignKey: 'test1Id'}},
							{model: 'testComponent2Model', options: {as: 'test2', foreignKey: 'test2Id'}}
						],
						hasOneAssociations: [
							{model: 'test3Model', options: {as: 'test3', foreignKey: 'test3Id'}},
							{model: 'testComponent4Model', options: {as: 'test4', foreignKey: 'test4Id'}}
						],
						hasManyAssociations: [
							{model: 'test5Model', options: {as: 'test5', foreignKey: 'test5Id'}},
							{model: 'testComponent6Model', options: {as: 'test6', foreignKey: 'test6Id'}}
						],
						belongsToManyAssociations: [
							{model: 'test7Model', options: {as: 'test7', through: 'test7Through', foreignKey: 'test7Id', otherKey: 'testId'}},
							{model: 'testComponent8Model', options: {as: 'test8', through: 'test8Through', foreignKey: 'test8Id', otherKey: 'testId'}}
						]
					},
					dependencyMapItemsShouldBe = {
						slaveOf: ['test1', 'testComponent2'],
						masterOf: ['test3', 'testComponent4', 'test5', 'testComponent6'],
						equalWith: ['test7', 'testComponent8'],
						associationKeys: ['test1', 'test2', 'test3', 'test4', 'test5', 'test6', 'test7', 'test8']
					}
				changeableInstance.model = model
				changeableInstance.db = db
				changeableInstance.associationsConfig = {
					test1: {type: 'belongsTo', foreignKey: 'test1Id'},
					test2: {type: 'belongsTo', componentName: 'testComponent2', foreignKey: 'test2Id'},
					test3: {type: 'hasOne', foreignKey: 'test3Id'},
					test4: {type: 'hasOne', componentName: 'testComponent4', foreignKey: 'test4Id'},
					test5: {type: 'hasMany', foreignKey: 'test5Id'},
					test6: {type: 'hasMany', componentName: 'testComponent6', foreignKey: 'test6Id'},
					test7: {type: 'belongsToMany', through: 'test7Through', foreignKey: 'test7Id', otherKey: 'testId'},
					test8: {type: 'belongsToMany', componentName: 'testComponent8', through: 'test8Through', foreignKey: 'test8Id', otherKey: 'testId'}
				}
				model.belongsToAssociations = []
				model.hasOneAssociations = []
				model.hasManyAssociations = []
				model.belongsToManyAssociations = []

				instance.associate()

				for (const associationName in associationsObjectsShouldBe) {
					const dataShouldBe = associationsObjectsShouldBe[associationName],
						objectFromTheModel = model[associationName]
					for (const i in objectFromTheModel) {
						const shouldBeItem = dataShouldBe[i],
							shouldBeOptions = shouldBeItem.options,
							itemFromTheModel = objectFromTheModel[i],
							options = itemFromTheModel.options
						assert.strictEqual(itemFromTheModel.model, shouldBeItem.model, `Bad model name ${itemFromTheModel.model} for "${associationName}" item no. ${i}, expected ${shouldBeItem.model}`)
						for (const key in options) {
							assert.strictEqual(options[key], shouldBeOptions[key], `Bad value ${options[key]} for option "${key}" for "${associationName}" item no. ${i}, expected ${shouldBeOptions[key]}`)
						}
					}
				}
				for (const type in dependencyMapItemsShouldBe) {
					const mapTypeShouldBe = dependencyMapItemsShouldBe[type],
						mapTypeDataFromModel = instance.dependencyMap[type]
					for (const i in mapTypeDataFromModel) {
						assert.strictEqual(mapTypeDataFromModel[i], mapTypeShouldBe[i], `Bad dependencyMap item value ${mapTypeDataFromModel[i]} for type "${type}", expected ${mapTypeShouldBe[i]}`)
					}
				}
			})
		})
	},
	testMapNestedRelations: function() {
		const instance = this
		let changeableInstance = this,
			db = {
				components: {
					test2: {
						model: 'test2Model',
						componentName: 'test2',
						dependencyMap: {associationKeys: ['test4', 'test5']},
						associationsConfig: {
							test4: {type: 'hasMany', foreignKey: 'test4Id'},
							test5: {type: 'belongsTo', componentName: 'testComponent5', foreignKey: 'test5Id'}
						}
					},
					testComponent3: {
						model: 'testComponent3Model',
						componentName: 'testComponent3'
					},
					test4: {
						model: 'test4Model',
						componentName: 'test4'
					},
					testComponent5: {
						model: 'testComponent5Model',
						componentName: 'testComponent5'
					}
				}
			}
		describe('baseDBComponent.mapNestedRelations', function() {
			it('should throw an error with the correct message if the sourceComponent argument is not a non-null object', function() {
				let didThrowAnError = false
				try {
					instance.mapNestedRelations()
				} catch(e) {
					if (e && (e.customMessage === 'Invalid sourceComponent object provided.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if the config argument is not an array', function() {
				let didThrowAnError = false
				try {
					instance.mapNestedRelations({})
				} catch(e) {
					if (e && (e.customMessage === 'Invalid config array provided.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should execute successfully and return a blank array if the config array is empty', function() {
				assert(!instance.mapNestedRelations({dependencyMap: {}}, []).length)
			})
			it('should throw an error with the correct message if an associationName is not a string', function() {
				let didThrowAnError = false
				try {
					instance.mapNestedRelations({componentName: 'test1', associationsConfig: {}, dependencyMap: {}}, [{}])
				} catch(e) {
					if (e && (e.customMessage === 'At "test1": invalid association name - "undefined".')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an associationName is an empty string', function() {
				let didThrowAnError = false
				try {
					instance.mapNestedRelations({componentName: 'test1', associationsConfig: {}, dependencyMap: {}}, [{associationName: ''}])
				} catch(e) {
					if (e && (e.customMessage === 'At "test1": invalid association name - "".')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an association with the provided name does not exist in the sourceComponent', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({componentName: 'test1', associationsConfig: {}, dependencyMap: {}}, [{associationName: 'test2'}])
				} catch(e) {
					if (e && (e.customMessage === 'At "test1": the component does not have an association named "test2".')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an attributes object is povided in an association, but is not an array', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', attributes: 'a'}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": the "attributes" object in the relation config must be a non-empty array.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an attributes object is povided in an association, but is an empty array', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', attributes: []}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": the "attributes" object in the relation config must be a non-empty array.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an attributes object is povided in an association, but one of its items is not a string', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', attributes: [null]}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": "attributes" array with invalid contents provided in the relation config.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an attributes object is povided in an association, but one of its items is an empty string', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', attributes: ['']}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": "attributes" array with invalid contents provided in the relation config.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if a where object is povided in an association, but it\'s not an array or an object', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', where: 'test'}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": the "where" object in the relation config must be a non-empty object or array.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if a where object is povided in an association, but it\'s an empty object', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', where: {}}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": the "where" object in the relation config must be a non-empty object or array.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if a where object is povided in an association, but it\'s an empty array', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', where: {}}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": the "where" object in the relation config must be a non-empty object or array.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an order object is povided in an association, but it\'s not an array', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', order: 'test'}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": the "order" object in the relation config must be a non-empty array.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an order object is povided in an association, but it\'s an empty array', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', order: []}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": the "order" object in the relation config must be a non-empty array.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an order object is povided in an association, but one of its items is not an array', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', order: ['test']}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": "order" object with invalid contents provided in the relation config.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an order object is povided in an association, but one of its items is an empty array', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', order: [[]]}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": "order" object with invalid length provided in the relation config.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an order object is povided in an association, but one of its inner items is not a string', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', order: [['test', null]]}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": "order" object with invalid contents provided in the relation config.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an order object is povided in an association, but one of its inner items is an empty string', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', order: [['test', '']]}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": "order" object with invalid contents provided in the relation config.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an order object is povided in an association, but one of its items has an invalid number of args (should be 2 or 3)', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', order: [['test']]}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": "order" object with invalid length provided in the relation config.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an order object is povided in an association, but one of its items has 3 values and the first is not a valid component name', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', order: [['test0', 'test', 't']]}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": no component named "test0" exists, cannot order results by it.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an include object is povided in an association, but it\'s not an array', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', include: 'test'}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": the "include" object in the relation config must be a non-empty array.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an include object is povided in an association, but it\'s an empty array', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', include: []}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": the "include" object in the relation config must be a non-empty array.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should execute successfully and return a valid mappedArray if all paramters are correct', function() {
				changeableInstance.db = db
				let mappedArray = instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {
								test2: {type: 'belongsTo', foreignKey: 'test2Id'},
								test3: {type: 'hasMany', componentName: 'testComponent3', foreignKey: 'test3Id'}
							},
							dependencyMap: {associationKeys: ['test2', 'test3']}
						}, [
							{associationName: 'test2', include: [{associationName: 'test5', required: true, attributes: ['id', 'name']}]},
							{associationName: 'test3', where: {id: 3}, order: [['testComponent3', 'id', 'asc']]}
						]
					),
					topLevelMapShouldBe = [
						{model: 'test2Model', as: 'test2', required: false},
						{model: 'testComponent3Model', as: 'test3', required: false}
					],
					firstItemIncludeShouldBe = [
						{model: 'testComponent5Model', as: 'test5', required: true}
					]

				const firstItem = mappedArray[0],
					secondItem = mappedArray[1]
				for (const i in topLevelMapShouldBe) {
					const tlmItem = topLevelMapShouldBe[i],
						mapItem = mappedArray[i]
					for (const j in tlmItem) {
						assert.strictEqual(mapItem[j], tlmItem[j], `At item no. ${i}: bad property "${j}", set to ${mapItem[j]}, expected ${tlmItem}.`)
					}
				}
				for (const i in firstItemIncludeShouldBe) {
					const tlmItem = firstItemIncludeShouldBe[i],
						mapItem = firstItem.include[i]
					for (const j in tlmItem) {
						if (tlmItem[j] !== mapItem[j]) {
							assert.strictEqual(mapItem[j], tlmItem[j], `At first item include item no. ${i}: bad property "${j}", set to ${mapItem[j]}, expected ${tlmItem[j]}.`)
						}
					}
				}
				assert.strictEqual(firstItem.include[0].attributes[0], 'id', `Bad value ${firstItem.include[0].attributes[0]} for firstItem.include[0].attributes[0], expected id.`)
				assert.strictEqual(firstItem.include[0].attributes[1], 'name', `Bad value ${firstItem.include[0].attributes[1]} for firstItem.include[0].attributes[1], expected name.`)
				assert.strictEqual(secondItem.where.id, 3, `Bad value ${secondItem.where.id} for secondItem.where.id, expected 3.`)
				assert.strictEqual(secondItem.order[0][0].model, 'testComponent3Model', `Bad value ${secondItem.order[0][0].model} for secondItem.order[0][0].model, expected testComponent3Model.`)
				assert.strictEqual(secondItem.order[0][0].as, 'test3', `Bad value ${secondItem.order[0][0].as} for secondItem.order[0][0].as, expected test3.`)
				assert.strictEqual(secondItem.order[0][1], 'id', `Bad value ${secondItem.order[0][1]} for secondItem.order[0][1], expected id.`)
				assert.strictEqual(secondItem.order[0][2], 'asc', `Bad value ${secondItem.order[0][2]} for secondItem.order[0][2], expected asc.`)
			})
		})
	},
	testMapRelations: function() {
		const instance = this
		let changeableInstance = this
		describe('baseDBComponent.mapRelations', function() {
			it('should execute successfully and leave everything blank if the component\'s associationConfig is not a non-null object', function() {
				changeableInstance.relReadKeys = []
				changeableInstance.relations = {}
				changeableInstance.associationsConfig = {}
				changeableInstance.relationsConfig = {}
				changeableInstance.db = {
					components: {
						test1: {model: 'test1Model'},
						testComponent2: {model: 'testComponent2Model'},
						test3: {model: 'test3Model'}
					}
				}
				instance.mapRelations()
				let relKeysLength = Object.keys(instance.relations).length
				assert.strictEqual(instance.relReadKeys.length, 0 , `Bad value ${instance.relReadKeys.length} for instance.relReadKeys.length, expected 0`)
				assert.strictEqual(relKeysLength, 0, `Bad value ${relKeysLength} for relKeysLength, expected 0.`)
			})
			it('should execute successfully and map the relations correctly if all paramters are correct', function() {
				let attributesShouldBe = {
					test1: {model: 'test1Model', as: 'test1'},
					test2: {model: 'testComponent2Model', as: 'test2'},
					test3: {model: 'test3Model', as: 'test3', required: true},
					test3ButWithADiffreentAlias: {model: 'test3Model', as: 'test3', required: false}
				}
				changeableInstance.relReadKeys = []
				changeableInstance.relations = {}
				changeableInstance.associationsConfig = {
					test1: {type: 'belongsTo', foreignKey: 'test1Id'},
					test2: {type: 'hasMany', componentName: 'testComponent2', foreignKey: 'test2Id'},
					test3: {type: 'hasMany', foreignKey: 'test3Id'},
				}
				changeableInstance.relationsConfig = {
					test3: {required: true, attributes: ['id', 'name']},
					test3ButWithADiffreentAlias: {associationName: 'test3', where: {id: 1}}
				}
				changeableInstance.db = {
					components: {
						test1: {model: 'test1Model'},
						testComponent2: {model: 'testComponent2Model'},
						test3: {model: 'test3Model'}
					}
				}
				instance.mapRelations()
				let keysAre = JSON.stringify(instance.relReadKeys),
					keysShouldBe = JSON.stringify(['test1', 'test2', 'test3', 'test3ButWithADiffreentAlias'])
				assert.strictEqual(keysAre, keysShouldBe, `Bad keys ${keysAre} for the instance.realReadKeys object. expected ${keysShouldBe}.`)
				for (const key in attributesShouldBe) {
					const reqItem = attributesShouldBe[key],
						relItem = instance.relations[key]
					for (const innerKey in reqItem) {
						assert.strictEqual(relItem[innerKey], reqItem[innerKey], `Bad value ${relItem[innerKey]} for key "${innerKey}" in item "${key}", expected ${reqItem[innerKey]}.`)
					}
				}
				let test3RelationAttributes = instance.relations.test3.attributes
				assert.strictEqual(test3RelationAttributes[0], 'id', `Bad value ${test3RelationAttributes[0]} for test3RelationAttributes[0], expected id.`)
				assert.strictEqual(test3RelationAttributes[1], 'name', `Bad value ${test3RelationAttributes[1]} for test3RelationAttributes[1], expected name.`)
				assert.strictEqual(instance.relations.test3ButWithADiffreentAlias.where.id, 1, `Bad value ${instance.relations.test3ButWithADiffreentAlias.where.id} for instance.relations.test3ButWithADiffreentAlias.where.id, expected 1.`)
			})
		})
	},
	testCheckFilterValue: function() {
		const instance = this
		describe('baseDBComponent.checkFilterValue', function() {
			it('should return false if filterValue is undefined', function() {
				let result = instance.checkFilterValue()
				assert.strictEqual(result, false, `Bad value ${result} for the method return, expected false.`)
			})
			it('should return true if filterValue is null', function() {
				let result = instance.checkFilterValue(null)
				assert.strictEqual(result, true, `Bad value ${result} for the method return, expected true.`)
			})
			it('should return true if filterValue is a string', function() {
				let result = instance.checkFilterValue('')
				assert.strictEqual(result, true, `Bad value ${result} for the method return, expected true.`)
			})
			it('should return true if filterValue is a number', function() {
				let result = instance.checkFilterValue(3)
				assert.strictEqual(result, true, `Bad value ${result} for the method return, expected true.`)
			})
			it('should return true if filterValue is an instance of Date', function() {
				let result = instance.checkFilterValue(new Date())
				assert.strictEqual(result, true, `Bad value ${result} for the method return, expected true.`)
			})
			it('should return false if filterValue is an empty object', function() {
				let result = instance.checkFilterValue({})
				assert.strictEqual(result, false, `Bad value ${result} for the method return, expected false.`)
			})
			it('should return false if filterValue is an object with a property that is not listed in the component\'s allowedFilterKeywordOperators array', function() {
				let result = instance.checkFilterValue({badProperty: true})
				assert.strictEqual(result, false, `Bad value ${result} for the method return, expected false.`)
			})
			it('should return false if filterValue is an empty array', function() {
				let result = instance.checkFilterValue([])
				assert.strictEqual(result, false, `Bad value ${result} for the method return, expected false.`)
			})
			it('should return false if filterValue is an array and one of its items is an empty non-null object', function() {
				let result = instance.checkFilterValue([{}])
				assert.strictEqual(result, false, `Bad value ${result} for the method return, expected false.`)
			})
			it('should return true if filterValue is an array and all of its items are null, strings, numbers, dates and valid objects', function() {
				let result = instance.checkFilterValue([null, 'testString', 2, new Date(), {$and: {$not: 3, $lte: 7}, $not: ['a', 'b', 'c'], $gt: 5}])
				assert.strictEqual(result, true, `Bad value ${result} for the method return, expected true.`)
			})
		})
	},
	testSetFilterValue: function() {
		const instance = this
		describe('baseDBComponent.setFilterValue', function() {
			it('should trow an error with the correct message if an invalid filter object is provided', function() {
				let didThrowAnError = false
				try {
					instance.setFilterValue(undefined, undefined, undefined, true)
				} catch(e) {
					if (e && (e.customMessage === 'Invalid filter object provided.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should trow an error with the correct message if the field argument is not a non-empty string', function() {
				let didThrowAnError = false
				try {
					instance.setFilterValue(undefined, {}, undefined, true)
				} catch(e) {
					if (e && (e.customMessage === 'Invalid field string provided.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should do nothing if the value does not correspond to checkFilterValue standards', function() {
				let container = {}
				instance.setFilterValue(container, {}, 'testField', undefined)
				let keysLength = Object.keys(container).length
				assert.strictEqual(keysLength, 0, `bad value ${keysLength} for Object.keys(container).length, expected 0`)
			})
			it('should set the filter value to equal the given one if no processing conditions are met', function() {
				let container = {}
				instance.setFilterValue(container, {}, 'testField', 'testValue')
				assert.strictEqual(container.testField, 'testValue', `bad value ${container.testField} for container.testField, expected testValue`)
			})
			it('should set the filter value to equal the given one if the filter is of a match type, but exactMatch is set for it', function() {
				let container = {}
				instance.setFilterValue(container, {like: '-%'}, 'testField', 'testValue', ['testField'])
				assert.strictEqual(container.testField, 'testValue', `bad value ${container.testField} for container.testField, expected testValue`)
			})
			it('should set the filter value correctly if the filter is of the "-%" match type and exactMatch is not set for it', function() {
				let container = {}
				instance.setFilterValue(container, {like: '-%'}, 'testField', 'testValue')
				assert.strictEqual(container.testField.$iLike, 'testValue%', `bad value ${container.testField.$iLike} for container.testField.$iLike, expected testValue%`)
			})
			it('should set the filter value correctly if the filter is of the "-%" caseSensitive match type and exactMatch is not set for it', function() {
				let container = {}
				instance.setFilterValue(container, {like: '-%', caseSensitive: true}, 'testField', 'testValue')
				assert.strictEqual(container.testField.$like, 'testValue%', `bad value ${container.testField.$iLike} for container.testField.$iLike, expected testValue%`)
			})
			it('should set the filter value correctly if the filter is of the "%-" match type and exactMatch is not set for it', function() {
				let container = {}
				instance.setFilterValue(container, {like: '%-'}, 'testField', 'testValue')
				assert.strictEqual(container.testField.$iLike, '%testValue', `bad value ${container.testField.$iLike} for container.testField.$iLike, expected %testValue`)
			})
			it('should set the filter value correctly if the filter is of the "%-" caseSensitive match type and exactMatch is not set for it', function() {
				let container = {}
				instance.setFilterValue(container, {like: '%-', caseSensitive: true}, 'testField', 'testValue')
				assert.strictEqual(container.testField.$like, '%testValue', `bad value ${container.testField.$iLike} for container.testField.$iLike, expected %testValue`)
			})
			it('should set the filter value correctly if the filter is of the "%%" match type and exactMatch is not set for it', function() {
				let container = {}
				instance.setFilterValue(container, {like: '%%'}, 'testField', 'testValue')
				assert.strictEqual(container.testField.$iLike, '%testValue%', `bad value ${container.testField.$iLike} for container.testField.$iLike, expected %testValue%`)
			})
			it('should set the filter value correctly if the filter is of the "%%" caseSensitive match type and exactMatch is not set for it', function() {
				let container = {}
				instance.setFilterValue(container, {like: '%%', caseSensitive: true}, 'testField', 'testValue')
				assert.strictEqual(container.testField.$like, '%testValue%', `bad value ${container.testField.$iLike} for container.testField.$iLike, expected %testValue%`)
			})
			it('should set the filter value correctly if the filter is of the "betweenFrom" range type and exactMatch is not set for it', function() {
				let container = {}
				instance.setFilterValue(container, {betweenFrom: true}, 'testFieldFrom', 'testValue')
				assert.strictEqual(container.testField.$gt, 'testValue', `bad value ${container.testField.$gt} for container.testField.$gt, expected testValue`)
			})
			it('should set the filter value correctly if the filter is of the "betweenFrom" range type and exactMatch is set for it', function() {
				let container = {}
				instance.setFilterValue(container, {betweenFrom: true}, 'testFieldFrom', 'testValue', ['testField'])
				assert.strictEqual(container.testField.$gte, 'testValue', `bad value ${container.testField.$gte} for container.testField.$gte, expected testValue`)
			})
			it('should set the filter value correctly if the filter is of the "betweenFrom" range type and exactMatchFields is set for it in the field options', function() {
				let container = {}
				instance.setFilterValue(container, {betweenFrom: true, exactMatchFields: true}, 'testFieldFrom', 'testValue')
				assert.strictEqual(container.testField.$gte, 'testValue', `bad value ${container.testField.$gte} for container.testField.$gte, expected testValue`)
			})
			it('should set the filter value correctly if the filter is of the "betweenTo" range type and exactMatch is not set for it', function() {
				let container = {}
				instance.setFilterValue(container, {betweenTo: true}, 'testFieldTo', 'testValue')
				assert.strictEqual(container.testField.$lt, 'testValue', `bad value ${container.testField.$lt} for container.testField.$lt, expected testValue`)
			})
			it('should set the filter value correctly if the filter is of the "betweenTo" range type and exactMatch is set for it', function() {
				let container = {}
				instance.setFilterValue(container, {betweenTo: true}, 'testFieldTo', 'testValue', ['testField'])
				assert.strictEqual(container.testField.$lte, 'testValue', `bad value ${container.testField.$lte} for container.testField.$lte, expected testValue`)
			})
			it('should set the filter value correctly if the filter is of the "betweenTo" range type and exactMatchFields is set for it in the field options', function() {
				let container = {}
				instance.setFilterValue(container, {betweenTo: true, exactMatchFields: true}, 'testFieldTo', 'testValue')
				assert.strictEqual(container.testField.$lte, 'testValue', `bad value ${container.testField.$lte} for container.testField.$lte, expected testValue`)
			})
		})
	},
	testGetWhereObjects: function() {
		const instance = this
		let changeableInstance = this
		describe('baseDBComponent.getWhereObjects', function() {
			it('should do nothing if filters argument is not a non-empty non-null object', function() {
				let {where, requiredRelationsData} = instance.getWhereObjects(),
					whereKeysLength = Object.keys(where).length,
					requiredRelationsDataKeysLength = Object.keys(requiredRelationsData).length
				assert.strictEqual(whereKeysLength, 0, `bad value ${whereKeysLength} for whereKeysLength, expected 0`)
				assert.strictEqual(requiredRelationsDataKeysLength, 0, `bad value ${requiredRelationsDataKeysLength} for requiredRelationsDataKeysLength, expected 0`)
			})
			it('should execute successfully populate the where and requiredRelationsData objects correctly if all parameters are correct', function() {
				changeableInstance.searchFields = [
					{field: 'id'},
					{field: 'someString', like: '%%'},
					{field: '$testRelation.innerTestRelation.nestedId$'},
					{field: 'anotherString', like: '-%'}
				]
				let {where, requiredRelationsData} = instance.getWhereObjects({
							id: 3,
							someString: 'test1',
							'$testRelation.innerTestRelation.nestedId$': 5,
							anotherString: 'test2'
						},
						['anotherString']
					),
					requiredRelationsDataKeysLength = Object.keys(requiredRelationsData).length
				assert.strictEqual(where.id, 3, `bad value ${where.id} for where.id, expected 3`)
				assert.strictEqual(where.someString.$iLike, '%test1%', `bad value ${where.someString.$iLike} for where.someString.$iLike, expected %test1%`)
				assert.strictEqual(where.anotherString, 'test2', `bad value ${where.anotherString} for where.anotherString, expected test2`)
				assert.strictEqual(requiredRelationsDataKeysLength, 1, `bad value ${requiredRelationsDataKeysLength} for requiredRelationsDataKeysLength, expected 1`)
				assert.strictEqual(requiredRelationsData.testRelation.path, 'testRelation.innerTestRelation', `bad value ${requiredRelationsData.testRelation.path} for requiredRelationsData.testRelation.path, expected testRelation.innerTestRelation`)
				assert.strictEqual(requiredRelationsData.testRelation.field, 'nestedId', `bad value ${requiredRelationsData.testRelation.field} for requiredRelationsData.testRelation.field, expected nestedId`)
				assert.strictEqual(requiredRelationsData.testRelation.value, 5, `bad value ${requiredRelationsData.testRelation.value} for requiredRelationsData.testRelation.value, expected 5`)
			})
		})
	},
	testAssignModelToDereferencedRelationRecursively: function() {
		const instance = this
		let changeableInstance = this
		describe('baseDBComponent.assignModelToDereferencedRelationRecursively', function() {
			it('should execute successfully and return the correct object if all parameters are correct', function() {
				let item = {
						model: new Date(),
						as: 'test1',
						include: [{model: new Date(), as: 'test2'}, {model: new Date(), as: 'test3', include: [{model: new Date(), as: 'test4'}]}, {model: new Date(), as: 'test5'}]
					},
					result = instance.assignModelToDereferencedRelationRecursively(item),
					include = result.include
				assert(result.model instanceof Date, `bad value ${result.model} for result.model, expected an instance of Date`)
				assert(include[0].model instanceof Date, `bad value ${include[0].model} for include[0].model, expected an instance of Date`)
				assert(include[1].model instanceof Date, `bad value ${include[1].model} for include[1].model, expected an instance of Date`)
				assert(include[1].include[0].model instanceof Date, `bad value ${include[1].include[0].model} for include[1].include[0].model, expected an instance of Date`)
				assert(include[2].model instanceof Date, `bad value ${include[2].model} for include[2].model, expected an instance of Date`)
			})
		})
	},
	testGetRelationObjects: function() {
		const instance = this
		let changeableInstance = this
		describe('baseDBComponent.getRelationObjects', function() {
			it('should execute successfully and return the correct include and order objects if all parameters are correct', function() {
				changeableInstance.searchFields = [
					{field: 'id'},
					{field: '$test1.name$'},
					{field: '$test2.test3.description$', like: '%-'}
				]
				changeableInstance.associationsConfig = {
					test1: {type: 'belongsTo', foreignKey: 'test1Id'},
					test2: {type: 'hasMany', componentName: 'testComponent2', foreignKey: 'test2Id'},
					test4: {type: 'belongsTo', foreignKey: 'test4Id'}
				}
				changeableInstance.relationsConfig = {
					test2: {order: [['testComponent2', 'id', 'asc']], include: [{associationName: 'test3'}]},
					test2ButWithADiffreentAlias: {associationName: 'test2', where: {id: 1}}
				}
				changeableInstance.db = {
					components: {
						test1: {model: 'test1Model', dependencyMap: {associationKeys: []}},
						testComponent2: {
							model: 'testComponent2Model',
							dependencyMap: {associationKeys: ['test3']},
							associationsConfig: {test3: {type: 'belongsTo', foreignKey: 'test3Id'}}
						},
						test3: {model: 'test3Model', dependencyMap: {associationKeys: []}},
						test4: {model: 'test4Model', dependencyMap: {associationKeys: []}}
					}
				}
				changeableInstance.relReadKeys = []
				changeableInstance.relations = {}
				instance.mapRelations()
				let {where, requiredRelationsData} = instance.getWhereObjects({id: 3, '$test1.name$': 'testName', '$test2.test3.description$': 'testDescription'}),
					{include, order} = instance.getRelationObjects({test4: true}, requiredRelationsData),
					topLevelIncludeShouldBe = [
						{model: 'test1Model', as: 'test1', required: true},
						{model: 'testComponent2Model', as: 'test2', required: true},
						{model: 'test4Model', as: 'test4', required: undefined}
					]
				for (const i in include) {
					const includeItem = include[i],
						includeItemShouldBe = topLevelIncludeShouldBe[i]
					for (const j in includeItemShouldBe) {
						assert.strictEqual(includeItem[j], includeItemShouldBe[j],`Bad value ${includeItem[j]} for key "${j}" in item no. ${i}, expected ${includeItemShouldBe[j]}.`)
					}
				}
				assert(order instanceof Array, `Bad value ${order} for order, expcted an array.`)
				assert.strictEqual(order.length, 1, `Bad value ${order.length} for order.length, expected 1.`)
				let firstOrderItem = order[0],
					firstIncludeItem = include[1].include
				assert(firstOrderItem instanceof Array, `Bad value ${firstOrderItem} for firstOrderItem, expcted an array.`)
				assert.strictEqual(firstOrderItem.length, 3, `Bad value ${firstOrderItem.length} for firstOrderItem.length, expected 3.`)
				assert.strictEqual(firstOrderItem[0].model, 'testComponent2Model', `Bad value ${firstOrderItem[0].model} for firstOrderItem[0].model, expected testComponent2Model.`)
				assert.strictEqual(firstOrderItem[0].as, 'test2', `Bad value ${firstOrderItem[0].as} for firstOrderItem[0].as, expected test2.`)
				assert.strictEqual(firstOrderItem[1], 'id', `Bad value ${firstOrderItem[1]} for firstOrderItem[1], expected id.`)
				assert.strictEqual(firstOrderItem[2], 'asc', `Bad value ${firstOrderItem[2]} for firstOrderItem[2], expected asc.`)
				assert(firstIncludeItem instanceof Array, `Bad value ${firstIncludeItem} for firstIncludeItem, expcted an array.`)
				assert.strictEqual(firstIncludeItem.length, 1, `Bad value ${firstIncludeItem.length} for firstIncludeItem.length, expected 1.`)
				firstIncludeItem = firstIncludeItem[0]
				assert.strictEqual(firstIncludeItem.model, 'test3Model', `Bad value ${firstIncludeItem.model} for firstIncludeItem.model, expected test3Model.`)
				assert.strictEqual(firstIncludeItem.as, 'test3', `Bad value ${firstIncludeItem.as} for firstIncludeItem.as, expected test3.`)
				assert.strictEqual(firstIncludeItem.required, true, `Bad value ${firstIncludeItem.required} for firstIncludeItem.required, expected true.`)
				assert(firstIncludeItem.where, `Bad value ${firstIncludeItem.where} for firstIncludeItem.where, expected it to exist.`)
				assert(firstIncludeItem.where.description, `Bad value ${firstIncludeItem.where.description} for firstIncludeItem.where.description, expected it to exist.`)
				assert.strictEqual(firstIncludeItem.where.description.$iLike, '%testDescription', `Bad value ${firstIncludeItem.where.description.$iLike} for firstIncludeItem.where.description.$iLike, expected %testDescription.`)
			})
		})
	},
	testCreate: function() {
		const instance = this,
			{sequelize, Sequelize} = this
		let changeableInstance = this
		describe('baseDBComponent.create', function() {
			it('should execute successfully and create a new db entry correctly if all parameters are correct', function() {
				return sequelize.transaction().then((t) => co(function*() {
					let item = {id: 3, name: 'testName', description: 'testDescription'}
					changeableInstance.model = sequelize.define('test1Model', {
						name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
						description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
					})
					yield sequelize.sync({force: true, transaction: t})
					yield instance.create(item, {transaction: t})
					let createdItem = (yield instance.model.findOne({where: {id: 3}, transaction: t})).dataValues
					for (const i in item) {
						assert.strictEqual(createdItem[i], item[i], `Bad value ${createdItem[i]} for field "${i}", expected ${item[i]}.`)
					}
					delete changeableInstance.model
					return t.rollback()
				}))
				return true
			})
		})
	},
	testBulkCreate: function() {
		const instance = this,
			{sequelize, Sequelize} = this
		let changeableInstance = this
		describe('baseDBComponent.bulkCreate', function() {
			it('should execute successfully and create the new db entries correctly if all parameters are correct', function() {
				return sequelize.transaction().then((t) => co(function*() {
					let items = [{id: 3, name: 'testName', description: 'testDescription'}, {id: 4, name: 'testName4', description: 'testDescription4'}]
					changeableInstance.model = sequelize.define('test1Model', {
						name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
						description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
					})
					yield sequelize.sync({force: true, transaction: t})
					yield instance.bulkCreate(items, {transaction: t})
					let createdItems = yield instance.model.findAll({where: {id: [3, 4]}, transaction: t})
					for (const i in items) {
						const item = items[i],
							createdItem = createdItems[i].dataValues
						for (const j in item) {
							assert.strictEqual(createdItem[j], item[j], `Bad value '${createdItem[j]}' for field "${j}" for item no. ${i}.`)
						}
					}
					delete changeableInstance.model
					return t.rollback()
				}))
			})
		})
	},
	testRead: function() {
		const instance = this,
			{sequelize, Sequelize} = this
		let changeableInstance = this
		describe('baseDBComponent.read', function() {
			it('should throw an error with the correct message if no filters are provided', function() {
				return co(function*() {
					changeableInstance.relReadKeys = []
					let didThrowAnError = false
					try {
						yield instance.read({})
					} catch(e) {
						if (e && (e.customMessage === 'No filters provided.')) {
						didThrowAnError = true
					} else {
						throw e
					}
					}
					assert.strictEqual(didThrowAnError, true, 'no error was thrown')
					return true
				})
			})
			it('should execute successfully and read a db entry correctly if all parameters are correct', function() {
				return sequelize.transaction().then((t) => co(function*() {
					let item = {id: 1, test2Id: 1, name: 'test1Name', description: 'test1Description'},
						test2Item = {id: 1, test3Id: 1, name: 'test2Name', description: 'test2Description'},
						test3Item = {id: 1, name: 'test3Name', description: 'test3Description'}
					changeableInstance.model = sequelize.define('test1Model', {
						name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
						description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
					})
					changeableInstance.searchFields = [
						{field: 'id'},
						{field: '$test2.name$'},
						{field: '$test2.test3.description$'}
					]
					changeableInstance.associationsConfig = {
						test2: {type: 'belongsTo', componentName: 'testComponent2', foreignKey: 'test2Id'}
					}
					changeableInstance.relationsConfig = {
						test2: {order: [['testComponent2', 'id', 'asc']], include: [{associationName: 'test3'}]}
					}
					changeableInstance.db = {
						components: {
							testComponent2: {
								model: sequelize.define('test2Model', {
									name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
									description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
								}),
								associationsConfig: {test3: {type: 'belongsTo', foreignKey: 'test3Id'}},
								dependencyMap: {associationKeys: ['test3']}
							},
							test3: {
								model: sequelize.define('test3Model', {
									name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
									description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
								}),
								dependencyMap: {associationKeys: []}
							}
						}
					}
					changeableInstance.associate()
					changeableInstance.db.components.testComponent2.model.belongsTo(changeableInstance.db.components.test3.model, {as: 'test3', foreignKey: 'test3Id'})
					changeableInstance.mapRelations()
					yield sequelize.sync({force: true, transaction: t})
					yield changeableInstance.db.components.test3.model.create(test3Item, {transaction: t})
					yield changeableInstance.db.components.testComponent2.model.create(test2Item, {transaction: t})
					yield instance.create(item, {transaction: t})
					let createdItem = (yield instance.read({
							filters: {
								id: 1,
								'$test2.name$': 'test2Name',
								'$test2.test3.description$': 'test3Description'
							},
							transaction: t
						})).dataValues,
						createdTest2Item = createdItem.test2.dataValues,
						createdTest3Item = createdTest2Item.test3.dataValues
					for (const i in item) {
						assert.strictEqual(createdItem[i], item[i], `Bad value '${createdItem[i]}' for field "${i}" for the main item, expected ${item[i]}.`)
					}
					for (const i in test2Item) {
						assert.strictEqual(createdTest2Item[i], test2Item[i], `Bad value '${createdTest2Item[i]}' for field "${i}" for the test2Item, expected ${test2Item[i]}.`)
					}
					for (const i in test3Item) {
						assert.strictEqual(createdTest3Item[i], test3Item[i], `Bad value '${createdTest3Item[i]}' for field "${i}" for the test3Item, expected ${test3Item[i]}.`)
					}
					delete changeableInstance.model
					delete changeableInstance.db
					return t.rollback()
				}))
				return true
			})
		})
	},
	testReadList: function() {
		const instance = this,
			{sequelize, Sequelize} = this
		let changeableInstance = this
		describe('baseDBComponent.readList', function() {
			it('should throw an error with the correct message if no filters are provided', function() {
				return co(function*() {
					changeableInstance.relReadKeys = []
					let didThrowAnError = false
					try {
						yield instance.readList({})
					} catch(e) {
						if (e && (e.customMessage === 'No filters provided.')) {
						didThrowAnError = true
					} else {
						throw e
					}
					}
					assert.strictEqual(didThrowAnError, true, 'no error was thrown')
					return true
				})
			})
			it('should execute successfully and read a list of db entries correctly if all parameters are correct and there are no relReadKeys', function() {
				return sequelize.transaction().then((t) => co(function*() {
					let items = [
							{id: 1, test2Id: 1, name: 'test1Name', description: 'test1Description'},
							{id: 2, test2Id: 1, name: 'test2Name', description: 'test2Description'},
							{id: 3, test2Id: 1, name: 'test3Name', description: 'test3Description'}
						],
						test2Item = {id: 1, test3Id: 1, name: 'test2Name', description: 'test2Description'},
						test3Item = {id: 1, name: 'test3Name', description: 'test3Description'}
					changeableInstance.model = sequelize.define('test1Model', {
						name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
						description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
					})
					changeableInstance.searchFields = [
						{field: 'id'},
						{field: '$test2.name$', like: '-%'},
						{field: '$test2.test3.description$', like: '-%'}
					]
					changeableInstance.associationsConfig = {
						test2: {type: 'belongsTo', componentName: 'testComponent2', foreignKey: 'test2Id'}
					}
					changeableInstance.relationsConfig = {
						test2: {order: [['testComponent2', 'id', 'asc']], include: [{associationName: 'test3'}]}
					}
					changeableInstance.db = {
						components: {
							testComponent2: {
								model: sequelize.define('test2Model', {
									name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
									description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
								}),
								associationsConfig: {test3: {type: 'belongsTo', foreignKey: 'test3Id'}},
								dependencyMap: {associationKeys: ['test3']}
							},
							test3: {
								model: sequelize.define('test3Model', {
									name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
									description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
								}),
								dependencyMap: {associationKeys: []}
							}
						}
					}
					changeableInstance.associate()
					changeableInstance.db.components.testComponent2.model.belongsTo(changeableInstance.db.components.test3.model, {as: 'test3', foreignKey: 'test3Id'})
					changeableInstance.mapRelations()
					yield sequelize.sync({force: true, transaction: t})
					yield changeableInstance.db.components.test3.model.create(test3Item, {transaction: t})
					yield changeableInstance.db.components.testComponent2.model.create(test2Item, {transaction: t})
					yield instance.bulkCreate(items, {transaction: t})
					let createdItemsData = yield instance.readList({
						filters: {
							id: [1, 2, 3],
							'$test2.name$': 'test',
							'$test2.test3.description$': 'test'
						},
						orderDirection: 'asc',
						transaction: t
					})
					for (const index in createdItemsData.results) {
						let item = items[index],
							createdItem = createdItemsData.results[index].dataValues,
							createdTest2Item = createdItem.test2.dataValues,
							createdTest3Item = createdTest2Item.test3.dataValues
						for (const i in item) {
							assert.strictEqual(createdItem[i], item[i], `Bad value '${createdItem[i]}' for field "${i}" for the main item, index ${index}, expected ${item[i]}.`)
						}
						for (const i in test2Item) {
							assert.strictEqual(createdTest2Item[i], test2Item[i], `Bad value '${createdTest2Item[i]}' for field "${i}" for the main test2Item, index ${index}, expected ${test2Item[i]}.`)
						}
						for (const i in test3Item) {
							assert.strictEqual(createdTest3Item[i], test3Item[i], `Bad value '${createdTest3Item[i]}' for field "${i}" for the main test3Item, index ${index}, expected ${test3Item[i]}.`)
						}
					}
					assert.strictEqual(createdItemsData.page, 1, `Bad value ${createdItemsData.page} for createdItemsData.page, expected 1.`)
					assert.strictEqual(createdItemsData.perPage, 10, `Bad value ${createdItemsData.perPage} for createdItemsData.perPage, expected 10.`)
					assert.strictEqual(createdItemsData.totalPages, 1, `Bad value ${createdItemsData.totalPages} for createdItemsData.totalPages, expected 1.`)
					assert.strictEqual(createdItemsData.more, false, `Bad value ${createdItemsData.more} for createdItemsData.more, expected false.`)
					delete changeableInstance.model
					delete changeableInstance.db
					return t.rollback()
				}))
			})
			it('should execute successfully and read a list of db entries correctly if all parameters are correct and there are relReadKeys', function() {
				return sequelize.transaction().then((t) => co(function*() {
					let items = [
							{id: 1, test2Id: 1, name: 'test1Name', description: 'test1Description'},
							{id: 2, test2Id: 1, name: 'test2Name', description: 'test2Description'},
							{id: 3, test2Id: 1, name: 'test3Name', description: 'test3Description'}
						],
						test2Item = {id: 1, test3Id: 1, name: 'test2Name', description: 'test2Description'},
						test3Item = {id: 1, name: 'test3Name', description: 'test3Description'}
					changeableInstance.model = sequelize.define('test1Model', {
						name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
						description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
					})
					changeableInstance.searchFields = [
						{field: 'id'},
						{field: '$test2.name$', like: '-%'},
						{field: '$test2.test3.description$', like: '-%'}
					]
					changeableInstance.associationsConfig = {
						test2: {type: 'belongsTo', componentName: 'testComponent2', foreignKey: 'test2Id'}
					}
					changeableInstance.relationsConfig = {
						test2: {order: [['testComponent2', 'id', 'asc']], include: [{associationName: 'test3'}]}
					}
					changeableInstance.db = {
						components: {
							testComponent2: {
								model: sequelize.define('test2Model', {
									name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
									description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
								}),
								associationsConfig: {test3: {type: 'belongsTo', foreignKey: 'test3Id'}},
								dependencyMap: {associationKeys: ['test3']}
							},
							test3: {
								model: sequelize.define('test3Model', {
									name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
									description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
								}),
								dependencyMap: {associationKeys: []}
							}
						}
					}
					changeableInstance.associate()
					changeableInstance.db.components.testComponent2.model.belongsTo(changeableInstance.db.components.test3.model, {as: 'test3', foreignKey: 'test3Id'})
					changeableInstance.mapRelations()
					yield sequelize.sync({force: true, transaction: t})
					yield changeableInstance.db.components.test3.model.create(test3Item, {transaction: t})
					yield changeableInstance.db.components.testComponent2.model.create(test2Item, {transaction: t})
					yield instance.bulkCreate(items, {transaction: t})
					let createdItemsData = yield instance.readList({
						filters: {
							id: [1, 2, 3]
						},
						relReadKeys: {test2: true},
						orderDirection: 'asc',
						transaction: t
					})
					for (const index in createdItemsData.results) {
						let item = items[index],
							createdItem = createdItemsData.results[index].dataValues,
							createdTest2Item = createdItem.test2.dataValues,
							createdTest3Item = createdTest2Item.test3.dataValues
						for (const i in item) {
							assert.strictEqual(createdItem[i], item[i], `Bad value '${createdItem[i]}' for field "${i}" for the main item, index ${index}, expected ${item[i]}.`)
						}
						for (const i in test2Item) {
							assert.strictEqual(createdTest2Item[i], test2Item[i], `Bad value '${createdTest2Item[i]}' for field "${i}" for the main test2Item, index ${index}, expected ${test2Item[i]}.`)
						}
						for (const i in test3Item) {
							assert.strictEqual(createdTest3Item[i], test3Item[i], `Bad value '${createdTest3Item[i]}' for field "${i}" for the main test3Item, index ${index}, expected ${test3Item[i]}.`)
						}
					}
					assert.strictEqual(createdItemsData.page, 1, `Bad value ${createdItemsData.page} for createdItemsData.page, expected 1.`)
					assert.strictEqual(createdItemsData.perPage, 10, `Bad value ${createdItemsData.perPage} for createdItemsData.perPage, expected 10.`)
					assert.strictEqual(createdItemsData.totalPages, 1, `Bad value ${createdItemsData.totalPages} for createdItemsData.totalPages, expected 1.`)
					assert.strictEqual(createdItemsData.more, false, `Bad value ${createdItemsData.more} for createdItemsData.more, expected false.`)
					delete changeableInstance.model
					delete changeableInstance.db
					return t.rollback()
				}))
				return true
			})
		})
	},
	testUpdate: function() {
		const instance = this,
			{sequelize, Sequelize} = this
		let changeableInstance = this
		describe('baseDBComponent.update', function() {
			it('should throw an error with the correct message if no filters are provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.update({})
					} catch(e) {
						if (e && (e.customMessage === 'Cannot update without criteria.')) {
						didThrowAnError = true
					} else {
						throw e
					}
					}
					assert.strictEqual(didThrowAnError, true, 'no error was thrown')
					return true
				})
			})
			it('should execute successfully and update a db entry correctly if all parameters are correct', function() {
				return sequelize.transaction().then((t) => co(function*() {
					let item = {name: 'testNameUpdated', description: 'testDescriptionUpdated'}
					changeableInstance.model = sequelize.define('test1Model', {
						name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
						description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
					})
					yield sequelize.sync({force: true, transaction: t})
					yield instance.create({id: 3, name: 'testName', description: 'testDescription'}, {transaction: t})
					yield instance.update({dbObject: item, where: {id: 3}, transaction: t})
					let updatedItem = (yield instance.model.findOne({where: {id: 3}, transaction: t})).dataValues
					for (const i in item) {
						assert.strictEqual(updatedItem[i], item[i], `Bad value ${updatedItem[i]} for field "${i}", expected ${item[i]}.`)
					}
					delete changeableInstance.model
					return t.rollback()
				}))
				return true
			})
		})
	},
	testBulkUpsert: function() {
		const instance = this,
			{sequelize, Sequelize} = this
		let changeableInstance = this
		describe('baseDBComponent.bulkUpsert', function() {
			it('should throw an error with the correct message of dbObjects is not an array', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.bulkUpsert()
					} catch (e) {
						if (e && (e.customMessage === 'Invalid array of "testComponent" items to create & update.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert.strictEqual(didThrowAnError, true, 'no error was thrown')
				})
			})
			it('should execute successfully create and update the list of db entries correctly if all parameters are correct', function() {
				changeableInstance.db = {sequelize}
				return sequelize.transaction().then((t) => co(function*() {
					let items = [
						{id: 1, name: 'testName1Updated', description: 'testDescription1Updated'},
						{id: 2, name: 'testName2Updated', description: 'testDescription2Updated'},
						{name: 'testName3Created', description: 'testDescription3Created'}
					]
					changeableInstance.model = sequelize.define('test1Model', {
						name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
						description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
					})
					yield sequelize.sync({force: true, transaction: t})
					yield instance.bulkCreate([
							{name: 'testName1', description: 'testDescription1'},
							{name: 'testName2', description: 'testDescription2'}
						],
						{transaction: t}
					)
					yield instance.bulkUpsert(items, {transaction: t})
					let updatedItems = yield instance.model.findAll({orderBy: [['id', 'asc']], transaction: t})
					for (const index in updatedItems) {
						const updatedItem = updatedItems[index].dataValues,
							item = items[index]
						for (const i in item) {
							assert.strictEqual(updatedItem[i], item[i], `Bad value ${updatedItem[i]} for field "${i}" in item no. ${index}, expected ${item[i]}.`)
						}
					}
					delete changeableInstance.model
					return t.rollback()
				}))
			})
		})
	},
	testDelete: function() {
		const instance = this,
			{sequelize, Sequelize} = this
		let changeableInstance = this
		describe('baseDBComponent.delete', function() {
			it('should throw an error with the correct message if checkForRelatedModels is set to true and an item has dependent items', function() {
				return sequelize.transaction().then((t) => co(function*() {
					let item = {id: 1, name: 'test1Name', description: 'test1Description'},
						test2Item = {id: 1, test1Id: 1, name: 'test2Name', description: 'test2Description'},
						didThrowAnError = false
					changeableInstance.componentName = 'test1Component'
					changeableInstance.model = sequelize.define('test1Model', {
						name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
						description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
					})
					changeableInstance.associationsConfig = {
						test2: {type: 'hasMany', componentName: 'testComponent2', foreignKey: 'test1Id'}
					}
					changeableInstance.relationsConfig = {}
					changeableInstance.db = {
						components: {
							testComponent2: {
								model: sequelize.define('test2Model', {
									name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
									description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
								}),
								dependencyMap: {associationKeys: []}
							}
						}
					}
					changeableInstance.searchFields = [
						{field: 'id'},
						{field: '$test2.name$'}
					]
					changeableInstance.associate()
					changeableInstance.mapRelations()
					yield sequelize.sync({force: true, transaction: t})
					yield instance.create(item, {transaction: t})
					yield changeableInstance.db.components.testComponent2.model.create(test2Item, {transaction: t})
					try {
						yield instance.delete({id: 1, additionalFilters: {'$test2.name$': 'test2Name'}, checkForRelatedModels: true, transaction: t})
					} catch(e) {
						if (e && (e.customMessage === 'Cannot delete a "test1Component" item that has related "test2" items in the database.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert.strictEqual(didThrowAnError, true, 'no error was thrown')
					return t.rollback()
				}))
			})
			it('should throw an error with the correct message if checkForRelatedModels is set to true and the item is system-critical', function() {
				return sequelize.transaction().then((t) => co(function*() {
					let item = {id: 1, name: 'test1Name', description: 'test1Description'},
						test2Item = {id: 1, test1Id: 1, name: 'test2Name', description: 'test2Description'},
						didThrowAnError = false
					changeableInstance.systemCriticalIds = [1]
					changeableInstance.componentName = 'test1Component'
					changeableInstance.model = sequelize.define('test1Model', {
						name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
						description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
					})
					changeableInstance.associationsConfig = {
						test2: {type: 'hasMany', componentName: 'testComponent2', foreignKey: 'test1Id'}
					}
					changeableInstance.relationsConfig = {}
					changeableInstance.db = {
						components: {
							testComponent2: {
								model: sequelize.define('test2Model', {
									name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
									description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
								}),
								dependencyMap: {associationKeys: []}
							}
						}
					}
					changeableInstance.associate()
					changeableInstance.mapRelations()
					yield sequelize.sync({force: true, transaction: t})
					yield instance.create(item, {transaction: t})
					yield changeableInstance.db.components.testComponent2.model.create(test2Item, {transaction: t})
					try {
						yield instance.delete({id: 1, checkForRelatedModels: true, transaction: t})
					} catch(e) {
						if (e && (e.customMessage === 'Cannot delete the "test1Component" item with id 1 - it is system-critical.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert.strictEqual(didThrowAnError, true, 'no error was thrown')
					return t.rollback()
				}))
			})
			it('should throw an error with the correct message if checkForRelatedModels is not set to true and the item is system-critical', function() {
				return sequelize.transaction().then((t) => co(function*() {
					let item = {id: 1, name: 'test1Name', description: 'test1Description'},
						didThrowAnError = false
					changeableInstance.systemCriticalIds = [1]
					changeableInstance.componentName = 'test1Component'
					changeableInstance.model = sequelize.define('test1Model', {
						name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
						description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
					})
					yield sequelize.sync({force: true, transaction: t})
					yield instance.create(item, {transaction: t})
					try {
						yield instance.delete({id: 1, transaction: t})
					} catch(e) {
						if (e && (e.customMessage === 'Cannot delete the "test1Component" item with id 1 - it is system-critical.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert.strictEqual(didThrowAnError, true, 'no error was thrown')
					return t.rollback()
				}))
			})
			it('should execute successfully delete a db entry correctly if all parameters are correct and no additionalFilters are provided', function() {
				return sequelize.transaction().then((t) => co(function*() {
					let item = {id: 1, name: 'test1Name', description: 'test1Description'},
						deletedCount = 0
					delete changeableInstance.systemCriticalIds
					changeableInstance.componentName = 'test1Component'
					changeableInstance.model = sequelize.define('test1Model', {
						name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
						description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
					})
					changeableInstance.associationsConfig = {}
					changeableInstance.relationsConfig = {}
					changeableInstance.db = {components: {}}
					changeableInstance.associate()
					changeableInstance.mapRelations()
					yield sequelize.sync({force: true, transaction: t})
					yield instance.create(item, {transaction: t})
					deletedCount = (yield instance.delete({id: 1, checkForRelatedModels: true, transaction: t})).deleted
					assert.strictEqual(deletedCount, 1, `bad value ${deletedCount} for deletedCount, expected 1`)
					return t.rollback()
				}))
			})
			it('should execute successfully delete a db entry correctly if all parameters are correct and additionalFilters are provided', function() {
				return sequelize.transaction().then((t) => co(function*() {
					let item = {id: 1, name: 'test1Name', description: 'test1Description'},
						deletedCount = 0
					delete changeableInstance.systemCriticalIds
					changeableInstance.componentName = 'test1Component'
					changeableInstance.model = sequelize.define('test1Model', {
							name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
							description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
						}, {
							paranoid: true
						}
					)
					changeableInstance.associationsConfig = {}
					changeableInstance.relationsConfig = {}
					changeableInstance.db = {components: {}}
					changeableInstance.associate()
					changeableInstance.mapRelations()
					yield sequelize.sync({force: true, transaction: t})
					yield instance.create(item, {transaction: t})
					deletedCount = (yield instance.delete({id: 1, additionalFilters: {id: 15, deletedAt: null}, checkForRelatedModels: true, transaction: t})).deleted
					assert.strictEqual(deletedCount, 1, `bad value ${deletedCount} for deletedCount, expected 1`)
					return t.rollback()
				}))
			})
		})
	}
}

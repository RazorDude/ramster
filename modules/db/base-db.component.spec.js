const
	assert = require('assert'),
	co = require('co'),
	fs = require('fs-extra'),
	moment = require('moment'),
	path = require('path')

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
			it('should execute testSetOrderDataForRelation successfully', function() {
				instance.testSetOrderDataForRelation()
			})
			it('should execute testParseDereferencedObjectValues successfully', function() {
				instance.testParseDereferencedObjectValues()
			})
			it('should execute testSetQueryDataForRelation successfully', function() {
				instance.testSetQueryDataForRelation()
			})
			it('should execute testGetRelationObjects successfully', function() {
				instance.testGetRelationObjects()
			})
			it('should execute testSaveImage successfully', function() {
				instance.testSaveImage()
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
			model = null
		describe('baseDBComponent.associate', function() {
			before(function() {
				changeableInstance.model = {
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
				}
				model = changeableInstance.model
				changeableInstance.db.components = {
					...changeableInstance.db.components,
					test1: {model: 'test1Model'},
					testComponent2: {model: 'testComponent2Model'},
					test3: {model: 'test3Model'},
					testComponent4: {model: 'testComponent4Model'},
					test5: {model: 'test5Model'},
					testComponent6: {model: 'testComponent6Model'},
					test7: {model: 'test7Model'},
					testComponent8: {model: 'testComponent8Model'}
				}
				return true
			})
			it('should execute successfully and leave everything blank if the component\'s associationConfig is not a non-null object', function() {
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
		let changeableInstance = this
		describe('baseDBComponent.mapNestedRelations', function() {
			before(function() {
				changeableInstance.db.components = {
					...changeableInstance.db.components,
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
			})
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
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', order: [[]]}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": "order" object with invalid length provided in the relation config at index 0.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an order object is povided in an association, but one of its inner items is not a string', function() {
				let didThrowAnError = false
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
			it('should throw an error with the correct message if an order object is povided in an association, but one of its items has an invalid number of args (should be 2)', function() {
				let didThrowAnError = false
				try {
					instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {test2: {}},
							dependencyMap: {}
						},
						[{associationName: 'test2', order: [['test']]}]
					)
				} catch(e) {
					if (e && (e.customMessage === 'At "test1" component, relation "test2": "order" object with invalid length provided in the relation config at index 0.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert.strictEqual(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if an include object is povided in an association, but it\'s not an array', function() {
				let didThrowAnError = false
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
			it('should execute successfully and return valid order and include arrays if all paramters are correct', function() {
				let {order, include} = instance.mapNestedRelations({
							componentName: 'test1',
							associationsConfig: {
								test2: {type: 'belongsTo', foreignKey: 'test2Id'},
								test3: {type: 'hasMany', componentName: 'testComponent3', foreignKey: 'test3Id'}
							},
							dependencyMap: {associationKeys: ['test2', 'test3']}
						}, [
							{associationName: 'test2', include: [{associationName: 'test5', required: true, attributes: ['id', 'name'], order: [['id', 'desc']]}]},
							{associationName: 'test3', where: {id: 3}, order: [['id', 'asc']]}
						]
					),
					topLevelMapShouldBe = [
						{model: 'test2Model', as: 'test2', required: false},
						{model: 'testComponent3Model', as: 'test3', required: false}
					],
					firstItemIncludeShouldBe = [
						{model: 'testComponent5Model', as: 'test5', required: true}
					]

				const firstItem = include[0],
					secondItem = include[1]
				for (const i in topLevelMapShouldBe) {
					const tlmItem = topLevelMapShouldBe[i],
						mapItem = include[i]
					for (const j in tlmItem) {
						assert.strictEqual(mapItem[j], tlmItem[j], `At item no. ${i}: bad property "${j}", set to ${mapItem[j]}, expected ${tlmItem}.`)
					}
				}
				for (const i in firstItemIncludeShouldBe) {
					const tlmItem = firstItemIncludeShouldBe[i],
						mapItem = firstItem.include[i]
					for (const j in tlmItem) {
						assert.strictEqual(mapItem[j], tlmItem[j], `At first item include item no. ${i}: bad property "${j}", set to ${mapItem[j]}, expected ${tlmItem[j]}.`)
					}
				}
				assert.strictEqual(firstItem.include[0].attributes[0], 'id', `Bad value ${firstItem.include[0].attributes[0]} for firstItem.include[0].attributes[0], expected id.`)
				assert.strictEqual(firstItem.include[0].attributes[1], 'name', `Bad value ${firstItem.include[0].attributes[1]} for firstItem.include[0].attributes[1], expected name.`)
				assert.strictEqual(secondItem.where.id, 3, `Bad value ${secondItem.where.id} for secondItem.where.id, expected 3.`)
				assert.strictEqual(order[0][0].model, 'test2Model', `Bad value ${order[0][0].model} for order[0][0].model, expected test2Model.`)
				assert.strictEqual(order[0][0].as, 'test2', `Bad value ${order[0][0].as} for order[0][0].as, expected test2.`)
				assert.strictEqual(order[0][1].model, 'testComponent5Model', `Bad value ${order[0][1].model} for order[0][1].model, expected testComponent5Model.`)
				assert.strictEqual(order[0][1].as, 'test5', `Bad value ${order[0][1].as} for order[0][1].as, expected test5.`)
				assert.strictEqual(order[0][2], 'id', `Bad value ${order[0][2]} for order[0][2], expected id.`)
				assert.strictEqual(order[0][3], 'desc', `Bad value ${order[0][3]} for firstItem.order[0][3], expected desc.`)
				assert.strictEqual(order[1][0].model, 'testComponent3Model', `Bad value ${order[1][0].model} for order[1][0].model, expected testComponent3Model.`)
				assert.strictEqual(order[1][0].as, 'test3', `Bad value ${order[1][0].as} for order[1][0].as, expected test3.`)
				assert.strictEqual(order[1][1], 'id', `Bad value ${order[1][1]} for order[1][1], expected id.`)
				assert.strictEqual(order[1][2], 'asc', `Bad value ${order[1][2]} for order[1][2], expected asc.`)
			})
		})
	},
	testMapRelations: function() {
		const instance = this
		let changeableInstance = this
		describe('baseDBComponent.mapRelations', function() {
			before(function() {
				changeableInstance.db.components = {
					...changeableInstance.db.components,
					test1: {model: 'test1Model'},
					testComponent2: {model: 'testComponent2Model'},
					test3: {model: 'test3Model'}
				}
			})
			it('should execute successfully and leave everything blank if the component\'s associationConfig is not a non-null object', function() {
				changeableInstance.relReadKeys = []
				changeableInstance.relations = {}
				changeableInstance.associationsConfig = {}
				changeableInstance.relationsConfig = {}
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
				instance.mapRelations()
				let keysAre = JSON.stringify(instance.relReadKeys),
					keysShouldBe = JSON.stringify(['test1', 'test2', 'test3', 'test3ButWithADiffreentAlias'])
				assert.strictEqual(keysAre, keysShouldBe, `Bad keys ${keysAre} for the instance.realReadKeys object. expected ${keysShouldBe}.`)
				for (const key in attributesShouldBe) {
					const reqItem = attributesShouldBe[key],
						relItem = instance.relations[key],
						relItemInclude = relItem.includeItem
					for (const innerKey in reqItem) {
						assert.strictEqual(relItemInclude[innerKey], reqItem[innerKey], `Bad value ${relItemInclude[innerKey]} for key "${innerKey}" in item "${key}", expected ${reqItem[innerKey]}.`)
					}
				}
				let test3RelationAttributes = instance.relations.test3.includeItem.attributes
				assert.strictEqual(test3RelationAttributes[0], 'id', `Bad value ${test3RelationAttributes[0]} for test3RelationAttributes[0], expected id.`)
				assert.strictEqual(test3RelationAttributes[1], 'name', `Bad value ${test3RelationAttributes[1]} for test3RelationAttributes[1], expected name.`)
				assert.strictEqual(instance.relations.test3ButWithADiffreentAlias.includeItem.where.id, 1, `Bad value ${instance.relations.test3ButWithADiffreentAlias.includeItem.where.id} for instance.relations.test3ButWithADiffreentAlias.includeItem.where.id, expected 1.`)
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
			it('should set the filter value correctly if the filter is of the "betweenFrom" range type and exactMatch is set for it in the field options', function() {
				let container = {}
				instance.setFilterValue(container, {betweenFrom: true, exactMatch: true}, 'testFieldFrom', 'testValue')
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
			it('should set the filter value correctly if the filter is of the "betweenTo" range type and exactMatch is set for it in the field options', function() {
				let container = {}
				instance.setFilterValue(container, {betweenTo: true, exactMatch: true}, 'testFieldTo', 'testValue')
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
					{field: '$testRelation.nestedName$'},
					{field: '$testRelation.innerTestRelation.nestedId$'},
					{field: '$testRelation.innerTestRelation.evenDeeperInnerTestRelation.nestedId$'},
					{field: '$testRelation2.nestedId$'},
					{field: '$testRelation2.nestedId2$'},
					{field: '$testRelation2.innerTestRelation2.evenDeeperInnerTestRelation2.nestedId2$'},
					{field: 'anotherString', like: '-%'}
				]
				let {where, requiredRelationsData} = instance.getWhereObjects({
							id: 3,
							someString: 'test1',
							'$testRelation.nestedName$': 'test',
							'$testRelation.innerTestRelation.nestedId$': 5,
							'$testRelation.innerTestRelation.evenDeeperInnerTestRelation.nestedId$': 16,
							'$testRelation2.nestedId$': 7,
							'$testRelation2.innerTestRelation2.evenDeeperInnerTestRelation2.nestedId2$': 25,
							anotherString: 'test2',
							$and: [{id: 15, someString: 'test2'}, {id: 16, someString: 'test3'}, {'$testRelation2.nestedId2$': 70}],
							$or: [{id: 15, someString: 'test2'}, {id: 16, someString: 'test3'}]
						},
						['anotherString']
					),
					requiredRelationsDataKeysLength = Object.keys(requiredRelationsData).length
				assert.strictEqual(where.id, 3, `bad value ${where.id} for where.id, expected 3`)
				assert.strictEqual(where.someString.$iLike, '%test1%', `bad value ${where.someString.$iLike} for where.someString.$iLike, expected %test1%`)
				assert.strictEqual(where.anotherString, 'test2', `bad value ${where.anotherString} for where.anotherString, expected test2`)
				assert.strictEqual(requiredRelationsDataKeysLength, 2, `bad value ${requiredRelationsDataKeysLength} for requiredRelationsDataKeysLength, expected 2`)
				assert.strictEqual(
					requiredRelationsData.testRelation.values.nestedName,
					'test',
					`bad value ${requiredRelationsData.testRelation.values.nestedName} for requiredRelationsData.testRelation.values.nestedName, expected "test"`
				)
				assert.strictEqual(
					requiredRelationsData.testRelation.children.innerTestRelation.values.nestedId,
					5,
					`bad value ${requiredRelationsData.testRelation.children.innerTestRelation.values.nestedId} for ` +
					`requiredRelationsData.testRelation.children.innerTestRelation.values.nestedId, expected 5`
				)
				assert.strictEqual(
					requiredRelationsData.testRelation.children.innerTestRelation.children.evenDeeperInnerTestRelation.values.nestedId,
					16,
					`bad value ${requiredRelationsData.testRelation.children.innerTestRelation.children.evenDeeperInnerTestRelation.values.nestedId} for ` +
					`requiredRelationsData.testRelation.children.innerTestRelation.children.evenDeeperInnerTestRelation.values.nestedId, expected 16`
				)
				assert.strictEqual(
					requiredRelationsData.testRelation2.values.nestedId,
					7,
					`bad value ${requiredRelationsData.testRelation2.values.nestedId} for requiredRelationsData.testRelation2.values.nestedId, expected 7`
				)
				assert.strictEqual(
					requiredRelationsData.testRelation2.values.nestedId2,
					70,
					`bad value ${requiredRelationsData.testRelation2.values.nestedId2} for requiredRelationsData.testRelation2.values.nestedId2, expected 70`
				)
				assert.strictEqual(
					requiredRelationsData.testRelation2.children.innerTestRelation2.children.evenDeeperInnerTestRelation2.values.nestedId2,
					25,
					`bad value ${requiredRelationsData.testRelation2.children.innerTestRelation2.children.evenDeeperInnerTestRelation2.values.nestedId2} for ` +
					`requiredRelationsData.testRelation2.children.innerTestRelation2.children.evenDeeperInnerTestRelation2.values.nestedId2, expected 25`
				)
			})
		})
	},
	testSetOrderDataForRelation: function() {
		const instance = this
		describe('baseDBComponent.setOrderDataForRelation', function() {
			it('should execute successfully and mutate the order and fieldMap objects correctly if all parameters are correct', function() {
				let fieldMap = {},
					order = []
				instance.setOrderDataForRelation(
					order, {
						model: new Date(),
						as: 'test1',
						order: [
							['id', 'desc'],
							[{model: new Date(), as: 'someDate'}, 'name', 'asc'],
							['id', 'asc']
						]
					},
					fieldMap
				)
				assert.strictEqual(order.length, 2, `bad value ${order.length} for order.length, expected 2`)
				assert(order[0][0].model instanceof Date, `bad value ${order[0][0].model} for order[0][0].model, expected an instance of Date`)
				assert.strictEqual(order[0][1], 'id', `bad value ${order[0][1]} for order[0][1], expected 'id'`)
				assert.strictEqual(order[0][2], 'asc', `bad value ${order[0][2]} for order[0][2], expected 'asc'`)
				assert(order[1][0].model instanceof Date, `bad value ${order[1][0].model} for order[1][0].model, expected an instance of Date`)
				assert.strictEqual(order[1][1], 'name', `bad value ${order[1][1]} for order[1][1], expected 'name'`)
				assert.strictEqual(order[1][2], 'asc', `bad value ${order[1][2]} for order[1][2], expected 'asc'`)
			})
		})
	},
	testParseDereferencedObjectValues: function() {
		const instance = this
		describe('baseDBComponent.parseDereferencedObjectValues', function() {
			it('should execute successfully and mutate the target object correctly if all parameters are correct', function() {
				let testModel = instance.db.sequelize.define('testModel_0')
				let sourceObject = {
						nullKey: null,
						numberKey: 1,
						booleanKey: true,
						stringKey: 'str',
						dateKey: new Date(),
						functionKey: () => {
							return true
						},
						sequelizeMethodKey: instance.db.sequelize.col('test'),
						sequelizeModelKey: testModel,
						nestedObject: {
							nullKey: null,
							numberKey: 1,
							booleanKey: true,
							stringKey: 'str',
							dateKey: new Date(),
							functionKey: () => {
								return true
							},
							sequelizeMethodKey: instance.db.sequelize.col('test'),
							sequelizeModelKey: testModel,
							nestedObjectArray: [{
									deeplyNestedObject: {
										nullKey: null,
										numberKey: 1,
										booleanKey: true,
										stringKey: 'str',
										dateKey: new Date(),
										functionKey: () => {
											return true
										},
										sequelizeMethodKey: instance.db.sequelize.col('test'),
										sequelizeModelKey: testModel
									}
								},
								1,
								15,
								false,
								[{test: 'test3'}]
							]
						}
					},
					targetObject = JSON.parse(JSON.stringify(sourceObject))
				instance.parseDereferencedObjectValues(sourceObject, targetObject)
				assert.strictEqual(targetObject.nullKey, null, `bad value ${targetObject.nullKey} for targetObject.nullKey, expected null`)
				assert.strictEqual(targetObject.numberKey, 1, `bad value ${targetObject.numberKey} for targetObject.numberKey, expected 1`)
				assert.strictEqual(targetObject.booleanKey, true, `bad value ${targetObject.booleanKey} for targetObject.booleanKey, expected true`)
				assert.strictEqual(targetObject.stringKey, 'str', `bad value ${targetObject.stringKey} for targetObject.stringKey, expected 'str'`)
				assert(targetObject.dateKey instanceof Date, `bad value ${targetObject.dateKey} for targetObject.dateKey, expected an instance of Date`)
				assert.strictEqual(
					typeof targetObject.functionKey,
					'function',
					`bad value ${targetObject.functionKey} for targetObject.functionKey, expected a function`
				)
				assert(
					targetObject.sequelizeMethodKey instanceof instance.db.Sequelize.Utils.SequelizeMethod,
					`bad value ${targetObject.sequelizeMethodKey} for targetObject.sequelizeMethodKey, expected an instance of instance.db.Sequelize.Utils.SequelizeMethod`
				)
				assert(
					typeof targetObject.sequelizeModelKey.sequelize !== 'undefined',
					`bad value ${targetObject.sequelizeModelKey} for targetObject.sequelizeModelKey, expected an instance of instance.db.Sequelize.Model`
				)

				assert.strictEqual(
					targetObject.nestedObject.nullKey,
					null,
					`bad value ${targetObject.nestedObject.nullKey} for targetObject.nestedObject.nullKey, expected null`
				)
				assert.strictEqual(
					targetObject.nestedObject.numberKey,
					1,
					`bad value ${targetObject.nestedObject.numberKey} for targetObject.nestedObject.numberKey, expected 1`
				)
				assert.strictEqual(
					targetObject.nestedObject.booleanKey,
					true,
					`bad value ${targetObject.nestedObject.booleanKey} for targetObject.nestedObject.booleanKey, expected true`
				)
				assert.strictEqual(
					targetObject.nestedObject.stringKey,
					'str',
					`bad value ${targetObject.nestedObject.stringKey} for targetObject.nestedObject.stringKey, expected 'str'`
				)
				assert(
					targetObject.nestedObject.dateKey instanceof Date,
					`bad value ${targetObject.nestedObject.dateKey} for targetObject.nestedObject.dateKey, expected an instance of Date`
				)
				assert(
					typeof targetObject.nestedObject.functionKey === 'function',
					`bad value ${targetObject.nestedObject.functionKey} for targetObject.nestedObject.functionKey, expected a function`
				)
				assert(
					targetObject.nestedObject.sequelizeMethodKey instanceof instance.db.Sequelize.Utils.SequelizeMethod,
					`bad value ${targetObject.nestedObject.sequelizeMethodKey} for targetObject.nestedObject.sequelizeMethodKey, expected an instance of instance.db.Sequelize.Utils.SequelizeMethod`
				)
				assert(
					typeof targetObject.nestedObject.sequelizeModelKey.sequelize !== 'undefined',
					`bad value ${targetObject.nestedObject.sequelizeModelKey} for targetObject.nestedObject.sequelizeModelKey, expected an instance of instance.db.Sequelize.Model`
				)

				assert.strictEqual(
					targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.nullKey,
					null,
					`bad value ${targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.nullKey} for targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.nullKey, expected null`
				)
				assert.strictEqual(
					targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.numberKey,
					1,
					`bad value ${targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.numberKey} for targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.numberKey, expected 1`
				)
				assert.strictEqual(
					targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.booleanKey,
					true,
					`bad value ${targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.booleanKey} for targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.booleanKey, expected true`
				)
				assert.strictEqual(
					targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.stringKey,
					'str',
					`bad value ${targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.stringKey} for targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.stringKey, expected 'str'`
				)
				assert(
					targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.dateKey instanceof Date,
					`bad value ${targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.dateKey} for targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.dateKey, expected an instance of Date`
				)
				assert(
					typeof targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.functionKey === 'function',
					`bad value ${targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.functionKey} for targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.functionKey, expected a function`
				)
				assert(
					targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.sequelizeMethodKey instanceof instance.db.Sequelize.Utils.SequelizeMethod,
					`bad value ${targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.sequelizeMethodKey} for targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.sequelizeMethodKey, expected an instance of instance.db.Sequelize.Utils.SequelizeMethod`
				)
				assert(
					typeof targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.sequelizeModelKey.sequelize !== 'undefined',
					`bad value ${targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.sequelizeModelKey} for targetObject.nestedObject.nestedObjectArray[0].deeplyNestedObject.sequelizeModelKey, expected an instance of instance.db.Sequelize.Model`
				)

				assert.strictEqual(
					targetObject.nestedObject.nestedObjectArray[1],
					1,
					`bad value ${targetObject.nestedObject.nestedObjectArray[1]} for targetObject.nestedObject.nestedObjectArray[1], expected 1`
				)
				assert.strictEqual(
					targetObject.nestedObject.nestedObjectArray[2],
					15,
					`bad value ${targetObject.nestedObject.nestedObjectArray[2]} for targetObject.nestedObject.nestedObjectArray[2], expected 15`
				)
				assert.strictEqual(
					targetObject.nestedObject.nestedObjectArray[3],
					false,
					`bad value ${targetObject.nestedObject.nestedObjectArray[3]} for targetObject.nestedObject.nestedObjectArray[3], expected false`
				)
				assert.strictEqual(
					targetObject.nestedObject.nestedObjectArray[4][0].test,
					'test3',
					`bad value ${targetObject.nestedObject.nestedObjectArray[4][0].test} for targetObject.nestedObject.nestedObjectArray[4][0].test, expected 'test3'`
				)
			})
		})
	},
	testSetQueryDataForRelation: function() {
		const instance = this
		let changeableInstance = this
		describe('baseDBComponent.setQueryDataForRelation', function() {
			before(function() {
				changeableInstance.db.components = {
					...changeableInstance.db.components,
					test1: {
						model: 'test1Model',
						componentName: 'test1',
						db: changeableInstance.db,
						dependencyMap: {associationKeys: ['test2', 'test3', 'test5']},
						associationsConfig: {
							test2: {type: 'hasMany', componentName: 'test2', foreignKey: 'test2Id'},
							test3: {type: 'belongsTo', foreignKey: 'test3Id'},
							test5: {type: 'belongsTo', foreignKey: 'test5Id'}
						},
						relations: {
							test2: {includeItem: {model: 'test2Model', as: 'test2'}, order: [['id', 'desc']]},
							test3: {includeItem: {model: 'test3Model', as: 'test3'}, order: [['id', 'desc']]},
							test5: {includeItem: {model: 'test5Model', as: 'test5'}, order: [['id', 'desc']]}
						}
					},
					test2: {
						model: 'test2Model',
						db: changeableInstance.db,
						componentName: 'test2',
						dependencyMap: {associationKeys: []},
						associationsConfig: {},
						relations: {}
					},
					test3: {
						model: 'test3Model',
						db: changeableInstance.db,
						componentName: 'test3',
						dependencyMap: {associationKeys: ['test4']},
						associationsConfig: {test4: {type: 'belongsTo', foreignKey: 'test4Id'}},
						relations: {
							test4: {includeItem: {model: 'test4Model', as: 'test4'}, order: [['id', 'desc']]}
						}
					},
					test4: {
						model: 'test4Model',
						db: changeableInstance.db,
						componentName: 'test4',
						dependencyMap: {associationKeys: []},
						associationsConfig: {},
						relations: {}
					},
					test5: {
						model: 'test5Model',
						db: changeableInstance.db,
						componentName: 'test5',
						dependencyMap: {associationKeys: []},
						associationsConfig: {},
						relations: {}
					}
				}
				changeableInstance.associationsConfig = {test1: {type: 'belongsTo', foreignKey: 'test1Id'}}
			})
			it('should execute successfully and mutate the include array and associationNameMap object if all parameters are correct', function() {
				let associationNameMap = {},
					include = []
				instance.setQueryDataForRelation(
					instance.db.components.test1,
					include,
					associationNameMap, {
						model: new Date(),
						as: 'test1',
						include: [
							{model: new Date(), as: 'test2'},
							{model: new Date(), as: 'test3', include: [{model: new Date(), as: 'test4'}]},
							{model: new Date(), as: 'test5'}
						]
					},
					'test1Relation',
					{test1Relation: {values: {name: 'testName'}, children: {test3: {values: {id: 1234}, children: {test4: {values: {id: 5}}}}}}}
				)
				assert.strictEqual(include.length, 1, `bad value ${include.length} for include.length, expected 1`)
				assert(include[0].model instanceof Date, `bad value ${include[0].model} for include[0].model, expected an instance of Date`)
				assert.strictEqual(include[0].required, true, `bad value ${include[0].required} for include[0].required, expected true`)
				assert.strictEqual(include[0].where.name, 'testName', `bad value ${include[0].where.name} for include[0].where.name, expected testName`)
				assert.strictEqual(include[0].include.length, 3, `bad value ${include[0].include.length} for include[0].include.length, expected 3`)
				assert(
					include[0].include[0].model instanceof Date,
					`bad value ${include[0].include[0].model} for include[0].include[0].model, expected an instance of Date`
				)
				assert.strictEqual(
					typeof include[0].include[0].required,
					'undefined',
					`bad value ${include[0].include[0].required} for include[0].include[0].required, expected undefined`
				)
				assert(
					include[0].include[1].model instanceof Date,
					`bad value ${include[0].include[1].model} for include[0].include[1].model, expected an instance of Date`
				)
				assert.strictEqual(
					include[0].include[1].required,
					true,
					`bad value ${include[0].include[1].required} for include[0].include[1].required, expected true`
				)
				assert.strictEqual(
					include[0].include[1].where.id,
					1234,
					`bad value ${include[0].include[1].where.id} for include[0].include[1].where.id, expected 1234`
				)
				assert(
					include[0].include[1].include[0].model instanceof Date,
					`bad value ${include[0].include[1].include[0].model} for include[0].include[1].include[0].model, expected an instance of Date`
				)
				assert.strictEqual(
					include[0].include[1].include[0].required,
					true,
					`bad value ${include[0].include[1].include[0].required} for include[0].include[1].include[0].required, expected true`
				)
				assert.strictEqual(
					include[0].include[1].include[0].where.id,
					5,
					`bad value ${include[0].include[1].include[0].where.id} for include[0].include[1].include[0].where.id, expected 5`
				)
				assert(
					include[0].include[2].model instanceof Date,
					`bad value ${include[0].include[2].model} for include[0].include[2].model, expected an instance of Date`
				)
				assert.strictEqual(
					typeof include[0].include[2].required,
					'undefined',
					`bad value ${include[0].include[2].required} for include[0].include[2].required, expected undefined`
				)
			})
		})
	},
	testGetRelationObjects: function() {
		const instance = this
		let changeableInstance = this
		describe('baseDBComponent.getRelationObjects', function() {
			before(function() {
				changeableInstance.db.components = {
					...changeableInstance.db.components,
					test1: {
						model: 'test1Model',
						componentName: 'test1',
						db: changeableInstance.db,
						dependencyMap: {associationKeys: []}
					},
					testComponent2: {
						model: 'testComponent2Model',
						componentName: 'testComponent2',
						db: changeableInstance.db,
						dependencyMap: {associationKeys: ['test3']},
						associationsConfig: {test3: {type: 'belongsTo', foreignKey: 'test3Id'}},
						relations: {
							test3: {includeItem: {model: 'test3Model', as: 'test3'}, order: [['id', 'desc']]}
						}
					},
					test3: {
						model: 'test3Model',
						componentName: 'test3',
						db: changeableInstance.db,
						dependencyMap: {associationKeys: ['test5']},
						associationsConfig: {test5: {type: 'belongsTo', foreignKey: 'test5Id'}},
						relations: {
							test5: {includeItem: {model: 'test5Model', as: 'test5'}, order: [['id', 'desc']]}
						}
					},
					test4: {
						model: 'test4Model',
						componentName: 'test4',
						db: changeableInstance.db,
						dependencyMap: {associationKeys: []}
					},
					test5: {
						model: 'test5Model',
						componentName: 'test5',
						db: changeableInstance.db,
						dependencyMap: {associationKeys: []},
						associationsConfig: {test6: {type: 'belongsTo', foreignKey: 'test6Id'}},
						relations: {
							test6: {includeItem: {model: 'test6Model', as: 'test6'}, order: [['id', 'desc']]}
						}
					},
					test6: {
						model: 'test6Model',
						componentName: 'test6',
						db: changeableInstance.db,
						dependencyMap: {associationKeys: []}
					}
				}
			})
			it('should execute successfully and return the correct include and order objects if all parameters are correct', function() {
				changeableInstance.searchFields = [
					{field: 'id'},
					{field: '$test1.name$'},
					{field: '$test2.test3.description$', like: '%-'},
					{field: '$test2.test3.test5.description$', like: '%-'}
				]
				changeableInstance.associationsConfig = {
					test1: {type: 'belongsTo', foreignKey: 'test1Id'},
					test2: {type: 'hasMany', componentName: 'testComponent2', foreignKey: 'test2Id'},
					test4: {type: 'belongsTo', foreignKey: 'test4Id'}
				}
				changeableInstance.relationsConfig = {
					test2: {order: [['id', 'asc']], include: [{associationName: 'test3'}]},
					test2ButWithADifferentAlias: {associationName: 'test2', where: {id: 1}}
				}
				changeableInstance.relReadKeys = []
				changeableInstance.relations = {}
				instance.mapRelations()
				let {requiredRelationsData} = instance.getWhereObjects({
						id: 3,
						'$test1.name$': 'testName',
						'$test2.test3.description$': 'testDescription',
						'$test2.test3.test5.description$': 'testInnerDescription'
					}),
					{include, order} = instance.getRelationObjects({test4: true, 'test2.test3.test5.test6': true}, requiredRelationsData),
					topLevelIncludeShouldBe = [
						{model: 'test1Model', as: 'test1', required: true},
						{model: 'testComponent2Model', as: 'test2', required: true},
						{model: 'test4Model', as: 'test4', required: undefined}
					]
				for (const i in include) {
					const includeItem = include[i],
						includeItemShouldBe = topLevelIncludeShouldBe[i]
					for (const j in includeItemShouldBe) {
						assert.strictEqual(includeItem[j], includeItemShouldBe[j],`Bad value ${includeItem[j]} for key "${j}" in include item no. ${i}, expected ${includeItemShouldBe[j]}.`)
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
				assert.strictEqual(
					firstIncludeItem.where.description.$iLike,
					'%testDescription',
					`Bad value ${firstIncludeItem.where.description.$iLike} for firstIncludeItem.where.description.$iLike, expected %testDescription.`
				)
				assert.strictEqual(
					firstIncludeItem.include[0].where.description.$iLike,
					'%testInnerDescription',
					`Bad value ${firstIncludeItem.include[0].where.description.$iLike} for firstIncludeItem.include[0].where.description.$iLike, expected %testInnerDescription.`
				)
				assert.strictEqual(
					firstIncludeItem.include[0].include[0].as,
					'test6',
					`Bad value ${firstIncludeItem.include[0].include[0].as} for firstIncludeItem.include[0].include[0].as, expected test6.`
				)
			})
		})
	},
	testSaveImage: function() {
		const instance = this,
			{componentName, db} = this,
			now = moment.utc().valueOf()
		let changeableInstance = this
		describe('baseDBComponent.saveImage', function() {
			before(function() {
				this.timeout(5000)
				return co(function*() {
					yield fs.copyFile(path.join(db.config.globalStoragePath, 'test/example.jpg'), path.join(db.config.globalUploadPath, `example_${now}.badExtension`))
					yield fs.copyFile(path.join(db.config.globalStoragePath, 'test/example.jpg'), path.join(db.config.globalUploadPath, `example_${now}.jpg`))
					yield fs.copyFile(path.join(db.config.globalStoragePath, 'test/example.jpg'), path.join(db.config.globalUploadPath, `example_${now}_2.jpg`))
					yield fs.copyFile(path.join(db.config.globalStoragePath, 'test/example.jpg'), path.join(db.config.globalUploadPath, `example_${now}_3.jpg`))
					yield fs.copyFile(path.join(db.config.globalStoragePath, 'test/example.jpeg'), path.join(db.config.globalUploadPath, `example_${now}.jpeg`))
					yield fs.copyFile(path.join(db.config.globalStoragePath, 'test/example.jpeg'), path.join(db.config.globalUploadPath, `example_${now}_2.jpeg`))
					yield fs.copyFile(path.join(db.config.globalStoragePath, 'test/example.jpeg'), path.join(db.config.globalUploadPath, `example_${now}_3.jpeg`))
					yield fs.copyFile(path.join(db.config.globalStoragePath, 'test/example.svg'), path.join(db.config.globalUploadPath, `example_${now}.svg`))
					yield fs.copyFile(path.join(db.config.globalStoragePath, 'test/example.svg'), path.join(db.config.globalUploadPath, `example_${now}_2.svg`))
					yield fs.copyFile(path.join(db.config.globalStoragePath, 'test/example.svg'), path.join(db.config.globalUploadPath, `example_${now}_3.svg`))
					yield fs.copyFile(path.join(db.config.globalStoragePath, 'test/example.png'), path.join(db.config.globalUploadPath, `example_${now}.png`))
					yield fs.copyFile(path.join(db.config.globalStoragePath, 'test/example.png'), path.join(db.config.globalUploadPath, `example_${now}_2.png`))
					yield fs.copyFile(path.join(db.config.globalStoragePath, 'test/example.png'), path.join(db.config.globalUploadPath, `example_${now}_3.png`))
					return true
				})
			})
			it('should throw an error with the correct message if no inputFileName is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.saveImage()
					} catch(e) {
						if (e && (e.customMessage === 'Invalid inputFileName provided. Please provide a non-empty string.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message the provided inputFileName is an empty string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.saveImage('')
					} catch(e) {
						if (e && (e.customMessage === 'Invalid inputFileName provided. Please provide a non-empty string.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if no outputFileName is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.saveImage(`suchAFileDoesntExist_${now}.png`)
					} catch(e) {
						if (e && (e.customMessage === 'Invalid outputFileName provided. Please provide a non-empty string.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if the provided outputFileName is an empty string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.saveImage(`suchAFileDoesntExist_${now}.png`, '')
					} catch(e) {
						if (e && (e.customMessage === 'Invalid outputFileName provided. Please provide a non-empty string.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if no dbObjectId is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.saveImage(`suchAFileDoesntExist_${now}.png`, 'ouput')
					} catch(e) {
						if (e && (e.customMessage === 'Invalid dbObjectId provided. Please provide a non-zero integer.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if the provided dbObjectId is not a number', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.saveImage(`suchAFileDoesntExist_${now}.png`, 'ouput', 'test')
					} catch(e) {
						if (e && (e.customMessage === 'Invalid dbObjectId provided. Please provide a non-zero integer.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if the provided dbObjectId is a number, but is less than 1', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.saveImage(`suchAFileDoesntExist_${now}.png`, 'ouput', -1)
					} catch(e) {
						if (e && (e.customMessage === 'Invalid dbObjectId provided. Please provide a non-zero integer.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if no file exists for the provided inputFileName', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.saveImage(`suchAFileDoesntExist_${now}.png`, 'ouput', 1)
					} catch(e) {
						if (e && (e.customMessage === 'Error saving the image file.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, true, 'no error thrown')
					return true
				})
			})
			it('should throw an error with the correct message if the file extension is invalid', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.saveImage(`example_${now}.badExtension`, 'ouput', 1)
					} catch(e) {
						if (e && (e.customMessage === 'Invalid or unsupported image file type ".badextension".')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, true, 'no error thrown')
					return true
				})
			})

			it('should execute successfully and save the image if it is a .png file and no resizing options are provided', function() {
				return co(function*() {
					yield instance.saveImage(`example_${now}.png`, 'ouput', 1)
					let stats = yield fs.lstat(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput.png`))
					yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput.png`))
					assert(stats.isFile())
					return true
				})
			})
			it('should execute successfully, convert the image to png and save it if it is a .jpg file and no resizing options are provided', function() {
				return co(function*() {
					yield instance.saveImage(`example_${now}.jpg`, 'ouput1', 1)
					let stats = yield fs.lstat(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput1.png`))
					yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput1.png`))
					assert(stats.isFile())
					return true
				})
			})
			it('should execute successfully, convert the image to png and save it if it is a .jpeg file and no resizing options are provided', function() {
				return co(function*() {
					yield instance.saveImage(`example_${now}.jpeg`, 'ouput2', 1)
					let stats = yield fs.lstat(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput2.png`))
					yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput2.png`))
					assert(stats.isFile())
					return true
				})
			})
			it('should execute successfully, convert the image to png and save it if it is an .svg file and no resizing options are provided', function() {
				return co(function*() {
					yield instance.saveImage(`example_${now}.svg`, 'ouput3', 1)
					let stats = yield fs.lstat(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput3.png`))
					yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput3.png`))
					assert(stats.isFile())
					return true
				})
			})

			it('should execute successfully and save the image if it is a .png file and resizing options are provided in the db config', function() {
				return co(function*() {
					changeableInstance.db.config.db.imageResizingOptions = [1024, 768, {fit: 'inside'}]
					yield instance.saveImage(`example_${now}_2.png`, 'ouput_rsz_dbconf', 1)
					let stats = yield fs.lstat(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput_rsz_dbconf.png`))
					yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput_rsz_dbconf.png`))
					assert(stats.isFile())
					return true
				})
			})
			it('should execute successfully, convert the image to png and save it if it is a .jpg file and resizing options are provided in the db config', function() {
				return co(function*() {
					yield instance.saveImage(`example_${now}_2.jpg`, 'ouput_rsz_dbconf1', 1)
					let stats = yield fs.lstat(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput_rsz_dbconf1.png`))
					yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput_rsz_dbconf1.png`))
					assert(stats.isFile())
					return true
				})
			})
			it('should execute successfully, convert the image to png and save it if it is a .jpeg file and resizing options are provided in the db config', function() {
				return co(function*() {
					yield instance.saveImage(`example_${now}_2.jpeg`, 'ouput_rsz_dbconf2', 1)
					let stats = yield fs.lstat(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput_rsz_dbconf2.png`))
					yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput_rsz_dbconf2.png`))
					assert(stats.isFile())
					return true
				})
			})
			it('should execute successfully, convert the image to png and save it if it is an .svg file and resizing options are provided in the db config', function() {
				return co(function*() {
					yield instance.saveImage(`example_${now}_2.svg`, 'ouput_rsz_dbconf3', 1)
					let stats = yield fs.lstat(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput_rsz_dbconf3.png`))
					yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput_rsz_dbconf3.png`))
					assert(stats.isFile())
					return true
				})
			})

			it('should execute successfully and save the image if it is a .png file and resizing options are provided in the component config', function() {
				return co(function*() {
					delete changeableInstance.db.config.db.imageResizingOptions
					changeableInstance.imageResizingOptions = [1024, 768, {fit: 'inside'}]
					yield instance.saveImage(`example_${now}_3.png`, 'ouput_rsz_cmpconf', 1)
					let stats = yield fs.lstat(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput_rsz_cmpconf.png`))
					yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput_rsz_cmpconf.png`))
					assert(stats.isFile())
					return true
				})
			})
			it('should execute successfully, convert the image to png and save it if it is a .jpg file and resizing options are provided in the component properties', function() {
				return co(function*() {
					yield instance.saveImage(`example_${now}_3.jpg`, 'ouput_rsz_cmpconf1', 1)
					let stats = yield fs.lstat(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput_rsz_cmpconf1.png`))
					yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput_rsz_cmpconf1.png`))
					assert(stats.isFile())
					return true
				})
			})
			it('should execute successfully, convert the image to png and save it if it is a .jpeg file and resizing options are provided in the component properties', function() {
				return co(function*() {
					yield instance.saveImage(`example_${now}_3.jpeg`, 'ouput_rsz_cmpconf2', 1)
					let stats = yield fs.lstat(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput_rsz_cmpconf2.png`))
					yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput_rsz_cmpconf2.png`))
					assert(stats.isFile())
					return true
				})
			})
			it('should execute successfully, convert the image to png and save it if it is an .svg file and resizing options are provided in the component properties', function() {
				return co(function*() {
					yield instance.saveImage(`example_${now}_3.svg`, 'ouput_rsz_cmpconf3', 1)
					let stats = yield fs.lstat(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput_rsz_cmpconf3.png`))
					yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}/1/ouput_rsz_cmpconf3.png`))
					assert(stats.isFile())
					return true
				})
			})
			after(function() {
				return co(function*() {
					delete changeableInstance.imageResizingOptions
					yield fs.remove(path.join(db.config.globalUploadPath, `example_${now}.badExtension`))
					return true
				})
			})
		})
	},
	testCreate: function() {
		const instance = this,
			{componentName, db} = this
		let changeableInstance = this,
			now = moment.utc().valueOf()
		describe('baseDBComponent.create', function() {
			before(function() {
				this.timeout(5000)
				return co(function*() {
					changeableInstance.searchFields = [
						{field: 'id'},
						{field: '$test2.name$'},
						{field: '$test2.test3.description$'}
					]
					changeableInstance.associationsConfig = {
						test2: {type: 'belongsTo', componentName: 'testComponent2', foreignKey: 'test2Id'},
						test4: {type: 'hasMany', foreignKey: 'test1Id'}
					}
					changeableInstance.relationsConfig = {
						test2: {order: [['id', 'asc']], include: [{associationName: 'test3'}]}
					}
					changeableInstance.model = db.sequelize.define('test1Model', {
							name: {type: db.Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
							description: {type: db.Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
						}, {
							setterMethods: {
								id: () => {}
							}
						}
					)
					changeableInstance.allowedUpdateFields = ['testId', 'name', 'description', 'active']
					changeableInstance.systemCriticalIds = [1]
					changeableInstance.db.components = {
						...changeableInstance.db.components,
						testComponent2: {
							model: db.sequelize.define('test2Model', {
									name: {type: db.Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
									description: {type: db.Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
								}, {
									setterMethods: {
										id: () => {}
									}
								}
							),
							associationsConfig: {test3: {type: 'belongsTo', foreignKey: 'test3Id'}},
							dependencyMap: {associationKeys: ['test3']}
						},
						test3: {
							model: db.sequelize.define('test3Model', {
									name: {type: db.Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
									description: {type: db.Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
								}, {
									setterMethods: {
										id: () => {}
									}
								}
							),
							associationsConfig: {test2: {type: 'hasMany', componentName: 'testComponent2', foreignKey: 'test3Id'}},
							dependencyMap: {associationKeys: ['test2']}
						},
						test4: {
							model: db.sequelize.define('test4Model', {
									name: {type: db.Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
									description: {type: db.Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
								}, {
									setterMethods: {
										id: () => {}
									}
								}
							),
							associationsConfig: {test1: {type: 'belongsTo', foreignKey: 'test1Id'}},
							dependencyMap: {associationKeys: ['test1']}
						}
					}
					changeableInstance.associate()
					changeableInstance.db.components.testComponent2.model.belongsTo(changeableInstance.db.components.test3.model, {as: 'test3', foreignKey: 'test3Id'})
					changeableInstance.db.components.test4.model.belongsTo(changeableInstance.model, {as: 'test1', foreignKey: 'test1Id'})
					changeableInstance.mapRelations()
					yield db.sequelize.sync({force: true})
					yield fs.copyFile(path.join(db.config.globalStoragePath, 'test/example.png'), path.join(db.config.globalUploadPath, `avatarForUpload_${now}.png`))
					yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}`))
					return true
				})
			})
			it('should execute successfully and create a new db entry correctly if all parameters are correct and no image data is provided', function() {
				return co(function*() {
					let item = {id: 10, name: 'testName1', description: 'testDescription1'},
						createdItem = yield instance.create(item)
					item.id = 1
					for (const i in item) {
						assert.strictEqual(createdItem[i], item[i], `Bad value ${createdItem[i]} for field "${i}", expected ${item[i]}.`)
					}
				})
			})
			it('should execute successfully, create the dbObject and save the provided image file, if all parameters are correct and image data is provided', function() {
				return co(function*() {
					let item = {id: 10, name: 'testName2', description: 'testDescription2'},
						createdItem = yield instance.create({inputImageFileName: `avatarForUpload_${now}.png`, outputImageFileName: 'avatar', ...item})
					item.id = 2
					for (const i in item) {
						assert.strictEqual(createdItem[i], item[i], `Bad value ${createdItem[i]} for field "${i}", expected ${item[i]}.`)
					}
					let stats = yield fs.lstat(path.join(db.config.globalStoragePath, `images/${componentName}/${createdItem.id}/avatar.png`))
					assert.strictEqual(stats.isFile(), true, 'expected the output to be saved as a png file, got undefined')
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield db.components.test4.model.create({test1Id: 2, name: 'test4Name', description: 'test4Description'})
					yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}`))
					return true
				})
			})
		})
	},
	testBulkCreate: function() {
		const instance = this
		describe('baseDBComponent.bulkCreate', function() {
			it('should execute successfully and create the new db entries correctly if all parameters are correct', function() {
				return co(function*() {
					let items = [{id: 10, name: 'testName3', description: 'testDescription3'}, {id: 10, name: 'testName4', description: 'testDescription4'}]
					yield instance.bulkCreate(items)
					items[0].id = 3
					items[1].id = 4
					let createdItems = yield instance.model.findAll({where: {id: {$not: [1, 2]}}})
					assert.strictEqual(createdItems.length, 2, `Bad value ${createdItems.length} for createdItems.length, expected ${2}.`)
					for (const i in items) {
						const item = items[i],
							createdItem = createdItems[i].dataValues
						for (const j in item) {
							assert.strictEqual(createdItem[j], item[j], `Bad value ${createdItem[j]} for field "${j}" for item no. ${i}, expected ${item[j]}.`)
						}
					}
					return true
				})
			})
		})
	},
	testRead: function() {
		const instance = this
		describe('baseDBComponent.read', function() {
			it('should throw an error with the correct message if no filters are provided', function() {
				return co(function*() {
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
					let dbComponents = instance.db.components
					for (const componentName in dbComponents) {
						let dbComponent = dbComponents[componentName]
						if (!dbComponent.componentName) {
							dbComponent.componentName = componentName
						}
						if (!dbComponent.db) {
							dbComponent.db = instance.db 
						}
					}
					return true
				})
			})
			it('should execute successfully and read a db entry correctly if all parameters are correct', function() {
				return co(function*() {
					let item = {id: 1, test2Id: 1, name: 'testName1', description: 'testDescription1'},
						test2Item = {id: 1, test3Id: 1, name: 'test2Name', description: 'test2Description'},
						test3Item = {id: 1, name: 'test3Name', description: 'test3Description'}
					yield instance.db.components.test3.model.create(test3Item)
					yield instance.db.components.testComponent2.model.create(test2Item)
					yield instance.model.update({test2Id: 1}, {where: {id: 1}})
					let createdItem = (yield instance.read({
							filters: {
								id: 1,
								'$test2.name$': 'test2Name',
								'$test2.test3.description$': 'test3Description',
								$and: [{id: [1,2,3,4]}, {$or: {'$test2.name$': 'test2Name'}}],
							}
						})).dataValues,
						createdTest2Item = createdItem.test2.dataValues,
						createdTest3Item = createdTest2Item.test3.dataValues
					for (const i in item) {
						assert.strictEqual(createdItem[i], item[i], `Bad value ${createdItem[i]} for field "${i}" for the main item, expected ${item[i]}.`)
					}
					for (const i in test2Item) {
						assert.strictEqual(createdTest2Item[i], test2Item[i], `Bad value ${createdTest2Item[i]} for field "${i}" for the test2Item, expected ${test2Item[i]}.`)
					}
					for (const i in test3Item) {
						assert.strictEqual(createdTest3Item[i], test3Item[i], `Bad value ${createdTest3Item[i]} for field "${i}" for the test3Item, expected ${test3Item[i]}.`)
					}
					return true
				})
			})
		})
	},
	testReadList: function() {
		const instance = this
		describe('baseDBComponent.readList', function() {
			it('should execute successfully and read a list of db entries correctly if all parameters are correct, there are no relReadKeys, no filters from associations and it is the first of one', function() {
				return co(function*() {
					let items = [
						{id: 3, test2Id: 1, name: 'testName3', description: 'testDescription3'},
						{id: 2, test2Id: 1, name: 'testName2', description: 'testDescription2'}
					]
					yield instance.model.update({test2Id: 1}, {where: {id: [1, 2, 3]}})
					let data = yield instance.readList({
						filters: {
							id: [2, 3]
						},
						page: 1,
						perPage: 9,
						orderDirection: 'desc'
					})
					assert.strictEqual(data.results.length, 2, `Bad value ${data.results.length} for data.results.length, expected 2.`)
					for (const index in data.results) {
						let item = items[index],
							dataItem = data.results[index].dataValues
						for (const i in item) {
							assert.strictEqual(dataItem[i],
								item[i],
								`Bad value '${dataItem[i]}' for field "${i}" for the item, index ${index}, expected ${item[i]}.`
							)
						}
					}
					assert.strictEqual(data.page, 1, `Bad value ${data.page} for data.page, expected 1.`)
					assert.strictEqual(data.perPage, 9, `Bad value ${data.perPage} for data.perPage, expected 9.`)
					assert.strictEqual(data.totalPages, 1, `Bad value ${data.totalPages} for data.totalPages, expected 1.`)
					assert.strictEqual(data.more, false, `Bad value ${data.more} for data.more, expected false.`)
					return true
				})
			})
			it('should execute successfully and read a list of db entries correctly if all parameters are correct, there are no relReadKeys, no filters from associations and it is the first page of many', function() {
				return co(function*() {
					let items = [
						{id: 3, test2Id: 1, name: 'testName3', description: 'testDescription3'},
						{id: 2, test2Id: 1, name: 'testName2', description: 'testDescription2'}
					]
					let data = yield instance.readList({
						filters: {
							id: [1, 2, 3]
						},
						page: 1,
						perPage: 2,
						orderDirection: 'desc'
					})
					assert.strictEqual(data.results.length, 2, `Bad value ${data.results.length} for data.results.length, expected 2.`)
					for (const index in data.results) {
						let item = items[index],
							dataItem = data.results[index].dataValues
						for (const i in item) {
							assert.strictEqual(dataItem[i],
								item[i],
								`Bad value '${dataItem[i]}' for field "${i}" for the item, index ${index}, expected ${item[i]}.`
							)
						}
					}
					assert.strictEqual(data.page, 1, `Bad value ${data.page} for data.page, expected 1.`)
					assert.strictEqual(data.perPage, 2, `Bad value ${data.perPage} for data.perPage, expected 2.`)
					assert.strictEqual(data.totalPages, 2, `Bad value ${data.totalPages} for data.totalPages, expected 2.`)
					assert.strictEqual(data.more, true, `Bad value ${data.more} for data.more, expected true.`)
					return true
				})
			})
			it('should execute successfully and read a list of db entries correctly if all parameters are correct, there are no relReadKeys, no filters from associations and it is the second page of many', function() {
				return co(function*() {
					let items = [
						{id: 1, test2Id: 1, name: 'testName1', description: 'testDescription1'}
					]
					let data = yield instance.readList({
						filters: {
							id: [1, 2, 3]
						},
						page: 2,
						perPage: 2,
						orderDirection: 'desc'
					})
					assert.strictEqual(data.results.length, 1, `Bad value ${data.results.length} for data.results.length, expected 1.`)
					for (const index in data.results) {
						let item = items[index],
							dataItem = data.results[index].dataValues
						for (const i in item) {
							assert.strictEqual(dataItem[i],
								item[i],
								`Bad value '${dataItem[i]}' for field "${i}" for the item, index ${index}, expected ${item[i]}.`
							)
						}
					}
					assert.strictEqual(data.page, 2, `Bad value ${data.page} for data.page, expected 2.`)
					assert.strictEqual(data.perPage, 2, `Bad value ${data.perPage} for data.perPage, expected 2.`)
					assert.strictEqual(data.totalPages, 2, `Bad value ${data.totalPages} for data.totalPages, expected 2.`)
					assert.strictEqual(data.more, false, `Bad value ${data.more} for data.more, expected false.`)
					return true
				})
			})
			it('should execute successfully and read a list of db entries correctly if all parameters are correct and there are no relReadKeys, but there are filters from associations', function() {
				return co(function*() {
					let items = [
							{id: 2, test2Id: 1, name: 'testName2', description: 'testDescription2'},
							{id: 3, test2Id: 1, name: 'testName3', description: 'testDescription3'}
						],
						test2Item = {id: 1, test3Id: 1, name: 'test2Name', description: 'test2Description'},
						test3Item = {id: 1, name: 'test3Name', description: 'test3Description'}
					yield instance.model.update({test2Id: null}, {where: {id: 1}})
					yield instance.model.update({test2Id: 1}, {where: {id: [2, 3]}})
					let data = yield instance.readList({
						filters: {
							id: [1, 2, 3],
							'$test2.test3.description$': {$or: ['test2Description', 'test3Description']}
						},
						orderDirection: 'asc'
					})
					assert.strictEqual(data.results.length, 2, `Bad value ${data.results.length} for data.results.length, expected 2.`)
					for (const index in data.results) {
						let item = items[index],
							dataItem = data.results[index].dataValues,
							dataTest2Item = dataItem.test2.dataValues,
							dataTest3Item = dataTest2Item.test3.dataValues
						for (const i in item) {
							assert.strictEqual(dataItem[i],
								item[i],
								`Bad value '${dataItem[i]}' for field "${i}" for the item, index ${index}, expected ${item[i]}.`
							)
						}
						for (const i in test2Item) {
							assert.strictEqual(dataTest2Item[i],
								test2Item[i],
								`Bad value '${dataTest2Item[i]}' for field "${i}" for the test2Item, index ${index}, expected ${test2Item[i]}.`
							)
						}
						for (const i in test3Item) {
							assert.strictEqual(dataTest3Item[i],
								test3Item[i],
								`Bad value '${dataTest3Item[i]}' for field "${i}" for the test3Item, index ${index}, expected ${test3Item[i]}.`
							)
						}
					}
					assert.strictEqual(data.page, 1, `Bad value ${data.page} for data.page, expected 1.`)
					assert.strictEqual(data.perPage, 10, `Bad value ${data.perPage} for data.perPage, expected 10.`)
					assert.strictEqual(data.totalPages, 1, `Bad value ${data.totalPages} for data.totalPages, expected 1.`)
					assert.strictEqual(data.more, false, `Bad value ${data.more} for data.more, expected false.`)
					return true
				})
			})
			it('should execute successfully and read a list of db entries correctly if all parameters are correct and there are relReadKeys', function() {
				return co(function*() {
					let items = [
							{id: 1, test2Id: 1, name: 'testName1', description: 'testDescription1'},
							{id: 2, test2Id: 1, name: 'testName2', description: 'testDescription2'},
							{id: 3, test2Id: 1, name: 'testName3', description: 'testDescription3'}
						],
						test2Item = {id: 1, test3Id: 1, name: 'test2Name', description: 'test2Description'},
						test3Item = {id: 1, name: 'test3Name', description: 'test3Description'}
					yield instance.model.update({test2Id: 1}, {where: {id: 1}})
					let data = yield instance.readList({
						filters: {
							id: [1, 2, 3]
						},
						relReadKeys: {test2: true},
						orderDirection: 'asc'
					})
					assert.strictEqual(data.results.length, 3, `Bad value ${data.results.length} for data.results.length, expected 3.`)
					for (const index in data.results) {
						let item = items[index],
							dataItem = data.results[index].dataValues,
							dataTest2Item = dataItem.test2.dataValues,
							dataTest3Item = dataTest2Item.test3.dataValues
						for (const i in item) {
							assert.strictEqual(dataItem[i],
								item[i],
								`Bad value '${dataItem[i]}' for field "${i}" for the main item, index ${index}, expected ${item[i]}.`
							)
						}
						for (const i in test2Item) {
							assert.strictEqual(dataTest2Item[i],
								test2Item[i],
								`Bad value '${dataTest2Item[i]}' for field "${i}" for the main test2Item, index ${index}, expected ${test2Item[i]}.`
							)
						}
						for (const i in test3Item) {
							assert.strictEqual(dataTest3Item[i],
								test3Item[i],
								`Bad value '${dataTest3Item[i]}' for field "${i}" for the main test3Item, index ${index}, expected ${test3Item[i]}.`
							)
						}
					}
					assert.strictEqual(data.page, 1, `Bad value ${data.page} for data.page, expected 1.`)
					assert.strictEqual(data.perPage, 10, `Bad value ${data.perPage} for data.perPage, expected 10.`)
					assert.strictEqual(data.totalPages, 1, `Bad value ${data.totalPages} for data.totalPages, expected 1.`)
					assert.strictEqual(data.more, false, `Bad value ${data.more} for data.more, expected false.`)
					return true
				})
			})
			it('should execute successfully and read a list of db entries correctly if all parameters are correct, there are relReadKeys, no filters from associations and it is the first of one', function() {
				return co(function*() {
					let items = [
						{id: 3, test2Id: 1, name: 'testName3', description: 'testDescription3'},
						{id: 2, test2Id: 1, name: 'testName2', description: 'testDescription2'}
					]
					yield instance.model.update({test2Id: 1}, {where: {id: [1, 2, 3]}})
					let data = yield instance.readList({
						filters: {
							id: [2, 3]
						},
						page: 1,
						perPage: 9,
						orderDirection: 'desc',
						relReadKeys: {test2: true}
					})
					assert.strictEqual(data.results.length, 2, `Bad value ${data.results.length} for data.results.length, expected 2.`)
					for (const index in data.results) {
						let item = items[index],
							dataItem = data.results[index].dataValues
						for (const i in item) {
							assert.strictEqual(dataItem[i],
								item[i],
								`Bad value '${dataItem[i]}' for field "${i}" for the item, index ${index}, expected ${item[i]}.`
							)
						}
					}
					assert.strictEqual(data.page, 1, `Bad value ${data.page} for data.page, expected 1.`)
					assert.strictEqual(data.perPage, 9, `Bad value ${data.perPage} for data.perPage, expected 9.`)
					assert.strictEqual(data.totalPages, 1, `Bad value ${data.totalPages} for data.totalPages, expected 1.`)
					assert.strictEqual(data.more, false, `Bad value ${data.more} for data.more, expected false.`)
					return true
				})
			})
			it('should execute successfully and read a list of db entries correctly if all parameters are correct, there are relReadKeys, no filters from associations and it is the first page of many', function() {
				return co(function*() {
					let items = [
						{id: 3, test2Id: 1, name: 'testName3', description: 'testDescription3'},
						{id: 2, test2Id: 1, name: 'testName2', description: 'testDescription2'}
					]
					let data = yield instance.readList({
						filters: {
							id: [1, 2, 3]
						},
						page: 1,
						perPage: 2,
						orderDirection: 'desc',
						relReadKeys: {test2: true}
					})
					assert.strictEqual(data.results.length, 2, `Bad value ${data.results.length} for data.results.length, expected 2.`)
					for (const index in data.results) {
						let item = items[index],
							dataItem = data.results[index].dataValues
						for (const i in item) {
							assert.strictEqual(dataItem[i],
								item[i],
								`Bad value '${dataItem[i]}' for field "${i}" for the item, index ${index}, expected ${item[i]}.`
							)
						}
					}
					assert.strictEqual(data.page, 1, `Bad value ${data.page} for data.page, expected 1.`)
					assert.strictEqual(data.perPage, 2, `Bad value ${data.perPage} for data.perPage, expected 2.`)
					assert.strictEqual(data.totalPages, 2, `Bad value ${data.totalPages} for data.totalPages, expected 2.`)
					assert.strictEqual(data.more, true, `Bad value ${data.more} for data.more, expected true.`)
					return true
				})
			})
			it('should execute successfully and read a list of db entries correctly if all parameters are correct, there are relReadKeys, no filters from associations and it is the second page of many', function() {
				return co(function*() {
					let items = [
						{id: 1, test2Id: 1, name: 'testName1', description: 'testDescription1'}
					]
					let data = yield instance.readList({
						filters: {
							id: [1, 2, 3]
						},
						page: 2,
						perPage: 2,
						orderDirection: 'desc',
						relReadKeys: {test2: true}
					})
					assert.strictEqual(data.results.length, 1, `Bad value ${data.results.length} for data.results.length, expected 1.`)
					for (const index in data.results) {
						let item = items[index],
							dataItem = data.results[index].dataValues
						for (const i in item) {
							assert.strictEqual(dataItem[i],
								item[i],
								`Bad value '${dataItem[i]}' for field "${i}" for the item, index ${index}, expected ${item[i]}.`
							)
						}
					}
					assert.strictEqual(data.page, 2, `Bad value ${data.page} for data.page, expected 2.`)
					assert.strictEqual(data.perPage, 2, `Bad value ${data.perPage} for data.perPage, expected 2.`)
					assert.strictEqual(data.totalPages, 2, `Bad value ${data.totalPages} for data.totalPages, expected 2.`)
					assert.strictEqual(data.more, false, `Bad value ${data.more} for data.more, expected false.`)
					return true
				})
			})
		})
	},
	testUpdate: function() {
		const instance = this,
			{componentName, db} = this
		let now = moment.utc().valueOf()
		describe('baseDBComponent.update', function() {
			before(function() {
				this.timeout(5000)
				return co(function*() {
					yield fs.copyFile(path.join(db.config.globalStoragePath, 'test/example.png'), path.join(db.config.globalUploadPath, `avatarForUpload_${now}.png`))
					yield fs.remove(path.join(db.config.globalStoragePath, `images/${componentName}`))
					return true
				})
			})
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
			it('should execute successfully and update the db entry correctly if all parameters are correct and no image data is provided', function() {
				return co(function*() {
					const item = {name: 'testNameUpdated', description: 'testDescriptionUpdated'},
						updatedItems = yield instance.update({dbObject: item, filters: {id: 3}})
					assert.strictEqual(updatedItems[0], 1, `Bad value ${updatedItems[0]} for updatedItems[0], expected 1.`)
					assert.strictEqual(updatedItems[1].length, 1, `Bad value ${updatedItems[1].length} for updatedItems[1].length, expected 1.`)
					const updatedItem = updatedItems[1][0]
					for (const i in item) {
						assert.strictEqual(updatedItem[i], item[i], `Bad value ${updatedItem[i]} for field "${i}", expected ${item[i]}.`)
					}
					return true
				})
			})
			it('should execute successfully, update the db entry correctly and save the image file if all parameters are correct and correct image data is provided', function() {
				return co(function*() {
					const item = {name: 'testNameUpdated2', description: 'testDescriptionUpdated2'},
						updatedItems = yield instance.update({dbObject: {inputImageFileName: `avatarForUpload_${now}.png`, outputImageFileName: 'avatar', ...item}, filters: {id: 3}})
					assert.strictEqual(updatedItems[0], 1, `Bad value ${updatedItems[0]} for updatedItems[0], expected 1.`)
					assert.strictEqual(updatedItems[1].length, 1, `Bad value ${updatedItems[1].length} for updatedItems[1].length, expected 1.`)
					const updatedItem = updatedItems[1][0]
					for (const i in item) {
						assert.strictEqual(updatedItem[i], item[i], `Bad value ${updatedItem[i]} for field "${i}", expected ${item[i]}.`)
					}
					let stats = yield fs.lstat(path.join(db.config.globalStoragePath, `images/${componentName}/${updatedItem.id}/avatar.png`))
					assert.strictEqual(stats.isFile(), true, 'expected the output to be saved as a png file, got undefined')
					return true
				})
			})
		})
	},
	testBulkUpsert: function() {
		const instance = this
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
				return co(function*() {
					let items = [
						{name: 'testName5Created', description: 'testDescription5Created'},
						{id: 4, name: 'testName4Updated', description: 'testDescription4Updated'},
						{id: 3, name: 'testName3Updated', description: 'testDescription3Updated'}
					]
					yield instance.bulkUpsert(items, {additionalCreateFields: {test2Id: 1}, updateFilters: {deletedAt: null}})
					let updatedItems = yield instance.model.findAll({order: [['id', 'desc']], limit: 3})
					items[0].id = 5
					items[0].test2Id = 1
					for (const index in updatedItems) {
						const updatedItem = updatedItems[index].dataValues,
							item = items[index]
						for (const i in item) {
							assert.strictEqual(updatedItem[i], item[i], `Bad value ${updatedItem[i]} for field "${i}" in item no. ${index}, expected ${item[i]}.`)
						}
					}
					return true
				})
			})
		})
	},
	testDelete: function() {
		const instance = this
		describe('baseDBComponent.delete', function() {
			it('should throw an error with the correct message if checkForRelatedModels is set to true and an item has dependent items', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.delete({id: 2, additionalFilters: {'$test4.name$': 'test4Name'}, checkForRelatedModels: true})
					} catch(e) {
						if (e && (e.customMessage === 'Cannot delete a "testComponent" item that has related "test4" items in the database.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert.strictEqual(didThrowAnError, true, 'no error was thrown')
					return true
				})
			})
			it('should throw an error with the correct message if checkForRelatedModels is set to true and the item is system-critical', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.delete({id: 1, checkForRelatedModels: true})
					} catch(e) {
						if (e && (e.customMessage === 'Cannot delete the "testComponent" item with id 1 - it is system-critical.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert.strictEqual(didThrowAnError, true, 'no error was thrown')
					return true
				})
			})
			it('should throw an error with the correct message if checkForRelatedModels is not set to true and the item is system-critical', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.delete({id: 1})
					} catch(e) {
						if (e && (e.customMessage === 'Cannot delete the "testComponent" item with id 1 - it is system-critical.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert.strictEqual(didThrowAnError, true, 'no error was thrown')
					return true
				})
			})
			it('should execute successfully delete a db entry correctly if all parameters are correct, no additionalFilters are provided and none of them have images', function() {
				return co(function*() {
					let deletedCount = (yield instance.delete({id: 3, checkForRelatedModels: true})).deleted
					assert.strictEqual(deletedCount, 1, `bad value ${deletedCount} for deletedCount, expected 1`)
					return true
				})
			})
			it('should execute successfully delete a db entry correctly if all parameters are correct, additionalFilters are provided and some of them have images', function() {
				return co(function*() {
					let deletedCount = (yield instance.delete({id: 4, additionalFilters: {id: 15, deletedAt: null}, checkForRelatedModels: true})).deleted,
						didThrowAnError = true
					assert.strictEqual(deletedCount, 1, `bad value ${deletedCount} for deletedCount, expected 1`)
					try {
						yield fs.lstat(path.join(db.config.globalStoragePath, `images/${componentName}/${updatedItem.id}`))
					} catch(e) {
						didThrowAnError = true
					}
					assert.strictEqual(didThrowAnError, true, 'the images folder was not deleted')
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield instance.db.sequelize.query(
						`drop table "test4Models";` +
						`drop table "test1Models";` +
						`drop table "test2Models";` +
						`drop table "test3Models";`
					)
					return true
				})
			})
		})
	}
}

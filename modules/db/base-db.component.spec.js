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
				assert(true)
			})
			it('should execute testMapNestedRelations successfully', function() {
				instance.testMapNestedRelations()
				assert(true)
			})
			it('should execute testMapRelations successfully', function() {
				instance.testMapRelations()
				assert(true)
			})
			it('should execute testCheckFilterValue successfully', function() {
				instance.testCheckFilterValue()
				assert(true)
			})
			it('should execute testSetFilterValue successfully', function() {
				instance.testSetFilterValue()
				assert(true)
			})
			it('should execute testGetWhereObjects successfully', function() {
				instance.testGetWhereObjects()
				assert(true)
			})
			it('should execute testGetRelationObjects successfully', function() {
				instance.testGetRelationObjects()
				assert(true)
			})
			it('should execute testCreate successfully', function() {
				instance.testCreate()
				assert(true)
			})
			it('should execute testBulkCreate successfully', function() {
				instance.testBulkCreate()
				assert(true)
			})
			it('should execute testRead successfully', function() {
				instance.testRead()
				assert(true)
			})
			it('should execute testReadList successfully', function() {
				instance.testReadList()
				assert(true)
			})
			it('should execute testUpdate successfully', function() {
				instance.testUpdate()
				assert(true)
			})
			it('should execute testDelete successfully', function() {
				instance.testDelete()
				assert(true)
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
				assert(
					!model.belongsToAssociations.length &&
					!model.hasOneAssociations.length &&
					!model.hasManyAssociations.length &&
					!model.belongsToManyAssociations.length &&
					!instance.dependencyMap.length
				)
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
					didThrowAnError = e && (e.customMessage === 'At "testComponent" component, relation "testAssociation": invalid association type.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "testComponent" component, relation "testAssociation: the provided config is missing a required property - "foreignKey".')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "testComponent" component, relation "testAssociation": invalid target component name - "testAssociation".')
				}
				assert(didThrowAnError)
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
					},
					dataIsGood = true
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
						if (shouldBeItem.model !== itemFromTheModel.model) {
							console.log(`Bad model name "${itemFromTheModel.model}" for "${associationName}" item no. ${i}.`)
							dataIsGood = false
							break
						}
						for (const key in options) {
							if (options[key] !== shouldBeOptions[key]) {
								console.log(`Bad option value '${options[key]}' for option "${key}" for "${associationName}" item no. ${i}.`)
								dataIsGood = false
								break
							}
						}
						if (!dataIsGood) {
							break
						}
					}
					if (!dataIsGood) {
						break
					}
				}

				for (const type in dependencyMapItemsShouldBe) {
					const mapTypeShouldBe = dependencyMapItemsShouldBe[type],
						mapTypeDataFromModel = instance.dependencyMap[type]
					for (const i in mapTypeDataFromModel) {
						if (mapTypeDataFromModel[i] !== mapTypeShouldBe[i]) {
							console.log(`Bad dependencyMap item value '${mapTypeDataFromModel[i]}' for type "${type}".`)
							dataIsGood = false
							break
						}
					}
					if (!dataIsGood) {
						break
					}
				}

				assert(dataIsGood)
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
					didThrowAnError = e && (e.customMessage === 'Invalid sourceComponent object provided.')
				}
				assert(didThrowAnError)
			})
			it('should throw an error with the correct message if the config argument is not an array', function() {
				let didThrowAnError = false
				try {
					instance.mapNestedRelations({})
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid config array provided.')
				}
				assert(didThrowAnError)
			})
			it('should execute successfully and return a blank array if the config array is empty', function() {
				assert(!instance.mapNestedRelations({dependencyMap: {}}, []).length)
			})
			it('should throw an error with the correct message if an associationName is not a string', function() {
				let didThrowAnError = false
				try {
					instance.mapNestedRelations({componentName: 'test1', associationsConfig: {}, dependencyMap: {}}, [{}])
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'At "test1": invalid association name - "undefined".')
				}
				assert(didThrowAnError)
			})
			it('should throw an error with the correct message if an associationName is an empty string', function() {
				let didThrowAnError = false
				try {
					instance.mapNestedRelations({componentName: 'test1', associationsConfig: {}, dependencyMap: {}}, [{associationName: ''}])
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'At "test1": invalid association name - "".')
				}
				assert(didThrowAnError)
			})
			it('should throw an error with the correct message if an association with the provided name does not exist in the sourceComponent', function() {
				let didThrowAnError = false
				changeableInstance.db = db
				try {
					instance.mapNestedRelations({componentName: 'test1', associationsConfig: {}, dependencyMap: {}}, [{associationName: 'test2'}])
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'At "test1": the component does not have an association named "test2".')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": the "attributes" object in the relation config must be a non-empty array.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": the "attributes" object in the relation config must be a non-empty array.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": "attributes" array with invalid contents provided in the relation config.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": "attributes" array with invalid contents provided in the relation config.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": the "where" object in the relation config must be a non-empty object or array.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": the "where" object in the relation config must be a non-empty object or array.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": the "where" object in the relation config must be a non-empty object or array.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": the "order" object in the relation config must be a non-empty array.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": the "order" object in the relation config must be a non-empty array.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": "order" object with invalid contents provided in the relation config.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": "order" object with invalid length provided in the relation config.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": "order" object with invalid contents provided in the relation config.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": "order" object with invalid contents provided in the relation config.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": "order" object with invalid length provided in the relation config.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": no component named "test0" exists, cannot order results by it.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": the "include" object in the relation config must be a non-empty array.')
				}
				assert(didThrowAnError)
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
					didThrowAnError = e && (e.customMessage === 'At "test1" component, relation "test2": the "include" object in the relation config must be a non-empty array.')
				}
				assert(didThrowAnError)
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
					],
					dataIsGood = true

				const firstItem = mappedArray[0],
					secondItem = mappedArray[1]
				for (const i in topLevelMapShouldBe) {
					const tlmItem = topLevelMapShouldBe[i],
						mapItem = mappedArray[i]
					for (const j in tlmItem) {
						if (tlmItem[j] !== mapItem[j]) {
							console.log(`At item no. ${i}: bad property "${j}", set to '${mapItem[j]}'.`)
							dataIsGood = false
							break
						}
					}
				}
				for (const i in firstItemIncludeShouldBe) {
					const tlmItem = firstItemIncludeShouldBe[i],
						mapItem = firstItem.include[i]
					for (const j in tlmItem) {
						if (tlmItem[j] !== mapItem[j]) {
							console.log(`At first item include item no. ${i}: bad property "${j}", set to '${mapItem[j]}'.`)
							dataIsGood = false
							break
						}
					}
				}
				if (dataIsGood &&
					(firstItem.include[0].attributes[0] !== 'id') &&
					(firstItem.include[0].attributes[1] !== 'name')
				) {
					console.log('Bad attributes clause for the first item\'s include item.')
					dataIsGood = false
				}
				if (dataIsGood && (secondItem.where.id !== 3)) {
					console.log('Bad where clause for the second item.')
					dataIsGood = false
				}
				if (dataIsGood &&
					(secondItem.order[0][0].model !== 'testComponent3Model') &&
					(secondItem.order[0][0].as !== 'testComponent3') &&
					(secondItem.order[0][1] !== 'id') &&
					(secondItem.order[0][2] !== 'asc')
				) {
					console.log('Bad order clause for the second item.')
					dataIsGood = false
				}

				assert(dataIsGood)
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
				assert(!instance.relReadKeys.length.length && !Object.keys(instance.relations).length)
			})
			it('should execute successfully and map the relations correctly if all paramters are correct', function() {
				let dataIsGood = true,
					attributesShouldBe = {
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
				if (JSON.stringify(instance.relReadKeys) !== JSON.stringify(['test1', 'test2', 'test3', 'test3ButWithADiffreentAlias'])) {
					console.log('Bad relReadKeys.')
					dataIsGood = false
				}
				if (dataIsGood) {
					for (const key in attributesShouldBe) {
						const reqItem = attributesShouldBe[key],
							relItem = instance.relations[key]
						for (const innerKey in reqItem) {
							if (reqItem[innerKey] !== relItem[innerKey]) {
								console.log(`Bad value '${relItem[innerKey]}' for key "${innerKey}" in item "${key}".`)
								dataIsGood = false
								break
							}
						}
					}
				}
				assert(
					dataIsGood &&
					(instance.relations.test3.attributes[0] === 'id') &&
					(instance.relations.test3.attributes[1] === 'name') &&
					(instance.relations.test3ButWithADiffreentAlias.where.id === 1)
				)
			})
		})
	},
	testCheckFilterValue: function() {
		const instance = this
		describe('baseDBComponent.checkFilterValue', function() {
			it('should return false if filterValue is undefined', function() {
				assert(instance.checkFilterValue() === false)
			})
			it('should return true if filterValue is null', function() {
				assert(instance.checkFilterValue(null) === true)
			})
			it('should return true if filterValue is a string', function() {
				assert(instance.checkFilterValue('') === true)
			})
			it('should return true if filterValue is a number', function() {
				assert(instance.checkFilterValue(3) === true)
			})
			it('should return true if filterValue is an instance of Date', function() {
				assert(instance.checkFilterValue(new Date()) === true)
			})
			it('should return false if filterValue is an empty object', function() {
				assert(instance.checkFilterValue({}) === false)
			})
			it('should return false if filterValue is an object with a property that is not listed in the component\'s allowedFilterKeywordOperators array', function() {
				assert(instance.checkFilterValue({badProperty: true}) === false)
			})
			it('should return false if filterValue is an empty array', function() {
				assert(instance.checkFilterValue([]) === false)
			})
			it('should return false if filterValue is an array and one of its items is an empty non-null object', function() {
				assert(instance.checkFilterValue([{}]) === false)
			})
			it('should return true if filterValue is an array and all of its items are null, strings, numbers, dates and valid objects', function() {
				assert(instance.checkFilterValue([null, 'testString', 2, new Date(), {$and: {$not: 3, $lte: 7}, $not: ['a', 'b', 'c'], $gt: 5}]) === true)
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
					didThrowAnError = e && (e.customMessage === 'Invalid filter object provided.')
				}
				assert(didThrowAnError)
			})
			it('should trow an error with the correct message if the field argument is not a non-empty string', function() {
				let didThrowAnError = false
				try {
					instance.setFilterValue(undefined, {}, undefined, true)
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid field string provided.')
				}
				assert(didThrowAnError)
			})
			it('should do nothing if the value does not correspond to checkFilterValue standards', function() {
				let container = {}
				instance.setFilterValue(container, {}, 'testField', undefined)
				assert(!Object.keys(container).length)
			})
			it('should set the filter value to equal the given one if no processing conditions are met', function() {
				let container = {}
				instance.setFilterValue(container, {}, 'testField', 'testvalue')
				assert(container.testField === 'testvalue')
			})
			it('should set the filter value to equal the given one if the filter is of a match type, but exactMatch is set for it', function() {
				let container = {}
				instance.setFilterValue(container, {like: '-%'}, 'testField', 'testvalue', ['testField'])
				assert(container.testField === 'testvalue')
			})
			it('should set the filter value correctly if the filter is of the "-%" match type and exactMatch is not set for it', function() {
				let container = {}
				instance.setFilterValue(container, {like: '-%'}, 'testField', 'testvalue')
				assert(container.testField.$iLike === 'testvalue%')
			})
			it('should set the filter value correctly if the filter is of the "-%" caseSensitive match type and exactMatch is not set for it', function() {
				let container = {}
				instance.setFilterValue(container, {like: '-%', caseSensitive: true}, 'testField', 'testvalue')
				assert(container.testField.$like === 'testvalue%')
			})
			it('should set the filter value correctly if the filter is of the "%-" match type and exactMatch is not set for it', function() {
				let container = {}
				instance.setFilterValue(container, {like: '%-'}, 'testField', 'testvalue')
				assert(container.testField.$iLike === '%testvalue')
			})
			it('should set the filter value correctly if the filter is of the "%-" caseSensitive match type and exactMatch is not set for it', function() {
				let container = {}
				instance.setFilterValue(container, {like: '%-', caseSensitive: true}, 'testField', 'testvalue')
				assert(container.testField.$like === '%testvalue')
			})
			it('should set the filter value correctly if the filter is of the "%%" match type and exactMatch is not set for it', function() {
				let container = {}
				instance.setFilterValue(container, {like: '%%'}, 'testField', 'testvalue')
				assert(container.testField.$iLike === '%testvalue%')
			})
			it('should set the filter value correctly if the filter is of the "%%" caseSensitive match type and exactMatch is not set for it', function() {
				let container = {}
				instance.setFilterValue(container, {like: '%%', caseSensitive: true}, 'testField', 'testvalue')
				assert(container.testField.$like === '%testvalue%')
			})
			it('should set the filter value correctly if the filter is of the "betweenFrom" range type and exactMatch is not set for it', function() {
				let container = {}
				instance.setFilterValue(container, {betweenFrom: true}, 'testFieldFrom', 'testvalue')
				assert(container.testField.$gt === 'testvalue')
			})
			it('should set the filter value correctly if the filter is of the "betweenFrom" range type and exactMatch is set for it', function() {
				let container = {}
				instance.setFilterValue(container, {betweenFrom: true}, 'testFieldFrom', 'testvalue', ['testField'])
				assert(container.testField.$gte === 'testvalue')
			})
			it('should set the filter value correctly if the filter is of the "betweenFrom" range type and exactMatchFields is set for it in the field options', function() {
				let container = {}
				instance.setFilterValue(container, {betweenFrom: true, exactMatchFields: true}, 'testFieldFrom', 'testvalue')
				assert(container.testField.$gte === 'testvalue')
			})
			it('should set the filter value correctly if the filter is of the "betweenTo" range type and exactMatch is not set for it', function() {
				let container = {}
				instance.setFilterValue(container, {betweenTo: true}, 'testFieldTo', 'testvalue')
				assert(container.testField.$lt === 'testvalue')
			})
			it('should set the filter value correctly if the filter is of the "betweenTo" range type and exactMatch is set for it', function() {
				let container = {}
				instance.setFilterValue(container, {betweenTo: true}, 'testFieldTo', 'testvalue', ['testField'])
				assert(container.testField.$lte === 'testvalue')
			})
			it('should set the filter value correctly if the filter is of the "betweenTo" range type and exactMatchFields is set for it in the field options', function() {
				let container = {}
				instance.setFilterValue(container, {betweenTo: true, exactMatchFields: true}, 'testFieldTo', 'testvalue')
				assert(container.testField.$lte === 'testvalue')
			})
		})
	},
	testGetWhereObjects: function() {
		const instance = this
		let changeableInstance = this
		describe('baseDBComponent.getWhereObjects', function() {
			it('should do nothing if filters argument is not a non-empty non-null object', function() {
				let {where, requiredRelationsData} = instance.getWhereObjects()
				assert(!Object.keys(where).length || !Object.keys(requiredRelationsData).length)
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
				)
				assert(
					(where.id === 3) &&
					(where['$testRelation.innerTestRelation.nestedId$'] === 5) &&
					(where.someString['$iLike'] === '%test1%') &&
					(where.anotherString === 'test2') &&
					(Object.keys(requiredRelationsData).length === 1) &&
					(requiredRelationsData['testRelation'] === 'testRelation.innerTestRelation')
				)
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
					{field: '$test2.test3.description$'}
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
					],
					dataIsGood = true
				for (const i in include) {
					const includeItem = include[i],
						includeItemShouldBe = topLevelIncludeShouldBe[i]
					for (const j in includeItemShouldBe) {
						if (includeItemShouldBe[j] !== includeItem[j]) {
							console.log(`Bad value '${includeItem[j]}' for key "${j}" in item no. ${i}.`)
							dataIsGood = false
							break
						}
					}
				}
				if (
					dataIsGood && (
						!(order instanceof Array) ||
						(order.length !== 1) ||
						!(order[0] instanceof Array) ||
						(order[0].length !== 3) ||
						(order[0][0].model !== 'testComponent2Model') ||
						(order[0][0].as !== 'test2') ||
						(order[0][1] !== 'id') ||
						(order[0][2] !== 'asc')
					)
				) {
					console.log('Bad order array returned by the method.')
					dataIsGood = false
				}
				if (
					dataIsGood && (
						!(include[1].include instanceof Array) ||
						(include[1].include.length !== 1) ||
						(include[1].include[0].model !== 'test3Model') ||
						(include[1].include[0].as !== 'test3') ||
						(include[1].include[0].required !== true)
					)
				) {
					console.log('Bad include array for include item no. 1.')
					dataIsGood = false
				}
				assert(dataIsGood)
			})
		})
	},
	testCreate: function() {
		const instance = this,
			{sequelize, Sequelize} = this
		let changeableInstance = this
		describe('baseDBComponent.create', function() {
			it('should execute successfully and create a new db entry correctly if all parameters are correct', function() {
				return co(function*() {
					let dataIsGood = false
					try {
						yield sequelize.transaction((t) => co(function*() {
							let item = {id: 3, name: 'testName', description: 'testDescription'}
							changeableInstance.model = sequelize.define('test1Model', {
								name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
								description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
							})
							yield sequelize.sync({force: true, transaction: t})
							yield instance.create(item, {transaction: t})
							let createdItem = (yield instance.model.findOne({where: {id: 3}, transaction: t})).dataValues
							dataIsGood = true
							for (const i in item) {
								if (createdItem[i] !== item[i]) {
									console.log(`Bad value '${createdItem[i]}' for field "${i}".`)
									dataIsGood = false
									break
								}
							}
							delete changeableInstance.model
							throw 'fakeError'
						}))
					} catch(e) {
						if (e !== 'fakeError') {
							throw e
						}
					}
					assert(dataIsGood)
					return true
				})
			})
		})
	},
	testBulkCreate: function() {
		const instance = this,
			{sequelize, Sequelize} = this
		let changeableInstance = this
		describe('baseDBComponent.bulkCreate', function() {
			it('should execute successfully and create the new db entries correctly if all parameters are correct', function() {
				return co(function*() {
					let dataIsGood = false
					try {
						yield sequelize.transaction((t) => co(function*() {
							let items = [{id: 3, name: 'testName', description: 'testDescription'}, {id: 4, name: 'testName4', description: 'testDescription4'}]
							changeableInstance.model = sequelize.define('test1Model', {
								name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
								description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
							})
							yield sequelize.sync({force: true, transaction: t})
							yield instance.bulkCreate(items, {transaction: t})
							let createdItems = yield instance.model.findAll({where: {id: [3, 4]}, transaction: t})
							dataIsGood = true
							for (const i in items) {
								const item = items[i],
									createdItem = createdItems[i].dataValues
								for (const j in item) {
									if (createdItem[j] !== item[j]) {
										console.log(`Bad value '${createdItem[j]}' for field "${j}" for item no. ${i}.`)
										dataIsGood = false
										break
									}
								}
							}
							delete changeableInstance.model
							throw 'fakeError'
						}))
					} catch(e) {
						if (e !== 'fakeError') {
							throw e
						}
					}
					assert(dataIsGood)
					return true
				})
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
						didThrowAnError = e && (e.customMessage === 'No filters provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully and read a db entry correctly if all parameters are correct', function() {
				return co(function*() {
					let dataIsGood = false
					try {
						yield sequelize.transaction((t) => co(function*() {
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
							dataIsGood = true
							for (const i in item) {
								if (createdItem[i] !== item[i]) {
									console.log(`Bad value '${createdItem[i]}' for field "${i}" for the main item.`)
									dataIsGood = false
									break
								}
							}
							for (const i in test2Item) {
								if (createdTest2Item[i] !== test2Item[i]) {
									console.log(`Bad value '${createdTest2Item[i]}' for field "${i}" for the test2 item.`)
									dataIsGood = false
									break
								}
							}
							for (const i in test3Item) {
								if (createdTest3Item[i] !== test3Item[i]) {
									console.log(`Bad value '${createdTest3Item[i]}' for field "${i}" the test3 item.`)
									dataIsGood = false
									break
								}
							}
							delete changeableInstance.model
							delete changeableInstance.db
							throw 'fakeError'
						}))
					} catch(e) {
						if (e !== 'fakeError') {
							throw e
						}
					}
					assert(dataIsGood)
					return true
				})
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
						didThrowAnError = e && (e.customMessage === 'No filters provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully and read a list of db entries correctly if all parameters are correct', function() {
				return co(function*() {
					let dataIsGood = false
					try {
						yield sequelize.transaction((t) => co(function*() {
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
							dataIsGood = true
							for (const index in createdItemsData.results) {
								let item = items[index],
									createdItem = createdItemsData.results[index].dataValues,
									createdTest2Item = createdItem.test2.dataValues,
									createdTest3Item = createdTest2Item.test3.dataValues
								for (const i in item) {
									if (createdItem[i] !== item[i]) {
										console.log(`Bad value '${createdItem[i]}' for field "${i}" for the main item, index ${index}.`)
										dataIsGood = false
										break
									}
								}
								if (!dataIsGood) {
									break
								}
								for (const i in test2Item) {
									if (createdTest2Item[i] !== test2Item[i]) {
										console.log(`Bad value '${createdTest2Item[i]}' for field "${i}" for the test2 item, index ${index}.`)
										dataIsGood = false
										break
									}
								}
								if (!dataIsGood) {
									break
								}
								for (const i in test3Item) {
									if (createdTest3Item[i] !== test3Item[i]) {
										console.log(`Bad value '${createdTest3Item[i]}' for field "${i}" the test3 item, index ${index}.`)
										dataIsGood = false
										break
									}
								}
								if (!dataIsGood) {
									break
								}
							}
							if (
								dataIsGood && (
									(createdItemsData.page !== 1) ||
									(createdItemsData.perPage !== 10) ||
									(createdItemsData.totalPages !== 1) ||
									(createdItemsData.more !== false)
								)
							) {
								console.log(`Bad additional params in the method return object.`)
							}
							delete changeableInstance.model
							delete changeableInstance.db
							throw 'fakeError'
						}))
					} catch(e) {
						if (e !== 'fakeError') {
							throw e
						}
					}
					assert(dataIsGood)
					return true
				})
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
						didThrowAnError = e && (e.customMessage === 'Cannot update without criteria.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully and update a db entry correctly if all parameters are correct', function() {
				return co(function*() {
					let dataIsGood = false
					try {
						yield sequelize.transaction((t) => co(function*() {
							let item = {name: 'testNameUpdated', description: 'testDescriptionUpdated'}
							changeableInstance.model = sequelize.define('test1Model', {
								name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
								description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
							})
							yield sequelize.sync({force: true, transaction: t})
							yield instance.create({id: 3, name: 'testName', description: 'testDescription'}, {transaction: t})
							yield instance.update({dbObject: item, where: {id: 3}, transaction: t})
							yield instance.model.findOne({where: {id: 3}, transaction: t})
							let updatedItem = (yield instance.model.findOne({where: {id: 3}, transaction: t})).dataValues
							dataIsGood = true
							for (const i in item) {
								if (updatedItem[i] !== item[i]) {
									console.log(`Bad value '${updatedItem[i]}' for field "${i}".`)
									dataIsGood = false
									break
								}
							}
							delete changeableInstance.model
							throw 'fakeError'
						}))
					} catch(e) {
						if (e !== 'fakeError') {
							throw e
						}
					}
					assert(dataIsGood)
					return true
				})
			})
		})
	},
	testDelete: function() {
		const instance = this,
			{sequelize, Sequelize} = this
		let changeableInstance = this
		describe('baseDBComponent.delete', function() {
			it('should throw an error with the correct message if checkForRelatedModels and an item has dependent items', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield sequelize.transaction((t) => co(function*() {
							let item = {id: 1, name: 'test1Name', description: 'test1Description'},
								test2Item = {id: 1, test1Id: 1, name: 'test2Name', description: 'test2Description'}
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
								didThrowAnError = e && (e.customMessage === 'Cannot delete a "test1Component" item that has related "test2" items in the database.')
							}
							throw 'fakeError'
						}))
					} catch(e) {
						if (e !== 'fakeError') {
							throw e
						}
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully delete a db entry correctly if all parameters are correct', function() {
				return co(function*() {
					let deletedCount = 0
					try {
						yield sequelize.transaction((t) => co(function*() {
							let item = {id: 1, name: 'test1Name', description: 'test1Description'}
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
							throw 'fakeError'
						}))
					} catch(e) {
						if (e !== 'fakeError') {
							throw e
						}
					}
					assert(deletedCount === 1)
					return true
				})
			})
		})
	}
}

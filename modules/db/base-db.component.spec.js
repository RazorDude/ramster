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
			it('should execute successfully and create valid associations and a correct depencencyMap if all paramters are correct', function() {
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
	}
}

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
		describe('migrations', function() {
			it('should execute testListen successfully', function() {
				instance.testListen()
				assert(true)
			})
			it('should execute testGetFullTableData successfully', function() {
				instance.testGetFullTableData()
				assert(true)
			})
			it('should execute testGetTableLayout successfully', function() {
				instance.testGetTableLayout()
				assert(true)
			})
			it('should execute testRemoveAllTables successfully', function() {
				instance.testRemoveAllTables()
				assert(true)
			})
			it('should execute testRunQueryFromColumnData successfully', function() {
				instance.testRunQueryFromColumnData()
				assert(true)
			})
			it('should execute testEscapeRecursively successfully', function() {
				instance.testEscapeRecursively()
				assert(true)
			})
			it('should execute testPrepareDataObjectForQuery successfully', function() {
				instance.testPrepareDataObjectForQuery()
				assert(true)
			})
			it('should execute testGetLinearArrayFromDependencyGraph successfully', function() {
				instance.testGetLinearArrayFromDependencyGraph()
				assert(true)
			})
			it('should execute testPrepareColumnData successfully', function() {
				instance.testPrepareColumnData()
				assert(true)
			})
			it('should execute testInsertData successfully', function() {
				instance.testInsertData()
				assert(true)
			})
			it('should execute testSync successfully', function() {
				instance.testSync()
				assert(true)
			})
			it('should execute testGenerateSeed successfully', function() {
				instance.testGenerateSeed()
				assert(true)
			})
			it('should execute testSeed successfully', function() {
				instance.testSeed()
				assert(true)
			})
			it('should execute testGenerateBackup successfully', function() {
				instance.testGenerateBackup()
				assert(true)
			})
			it('should execute testInsertStaticData successfully', function() {
				instance.testInsertStaticData()
				assert(true)
			})
		})
	},
	testListen: function() {
		const instance = this
		describe('migrations.listen', function() {
			it('should execute successfully', function() {
				instance.listen()
			})
		})
	},
	testGetFullTableData: function() {
		const instance = this
		describe('migrations.getFullTableData', function() {
			it('should execute successfully', function() {
				return co(function*() {
					yield instance.getFullTableData()
					assert(true)
					return true
				})
			})
		})
	},
	testGetTableLayout: function() {
		const instance = this
		describe('migrations.getTableLayout', function() {
			it('should execute successfully', function() {
				return co(function*() {
					yield instance.getTableLayout()
					assert(true)
					return true
				})
			})
		})
	},
	testRemoveAllTables: function() {
		const instance = this
		describe('migrations.removeAllTables', function() {
			it('should execute successfully', function() {
				return co(function*() {
					let fullTableData = null
					try {
						yield instance.sequelize.transaction((t) => {
							return co(function*() {
								yield instance.removeAllTables(t)
								fullTableData = yield instance.getFullTableData(t)
								throw {customMessage: 'fakeError'}
							})
						})
					} catch(e) {
						if (!e || (e.customMessage !== 'fakeError')) {
							throw e
						}
					}
					assert(fullTableData && Object.keys(fullTableData).length === 0)
					return true
				})
			})
		})
	},
	testRunQueryFromColumnData: function() {
		const instance = this,
			{sequelize} = this,
			queryInterface = sequelize.getQueryInterface()
		describe('migrations.runQueryFromColumnData', function() {
			it('should throw an error with the correct message if queryInterface is not sequelize.queryInterface', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData()
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid queryInterface object provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if tableName is not a string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface)
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid tableName string provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if tableName is an empty string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, '')
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid tableName string provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if inserts is not a json object', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, 'userTypes')
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'At table "userTypes": invalid inserts object provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if inserts.columns is not an array', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, 'userTypes', {})
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'At table "userTypes": inserts.columns must be a non-empty array.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if inserts.columns is an empty array', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, 'userTypes', {columns: []})
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'At table "userTypes": inserts.columns must be a non-empty array.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if inserts.values is not an array', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, 'userTypes', {columns: ['id']})
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'At table "userTypes": inserts.values must be an array.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if deleteTableContents is provided, but is not an array', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, 'userTypes', {columns: ['id'], values: []}, 'dummyTransaction', {deleteTableContents: 'blabla'})
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'At table "userTypes": if provided, deleteTableContents must be an array.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if an inserts.values item is not an array', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, 'userTypes', {columns: ['id'], values: ['wrongItem']})
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'At table "userTypes", item no. 0: inserts.values items must be arrays.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if an inserts.values item has more columns than inserts.columns', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, 'userTypes', {columns: ['id'], values: [[1, 2]]})
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'At table "userTypes", item no. 0: the number of fields in this item does not match the number of columns in inserts.columns.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if an inserts.values item has less columns than inserts.columns', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, 'userTypes', {columns: ['id'], values: [[]]})
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'At table "userTypes", item no. 0: the number of fields in this item does not match the number of columns in inserts.columns.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully if all parameters are correct, deleteTableContents is not provided and dontSetIdSequence is not set to true', function() {
				return co(function*() {
					let now = moment.utc().valueOf(),
						data = null
					try {
						yield instance.sequelize.transaction((t) => {
							return co(function*() {
								yield instance.runQueryFromColumnData(queryInterface, 
									'userTypes', {
										columns: ['id', 'name', 'description', 'status', 'createdAt', 'updatedAt'],
										values: [[1500, `Test type 1 - ${now}`, 'TT1', true, 'now()', 'now()']]
									},
									t
								)
								data = (yield sequelize.query(`select * from "userTypes" where "id"=1500;`, {transaction: t}))[0]
								throw {customMessage: 'fakeError'}
							})
						})
					} catch(e) {
						if (!e || (e.customMessage !== 'fakeError')) {
							throw e
						}
					}
					assert(data && (data.length > 0))
					return true
				})
			})
			it('should execute successfully if all parameters are correct, deleteTableContents is a valid array containing the table name and dontSetIdSequence is not set to true', function() {
				return co(function*() {
					let now = moment.utc().valueOf(),
						data = null
					try {
						yield instance.sequelize.transaction((t) => {
							return co(function*() {
								yield instance.runQueryFromColumnData(queryInterface, 
									'userTypes', {
										columns: ['id', 'name', 'description', 'status', 'createdAt', 'updatedAt'],
										values: [[1500, `Test type 1 - ${now}`, 'TT1', true, 'now()', 'now()']]
									},
									t,
									{deleteTableContents: ['userTypes']}
								)
								data = (yield sequelize.query(`select * from "userTypes" where "id"=1500;`, {transaction: t}))[0]
								throw {customMessage: 'fakeError'}
							})
						})
					} catch(e) {
						if (!e || (e.customMessage !== 'fakeError')) {
							throw e
						}
					}
					assert(data && (data.length > 0))
					return true
				})
			})
			it('should execute successfully if all parameters are correct, deleteTableContents is not provided and dontSetIdSequence is set to true', function() {
				return co(function*() {
					let now = moment.utc().valueOf(),
						data = null
					try {
						yield instance.sequelize.transaction((t) => {
							return co(function*() {
								yield instance.runQueryFromColumnData(queryInterface, 
									'userTypes', {
										columns: ['id', 'name', 'description', 'status', 'createdAt', 'updatedAt'],
										values: [[1500, `Test type 1 - ${now}`, 'TT1', true, 'now()', 'now()']]
									},
									t,
									{dontSetIdSequence: true}
								)
								data = (yield sequelize.query(`select * from "userTypes" where "id"=1500;`, {transaction: t}))[0]
								throw {customMessage: 'fakeError'}
							})
						})
					} catch(e) {
						if (!e || (e.customMessage !== 'fakeError')) {
							throw e
						}
					}
					assert(data && (data.length > 0))
					return true
				})
			})
			it('should execute successfully if all parameters are correct, deleteTableContents is a valid array containing the table name and dontSetIdSequence is set to true', function() {
				return co(function*() {
					let now = moment.utc().valueOf(),
						data = null
					try {
						yield instance.sequelize.transaction((t) => {
							return co(function*() {
								yield instance.runQueryFromColumnData(queryInterface, 
									'userTypes', {
										columns: ['id', 'name', 'description', 'status', 'createdAt', 'updatedAt'],
										values: [[1500, `Test type 1 - ${now}`, 'TT1', true, 'now()', 'now()']]
									},
									t,
									{deleteTableContents: ['userTypes'], dontSetIdSequence: true}
								)
								data = (yield sequelize.query(`select * from "userTypes" where "id"=1500;`, {transaction: t}))[0]
								throw {customMessage: 'fakeError'}
							})
						})
					} catch(e) {
						if (!e || (e.customMessage !== 'fakeError')) {
							throw e
						}
					}
					assert(data && (data.length > 0))
					return true
				})
			})
		})
	},
	testEscapeRecursively: function() {
		const instance = this,
			{sequelize} = this,
			queryInterface = sequelize.getQueryInterface()
		describe('migrations.escapeRecursively', function() {
			it('should throw an error if queryInterface is not sequelize.queryInterface', function() {
				let didThrowAnError = false
				try {
					instance.escapeRecursively(null, 'testString')
				} catch(e) {
					didThrowAnError = true
				}
				assert(didThrowAnError)
			})
			it('should execute successfully if all parameters are correct', function() {
				let escapedObject = instance.escapeRecursively(queryInterface, {
					testProperty: [
						'someString',
						'otherString"', {
							innerObject: {stringy: 'test', misterArray: [true, false, 1, 'yay', null, undefined, 'foo']}
						}
					],
					bar: {q: 'test'},
					test: null
				})
				assert(
					(escapedObject.testProperty instanceof Array) &&
					(escapedObject.testProperty[0] === 'someString') &&
					(escapedObject.testProperty[1] === 'otherString"') &&
					(escapedObject.testProperty[2].innerObject.stringy === 'test') &&
					(escapedObject.testProperty[2].innerObject.misterArray instanceof Array) &&
					(escapedObject.testProperty[2].innerObject.misterArray[0] === true) &&
					(escapedObject.testProperty[2].innerObject.misterArray[1] === false) &&
					(escapedObject.testProperty[2].innerObject.misterArray[2] === 1) &&
					(escapedObject.testProperty[2].innerObject.misterArray[3] === 'yay') &&
					(escapedObject.testProperty[2].innerObject.misterArray[4] === null) &&
					(escapedObject.testProperty[2].innerObject.misterArray[5] === undefined) &&
					(escapedObject.testProperty[2].innerObject.misterArray[6] === 'foo') &&
					(escapedObject.bar.q === 'test') &&
					(escapedObject.test === null)
				)
			})
		})
	},
	testPrepareDataObjectForQuery: function() {
		const instance = this,
			{sequelize} = this
		describe('migrations.prepareDataObjectForQuery', function() {
			it('should throw an error with the correct message if tableLayout is not an array', function() {
				let didThrowAnError = false
				try {
					instance.prepareDataObjectForQuery()
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid tableLayout array provided.')
				}
				assert(didThrowAnError)
			})
			it('should throw an error with the correct message if dataObject is not an object', function() {
				let didThrowAnError = false
				try {
					instance.prepareDataObjectForQuery(['testColumn'])
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid dataObject provided.')
				}
				assert(didThrowAnError)
			})
			it('should execute successfully if all parameters are correct', function() {
				let {columns, values} = instance.prepareDataObjectForQuery(['testProperty', 'bar', 'test', 'doesNotExistInTheObjectProperty'], {
						testProperty: [
							'someString',
							'otherString"', {
								innerObject: {stringy: 'test', misterArray: [true, false, 1, 'yay', null, undefined, 'foo']}
							}
						],
						bar: {q: 'test'},
						test: null,
						doesNotExistInTheTableColumn: 'definitelyYes'
					}),
					parsedTestProperty = JSON.parse(values[0])
				// console.log(columns.length === 3)
				// console.log(values.length === 3)
				// console.log(columns[0] === 'testProperty')
				// console.log(columns[1] === 'bar')
				// console.log(columns[2] === 'test')
				// console.log(parsedTestProperty instanceof Array)
				// console.log(parsedTestProperty[0] === 'someString')
				// console.log(parsedTestProperty[1] === 'otherString"')
				// console.log(parsedTestProperty[2].innerObject.stringy === 'test')
				// console.log(parsedTestProperty[2].innerObject.misterArray instanceof Array)
				// console.log(parsedTestProperty[2].innerObject.misterArray[0] === true)
				// console.log(parsedTestProperty[2].innerObject.misterArray[2] === 1)
				// console.log(parsedTestProperty[2].innerObject.misterArray[3] === 'yay')
				// console.log(parsedTestProperty[2].innerObject.misterArray[4] === null)
				// console.log(parsedTestProperty[2].innerObject.misterArray[5] === null)
				// console.log(parsedTestProperty[2].innerObject.misterArray[6] === 'foo')
				// console.log(JSON.parse(values[1]).q === 'test')
				// console.log(values[2] === null)
				assert(
					(columns.length === 3) &&
					(values.length === 3) &&
					(columns[0] === 'testProperty') &&
					(columns[1] === 'bar') &&
					(columns[2] === 'test') &&
					(parsedTestProperty instanceof Array) &&
					(parsedTestProperty[0] === 'someString') &&
					(parsedTestProperty[1] === 'otherString"') &&
					(parsedTestProperty[2].innerObject.stringy === 'test') &&
					(parsedTestProperty[2].innerObject.misterArray instanceof Array) &&
					(parsedTestProperty[2].innerObject.misterArray[0] === true) &&
					(parsedTestProperty[2].innerObject.misterArray[1] === false) &&
					(parsedTestProperty[2].innerObject.misterArray[2] === 1) &&
					(parsedTestProperty[2].innerObject.misterArray[3] === 'yay') &&
					(parsedTestProperty[2].innerObject.misterArray[4] === null) &&
					(parsedTestProperty[2].innerObject.misterArray[5] === null) && // yes, json.stringfy transforms undefined to null in array objects
					(parsedTestProperty[2].innerObject.misterArray[6] === 'foo') &&
					(JSON.parse(values[1]).q === 'test') &&
					(values[2] === null)
				)
			})
		})
	},
	testGetLinearArrayFromDependencyGraph: function() {
		const instance = this,
			{sequelize} = this
		describe('migrations.getLinearArrayFromDependencyGraph', function() {
			it('should throw an error with the correct message if dependencyGraph is not an object', function() {
				let didThrowAnError = false
				try {
					instance.getLinearArrayFromDependencyGraph()
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid dependencyGraph object provided.')
				}
				assert(didThrowAnError)
			})
			it('should throw an error with the correct message if a dependencyGraph vertex does not contain a data object', function() {
				let didThrowAnError = false
				try {
					instance.getLinearArrayFromDependencyGraph({1: {}})
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'At vertex id 1: invalid data object.')
				}
				assert(didThrowAnError)
			})
			it('should execute successfully if all parameters are correct', function() {
				let dependencyGraph = {
						1: {
							data: {id: 1, name: 'name1', description: 'desc1'},
							vertices: {
								2: {data: {id: 2, name: 'name2', description: 'desc2'}},
								3: {
									data: {id: 3, name: 'name3', description: 'desc3'},
									vertices: {
										4: {
											data: {id: 4, name: 'name4', description: 'desc4'},
											vertices: {
												5: {data: {id: 5, name: 'name5', description: 'desc5'}},
												6: {data: {id: 6, name: 'name6', description: 'desc6'}}
											}
										}
									}
								},
								7: {
									data: {id: 7, name: 'name7', description: 'desc7'},
									vertices: {
										8: {data: {id: 8, name: 'name8', description: 'desc8'}}
									}
								},
								9: {data: {id: 9, name: 'name9', description: 'desc9'}}
							}
						}
					},
					linearArray = instance.getLinearArrayFromDependencyGraph(dependencyGraph),
					dataIsGood = true
				if (linearArray.length < 9) {
					assert(false)
					return true
				}
				for (const i in linearArray) {
					if (linearArray[i].id !== (parseInt(i, 10)) + 1) {
						dataIsGood = false
						break
					}
				}
				assert(dataIsGood)
			})
		})
	},
	testPrepareColumnData: function() {
		const instance = this,
			{sequelize} = this
		describe('migrations.prepareColumnData', function() {
			it('should throw an error with the correct message if data is not an array', function() {
				let didThrowAnError = false
				try {
					instance.prepareColumnData()
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid data array provided.')
				}
				assert(didThrowAnError)
			})
			it('should throw an error with the correct message if tableLayout is not an array', function() {
				let didThrowAnError = false
				try {
					instance.prepareColumnData([])
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid tableLayout array provided.')
				}
				assert(didThrowAnError)
			})
			it('should throw an error with the correct message if sameTablePrimaryKey is not a string', function() {
				let didThrowAnError = false
				try {
					instance.prepareColumnData([], [], null)
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid sameTablePrimaryKey string provided.')
				}
				assert(didThrowAnError)
			})
			it('should throw an error with the correct message if sameTablePrimaryKey an empty string', function() {
				let didThrowAnError = false
				try {
					instance.prepareColumnData([], [], '')
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid sameTablePrimaryKey string provided.')
				}
				assert(didThrowAnError)
			})
			it('should execute successfully if all parameters are correct and sameTablePimaryKey is undefined', function() {
				let preparedData = instance.prepareColumnData(
						[
							{id: 1, name: 'name1', description: 'description1'},
							{id: 2, name: 'name1', description: 'description1'},
							{id: 3, name: 'name1', description: 'description1'},
							{id: 4, name: 'name1'},
							{id: 5, name: 'name1', description: 'description1'},
							{id: 6, name: 'name1'},
							{id: 7, name: 'name1', description: 'description1'},
							{id: 8, name: 'name1'},
							{id: 9, name: 'name1', description: 'description1', createdAt: 'now()'}
						],
						['id', 'name', 'description', 'createdAt']
					),
					keys = Object.keys(preparedData),
					stringifiedColumnsShouldEqual = ['["id","name","description"]', '["id","name"]', '["id","name","description","createdAt"]'],
					valuesLengthShouldBe = [5, 3, 1],
					idColumnShouldBe = [[1, 2, 3, 5, 7], [4, 6, 8], [9]]
				for (const i in keys) {
					const stringifiedColumns = keys[i],
						{columns, values} = preparedData[stringifiedColumns]
					if (stringifiedColumns !== stringifiedColumnsShouldEqual[i]) {
						assert(false)
						return true
					}
					for (const j in columns) {
						if (columns[j] !== columns[j]) {
							console.log('====> fails here 1')
							assert(false)
							return true
						}
					}
					if (values.length !== valuesLengthShouldBe[i]) {
						assert(false)
						return true
					}
					for (const j in values) {
						const item = values[j]
						if (item.length !== columns.length) {
							assert(false)
							return true
						}
						if (item[0] !== idColumnShouldBe[i][j]) {
							assert(false)
							return true
						}
					}
				}
				assert(true)
			})
			it('should execute successfully if all parameters are correct and sameTablePimaryKey is set', function() {
				let preparedData = instance.prepareColumnData(
						[
							{id: 1, name: 'name1', description: 'description1'},
							{id: 2, parentId: 1, name: 'name2', description: 'description2'},
							{id: 3, parentId: 1, name: 'name3', description: 'description3'},
							{id: 4, parentId: 3, name: 'name4'},
							{id: 5, parentId: 4, name: 'name5', description: 'description5'},
							{id: 6, parentId: 4, name: 'name6'},
							{id: 7, parentId: 1, name: 'name7', description: 'description7'},
							{id: 8, parentId: 7, name: 'name8'},
							{id: 9, parentId: 1, name: 'name9', description: 'description9', createdAt: 'now()'}
						],
						['id', 'name', 'description', 'createdAt'],
						'parentId'
					),
					stringifiedColumnsShouldEqual = [
						'["id","name","description"]',
						'["id","name"]',
						'["id","name","description"]',
						'["id","name"]',
						'["id","name","description"]',
						'["id","name"]',
						'["id","name","description","createdAt"]'
					],
					valuesLengthShouldBe = [3, 1, 1, 1, 1, 1, 1],
					idColumnShouldBe = [[1, 2, 3], [4], [5], [6], [7], [8], [9]]
				if (!(preparedData instanceof Array)) {
					assert(false)
					return true
				}
				for (const i in preparedData) {
					const {columns, stringifiedColumns, values} = preparedData[i]
					if (stringifiedColumns !== stringifiedColumnsShouldEqual[i]) {
						assert(false)
						return true
					}
					for (const j in columns) {
						if (columns[j] !== columns[j]) {
							assert(false)
							return true
						}
					}
					if (values.length !== valuesLengthShouldBe[i]) {
						assert(false)
						return true
					}
					for (const j in values) {
						const item = values[j]
						if (item.length !== columns.length) {
							assert(false)
							return true
						}
						if (item[0] !== idColumnShouldBe[i][j]) {
							assert(false)
							return true
						}
					}
				}
				assert(true)
			})
		})
	},
	testInsertData: function() {
		const instance = this,
			{config, sequelize} = this
		let changeableInstance = this
		describe('migrations.insertData', function() {
			it('should throw an error with the correct message if data is not an object', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.insertData()
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid data object provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully if all parameters are correct, noSync and deleteTableContents are not set to true', function() {
				return co(function*() {
					let fileData = JSON.parse(yield fs.readFile(path.join(config.migrations.staticDataPath, 'staticData.json'))),
						data = {},
						resultsAreGood = true,
						originalSeedingOrder = JSON.parse(JSON.stringify(instance.seedingOrder)),
						newSeedingOrder = [],
						didThrowAnError = false
					instance.seedingOrder.forEach((item, index) => {
						if (item !== 'users') {
							newSeedingOrder.push(item)
						}
					})
					changeableInstance.seedingOrder = newSeedingOrder
					for (const tableName in fileData) {
						data[tableName] = fileData[tableName].data
					}
					try {
						yield instance.insertData(data, {
								userTypes: ['id', 'name', 'description', 'status', 'createdAt', 'updatedAt'],
								users: ['id', 'typeId', 'firstName', 'lastName', 'email', 'password', 'status', 'createdAt', 'updatedAt']
							}
						)
					} catch(e) {
						didThrowAnError = e
					}
					changeableInstance.seedingOrder = originalSeedingOrder
					if (didThrowAnError) {
						throw didThrowAnError
					}
					let userList = (yield sequelize.query('select * from "users" where "id" in (1,2,3,4);'))[0],
						userIdIndexMap = {},
						userTypeList = (yield sequelize.query('select * from "userTypes" where "id" in (1,2,3);'))[0],
						userTypeIdIndexMap = {}
					for (const i in userList) {
						userIdIndexMap[userList[i].id] = i
					}
					for (const i in userTypeList) {
						userTypeIdIndexMap[userTypeList[i].id] = i
					}
					for (const i in data.users) {
						const user = data.users[i],
							userFromDB = userList[userIdIndexMap[user.id]]
						for (const fieldName in user) {
							if (userFromDB[fieldName] !== user[fieldName]) {
								assert(false)
								return true
							}
						}
					}
					for (const i in data.userTypes) {
						const userType = data.userTypes[i],
							userTypeFromDB = userTypeList[userTypeIdIndexMap[userType.id]]
						for (const fieldName in userType) {
							if (userTypeFromDB[fieldName] !== userType[fieldName]) {
								assert(false)
								return true
							}
						}
					}
					assert(true)
					return true
				})
			})
			it('should execute successfully if all parameters are correct, noSync and deleteTableContents are set to true', function() {
				return co(function*() {
					let fileData = JSON.parse(yield fs.readFile(path.join(config.migrations.staticDataPath, 'staticData.json'))),
						data = {},
						resultsAreGood = true,
						originalSeedingOrder = JSON.parse(JSON.stringify(instance.seedingOrder)),
						newSeedingOrder = [],
						didThrowAnError = false
					instance.seedingOrder.forEach((item, index) => {
						if (item !== 'users') {
							newSeedingOrder.push(item)
						}
					})
					changeableInstance.seedingOrder = newSeedingOrder
					for (const tableName in fileData) {
						data[tableName] = fileData[tableName].data
					}
					try {
						yield instance.insertData(data, {
								userTypes: ['id', 'name', 'description', 'status', 'createdAt', 'updatedAt'],
								users: ['id', 'typeId', 'firstName', 'lastName', 'email', 'password', 'status', 'createdAt', 'updatedAt']
							},
							{noSync: true, deleteTableContents: true}
						)
					} catch(e) {
						didThrowAnError = e
					}
					changeableInstance.seedingOrder = originalSeedingOrder
					if (didThrowAnError) {
						throw didThrowAnError
					}
					let userList = (yield sequelize.query('select * from "users" where "id" in (1,2,3,4);'))[0],
						userIdIndexMap = {},
						userTypeList = (yield sequelize.query('select * from "userTypes" where "id" in (1,2,3);'))[0],
						userTypeIdIndexMap = {}
					for (const i in userList) {
						userIdIndexMap[userList[i].id] = i
					}
					for (const i in userTypeList) {
						userTypeIdIndexMap[userTypeList[i].id] = i
					}
					for (const i in data.users) {
						const user = data.users[i],
							userFromDB = userList[userIdIndexMap[user.id]]
						for (const fieldName in user) {
							if (userFromDB[fieldName] !== user[fieldName]) {
								assert(false)
								return true
							}
						}
					}
					for (const i in data.userTypes) {
						const userType = data.userTypes[i],
							userTypeFromDB = userTypeList[userTypeIdIndexMap[userType.id]]
						for (const fieldName in userType) {
							if (userTypeFromDB[fieldName] !== userType[fieldName]) {
								assert(false)
								return true
							}
						}
					}
					assert(true)
					return true
				})
			})
		})
	},
	testSync: function() {
		const instance = this,
			{config} = this
		let changeableInstance = this
		describe('migrations.sync', function() {
			it('should throw an error if the syncHistoryPath does not exist or is not a valid directory', function() {
				return co(function*() {
					const originalPath = config.migrations.syncHistoryPath
					let didThrowAnError = false
					changeableInstance.config.migrations.syncHistoryPath = 'fakePath'
					try {
						yield instance.sync()
					} catch(e) {
						didThrowAnError = true
					}
					changeableInstance.config.migrations.syncHistoryPath = originalPath
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully and generate a preSync file if all parameters are correct', function() {
				return co(function*() {
					let currentDirData = yield fs.readdir(config.migrations.syncHistoryPath),
						wasSuccessful = false
					yield instance.sync()
					wasSuccessful = currentDirData.length !== (yield fs.readdir(config.migrations.syncHistoryPath)).length
					try {
						yield fs.emptyDir(config.migrations.syncHistoryPath)
					} catch(e) {
					}
					assert(wasSuccessful)
					return true
				})
			})
		})
	},
	testGenerateSeed: function() {
		const instance = this,
			{config} = this
		let changeableInstance = this
		describe('migrations.generateSeed', function() {
			it('should throw an error with the correct message if the provided seedFileName is not a non-empty string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.generateSeed()
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid seedFileName string provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error if the seedFilesPath does not exist or is not a valid directory', function() {
				return co(function*() {
					const originalPath = config.migrations.seedFilesPath
					let didThrowAnError = false
					changeableInstance.config.migrations.seedFilesPath = 'fakePath'
					try {
						yield instance.generateSeed()
					} catch(e) {
						didThrowAnError = true
					}
					changeableInstance.config.migrations.seedFilesPath = originalPath
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully and generate a preSync file if all parameters are correct', function() {
				return co(function*() {
					let currentSeedFilesDirData = yield fs.readdir(config.migrations.seedFilesPath),
						wasSuccessful = false
					yield instance.generateSeed('ramsterTestSeedFile')
					wasSuccessful = currentSeedFilesDirData.length !== (yield fs.readdir(config.migrations.seedFilesPath)).length
					try {
						yield fs.emptyDir(config.migrations.syncHistoryPath)
					} catch(e) {
					}
					assert(wasSuccessful)
					return true
				})
			})
		})
	},
	testSeed: function() {
		const instance = this,
			{config} = this
		describe('migrations.seed', function() {
			it('should throw an error with the correct message if the provided seedFolderName is not a non-empty string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.seed()
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid seedFolderName string provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error with the correct message if the provided seedFileName is not a non-empty string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.seed('someFolder')
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid seedFileName string provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error if the provided seedFolderName and seedFileName do not exist', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.seed('someFolder', 'someFile')
					} catch(e) {
						didThrowAnError = true
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully and generate a preSeed file if all parameters are correct', function() {
				return co(function*() {
					let currentSyncHistoryDirData = yield fs.readdir(config.migrations.syncHistoryPath),
						wasSuccessful = false
					yield instance.seed('seedFiles', 'ramsterTestSeedFile')
					wasSuccessful = currentSyncHistoryDirData.length !== (yield fs.readdir(config.migrations.syncHistoryPath)).length
					try {
						yield fs.emptyDir(config.migrations.syncHistoryPath)
						yield fs.remove(path.join(config.migrations.seedFilesPath, 'ramsterTestSeedFile.json'))
					} catch(e) {
					}
					assert(wasSuccessful)
					return true
				})
			})
		})
	},
	testGenerateBackup: function() {
		const instance = this,
			{config} = this
		let changeableInstance = this
		describe('migrations.generateBackup', function() {
			it('should throw an error if the backupPath does not exist or is not a valid directory', function() {
				return co(function*() {
					const originalPath = config.migrations.backupPath
					let didThrowAnError = false
					changeableInstance.config.migrations.backupPath = 'fakePath'
					try {
						yield instance.generateBackup()
					} catch(e) {
						didThrowAnError = true
					}
					changeableInstance.config.migrations.backupPath = originalPath
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully and generate a backup file if all parameters are correct', function() {
				return co(function*() {
					let currentBackupDirData = yield fs.readdir(config.migrations.backupPath),
						wasSuccessful = false
					yield instance.generateBackup()
					wasSuccessful = currentBackupDirData.length !== (yield fs.readdir(config.migrations.backupPath)).length
					try {
						yield fs.emptyDir(config.migrations.backupPath)
					} catch(e) {
					}
					assert(wasSuccessful)
					return true
				})
			})
		})
	},
	testInsertStaticData: function() {
		const instance = this,
			{config} = this
		let changeableInstance = this
		describe('migrations.insertStaticData', function() {
			it('should throw an error if the staticDataPath does not exist or is not a valid directory', function() {
				return co(function*() {
					const originalPath = config.migrations.staticDataPath
					let didThrowAnError = false
					changeableInstance.config.migrations.staticDataPath = 'fakePath'
					try {
						yield instance.insertStaticData()
					} catch(e) {
						didThrowAnError = true
					}
					changeableInstance.config.migrations.staticDataPath = originalPath
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error if no staticData.json file exists at the staticDataPath or is not a valid json file', function() {
				return co(function*() {
					const originalPath = config.migrations.staticDataPath
					let didThrowAnError = false
					changeableInstance.config.migrations.staticDataPath = config.migrations.syncHistoryPath
					try {
						yield instance.insertStaticData()
					} catch(e) {
						didThrowAnError = true
					}
					changeableInstance.config.migrations.staticDataPath = originalPath
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully and generate a preStaticDataInsert file if all parameters are correct', function() {
				return co(function*() {
					let currentSyncHistoryDirData = yield fs.readdir(config.migrations.syncHistoryPath),
						wasSuccessful = false
					yield instance.insertStaticData()
					wasSuccessful = currentSyncHistoryDirData.length !== (yield fs.readdir(config.migrations.syncHistoryPath)).length
					try {
						yield fs.emptyDir(config.migrations.syncHistoryPath)
					} catch(e) {
					}
					assert(wasSuccessful)
					return true
				})
			})
		})
	}
}

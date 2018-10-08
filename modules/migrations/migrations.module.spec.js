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
			// it('should execute testListen successfully', function() {
			// 	instance.testListen()
			// })
			it('should execute testGetFullTableData successfully', function() {
				instance.testGetFullTableData()
			})
			it('should execute testGetTableLayout successfully', function() {
				instance.testGetTableLayout()
			})
			it('should execute testRemoveAllTables successfully', function() {
				instance.testRemoveAllTables()
			})
			it('should execute testRunQueryFromColumnData successfully', function() {
				instance.testRunQueryFromColumnData()
			})
			it('should execute testEscapeRecursively successfully', function() {
				instance.testEscapeRecursively()
			})
			it('should execute testPrepareDataObjectForQuery successfully', function() {
				instance.testPrepareDataObjectForQuery()
			})
			it('should execute testGetLinearArrayFromDependencyGraph successfully', function() {
				instance.testGetLinearArrayFromDependencyGraph()
			})
			it('should execute testPrepareColumnData successfully', function() {
				instance.testPrepareColumnData()
			})
			it('should execute testInsertData successfully', function() {
				instance.testInsertData()
			})
			it('should execute testSync successfully', function() {
				instance.testSync()
			})
			it('should execute testGenerateSeed successfully', function() {
				instance.testGenerateSeed()
			})
			it('should execute testSeed successfully', function() {
				instance.testSeed()
			})
			it('should execute testGenerateBackup successfully', function() {
				instance.testGenerateBackup()
			})
			it('should execute testInsertStaticData successfully', function() {
				instance.testInsertStaticData()
			})
		})
	},
	testListen: function() {
		const instance = this
		describe('migrations.listen', function() {
			it('should execute successfully', function(done) {
				instance.listen()
				setTimeout(() => instance.server.close(), 500)
			})
		})
	},
	testGetFullTableData: function() {
		const instance = this
		describe('migrations.getFullTableData', function() {
			it('should execute successfully', function() {
				return co(function*() {
					yield instance.getFullTableData()
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
					yield instance.sequelize.transaction().then((t) => {
						return co(function*() {
							yield instance.removeAllTables(t)
							fullTableData = yield instance.getFullTableData(t)
							return t.rollback()
						})
					})
					assert(fullTableData, `bad value ${fullTableData} for fullTableData, expected it to exist`)
					let keysLength = Object.keys(fullTableData).length
					assert.strictEqual(keysLength, 0, `bad value ${keysLength} for keysLength, expected 0`)
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
						if (e && (e.customMessage === 'Invalid queryInterface object provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, true, 'no error was thrown')
					return true
				})
			})
			it('should throw an error with the correct message if tableName is not a string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface)
					} catch(e) {
						if (e && (e.customMessage === 'Invalid tableName string provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error was thrown')
					return true
				})
			})
			it('should throw an error with the correct message if tableName is an empty string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, '')
					} catch(e) {
						if (e && (e.customMessage === 'Invalid tableName string provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error was thrown')
					return true
				})
			})
			it('should throw an error with the correct message if inserts is not a json object', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, 'userTypes')
					} catch(e) {
						if (e && (e.customMessage === 'At table "userTypes": invalid inserts object provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error was thrown')
					return true
				})
			})
			it('should throw an error with the correct message if inserts.columns is not an array', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, 'userTypes', {})
					} catch(e) {
						if (e && (e.customMessage === 'At table "userTypes": inserts.columns must be a non-empty array.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error was thrown')
					return true
				})
			})
			it('should throw an error with the correct message if inserts.columns is an empty array', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, 'userTypes', {columns: []})
					} catch(e) {
						if (e && (e.customMessage === 'At table "userTypes": inserts.columns must be a non-empty array.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error was thrown')
					return true
				})
			})
			it('should throw an error with the correct message if inserts.values is not an array', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, 'userTypes', {columns: ['id']})
					} catch(e) {
						if (e && (e.customMessage === 'At table "userTypes": inserts.values must be an array.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error was thrown')
					return true
				})
			})
			it('should throw an error with the correct message if deleteTableContents is provided, but is not an array', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, 'userTypes', {columns: ['id'], values: []}, 'dummyTransaction', {deleteTableContents: 'blabla'})
					} catch(e) {
						if (e && (e.customMessage === 'At table "userTypes": if provided, deleteTableContents must be an array.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error was thrown')
					return true
				})
			})
			it('should throw an error with the correct message if an inserts.values item is not an array', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, 'userTypes', {columns: ['id'], values: ['wrongItem']})
					} catch(e) {
						if (e && (e.customMessage === 'At table "userTypes", item no. 0: inserts.values items must be arrays.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error was thrown')
					return true
				})
			})
			it('should throw an error with the correct message if an inserts.values item has more columns than inserts.columns', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, 'userTypes', {columns: ['id'], values: [[1, 2]]})
					} catch(e) {
						if (e && (e.customMessage === 'At table "userTypes", item no. 0: the number of fields in this item does not match the number of columns in inserts.columns.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error was thrown')
					return true
				})
			})
			it('should throw an error with the correct message if an inserts.values item has less columns than inserts.columns', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData(queryInterface, 'userTypes', {columns: ['id'], values: [[]]})
					} catch(e) {
						if (e && (e.customMessage === 'At table "userTypes", item no. 0: the number of fields in this item does not match the number of columns in inserts.columns.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, 'no error was thrown')
					return true
				})
			})
			it('should execute successfully if all parameters are correct, deleteTableContents is not provided and dontSetIdSequence is not set to true', function() {
				return co(function*() {
					let now = moment.utc().valueOf(),
						data = null
					yield instance.sequelize.transaction().then((t) => {
						return co(function*() {
							yield instance.runQueryFromColumnData(queryInterface,
								'userTypes', {
									columns: ['id', 'name', 'description', 'active', 'createdAt', 'updatedAt'],
									values: [[1500, `Test type 1 - ${now}`, 'TT1', true, 'now()', 'now()']]
								},
								t
							)
							data = (yield sequelize.query(`select * from "userTypes" where "id"=1500;`, {transaction: t}))[0]
							return t.rollback()
						})
					})
					assert(data, `bad value ${data} for data, expected it to exist`)
					assert(data.length > 0, `bad value ${data.length} for data.length, expected > 0`)
					return true
				})
			})
			it('should execute successfully if all parameters are correct, deleteTableContents is a valid array containing the table name and dontSetIdSequence is not set to true', function() {
				return co(function*() {
					let now = moment.utc().valueOf(),
						data = null
					yield instance.sequelize.transaction().then((t) => {
						return co(function*() {
							yield instance.runQueryFromColumnData(queryInterface, 
								'userTypes', {
									columns: ['id', 'name', 'description', 'active', 'createdAt', 'updatedAt'],
									values: [[1500, `Test type 1 - ${now}`, 'TT1', true, 'now()', 'now()']]
								},
								t,
								{deleteTableContents: ['userTypes']}
							)
							data = (yield sequelize.query(`select * from "userTypes" where "id"=1500;`, {transaction: t}))[0]
							return t.rollback()
						})
					})
					assert(data, `bad value ${data} for data, expected it to exist`)
					assert(data.length > 0, `bad value ${data.length} for data.length, expected > 0`)
					return true
				})
			})
			it('should execute successfully if all parameters are correct, deleteTableContents is not provided and dontSetIdSequence is set to true', function() {
				return co(function*() {
					let now = moment.utc().valueOf(),
						data = null
					yield instance.sequelize.transaction().then((t) => {
						return co(function*() {
							yield instance.runQueryFromColumnData(queryInterface, 
								'userTypes', {
									columns: ['id', 'name', 'description', 'active', 'createdAt', 'updatedAt'],
									values: [[1500, `Test type 1 - ${now}`, 'TT1', true, 'now()', 'now()']]
								},
								t,
								{dontSetIdSequence: true}
							)
							data = (yield sequelize.query(`select * from "userTypes" where "id"=1500;`, {transaction: t}))[0]
							return t.rollback()
						})
					})
					assert(data, `bad value ${data} for data, expected it to exist`)
					assert(data.length > 0, `bad value ${data.length} for data.length, expected > 0`)
					return true
				})
			})
			it('should execute successfully if all parameters are correct, deleteTableContents is a valid array containing the table name and dontSetIdSequence is set to true', function() {
				return co(function*() {
					let now = moment.utc().valueOf(),
						data = null
					yield instance.sequelize.transaction().then((t) => {
						return co(function*() {
							yield instance.runQueryFromColumnData(queryInterface, 
								'userTypes', {
									columns: ['id', 'name', 'description', 'active', 'createdAt', 'updatedAt'],
									values: [[1500, `Test type 1 - ${now}`, 'TT1', true, 'now()', 'now()']]
								},
								t,
								{deleteTableContents: ['userTypes'], dontSetIdSequence: true}
							)
							data = (yield sequelize.query(`select * from "userTypes" where "id"=1500;`, {transaction: t}))[0]
							return t.rollback()
						})
					})
					assert(data, `bad value ${data} for data, expected it to exist`)
					assert(data.length > 0, `bad value ${data.length} for data.length, expected > 0`)
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
				assert(didThrowAnError, true, 'no error was thrown')
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
					}),
					tp = escapedObject.testProperty,
					maValuesShouldBe = [true, false, 1, 'yay', null, undefined, 'foo']
				assert(tp instanceof Array, `bad value ${tp} for escapedObject.testProperty, expected an array`)
				assert.strictEqual(tp[0], 'someString', `bad value ${tp[0]} for escapedObject.testProperty[0], expected someString`)
				assert.strictEqual(tp[1], 'otherString"', `bad value ${tp[1]} for escapedObject.testProperty[1], expected otherString"`)
				let {stringy, misterArray} = tp[2].innerObject
				assert.strictEqual(stringy, 'test', `bad value ${stringy} for escapedObject.testProperty[2].innerObject.stringy, expected test`)
				assert(misterArray instanceof Array, `bad value ${misterArray} for escapedObject.testProperty[2].innerObject.misterArray, expected an array`)
				for (const i in misterArray) {
					const maItem = misterArray[i],
						itemShouldBe = maValuesShouldBe[i]
					assert.strictEqual(maItem, itemShouldBe, `bad value ${maItem} for escapedObject.testProperty[2].innerObject.misterArray[${i}], expected ${itemShouldBe}`)
				}
				assert.strictEqual(escapedObject.bar.q, 'test', `bad value ${escapedObject.bar.q} for escapedObject.bar.q, expected test`)
				assert.strictEqual(tp[0], 'someString', `bad value ${tp[0]} for escapedObject.testProperty[0], expected someString`)
				assert.strictEqual(escapedObject.bar.q, 'test', `bad value ${escapedObject.bar.q} for escapedObject.bar.q, expected test`)
				assert.strictEqual(escapedObject.test, null, `bad value ${escapedObject.test} for escapedObject.test, expected test`)
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
					if (e && (e.customMessage === 'Invalid tableLayout array provided.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if dataObject is not an object', function() {
				let didThrowAnError = false
				try {
					instance.prepareDataObjectForQuery(['testColumn'])
				} catch(e) {
					if (e && (e.customMessage === 'Invalid dataObject provided.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert(didThrowAnError, 'no error was thrown')
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
					tp = JSON.parse(values[0]),
					columnsShouldBe = ['testProperty', 'bar', 'test'],
					maValuesShouldBe = [true, false, 1, 'yay', null, null, 'foo']
				assert.strictEqual(columns.length, 3, `bad value ${columns.length} for columns.length, expected 3`)
				assert.strictEqual(values.length, 3, `bad value ${values.length} for values.length, expected 3`)
				for (const i in columns) {
					const cv = columns[i],
						cvShouldBe = columnsShouldBe[i]
					assert.strictEqual(cv[i], cvShouldBe[i], `bad value ${cv[i]} for columns[${i}], expected ${cvShouldBe[i]}`)
				}
				assert(tp instanceof Array, `bad value ${tp} for values[0].testProperty, expected an array`)
				assert.strictEqual(tp[0], 'someString', `bad value ${tp[0]} for values[0].testProperty[0], expected someString`)
				assert.strictEqual(tp[1], 'otherString"', `bad value ${tp[1]} for values[0].testProperty[1], expected otherString"`)
				let {stringy, misterArray} = tp[2].innerObject
				assert.strictEqual(stringy, 'test', `bad value ${stringy} for values[0].testProperty[2].innerObject.stringy, expected test`)
				assert(misterArray instanceof Array, `bad value ${misterArray} for values[0].testProperty[2].innerObject.misterArray, expected an array`)
				for (const i in misterArray) {
					const maItem = misterArray[i],
						itemShouldBe = maValuesShouldBe[i]
					assert.strictEqual(maItem, itemShouldBe, `bad value ${maItem} for values[0].testProperty[2].innerObject.misterArray[${i}], expected ${itemShouldBe}`)
				}
				assert.strictEqual(JSON.parse(values[1]).q, 'test', `bad value ${JSON.parse(values[1]).q} for JSON.parse(values[1]).q, expected test`)
				assert.strictEqual(values[2], null, `bad value ${values[2]} for values[2], expected null`)
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
					if (e && (e.customMessage === 'Invalid dependencyGraph object provided.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if a dependencyGraph vertex does not contain a data object', function() {
				let didThrowAnError = false
				try {
					instance.getLinearArrayFromDependencyGraph({1: {}})
				} catch(e) {
					if (e && (e.customMessage === 'At vertex id 1: invalid data object.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert(didThrowAnError, 'no error was thrown')
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
					linearArray = instance.getLinearArrayFromDependencyGraph(dependencyGraph)
				assert.strictEqual(linearArray.length, 9, `bad value ${linearArray.length} for linearArray.length, expected 9`)
				for (const i in linearArray) {
					const idShouldBe = parseInt(i, 10) + 1
					assert.strictEqual(linearArray[i].id, idShouldBe, `bad value ${linearArray[i].id} for linearArray[i].id, expected "${idShouldBe}`)
				}
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
					if (e && (e.customMessage === 'Invalid data array provided.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert(didThrowAnError, true, 'no error was thrown')
			})
			it('should throw an error with the correct message if tableLayout is not an array', function() {
				let didThrowAnError = false
				try {
					instance.prepareColumnData([])
				} catch(e) {
					if (e && (e.customMessage === 'Invalid tableLayout array provided.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert(didThrowAnError, 'no error was thrown')
			})
			it('should throw an error with the correct message if sameTablePrimaryKey is not a string', function() {
				let didThrowAnError = false
				try {
					instance.prepareColumnData([], [], null)
				} catch(e) {
					if (e && (e.customMessage === 'Invalid sameTablePrimaryKey string provided.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert(didThrowAnError, 'no error was thrown')
			})
			it('should throw an error with the correct message if sameTablePrimaryKey an empty string', function() {
				let didThrowAnError = false
				try {
					instance.prepareColumnData([], [], '')
				} catch(e) {
					if (e && (e.customMessage === 'Invalid sameTablePrimaryKey string provided.')) {
						didThrowAnError = true
					} else {
						throw e
					}
				}
				assert(didThrowAnError, 'no error was thrown')
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
					assert.strictEqual(stringifiedColumns, stringifiedColumnsShouldEqual[i], `bad value ${stringifiedColumns} for stringifiedColumns, expected ${stringifiedColumnsShouldEqual[i]}`)
					assert.strictEqual(values.length, valuesLengthShouldBe[i], `bad value ${values.length} for values.length, expected ${valuesLengthShouldBe[i]}`)
					for (const j in values) {
						const item = values[j],
							idShouldBe = idColumnShouldBe[i][j]
						assert.strictEqual(item.length, columns.length, `bad value ${item.length} for item.length, expected ${columns.length}`)
						assert.strictEqual(item[0], idShouldBe, `bad value ${item[0]} for item[0], expected ${idShouldBe}`)
					}
				}
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
				assert(preparedData instanceof Array, `bad value ${preparedData} for preparedData, expected an array`)
				for (const i in preparedData) {
					const {columns, stringifiedColumns, values} = preparedData[i]
					assert.strictEqual(stringifiedColumns, stringifiedColumnsShouldEqual[i], `bad value ${stringifiedColumns} for stringifiedColumns, expected ${stringifiedColumnsShouldEqual[i]}`)
					assert.strictEqual(values.length, valuesLengthShouldBe[i], `bad value ${values.length} for values.length, expected ${valuesLengthShouldBe[i]}`)
					for (const j in values) {
						const item = values[j],
							idShouldBe = idColumnShouldBe[i][j]
						assert.strictEqual(item.length, columns.length, `bad value ${item.length} for item.length, expected ${columns.length}`)
						assert.strictEqual(item[0], idShouldBe, `bad value ${item[0]} for item[0], expected ${idShouldBe}`)
					}
				}
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
						if (e && (e.customMessage === 'Invalid data object provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, true, 'no error was thrown')
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
					// add this so we can test if it will skip the tables for which there is no layout
					data.absolutelyFakeAndInexistentTableName = [1, 2, 3, 4, 5]
					try {
						yield instance.insertData(data, {
								userTypes: ['id', 'name', 'description', 'active', 'createdAt', 'updatedAt'],
								users: ['id', 'typeId', 'firstName', 'lastName', 'email', 'password', 'active', 'createdAt', 'updatedAt']
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
							assert.strictEqual(userFromDB[fieldName], user[fieldName], `bad value ${userFromDB[fieldName]} for userFromDB[fieldName] expected ${user[fieldName]}`)
						}
					}
					for (const i in data.userTypes) {
						const userType = data.userTypes[i],
							userTypeFromDB = userTypeList[userTypeIdIndexMap[userType.id]]
						for (const fieldName in userType) {
							assert.strictEqual(userTypeFromDB[fieldName], userType[fieldName], `bad value ${userTypeFromDB[fieldName]} for userTypeFromDB[fieldName] expected ${userType[fieldName]}`)
						}
					}
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
								userTypes: ['id', 'name', 'description', 'active', 'createdAt', 'updatedAt'],
								users: ['id', 'typeId', 'firstName', 'lastName', 'email', 'password', 'active', 'createdAt', 'updatedAt']
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
							assert.strictEqual(userFromDB[fieldName], user[fieldName], `bad value ${userFromDB[fieldName]} for userFromDB[fieldName] expected ${user[fieldName]}`)
						}
					}
					for (const i in data.userTypes) {
						const userType = data.userTypes[i],
							userTypeFromDB = userTypeList[userTypeIdIndexMap[userType.id]]
						for (const fieldName in userType) {
							assert.strictEqual(userTypeFromDB[fieldName], userType[fieldName], `bad value ${userTypeFromDB[fieldName]} for userTypeFromDB[fieldName] expected ${userType[fieldName]}`)
						}
					}
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
					assert(didThrowAnError, true, 'no error was thrown')
					return true
				})
			})
			it('should execute successfully and generate a preSync file if all parameters are correct', function() {
				return co(function*() {
					let currentDirData = yield fs.readdir(config.migrations.syncHistoryPath)
					yield instance.sync()
					let newLength = (yield fs.readdir(config.migrations.syncHistoryPath)).length
					assert(newLength > currentDirData.length, `bad value ${newLength} for newLength, expected it to be greater than ${currentDirData.length}`)
					try {
						yield fs.emptyDir(config.migrations.syncHistoryPath)
					} catch(e) {
					}
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
						if (e && (e.customMessage === 'Invalid seedFileName string provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, true, 'no error was thrown')
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
					assert(didThrowAnError, true, 'no error was thrown')
					return true
				})
			})
			it('should execute successfully and generate a preSync file if all parameters are correct', function() {
				return co(function*() {
					let currentSeedFilesDirData = yield fs.readdir(config.migrations.seedFilesPath)
					yield instance.generateSeed('ramsterTestSeedFile')
					let newLength = (yield fs.readdir(config.migrations.seedFilesPath)).length
					assert(newLength > currentSeedFilesDirData.length, `bad value ${newLength} for newLength, expected it to be greater than ${currentSeedFilesDirData.length}`)
					try {
						yield fs.emptyDir(config.migrations.syncHistoryPath)
					} catch(e) {
					}
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
						if (e && (e.customMessage === 'Invalid seedFolderName string provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, true, 'no error was thrown')
					return true
				})
			})
			it('should throw an error with the correct message if the provided seedFileName is not a non-empty string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.seed('someFolder')
					} catch(e) {
						if (e && (e.customMessage === 'Invalid seedFileName string provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert(didThrowAnError, true, 'no error was thrown')
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
					assert(didThrowAnError, true, 'no error was thrown')
					return true
				})
			})
			it('should execute successfully and generate a preSeed file if all parameters are correct', function() {
				return co(function*() {
					let currentSyncHistoryDirData = yield fs.readdir(config.migrations.syncHistoryPath)
					yield instance.seed('seedFiles', 'ramsterTestSeedFile')
					let newLength = (yield fs.readdir(config.migrations.syncHistoryPath)).length
					assert(newLength > currentSyncHistoryDirData.length, `bad value ${newLength} for newLength, expected it to be greater than ${currentSyncHistoryDirData.length}`)
					try {
						yield fs.emptyDir(config.migrations.syncHistoryPath)
						yield fs.remove(path.join(config.migrations.seedFilesPath, 'ramsterTestSeedFile.json'))
					} catch(e) {
					}
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
					assert(didThrowAnError, true, 'no error was thrown')
					return true
				})
			})
			it('should execute successfully and generate a backup file if all parameters are correct', function() {
				return co(function*() {
					let currentBackupDirData = yield fs.readdir(config.migrations.backupPath)
					yield instance.generateBackup()
					let newLength = (yield fs.readdir(config.migrations.backupPath)).length
					assert(newLength > currentBackupDirData.length, `bad value ${newLength} for newLength, expected it to be greater than ${currentBackupDirData.length}`)
					try {
						yield fs.emptyDir(config.migrations.backupPath)
					} catch(e) {
					}
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
					assert(didThrowAnError, true, 'no error was thrown')
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
					assert(didThrowAnError, true, 'no error was thrown')
					return true
				})
			})
			it('should execute successfully and generate a preStaticDataInsert file if all parameters are correct and no staticData fileName is provided', function() {
				return co(function*() {
					let currentSyncHistoryDirData = yield fs.readdir(config.migrations.syncHistoryPath)
					yield instance.insertStaticData()
					let newLength = (yield fs.readdir(config.migrations.syncHistoryPath)).length
					assert(newLength > currentSyncHistoryDirData.length, `bad value ${newLength} for newLength, expected it to be greater than ${currentSyncHistoryDirData.length}`)
					try {
						yield fs.emptyDir(config.migrations.syncHistoryPath)
					} catch(e) {
					}
					return true
				})
			})
			it('should execute successfully and generate a preStaticDataInsert file if all parameters are correct and a staticData fileName is provided', function() {
				return co(function*() {
					let currentSyncHistoryDirData = yield fs.readdir(config.migrations.syncHistoryPath),
						testFilePath = path.join(config.migrations.staticDataPath, 'staticDataTest.json'),
						fd = yield fs.open(testFilePath, 'w')
					yield fs.write(fd, yield fs.readFile(path.join(config.migrations.staticDataPath, 'staticData.json')))
					yield fs.close(fd)
					yield instance.insertStaticData('staticDataTest')
					let newLength = (yield fs.readdir(config.migrations.syncHistoryPath)).length
					assert(newLength > currentSyncHistoryDirData.length, `bad value ${newLength} for newLength, expected it to be greater than ${currentSyncHistoryDirData.length}`)
					try {
						yield fs.emptyDir(config.migrations.syncHistoryPath)
						yield fs.remove(testFilePath)
					} catch(e) {
					}
					return true
				})
			})
		})
	}
}

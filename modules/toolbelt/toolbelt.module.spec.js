'use strict'
const
	assert = require('assert'),
	co = require('co'),
	fs = require('fs-extra'),
	moment = require('moment'),
	path = require('path'),
	toolbelt = require('./index')

module.exports = {
	testAll: function() {
		const instance = this
		describe('toolbelt', function() {
			it('should execute testArraySort successfully', function() {
				instance.testArraySort()
			})
			it('should execute testChangeKeyCase successfully', function() {
				instance.testChangeKeyCase()
			})
			it('should execute testCheckRoutes successfully', function() {
				instance.testCheckRoutes()
			})
			it('should execute testEmptyToNull successfully', function() {
				instance.testEmptyToNull()
			})
			it('should execute testFindVertexByIdDFS successfully', function() {
				instance.testFindVertexByIdDFS()
			})
			it('should execute testGetFolderSize successfully', function() {
				instance.testGetFolderSize()
			})
			it('should execute testGetNested successfully', function() {
				instance.testGetNested()
			})
			it('should execute testGenerateRandomNumber successfully', function() {
				instance.testGenerateRandomNumber()
			})
			it('should execute testGenerateRandomString successfully', function() {
				instance.testGenerateRandomString()
			})
			it('should execute testParseDate successfully', function() {
				instance.testParseDate()
			})
			it('should execute testSetNested successfully', function() {
				instance.testSetNested()
			})
		})
	},
	testArraySort: function() {
		const arraySort = toolbelt.arraySort
		describe('toolbelt.arraySort', function() {
			it('should throw an error with the correct message if the array argument is not an array', function() {
				let didThrowAnError = false
				try {
					arraySort()
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid array provided.')
				}
				assert(didThrowAnError)
			})
			it('should throw an error with the correct message if the orderBy argument is not an array', function() {
				let didThrowAnError = false
				try {
					arraySort([])
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid orderBy array provided.')
				}
				assert(didThrowAnError)
			})
			it('should throw an error with the correct message if the orderBy argument is an empty array', function() {
				let didThrowAnError = false
				try {
					arraySort([])
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid orderBy array provided.')
				}
				assert(didThrowAnError)
			})
			it('should throw an error if an orderBy array argument is not an array', function() {
				let didThrowAnError = false
				try {
					arraySort([1, 2, 3], [''])
				} catch(e) {
					didThrowAnError = true
				}
				assert(didThrowAnError)
			})
			it('should execute successfully and sort the array in an ascending order, if all parameters are correct and haveValuesOnly is not set', function() {
				let sortedArray = arraySort([{id: 5}, {id: 1}, {id: 3}, {id: 2}, {id: 4}, {id: 7}, {id: 6}], [['id', 'asc']]),
					dataIsGood = true
				for (const i in sortedArray) {
					if (sortedArray[i].id !== (parseInt(i, 10) + 1)) {
						dataIsGood = false
						break
					}
				}
				assert(dataIsGood)
			})
			it('should execute successfully and sort the array in an ascending order, if all parameters are correct and haveValuesOnly is set', function() {
				let sortedArray = arraySort([{id: 5}, {id: 1}, {id: null}, {id: 3}, {id: 2}, {id: undefined}, {id: 4}, {id: 7}, {id: 6}], [['id', 'asc', 'haveValuesOnly']]),
					dataIsGood = true
				for (const i in sortedArray) {
					let index = parseInt(i, 10) + 1
					if (index < 3) {
						continue
					}
					if (sortedArray[i].id !== (index - 2)) {
						dataIsGood = false
						break
					}
				}
				assert(dataIsGood)
			})
			it('should execute successfully and sort the array in a descending order, if all parameters are correct and haveValuesOnly is not set', function() {
				let sortedArray = arraySort([{id: 5}, {id: 1}, {id: 3}, {id: 2}, {id: 4}, {id: 7}, {id: 6}], [['id', 'desc']]),
					idsShouldBe = [7, 6, 5, 4, 3, 2, 1],
					dataIsGood = true
				for (const i in sortedArray) {
					if (sortedArray[i].id !== idsShouldBe[i]) {
						dataIsGood = false
						break
					}
				}
				assert(dataIsGood)
			})
			it('should execute successfully and sort the array in a descending order, if all parameters are correct and haveValuesOnly is set', function() {
				let sortedArray = arraySort([{id: 5}, {id: 1}, {id: null}, {id: 3}, {id: 2}, {id: undefined}, {id: 4}, {id: 7}, {id: 6}], [['id', 'desc', 'haveValuesOnly']]),
					idsShouldBe = [7, 6, 5, 4, 3, 2, 1, null, undefined],
					dataIsGood = true
				for (const i in sortedArray) {
					if (sortedArray[i].id !== idsShouldBe[i]) {
						dataIsGood = false
						break
					}
				}
				assert(dataIsGood)
			})
		})
	},
	testChangeKeyCase: function() {
		const changeKeyCase = toolbelt.changeKeyCase
		describe('toolbelt.changeKeyCase', function() {
			it('should throw an error with the correct message if the keyMap argument is not an array', function() {
				let didThrowAnError = false
				try {
					changeKeyCase()
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid keyMap array provided.')
				}
				assert(didThrowAnError)
			})
			it('should throw an error with the correct message if the outputType argument is "lower" or "upper"', function() {
				let didThrowAnError = false
				try {
					changeKeyCase([], '')
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid outputType: should be "lower" or "upper"')
				}
				assert(didThrowAnError)
			})
			it('should execute successfully and return null if undefined is provided as input', function() {
				assert(changeKeyCase([], undefined, 'lower') === undefined)
			})
			it('should execute successfully and return null if null is provided as input', function() {
				assert(changeKeyCase([], null, 'lower') === null)
			})
			it('should execute successfully if a string is provided as input and outputType is "upper"', function() {
				assert(changeKeyCase([
						{lower: 'testKey', upper: 'TestKey'},
						{lower: 'testKey1', upper: 'TestKey1'},
						{lower: 'testKey2', upper: 'TestKey2'},
						{lower: 'testKey3', upper: 'TestKey3'},
						{lower: 'testKey4', upper: 'TestKey4'}
					],
					'?testKey=1&testKey2=2&TestKey3=3&testKey4=4',
					'upper'
				) === '?TestKey=1&TestKey2=2&TestKey3=3&TestKey4=4')
			})
			it('should execute successfully if a string is provided as input and outputType is "lower"', function() {
				assert(changeKeyCase([
						{lower: 'testKey', upper: 'TestKey'},
						{lower: 'testKey1', upper: 'TestKey1'},
						{lower: 'testKey2', upper: 'TestKey2'},
						{lower: 'testKey3', upper: 'TestKey3'},
						{lower: 'testKey4', upper: 'TestKey4'}
					],
					'?TestKey=1&TestKey2=2&testKey3=3&TestKey4=4',
					'lower'
				) === '?testKey=1&testKey2=2&testKey3=3&testKey4=4')
			})
			it('should execute successfully if an object is provided as input and outputType is "upper"', function() {
				assert(changeKeyCase([
						{lower: 'testKey', upper: 'TestKey'},
						{lower: 'testKey1', upper: 'TestKey1'},
						{lower: 'testKey2', upper: 'TestKey2'},
						{lower: 'testKey3', upper: 'TestKey3'},
						{lower: 'testKey4', upper: 'TestKey4'}
					],
					{testKey: 1, testKey2: 2, TestKey3: 3, testKey4: 4},
					'upper'
				) === JSON.stringify({TestKey: 1, TestKey2: 2, TestKey3: 3, TestKey4: 4}))
			})
			it('should execute successfully if an object is provided as input and outputType is "lower"', function() {
				assert(changeKeyCase([
						{lower: 'testKey', upper: 'TestKey'},
						{lower: 'testKey1', upper: 'TestKey1'},
						{lower: 'testKey2', upper: 'TestKey2'},
						{lower: 'testKey3', upper: 'TestKey3'},
						{lower: 'testKey4', upper: 'TestKey4'}
					],
					{TestKey: 1, TestKey2: 2, testKey3: 3, TestKey4: 4},
					'lower'
				) === JSON.stringify({testKey: 1, testKey2: 2, testKey3: 3, testKey4: 4}))
			})
		})
	},
	testCheckRoutes: function() {
		const checkRoutes = toolbelt.checkRoutes
		describe('toolbelt.checkRoutes', function() {
			it('should throw an error with the correct message if the route argument is not a string', function() {
				let didThrowAnError = false
				try {
					checkRoutes()
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'The route argument must be a non-empty string.')
				}
				assert(didThrowAnError)
			})
			it('should throw an error with the correct message if the route argument is an empty string', function() {
				let didThrowAnError = false
				try {
					checkRoutes('')
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'The route argument must be a non-empty string.')
				}
				assert(didThrowAnError)
			})
			it('should throw an error with the correct message if the routes argument is not an array', function() {
				let didThrowAnError = false
				try {
					checkRoutes('/test')
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'The routes argument must be an array.')
				}
				assert(didThrowAnError)
			})
			it('should execute successfully and return true if the route is found', function() {
				assert(checkRoutes('/test', ['/notTest', '/t/:1', '/test']) === true)
			})
			it('should execute successfully and return true if the route has routeParams and is found', function() {
				assert(checkRoutes('/t/param', ['/notTest', '/t/:1', '/test']) === true)
			})
			it('should execute successfully and return false if the route is not found', function() {
				assert(checkRoutes('/notGoingToFindIt', ['/notTest', '/t/:1', '/test']) === false)
			})
		})
	},
	testEmptyToNull: function() {
		const emptyToNull = toolbelt.emptyToNull
		describe('toolbelt.emptyToNull', function() {
			it('should execute successfully and return null if the data is undefined', function() {
				assert(emptyToNull() === null)
			})
			it('should execute successfully and return null if the data is null', function() {
				assert(emptyToNull(null) === null)
			})
			it('should execute successfully and return null if the data is an empty string', function() {
				assert(emptyToNull('') === null)
			})
			it('should execute successfully and return the data as it is if it\'s not undefined, null, an object or a string', function() {
				assert((emptyToNull(1) === 1) && (emptyToNull(true) === true))
			})
			it('should execute successfully if all parameters are correct and data is an object or an array', function() {
				let data = emptyToNull({
					test1: 'test1string',
					t: ['', {test2: true}, 2],
					a: undefined,
					b: null,
					c: 567,
					d: ''
				})
				assert(
					(data.test1 === 'test1string') &&
					(data.t instanceof Array) &&
					(data.t[0] === null) &&
					(data.t[1].test2 === true) &&
					(data.t[2] === 2) &&
					(data.a === null) &&
					(data.b === null) &&
					(data.c === 567) &&
					(data.d === null)
				)
			})
		})
	},
	testFindVertexByIdDFS: function() {
		const findVertexByIdDFS = toolbelt.findVertexByIdDFS
		describe('toolbelt.findVertexByIdDFS', function() {
			it('should throw an error with the correct message if vertexId is undefined', function() {
				let didThrowAnError = false
				try {
					findVertexByIdDFS()
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid vertexId provided.')
				}
			})
			it('should throw an error with the correct message if vertexId is null', function() {
				let didThrowAnError = false
				try {
					findVertexByIdDFS(null)
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid vertexId provided.')
				}
			})
			it('should execute successfully and return null if the graph is undefined', function() {
				assert(findVertexByIdDFS(1) === null)
			})
			it('should execute successfully and return null if the graph is null', function() {
				assert(findVertexByIdDFS(1, null) === null)
			})
			it('should execute successfully and return null if the graph is not an object', function() {
				assert(findVertexByIdDFS(1, true) === null)
			})
			it('should execute successfully and return true if all parameters are correct and the action is not specified', function() {
				assert(
					findVertexByIdDFS('veryInnerId', {
						test1: 'test1string',
						a: undefined,
						b: null,
						c: 567,
						t: {
							vertices: {
								f: {
									vertices: [
										'', {
											vertices: {
												test2: true,
												innerTest: {vertices: {veryInnerId: 25}}
											}
										},
										2
									]
								}
							}
						},
						d: ''
					}) === true
				)
			})
			it('should execute successfully and return the vertex if all parameters are correct and the action is "get"', function() {
				assert(
					findVertexByIdDFS('veryInnerId', {
						test1: 'test1string',
						a: undefined,
						b: null,
						c: 567,
						t: {
							vertices: {
								f: {
									vertices: [
										'', {
											vertices: {
												test2: true,
												innerTest: {vertices: {veryInnerId: 25}}
											}
										},
										2
									]
								}
							}
						},
						d: ''
					}, 'get') === 25
				)
			})
			it('should execute successfully and delete the vertex if all parameters are correct and the action is "delete"', function() {
				let graph = {
					test1: 'test1string',
					a: undefined,
					b: null,
					c: 567,
					t: {
						vertices: {
							f: {
								vertices: [
									'', {
										vertices: {
											test2: true,
											innerTest: {vertices: {veryInnerId: 25}}
										}
									},
									2
								]
							}
						}
					},
					d: ''
				}
				findVertexByIdDFS('veryInnerId', graph, 'delete')
				assert(findVertexByIdDFS('veryInnerId', graph, 'get') === null)
			})
		})
	},
	testGetFolderSize: function() {
		const getFolderSize = toolbelt.getFolderSize
		describe('toolbelt.getFolderSize', function() {
			it('should throw an error if folderPath does not point to an existing entity', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield getFolderSize()
					} catch(e) {
						didThrowAnError = true
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully and return the entity size in bytes if folderPath points to a file and unit is not set', function() {
				return co(function*() {
					let fileSize = yield getFolderSize(path.join(__dirname, 'index.js'))
					assert((fileSize / 1000) > 0)
					return true
				})
			})
			it('should execute successfully and return the entity size in bytes if folderPath points to a folder and unit is not set', function() {
				return co(function*() {
					let folderSize = yield getFolderSize(path.join(__dirname, '../toolbelt'))
					assert((folderSize / 10000) > 0)
					return true
				})
			})
			it('should execute successfully and return the entity size in megabytes if folderPath points to a folder and unit is set to 2', function() {
				return co(function*() {
					let folderSize = yield getFolderSize(path.join(__dirname, '../toolbelt'), 2)
					assert(folderSize < 0.05)
					return true
				})
			})
		})
	},
	testGenerateRandomNumber: function() {
		const generateRandomNumber = toolbelt.generateRandomNumber
		describe('toolbelt.generateRandomNumber', function() {
			it('should throw an error with the correct message if the length argument is not a number greater than or equal to 1', function() {
				let didThrowAnError = false
				try {
					generateRandomNumber()
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid length number provided.')
				}
				assert(didThrowAnError)
			})
			it('should execute successfully and return a random number if al paramters are correct', function() {
				assert(typeof generateRandomNumber(10) === 'number')
			})
		})
	},
	testGenerateRandomString: function() {
		const generateRandomString = toolbelt.generateRandomString
		describe('toolbelt.generateRandomString', function() {
			it('should throw an error with the correct message if the length argument is not a number greater than or equal to 1', function() {
				let didThrowAnError = false
				try {
					generateRandomString()
				} catch(e) {
					didThrowAnError = e && (e.customMessage === 'Invalid length number provided.')
				}
				assert(didThrowAnError)
			})
			it('should execute successfully and return a random string if all paramters are correct', function() {
				let result = generateRandomString(10)
				assert((typeof result === 'string') && (result.length <= 10))
			})
		})
	},
	testParseDate: function() {
		const parseDate = toolbelt.parseDate
		describe('toolbelt.parseDate', function() {
			it('should execute successfully and return valid moment date object if the date is a string in the format "DD/MM/YYYY"', function() {
				let result = parseDate('23/12/1994')
				assert(result.isValid() && (result.format('YYYY-MM-DD').toString() === '1994-12-23'))
			})
			it('should execute successfully and return valid moment date object if the date is a string in the format "YYYY-MM-DD"', function() {
				let result = parseDate('1994-12-23')
				assert(result.isValid() && (result.format('YYYY-MM-DD').toString() === '1994-12-23'))
			})
			it('should execute successfully and return valid moment date object if the date is a date object', function() {
				let result = parseDate(new Date(moment.utc('1994-12-23', 'YYYY-MM-DD').valueOf()))
				assert(result.isValid() && (result.format('YYYY-MM-DD').toString() === '1994-12-23'))
			})
		})
	},
	testGetNested: function() {
		const getNested = toolbelt.getNested
		describe('toolbelt.getNested', function() {
			it('should execute successfully and return undefined if the parent is undefined', function() {
				assert.strictEqual(getNested(), undefined)
			})
			it('should execute successfully and return undefined if the parent is null', function() {
				assert.strictEqual(getNested(null), undefined)
			})
			it('should execute successfully and return undefined if the parent is not an object', function() {
				assert.strictEqual(getNested(1), undefined)
			})
			it('should execute successfully and return undefined if the field is not a string', function() {
				assert.strictEqual(getNested({}), undefined)
			})
			it('should execute successfully and return undefined if the field is an empty string', function() {
				assert.strictEqual(getNested({}, ''), undefined)
			})
			it('should execute successfully and return undefined if the field does not exist in the parent', function() {
				assert.strictEqual(getNested({}, 'test.test1'), undefined)
			})
			it('should execute successfully and return the field\'s value if all parameters are correct and no items in the path are arrays without indexes', function() {
				const result = getNested({
						test1: 'test1string',
						a: undefined,
						b: null,
						c: 567,
						t: {
							vertices: {
								f: {
									$vertices: [
										'', {
											vertices: {
												test2: true,
												'$innerTest.vertices$': {veryInnerId: 25}
											}
										},
										2
									]
								}
							}
						},
						d: ''
					}, 't.vertices.f.$vertices.1.vertices.$innerTest.vertices$.veryInnerId'
				)
				assert.strictEqual(result, 25, `bad value ${result} for result, expected 25`)
			})
			it('should execute successfully and return the field\'s value if all parameters are correct and the last value is an array', function() {
				const result = getNested({
						test1: 'test1string',
						a: undefined,
						b: null,
						c: 567,
						t: {
							vertices: {
								f: {
									$vertices: [
										'', {
											vertices: {
												test2: true,
												'$innerTest.vertices$': {veryInnerIds: [25]}
											}
										},
										2
									]
								}
							}
						},
						d: ''
					}, 't.vertices.f.$vertices.1.vertices.$innerTest.vertices$.veryInnerIds'
				)
				assert.strictEqual(result instanceof Array, true, 'expected the returned value to be an array')
				assert.strictEqual(result.length, 1, `bad value ${result.length} for result.length, expected 1`)
				assert.strictEqual(result[0], 25, `bad value ${result[0]} for result[0], expected 25`)
			})
			it('should execute successfully and return the field\'s value if all parameters are correct and one of the items in the path is an array without an index', function() {
				const result = getNested({
						test1: 'test1string',
						a: undefined,
						b: null,
						c: 567,
						t: {
							vertices: {
								f: {
									$vertices: [
										'', {
											vertices: {
												test2: true,
												'$innerTest.vertices$': [{veryInnerId: 25}, {veryInnerId: 26}]
											}
										},
										2
									]
								}
							}
						},
						d: ''
					}, 't.vertices.f.$vertices.1.vertices.$innerTest.vertices$.veryInnerId'
				)
				assert.strictEqual(result instanceof Array, true, 'expected the returned value to be an array')
				assert.strictEqual(result.length, 2, `bad value ${result.length} for result.length, expected 2`)
				assert.strictEqual(result[0], 25, `bad value ${result[0]} for result[0], expected 25`)
				assert.strictEqual(result[1], 26, `bad value ${result[1]} for result[1], expected 26`)
			})
			it('should execute successfully and return the field\'s value if all parameters are correct and multiple items in the path are arrays without an index', function() {
				const result = getNested({
						test1: 'test1string',
						a: undefined,
						b: null,
						c: 567,
						t: {
							vertices: {
								f: {
									$vertices: [
										'', {
											vertices: [{
													test2: true,
													'$innerTest.vertices$': [{veryInnerId: 25}, {veryInnerId: 26}]
												},{
													test2: true,
													'$innerTest.vertices$': [{veryInnerId: 27}, {veryInnerId: 28}]
												}
											]
										},
										2
									]
								}
							}
						},
						d: ''
					}, 't.vertices.f.$vertices.1.vertices.$innerTest.vertices$.veryInnerId'
				)
				assert.strictEqual(result instanceof Array, true, 'expected the returned value to be an array')
				assert.strictEqual(result.length, 4, `bad value ${result.length} for result.length, expected 4`)
				assert.strictEqual(result[0], 25, `bad value ${result[0]} for result[0], expected 25`)
				assert.strictEqual(result[1], 26, `bad value ${result[1]} for result[1], expected 26`)
				assert.strictEqual(result[2], 27, `bad value ${result[2]} for result[2], expected 27`)
				assert.strictEqual(result[3], 28, `bad value ${result[3]} for result[3], expected 28`)
			})
		})
	},
	testSetNested: function() {
		const setNested = toolbelt.setNested
		describe('toolbelt.setNested', function() {
			it('should execute successfully and return false if the parent is undefined', function() {
				const response = setNested()
				assert.strictEqual(response, false, `bad value ${response} for response, expected false`)
			})
			it('should execute successfully and return false if the parent is null', function() {
				const response = setNested(null)
				assert.strictEqual(response, false, `bad value ${response} for response, expected false`)
			})
			it('should execute successfully and return false if the parent is not an object', function() {
				const response = setNested(1)
				assert.strictEqual(response, false, `bad value ${response} for response, expected false`)
			})
			it('should execute successfully and return false if the field is not a string', function() {
				const response = setNested({})
				assert.strictEqual(response, false, `bad value ${response} for response, expected false`)
			})
			it('should execute successfully and return false if the field is an empty string', function() {
				const response = setNested({}, '')
				assert.strictEqual(response, false, `bad value ${response} for response, expected false`)
			})
			it('should execute successfully and return false if the field does not exist in the parent', function() {
				const response = setNested({}, 'test.test1')
				assert.strictEqual(response, false, `bad value ${response} for response, expected false`)
			})
			it('should execute successfully and set the field\'s value if all parameters are correct and the last field does not contain $ bracket syntax', function() {
				let parent = {
					test1: 'test1string',
					a: undefined,
					b: null,
					c: 567,
					t: {
						vertices: {
							f: {
								'$vertices': [
									'', {
										vertices: {
											test2: true,
											'$innerTest.vertices$': {veryInnerId: 25}
										}
									},
									2
								]
							}
						}
					},
					d: ''
				}
				let response = setNested(parent, 't.vertices.f.$vertices.1.vertices.$innerTest.vertices$.veryInnerId', 26),
					result = parent.t.vertices.f.$vertices[1].vertices['$innerTest.vertices$'].veryInnerId
				assert.strictEqual(response, true, `bad value ${response} for response, expected true`)
				assert.strictEqual(result, 26, `bad value ${result} for result, expected 26`)
			})
			it('should execute successfully and set the field\'s value if all parameters are correct and the last field contains $ bracket syntax', function() {
				let parent = {
					test1: 'test1string',
					a: undefined,
					b: null,
					c: 567,
					t: {
						vertices: {
							f: {
								$vertices: [
									'', {
										vertices: {
											test2: true,
											'$innerTest.vertices$': {veryInnerId: 25},
											test3: {'$evenDeeperTest.field$': 13},
										}
									},
									2
								]
							}
						}
					},
					d: ''
				}
				let response = setNested(parent, 't.vertices.f.$vertices.1.vertices.test3.$evenDeeperTest.field$', 14),
					result = parent.t.vertices.f.$vertices[1].vertices.test3['$evenDeeperTest.field$']
				assert.strictEqual(response, true, `bad value ${response} for response, expected true`)
				assert.strictEqual(result, 14, `bad value ${result} for result, expected 14`)
			})
			it('should execute successfully and set the field\'s value if all parameters are correct and the last field does not exist in the object and it does not contain $ bracket syntax', function() {
				let parent = {
					test1: 'test1string',
					a: undefined,
					b: null,
					c: 567,
					t: {
						vertices: {
							f: {
								$vertices: [
									'', {
										vertices: {
											test2: true,
											'$innerTest.vertices$': {veryInnerId: 25},
											test3: {'$evenDeeperTest.field$': 13},
										}
									},
									2
								]
							}
						}
					},
					d: ''
				}
				let response = setNested(parent, 't.vertices.f.$vertices.1.vertices.test3.newField', 15),
					result = parent.t.vertices.f.$vertices[1].vertices.test3.newField
				assert.strictEqual(response, true, `bad value ${response} for response, expected true`)
				assert.strictEqual(result, 15, `bad value ${result} for result, expected 15`)
			})
			it('should execute successfully and set the field\'s value if all parameters are correct and the last field does not exist in the object and it contains $ bracket syntax', function() {
				let parent = {
					test1: 'test1string',
					a: undefined,
					b: null,
					c: 567,
					t: {
						vertices: {
							f: {
								$vertices: [
									'', {
										vertices: {
											test2: true,
											'$innerTest.vertices$': {veryInnerId: 25},
											test3: {'$evenDeeperTest.field$': 13},
										}
									},
									2
								]
							}
						}
					},
					d: ''
				}
				let response = setNested(parent, 't.vertices.f.$vertices.1.vertices.test3.$new.field$', 15),
					result = parent.t.vertices.f.$vertices[1].vertices.test3['$new.field$']
				assert.strictEqual(response, true, `bad value ${response} for response, expected true`)
				assert.strictEqual(result, 15, `bad value ${result} for result, expected 15`)
			})
		})
	}
}
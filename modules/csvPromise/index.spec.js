'use strict'
const
	assert = require('assert'),
	co = require('co'),
	fs = require('fs-extra'),
	path = require('path')

module.exports = {
	testMe: function() {
		const instance = this
		describe('csvPromise', function() {
			it('should execute testParse successfully', function() {
				instance.testParse()
				assert(true)
			})
			it('should execute testStringify successfully', function() {
				instance.testStringify()
				assert(true)
			})
		})
	},
	testParse: function() {
		const instance = this
		describe('csvPromise.parse', function() {
			it('should throw an error with the correct message if the data argument is not a non-empty string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.parse()
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid data string provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully if all paramters are correct and the delimiter is the default one (",")', function() {
				return co(function*() {
					let data = [['id', 'name', 'description'], ['1', 'Test Name 1', 'Test description 1'], ['2', 'Test Name 2', 'Test description 2'], ['3', 'Test Name 3', 'Test description 3']],
						parsedData = yield instance.parse(`id,name,description\r\n1,Test Name 1,Test description 1\r\n2,Test Name 2,Test description 2\r\n3,Test Name 3,Test description 3\r\n`),
						dataIsGood = true
					for (const i in parsedData) {
						const parsedDataRow = parsedData[i],
							dataRow = data[i]
						if (!(dataRow instanceof Array) || !(parsedDataRow instanceof Array)) {
							dataIsGood = false
							break
						}
						for (const j in parsedDataRow) {
							if (parsedDataRow[j] !== dataRow[j]) {
								// for (const k in parsedDataRow[j]) {
								// 	console.log(parsedDataRow[j][k], dataRow[j][k])
								// }
								dataIsGood = false
								break
							}
						}
						if (!dataIsGood) {
							break
						}
					}
					assert(dataIsGood)
					return true
				})
			})
			it('should execute successfully if all paramters are correct and the delimiter is explicitly set to ","', function() {
				return co(function*() {
					let data = [['id', 'name', 'description'], ['1', 'Test Name 1', 'Test description 1'], ['2', 'Test Name 2', 'Test description 2'], ['3', 'Test Name 3', 'Test description 3']],
						parsedData = yield instance.parse(
							`id,name,description\r\n1,Test Name 1,Test description 1\r\n2,Test Name 2,Test description 2\r\n3,Test Name 3,Test description 3\r\n`,
							{delimiter: ','}
						),
						dataIsGood = true
					for (const i in parsedData) {
						const parsedDataRow = parsedData[i],
							dataRow = data[i]
						if (!(dataRow instanceof Array) || !(parsedDataRow instanceof Array)) {
							dataIsGood = false
							break
						}
						for (const j in parsedDataRow) {
							if (parsedDataRow[j] !== dataRow[j]) {
								// for (const k in parsedDataRow[j]) {
								// 	console.log(parsedDataRow[j][k], dataRow[j][k])
								// }
								dataIsGood = false
								break
							}
						}
						if (!dataIsGood) {
							break
						}
					}
					assert(dataIsGood)
					return true
				})
			})
			it('should execute successfully if all paramters are correct and the delimiter is explicitly set to ";"', function() {
				return co(function*() {
					let data = [['id', 'name', 'description'], ['1', 'Test Name 1', 'Test description 1'], ['2', 'Test Name 2', 'Test description 2'], ['3', 'Test Name 3', 'Test description 3']],
						parsedData = yield instance.parse(
							`id;name;description\r\n1;Test Name 1;Test description 1\r\n2;Test Name 2;Test description 2\r\n3;Test Name 3;Test description 3\r\n`,
							{delimiter: ';'}
						),
						dataIsGood = true
					for (const i in parsedData) {
						const parsedDataRow = parsedData[i],
							dataRow = data[i]
						if (!(dataRow instanceof Array) || !(parsedDataRow instanceof Array)) {
							dataIsGood = false
							break
						}
						for (const j in parsedDataRow) {
							if (parsedDataRow[j] !== dataRow[j]) {
								// for (const k in parsedDataRow[j]) {
								// 	console.log(parsedDataRow[j][k], dataRow[j][k])
								// }
								dataIsGood = false
								break
							}
						}
						if (!dataIsGood) {
							break
						}
					}
					assert(dataIsGood)
					return true
				})
			})
		})
	},
	testStringify: function() {
		const instance = this
		describe('csvPromise.stringify', function() {
			it('should throw an error with the correct message if the data argument is not an array', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.stringify()
					} catch(e) {
						didThrowAnError = e && (e.customMessage === 'Invalid data array provided.')
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully if all paramters are correct and the delimiter is the default one (",")', function() {
				return co(function*() {
					let data = [['id', 'name', 'description'], ['1', 'Test Name 1', 'Test description 1'], ['2', 'Test Name 2', 'Test description 2'], ['3', 'Test Name 3', 'Test description 3']],
						parsedData = yield instance.stringify(data)
					assert(
						(parsedData === `id,name,description\n1,Test Name 1,Test description 1\n2,Test Name 2,Test description 2\n3,Test Name 3,Test description 3\n`) ||
						(parsedData === `id,name,description\r1,Test Name 1,Test description 1\r2,Test Name 2,Test description 2\r3,Test Name 3,Test description 3\r`) ||
						(parsedData === `id,name,description\r\n1,Test Name 1,Test description 1\r\n2,Test Name 2,Test description 2\r\n3,Test Name 3,Test description 3\r\n`)
					)
					return true
				})
			})
			it('should execute successfully if all paramters are correct and the delimiter is explicitly set to ","', function() {
				return co(function*() {
					let data = [['id', 'name', 'description'], ['1', 'Test Name 1', 'Test description 1'], ['2', 'Test Name 2', 'Test description 2'], ['3', 'Test Name 3', 'Test description 3']],
						parsedData = yield instance.stringify(data, {delimiter: ','})
					assert(
						(parsedData === `id,name,description\n1,Test Name 1,Test description 1\n2,Test Name 2,Test description 2\n3,Test Name 3,Test description 3\n`) ||
						(parsedData === `id,name,description\r1,Test Name 1,Test description 1\r2,Test Name 2,Test description 2\r3,Test Name 3,Test description 3\r`) ||
						(parsedData === `id,name,description\r\n1,Test Name 1,Test description 1\r\n2,Test Name 2,Test description 2\r\n3,Test Name 3,Test description 3\r\n`)
					)
					return true
				})
			})
			it('should execute successfully if all paramters are correct and the delimiter is explicitly set to ";"', function() {
				return co(function*() {
					let data = [['id', 'name', 'description'], ['1', 'Test Name 1', 'Test description 1'], ['2', 'Test Name 2', 'Test description 2'], ['3', 'Test Name 3', 'Test description 3']],
						parsedData = yield instance.stringify(data, {delimiter: ';'})
					assert(
						(parsedData === `id;name;description\n1;Test Name 1;Test description 1\n2;Test Name 2;Test description 2\n3;Test Name 3;Test description 3\n`) ||
						(parsedData === `id;name;description\r1;Test Name 1;Test description 1\r2;Test Name 2;Test description 2\r3;Test Name 3;Test description 3\r`) ||
						(parsedData === `id;name;description\r\n1;Test Name 1;Test description 1\r\n2;Test Name 2;Test description 2\r\n3;Test Name 3;Test description 3\r\n`)
					)
					return true
				})
			})
		})
	}
}
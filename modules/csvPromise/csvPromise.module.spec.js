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
			})
			it('should execute testStringify successfully', function() {
				instance.testStringify()
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
						if (e && (e.customMessage === 'Invalid data string provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert.strictEqual(didThrowAnError, true, 'no error was thrown')
					return true
				})
			})
			it('should execute successfully if all paramters are correct and the delimiter is the default one (",")', function() {
				return co(function*() {
					let data = [['id', 'name', 'description'], ['1', 'Test Name 1', 'Test description 1'], ['2', 'Test Name 2', 'Test description 2'], ['3', 'Test Name 3', 'Test description 3']],
						parsedData = yield instance.parse(`id,name,description\r\n1,Test Name 1,Test description 1\r\n2,Test Name 2,Test description 2\r\n3,Test Name 3,Test description 3\r\n`)
					for (const i in parsedData) {
						const parsedDataRow = parsedData[i],
							dataRow = data[i]
						assert(dataRow instanceof Array, `no reference data array with index ${i} exits`)
						assert(parsedDataRow instanceof Array, `expected the parsed data at row ${i} to be an array`)
						for (const j in parsedDataRow) {
							assert.strictEqual(parsedDataRow[j], dataRow[j], `bad value ${parsedDataRow[j]} for column index ${j} at row ${i}, expected ${dataRow[j]}`)
						}
					}
					return true
				})
			})
			it('should execute successfully if all paramters are correct and the delimiter is explicitly set to ","', function() {
				return co(function*() {
					let data = [['id', 'name', 'description'], ['1', 'Test Name 1', 'Test description 1'], ['2', 'Test Name 2', 'Test description 2'], ['3', 'Test Name 3', 'Test description 3']],
						parsedData = yield instance.parse(
							`id,name,description\r\n1,Test Name 1,Test description 1\r\n2,Test Name 2,Test description 2\r\n3,Test Name 3,Test description 3\r\n`,
							{delimiter: ','}
						)
					for (const i in parsedData) {
						const parsedDataRow = parsedData[i],
							dataRow = data[i]
						assert(dataRow instanceof Array, `no reference data array with index ${i} exits`)
						assert(parsedDataRow instanceof Array, `expected the parsed data at row ${i} to be an array`)
						for (const j in parsedDataRow) {
							assert.strictEqual(parsedDataRow[j], dataRow[j], `bad value ${parsedDataRow[j]} for column index ${j} at row ${i}, expected ${dataRow[j]}`)
						}
					}
					return true
				})
			})
			it('should execute successfully if all paramters are correct and the delimiter is explicitly set to ";"', function() {
				return co(function*() {
					let data = [['id', 'name', 'description'], ['1', 'Test Name 1', 'Test description 1'], ['2', 'Test Name 2', 'Test description 2'], ['3', 'Test Name 3', 'Test description 3']],
						parsedData = yield instance.parse(
							`id;name;description\r\n1;Test Name 1;Test description 1\r\n2;Test Name 2;Test description 2\r\n3;Test Name 3;Test description 3\r\n`,
							{delimiter: ';'}
						)
					for (const i in parsedData) {
						const parsedDataRow = parsedData[i],
							dataRow = data[i]
						assert(dataRow instanceof Array, `no reference data array with index ${i} exits`)
						assert(parsedDataRow instanceof Array, `expected the parsed data at row ${i} to be an array`)
						for (const j in parsedDataRow) {
							assert.strictEqual(parsedDataRow[j], dataRow[j], `bad value ${parsedDataRow[j]} for column index ${j} at row ${i}, expected ${dataRow[j]}`)
						}
					}
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
						if (e && (e.customMessage === 'Invalid data array provided.')) {
							didThrowAnError = true
						} else {
							throw e
						}
					}
					assert.strictEqual(didThrowAnError, true, 'no error was thrown')
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
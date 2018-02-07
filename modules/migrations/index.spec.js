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
			{sequelize} = this
		describe('migrations.runQueryFromColumnData', function() {
			it('should throw an error with the correct message if tableName is not a string', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.runQueryFromColumnData()
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
						yield instance.runQueryFromColumnData('')
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
						yield instance.runQueryFromColumnData('userTypes')
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
						yield instance.runQueryFromColumnData('userTypes', {})
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
						yield instance.runQueryFromColumnData('userTypes', {columns: []})
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
						yield instance.runQueryFromColumnData('userTypes', {columns: ['id']})
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
						yield instance.runQueryFromColumnData('userTypes', {columns: ['id'], values: []}, 'dummyTransaction', {deleteTableContents: 'blabla'})
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
						yield instance.runQueryFromColumnData('userTypes', {columns: ['id'], values: ['wrongItem']})
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
						yield instance.runQueryFromColumnData('userTypes', {columns: ['id'], values: [[1, 2]]})
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
						yield instance.runQueryFromColumnData('userTypes', {columns: ['id'], values: [[]]})
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
								yield instance.runQueryFromColumnData(
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
								yield instance.runQueryFromColumnData(
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
								yield instance.runQueryFromColumnData(
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
								yield instance.runQueryFromColumnData(
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
	}
}

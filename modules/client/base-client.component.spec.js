const
	assert = require('assert'),
	co = require('co'),
	fs = require('fs-extra'),
	path = require('path'),
	wrap = require('co-express')

const
	assertImportFileCheckOutput = (result, matchesTemplateShouldBe, resultColumnsShouldBe, templateColumnsShouldBe, fileDataShouldBe) => {
		assert.strictEqual(result.matchesTemplate, matchesTemplateShouldBe, `bad value ${result.matchesTemplate} for matchesTemplate, expected ${matchesTemplateShouldBe}`)
		for (const i in resultColumnsShouldBe) {
			const columnNameShouldBe = resultColumnsShouldBe[i],
				columnNameIs = result.columns[i]
			assert.strictEqual(columnNameIs, columnNameShouldBe, `bad value ${columnNameIs} for input file column at index ${i}, expected '${columnNameShouldBe}'`)
		}
		for (const i in templateColumnsShouldBe) {
			const columnNameShouldBe = templateColumnsShouldBe[i],
				columnNameIs = result.templateColumns[i]
			assert.strictEqual(columnNameIs, columnNameShouldBe, `bad value ${columnNameIs} for template column at index ${i}, expected '${columnNameShouldBe}'`)
		}
		for (const i in fileDataShouldBe) {
			const row = fileDataShouldBe[i],
				fileRow = result.fileData[i]
			for (const j in row) {
				assert.strictEqual(fileRow[j], row[j], `bad value ${fileRow[j]} in the input file at column index ${j}, row index ${i}; expected ${row[j]}`)
			}
		}
	}

module.exports = {
	testMe: function() {
		const instance = this
		let req = {
				headers: {},
				connection: {},
				locals: {}
			},
			res = {
				headers: {},
				getHeader: function(headerName) {
				},
				set: function(headerName, headerValue) {
					res.fakeVar = true
					if (!res.headers) {
						res.headers = {}
					}
					res.headers[headerName] = headerValue
				},
				status: function(statusCode) {
					res.fakeVar = true
					if (typeof res.response === 'undefined') {
						res.response = {}
					}
					res.response.statusCode = statusCode
					return res
				},
				jsonTemplate: function(resolvePromise, jsonObject) {
					res.fakeVar = true
					if (typeof res.response === 'undefined') {
						res.response = {}
					}
					res.response.jsonBody = jsonObject
					if (typeof resolvePromise === 'function') {
						resolvePromise()
						return
					}
					return res
				},
				endTemplate: function(resolvePromise) {
					if (typeof resolvePromise === 'function') {
						resolvePromise()
						return
					}
				},
				redirectTemplate: function(resolvePromise, statusCode, route) {
					res.fakeVar = true
					if (typeof res.response === 'undefined') {
						res.response = {}
					}
					res.response.statusCode = statusCode
					res.response.redirectRoute = route
					if (typeof resolvePromise === 'function') {
						resolvePromise()
						return
					}
					return res
				}
			},
			next = function(resolvePromise, errorObject) {
				next.fakeVar = true
				if (errorObject) {
					next.fail = true
					next.errorStatus = errorObject.status
					next.errorMessage = errorObject.message
				} else {
					next.fail = false
				}
				if (typeof resolvePromise === 'function') {
					resolvePromise()
				}
			}
		this.componentName = 'users'
		this.dbComponent = this.module.db.components[this.componentName]
		describe('base-client.component', function() {
			it('should execute testImportFileCheck successfully', function() {
				instance.testImportFileCheck()
			})
			it('should execute testReadList successfully', function() {
				instance.testReadList(req, res, next)
			})
			it('should execute testCheckImportFile successfully', function() {
				instance.testCheckImportFile(req, res, next)
			})
			it('should execute testImportFile successfully', function() {
				instance.testImportFile(req, res, next)
			})
		})
	},
	testImportFileCheck: function() {
		const instance = this,
			{componentName, module} = this,
			{config} = module
		let changeableInstance = this
		describe('base-client.component.importFileCheck', function() {
			it('should throw an error if the input file does not exist', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.importFileCheck()
					} catch(e) {
						didThrowAnError = true
					}
					assert.strictEqual(didThrowAnError, true, 'no error was thrown')
					return true
				})
			})
			it('should throw an error if the template file does not exist', function() {
				return co(function*() {
					let didThrowAnError = false,
						inputFileName = 'testFile.csv',
						fd = yield fs.open(path.join(config.globalUploadPath, inputFileName), 'w')
					yield fs.writeFile(fd, `col0,col1,col2\n\nrow0val0,row0val1,row0val2\nrow1val0,row1val1,row1val2`)
					yield fs.close(fd)
					yield fs.remove(path.join(config.globalStoragePath, `importTemplates/${componentName}.csv`))
					try {
						yield instance.importFileCheck(inputFileName)
					} catch(e) {
						didThrowAnError = true
					}
					assert.strictEqual(didThrowAnError, true, 'no error was thrown')
					return true
				})
			})
			it('should return the correct data if the csv file does not match the template due to incorrect delimiter', function() {
				return co(function*() {
					let didThrowAnError = false,
						fd = yield fs.open(path.join(config.globalStoragePath, `importTemplates/${componentName}.csv`), 'w')
					yield fs.writeFile(fd, `col0,col1,col2`)
					yield fs.close(fd)
					let result = yield instance.importFileCheck('testFile.csv', ';')
					assertImportFileCheckOutput(
						result,
						false,
						['col0,col1,col2'],
						['col0', 'col1', 'col2'], [
							['row0val0,row0val1,row0val2'],
							['row1val0,row1val1,row1val2']
						]
					)
					return true
				})
			})
			it('should return the correct data if the csv file does not match the template due to column mismatch', function() {
				return co(function*() {
					let didThrowAnError = false,
						fd = yield fs.open(path.join(config.globalStoragePath, `importTemplates/${componentName}.csv`), 'w')
					yield fs.writeFile(fd, `col0,col1`)
					yield fs.close(fd)
					let result = yield instance.importFileCheck('testFile.csv', ',')
					assertImportFileCheckOutput(
						result,
						false,
						['col0', 'col1', 'col2'],
						['col0', 'col1'], [
							['row0val0', 'row0val1', 'row0val2'],
							['row1val0', 'row1val1', 'row1val2']
						]
					)
					return true
				})
			})
			it('should return the correct data if the csv file matches the template and all parameters are correct', function() {
				return co(function*() {
					let didThrowAnError = false,
						fd = yield fs.open(path.join(config.globalStoragePath, `importTemplates/${componentName}.csv`), 'w')
					yield fs.writeFile(fd, `col0,col1,col2`)
					yield fs.close(fd)
					let result = yield instance.importFileCheck('testFile.csv', ',')
					assertImportFileCheckOutput(
						result,
						true,
						['col0', 'col1', 'col2'],
						['col0', 'col1', 'col2'], [
							['row0val0', 'row0val1', 'row0val2'],
							['row1val0', 'row1val1', 'row1val2']
						]
					)
					return true
				})
			})
		})
	},
	testReadList: function(req, res, next) {
		const instance = this,
			{module} = this,
			db = module.db,
			dbComponents = db.components
		let changeableInstance = this
		describe('base-client.component.readList', function() {
			before(function() {
				return co(function*() {
					yield dbComponents.userTypes.create({name: 'type1', description: 'description1', active: true})
					yield dbComponents.users.create({typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', password: '1234', active: true})
					delete req.locals.error
					return true
				})
			})
			it('should execute successfully and return the found object and save the search data if all paramteres are correct and saveSearchData is set to true', function() {
				return co(function*() {
					req.user = {id: 1}
					req.query = {filters: {id: 2}, saveSearchData: true}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.readList())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let returnedData = res.response.jsonBody,
						result = returnedData.results[0],
						item = {id: 2, typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', active: true},
						savedSearchData = JSON.parse(yield module.generalStore.getStoredEntry(`userId-1-searchComponent-users-savedSearchData`))
					for (const key in item) {
						assert.strictEqual(result[key], item[key], `bad value ${result[key]} for field "${key}", expected ${item[key]}`)
					}
					assert.strictEqual(savedSearchData.filters.id, 2, `bad value ${savedSearchData.filters.id} for savedSearchData.filters.id, expected 2`)
					assert.strictEqual(returnedData.results.length, 1, `bad value ${returnedData.results.length} for returnedData.results.length, expected 1`)
					assert.strictEqual(returnedData.page, 1, `bad value ${returnedData.page} for returnedData.page, expected 1`)
					assert.strictEqual(returnedData.perPage, 10, `bad value ${returnedData.perPage} for returnedData.perPage, expected 10`)
					assert.strictEqual(returnedData.totalPages, 1, `bad value ${returnedData.totalPages} for returnedData.totalPages, expected 1`)
					assert.strictEqual(returnedData.more, false, `bad value ${returnedData.more} for returnedData.more, expected false`)
					return true
				})
			})
			it('should execute successfully and return the found object if all paramteres are correct and useSavedSearchData is set to true', function() {
				return co(function*() {
					delete req.locals.error
					req.user = {id: 1}
					req.query = {filters: {id: 2}, staticFilters: {id: {$not: 3}}, useSavedSearchData: true}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.readList())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let returnedData = res.response.jsonBody,
						result = returnedData.results[0],
						item = {id: 2, typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', active: true}
					for (const key in item) {
						assert.strictEqual(result[key], item[key], `bad value ${result[key]} for field "${key}", expected ${item[key]}`)
					}
					assert.strictEqual(returnedData.savedSearchData.filters.id, 2, `bad value ${returnedData.savedSearchData.filters.id} for returnedData.savedSearchData.filters.id, expected 2`)
					assert.strictEqual(returnedData.results.length, 1, `bad value ${returnedData.results.length} for returnedData.results.length, expected 1`)
					assert.strictEqual(returnedData.page, 1, `bad value ${returnedData.page} for returnedData.page, expected 1`)
					assert.strictEqual(returnedData.perPage, 10, `bad value ${returnedData.perPage} for returnedData.perPage, expected 10`)
					assert.strictEqual(returnedData.totalPages, 1, `bad value ${returnedData.totalPages} for returnedData.totalPages, expected 1`)
					assert.strictEqual(returnedData.more, false, `bad value ${returnedData.more} for returnedData.more, expected false`)
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
					return true
				})
			})
		})
	},
	testCheckImportFile: function(req, res, next) {
		const instance = this,
			{componentName, module} = this,
			{config} = module
		let changeableInstance = this
		describe('base-client.component.checkImportFile', function() {
			it('should throw an error if the input file does not exist', function() {
				return co(function*() {
					delete req.locals.error
					req.user = {id: 1}
					req.query = {fileName: 'inexistentFile.csv', delimiter: ','}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.checkImportFile())(req, res, next.bind(next, resolve))
					}))
					assert(req.locals.error, 'no error was thrown')
					return true
				})
			})
			it('should execute successfully and return the correct data if the csv file matches the template and all parameters are correct', function() {
				return co(function*() {
					delete req.locals.error
					req.user = {id: 1}
					req.query = {fileName: 'testFile.csv', delimiter: ','}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.checkImportFile())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					assertImportFileCheckOutput(
						res.response.jsonBody,
						true,
						['col0', 'col1', 'col2'],
						['col0', 'col1', 'col2'], [
							['row0val0', 'row0val1', 'row0val2'],
							['row1val0', 'row1val1', 'row1val2']
						]
					)
					return true
				})
			})
		})
	},
	testImportFile: function(req, res, next) {
		const instance = this,
			{componentName, dbComponent, module} = this,
			{config, db} = module
		let changeableInstance = this
		describe('base-client.component.importFile', function() {
			it('should throw an error if the input file does not exist', function() {
				return co(function*() {
					delete req.locals.error
					req.user = {id: 1}
					req.body = {fileName: 'inexistentFile.csv', delimiter: ','}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.importFile())(req, res, next.bind(next, resolve))
					}))
					assert(req.locals.error, 'no error was thrown')
					return true
				})
			})
			it('should throw an error with the correct message if the input file does does not contain any data', function() {
				return co(function*() {
					let fileName = 'testFile.csv',
						fd = yield fs.open(path.join(config.globalUploadPath, fileName), 'w'),
						messageShouldBe = 'Invalid data string provided.'
					yield fs.writeFile(fd, '')
					yield fs.close(fd)
					delete req.locals.error
					req.user = {id: 1}
					req.body = {fileName, delimiter: ','}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.importFile())(req, res, next.bind(next, resolve))
					}))
					assert(req.locals.error, 'no error was thrown')
					assert.strictEqual(
						req.locals.error.customMessage,
						messageShouldBe,
						`bad value ${req.locals.error.message} for the thrown error message, expected '${messageShouldBe}'`
					)
					return true
				})
			})
			it('should execute successfully, skip empty lines, populate data from addfields and create and update records accordingly, if the csv file matches the template and all parameters are correct', function() {
				return co(function*() {
					let fileName = 'testFile.csv',
						fd = yield fs.open(path.join(config.globalStoragePath, `importTemplates/${componentName}.csv`), 'w')
					yield fs.writeFile(fd, `id,typeId,firstName,lastname,email,password,active`)
					yield fs.close(fd)
					fd = yield fs.open(path.join(config.globalUploadPath, fileName), 'w')
					yield fs.writeFile(fd, 'id,typeId,firstName,lastname,email,password,active\n2,2,updatedFN2,ln2,email2Updated@ramster.com,1234,true\n\n,2,fn3,ln3,email3@ramster.com,1234,true')
					yield fs.close(fd)
					yield db.components.userTypes.create({name: 'type1', description: 'description1', active: true})
					yield dbComponent.create({typeId: 2, firstName: 'fn2', lastName: 'ln2', email: 'email2@ramster.com', password: '1234', active: true})
					delete req.locals.error
					req.user = {id: 1}
					req.body = {fileName, delimiter: ','}
					changeableInstance.addFields = [{fieldName: 'lastName', getValue: (item) => `thisIsTheNewShit${item.typeId}`}]
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.importFile({test1: 'test', test2: 'testq'}))(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let usersShouldBe = [
							{id: 2, typeId: 2, firstName: 'updatedFN2', lastName: 'thisIsTheNewShit2', email: 'email2Updated@ramster.com', active: true},
							{id: 3, typeId: 2, firstName: 'fn3', lastName: 'thisIsTheNewShit2', email: 'email3@ramster.com', active: true}
						],
						users = yield dbComponent.model.findAll({order: [['id', 'asc']]})
					for (const i in usersShouldBe) {
						const item = usersShouldBe[i],
							user = users[i].dataValues
						for (const key in item) {
							assert.strictEqual(user[key], item[key], `bad value ${user[key]} for field "${key}" in item no. ${i}, expected ${item[key]}`)
						}
					}
					return true
				})
			})
			it('should throw an error if the csv file does not match the template and the columns are not mapped in the body', function() {
				return co(function*() {
					let fileName = 'testFile.csv',
						fd = yield fs.open(path.join(config.globalUploadPath, fileName), 'w'),
						messageShouldBe = 'The file does not match the template and not all columns have been mapped.'
					yield fs.writeFile(fd, 'id,typeId,firstNameTest,lastname,emailTest,password,active\n2,2,updatedFN2,ln2,email2Updated@ramster.com,1234,true\n\n,2,fn3,ln3,email3@ramster.com,1234,true')
					yield fs.close(fd)
					delete req.locals.error
					req.user = {id: 1}
					req.body = {fileName, delimiter: ','}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.importFile())(req, res, next.bind(next, resolve))
					}))
					assert(req.locals.error, 'no error was thrown')
					assert.strictEqual(
						req.locals.error.customMessage,
						messageShouldBe,
						`bad value ${req.locals.error.message} for the thrown error message, expected '${messageShouldBe}'`
					)
					return true
				})
			})
			it('should execute successfully, skip empty lines, populate data from addfields and create and update records accordingly, if the csv file does not match the template, the columns are mapped in the body and all parameters are correct', function() {
				return co(function*() {
					let fileName = 'testFile.csv',
						fd = yield fs.open(path.join(config.globalUploadPath, fileName), 'w')
					yield fs.writeFile(fd, 'id,typeId,firstNameTest,lastname,emailTest,password,active\n2,2,updatedFN2,ln2,email2Updated@ramster.com,1234,true\n\n,2,fn3,ln3,email3@ramster.com,1234,true')
					yield fs.close(fd)
					yield db.sequelize.query(`
						delete from "users";
						select setval('"users_id_seq"'::regclass, 1);
					`)
					yield dbComponent.create({typeId: 2, firstName: 'fn2', lastName: 'ln2', email: 'email2@ramster.com', password: '1234', active: true})
					delete req.locals.error
					req.user = {id: 1}
					req.body = {fileName, delimiter: ',', id: 'id', typeId: 'typeId', firstName: 'firstNameTest', lastname: 'lastname', email: 'emailTest', password: 'password', active: 'active'}
					changeableInstance.addFields = [{fieldName: 'lastName', getValue: (item) => `thisIsTheNewShit${item.typeId}`}]
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.importFile())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let usersShouldBe = [
							{id: 2, typeId: 2, firstName: 'updatedFN2', lastName: 'thisIsTheNewShit2', email: 'email2Updated@ramster.com', active: true},
							{id: 3, typeId: 2, firstName: 'fn3', lastName: 'thisIsTheNewShit2', email: 'email3@ramster.com', active: true}
						],
						users = yield dbComponent.model.findAll({order: [['id', 'asc']]})
					for (const i in usersShouldBe) {
						const item = usersShouldBe[i],
							user = users[i].dataValues
						for (const key in item) {
							assert.strictEqual(user[key], item[key], `bad value ${user[key]} for field "${key}" in item no. ${i}, expected ${item[key]}`)
						}
					}
					return true
				})
			})
			after(function() {
				return co(function*() {
					yield fs.unlink(path.join(config.globalUploadPath, 'testFile.csv'))
					yield fs.unlink(path.join(config.globalStoragePath, 'importTemplates/users.csv'))
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
					return true
				})
			})
		})
	}
}

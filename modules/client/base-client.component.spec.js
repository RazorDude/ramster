const
	assert = require('assert'),
	co = require('co'),
	fs = require('fs-extra'),
	path = require('path'),
	wrap = require('co-express')

const
	assertImportFileCheckOutput = (result, matchesTemplateShouldBe, resultColumnsShouldBe, templateColumnsShouldBe, fileDataShouldBe) => {
		let dataIsGood = true
		if (result.matchesTemplate !== matchesTemplateShouldBe) {
			console.log(`Bad output: matches template equals ${result.matchesTemplate}, rather than ${matchesTemplateShouldBe}.`)
			dataIsGood = false
		}
		if (dataIsGood) {
			for (const i in resultColumnsShouldBe) {
				if (resultColumnsShouldBe[i] !== result.columns[i]) {
					console.log(`Bad output: invalid input file column "${result.columns[i]}" at index ${i}.`)
					dataIsGood = false
					break
				}
			}
		}
		if (dataIsGood) {
			for (const i in templateColumnsShouldBe) {
				if (templateColumnsShouldBe[i] !== result.templateColumns[i]) {
					console.log(`Bad output: invalid template column "${result.templateColumns[i]}" at index ${i}.`)
					dataIsGood = false
					break
				}
			}
		}
		if (dataIsGood) {
			for (const i in fileDataShouldBe) {
				const row = fileDataShouldBe[i],
					fileRow = result.fileData[i]
				for (const j in row) {
					if (row[j] !== fileRow[j]) {
						console.log(`Bad output: invalid input file column value "${fileRow[j]}" at column index ${j}, row index ${i}.`)
						dataIsGood = false
						break
					}
				}
				if (!dataIsGood) {
					break
				}
			}
		}
		return dataIsGood
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
				assert(true)
			})
			it('should execute testReadList successfully', function() {
				instance.testReadList(req, res, next)
				assert(true)
			})
			it('should execute testCheckImportFile successfully', function() {
				instance.testCheckImportFile(req, res, next)
				assert(true)
			})
			it('should execute testImportFile successfully', function() {
				instance.testImportFile(req, res, next)
				assert(true)
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
					assert(didThrowAnError)
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
					assert(didThrowAnError)
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
					assert(assertImportFileCheckOutput(
						result,
						false,
						['col0,col1,col2'],
						['col0', 'col1', 'col2'], [
							['row0val0,row0val1,row0val2'],
							['row1val0,row1val1,row1val2']
						]
					))
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
					assert(assertImportFileCheckOutput(
						result,
						false,
						['col0', 'col1', 'col2'],
						['col0', 'col1'], [
							['row0val0', 'row0val1', 'row0val2'],
							['row1val0', 'row1val1', 'row1val2']
						]
					))
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
					assert(assertImportFileCheckOutput(
						result,
						true,
						['col0', 'col1', 'col2'],
						['col0', 'col1', 'col2'], [
							['row0val0', 'row0val1', 'row0val2'],
							['row1val0', 'row1val1', 'row1val2']
						]
					))
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
			it('should execute successfully and return the found object and save the search data if all paramteres are correct and saveSearchData is set to true', function() {
				return co(function*() {
					yield dbComponents.userTypes.create({name: 'type1', description: 'description1', status: true})
					yield dbComponents.users.create({typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', password: '1234', status: true})
					delete req.locals.error
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
						item = {id:2, typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', status: true},
						savedSearchData = JSON.parse(yield module.generalStore.getStoredEntry(`user1usersSavedSearchData`)),
						dataIsGood = true
					for (const key in item) {
						if (result[key] !== item[key]) {
							console.log(`Bad value '${result[key]}' for field "${key}".`)
							dataIsGood = false
							break
						}
					}
					assert(
						dataIsGood &&
						(savedSearchData.filters.id === 2) &&
						(returnedData.results.length === 1) &&
						(returnedData.page === 1) &&
						(returnedData.perPage === 10) &&
						(returnedData.totalPages === 1) &&
						(returnedData.more === false)
					)
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
						item = {id:2, typeId: 2, firstName: 'fn1', lastName: 'ln1', email: 'email1@ramster.com', status: true},
						dataIsGood = true
					for (const key in item) {
						if (result[key] !== item[key]) {
							console.log(`Bad value '${result[key]}' for field "${key}".`)
							dataIsGood = false
							break
						}
					}
					assert(
						dataIsGood &&
						(returnedData.savedSearchData.filters.id === 2) &&
						(returnedData.results.length === 1) &&
						(returnedData.page === 1) &&
						(returnedData.perPage === 10) &&
						(returnedData.totalPages === 1) &&
						(returnedData.more === false)
					)
					return true
				})
			})
			it('should clean up users and userTypes after it finishes testing', function() {
				return co(function*() {
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
					assert(true)
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
					assert(req.locals.error)
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
					assert(assertImportFileCheckOutput(
						res.response.jsonBody,
						true,
						['col0', 'col1', 'col2'],
						['col0', 'col1', 'col2'], [
							['row0val0', 'row0val1', 'row0val2'],
							['row1val0', 'row1val1', 'row1val2']
						]
					))
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
					assert(req.locals.error)
					return true
				})
			})
			it('should throw an error with the correct message if the input file does does not contain any data', function() {
				return co(function*() {
					let fileName = 'testFile.csv',
						fd = yield fs.open(path.join(config.globalUploadPath, fileName), 'w')
					yield fs.writeFile(fd, '')
					yield fs.close(fd)
					delete req.locals.error
					req.user = {id: 1}
					req.body = {fileName, delimiter: ','}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.importFile())(req, res, next.bind(next, resolve))
					}))
					assert(req.locals.error && (req.locals.error.customMessage === 'Invalid data string provided.'))
					return true
				})
			})
			it('should execute successfully, skip empty lines, populate data from addfields and create and update records accordingly, if the csv file matches the template and all parameters are correct', function() {
				return co(function*() {
					let fileName = 'testFile.csv',
						fd = yield fs.open(path.join(config.globalStoragePath, `importTemplates/${componentName}.csv`), 'w')
					yield fs.writeFile(fd, `id,typeId,firstName,lastname,email,password,status`)
					yield fs.close(fd)
					fd = yield fs.open(path.join(config.globalUploadPath, fileName), 'w')
					yield fs.writeFile(fd, 'id,typeId,firstName,lastname,email,password,status\n2,2,updatedFN2,ln2,email2Updated@ramster.com,1234,true\n\n,2,fn3,ln3,email3@ramster.com,1234,true')
					yield fs.close(fd)
					yield db.components.userTypes.create({name: 'type1', description: 'description1', status: true})
					yield dbComponent.create({typeId: 2, firstName: 'fn2', lastName: 'ln2', email: 'email2@ramster.com', password: '1234', status: true})
					delete req.locals.error
					req.user = {id: 1}
					req.body = {fileName, delimiter: ','}
					changeableInstance.addFields = [{fieldName: 'lastName', getValue: (item) => `thisIsTheNewShit${item.typeId}`}]
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.importFile())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let usersShouldBe = [
							{id: 2, typeId: 2, firstName: 'updatedFN2', lastName: 'thisIsTheNewShit2', email: 'email2Updated@ramster.com', status: true},
							{id: 3, typeId: 2, firstName: 'fn3', lastName: 'thisIsTheNewShit2', email: 'email3@ramster.com', status: true}
						],
						users = yield dbComponent.model.findAll({order: [['id', 'asc']]}),
						dataIsGood = true
					for (const i in usersShouldBe) {
						const item = usersShouldBe[i],
							user = users[i].dataValues
						for (const key in item) {
							if (item[key] !== user[key]) {
								console.log(`Bad value '${user[key]}' for field "${key}" in item no. ${i}.`)
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
			it('should throw an error if the csv file does not match the template and the columns are not mapped in the body', function() {
				return co(function*() {
					let fileName = 'testFile.csv',
						fd = yield fs.open(path.join(config.globalUploadPath, fileName), 'w')
					yield fs.writeFile(fd, 'id,typeId,firstNameTest,lastname,emailTest,password,status\n2,2,updatedFN2,ln2,email2Updated@ramster.com,1234,true\n\n,2,fn3,ln3,email3@ramster.com,1234,true')
					yield fs.close(fd)
					delete req.locals.error
					req.user = {id: 1}
					req.body = {fileName, delimiter: ','}
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.importFile())(req, res, next.bind(next, resolve))
					}))
					assert(req.locals.error && (req.locals.error.customMessage === 'The file does not match the template and not all columns have been mapped.'))
					return true
				})
			})
			it('should execute successfully, skip empty lines, populate data from addfields and create and update records accordingly, if the csv file does not match the template, the columns are mapped in the body and all parameters are correct', function() {
				return co(function*() {
					let fileName = 'testFile.csv',
						fd = yield fs.open(path.join(config.globalUploadPath, fileName), 'w')
					yield fs.writeFile(fd, 'id,typeId,firstNameTest,lastname,emailTest,password,status\n2,2,updatedFN2,ln2,email2Updated@ramster.com,1234,true\n\n,2,fn3,ln3,email3@ramster.com,1234,true')
					yield fs.close(fd)
					yield db.sequelize.query(`
						delete from "users";
						select setval('"users_id_seq"'::regclass, 1);
					`)
					yield dbComponent.create({typeId: 2, firstName: 'fn2', lastName: 'ln2', email: 'email2@ramster.com', password: '1234', status: true})
					delete req.locals.error
					req.user = {id: 1}
					req.body = {fileName, delimiter: ',', id: 'id', typeId: 'typeId', firstName: 'firstNameTest', lastname: 'lastname', email: 'emailTest', password: 'password', status: 'status'}
					changeableInstance.addFields = [{fieldName: 'lastName', getValue: (item) => `thisIsTheNewShit${item.typeId}`}]
					yield (new Promise((resolve, reject) => {
						res.json = res.jsonTemplate.bind(res, resolve)
						wrap(instance.importFile())(req, res, next.bind(next, resolve))
					}))
					if (req.locals.error) {
						throw req.locals.error
					}
					let usersShouldBe = [
							{id: 2, typeId: 2, firstName: 'updatedFN2', lastName: 'thisIsTheNewShit2', email: 'email2Updated@ramster.com', status: true},
							{id: 3, typeId: 2, firstName: 'fn3', lastName: 'thisIsTheNewShit2', email: 'email3@ramster.com', status: true}
						],
						users = yield dbComponent.model.findAll({order: [['id', 'asc']]}),
						dataIsGood = true
					for (const i in usersShouldBe) {
						const item = usersShouldBe[i],
							user = users[i].dataValues
						for (const key in item) {
							if (item[key] !== user[key]) {
								console.log(`Bad value '${user[key]}' for field "${key}" in item no. ${i}.`)
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
			it('should clean up the files, users and userTypes after it finishes testing', function() {
				return co(function*() {
					yield fs.unlink(path.join(config.globalUploadPath, 'testFile.csv'))
					yield fs.unlink(path.join(config.globalStoragePath, 'importTemplates/users.csv'))
					yield db.sequelize.query(`
						delete from "userTypes";
						delete from "users";
						select setval('"userTypes_id_seq"'::regclass, 1);
						select setval('"users_id_seq"'::regclass, 1);
					`)
					assert(true)
					return true
				})
			})
		})
	}
}

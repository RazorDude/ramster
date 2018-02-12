'use strict'

const
	BaseServerComponent = require('../shared/base-server.component'),
	co = require('co'),
	csv = new (require('../csvPromise'))(),
	fs = require('fs-extra'),
	path = require('path'),
	toolbelt = require('../toolbelt'),
	xlsx = require('node-xlsx')

class BaseClientComponent extends BaseServerComponent {
	constructor({componentName, componentNameSingular, routes, additionalDefaultRoutes, addDefaultRoutes, routePrefix}) {
		super()
		this.componentName = componentName
		this.componentNameSingular = componentNameSingular

		this.routes = routes || []
		routePrefix = routePrefix || ''
		if (addDefaultRoutes instanceof Array) {
			let defaultRoutes = {
					create: {method: 'post', path: `${routePrefix}/${this.componentName}/create`, func: 'create'},
					read: {method: 'get', path: `${routePrefix}/${this.componentName}/read`, func: 'read'},
					readList: {method: 'post', path: `${routePrefix}/${this.componentName}/readList`, func: 'readList'},
					update: {method: 'post', path: `${routePrefix}/${this.componentName}/update`, func: 'update'},
					checkImportFile: {method: 'get', path: `${routePrefix}/${this.componentName}/checkImportFile`, func: 'checkImportFile'},
					importFile: {method: 'post', path: `${routePrefix}/${this.componentName}/importFile`, func: 'importFile'},
					delete: {method: 'get', path: `${routePrefix}/${this.componentName}/delete`, func: 'delete'}
				},
				defaultRoutesToAdd = []
			if (typeof additionalDefaultRoutes === 'object') {
				for (let key in additionalDefaultRoutes) {
					defaultRoutes[key] = additionalDefaultRoutes[key]
				}
			}
			addDefaultRoutes.forEach((route, index) => {
				if (defaultRoutes[route]) {
					defaultRoutesToAdd.push(defaultRoutes[route])
				}
			})
			this.routes = this.routes.concat(defaultRoutesToAdd)
		}
	}

	importFileCheck({locals, inputFileName, delimiter}) {
		const instance = this
		return co(function*() {
			let fileName = inputFileName,
				extNameRegex = new RegExp(/\.[^/.]+$/),
				extName = extNameRegex.exec(fileName),
				inputFileData = yield fs.readFile(path.join(locals.cfg.globalUploadPath, inputFileName)),
				parsedInputFileData = null,
				template = {
					fileData: yield fs.readFile(path.join(locals.cfg.globalStoragePath, `/importTemplates/${instance.componentName}.csv`)),
					columns: []
				},
				matchesTemplate = true,
				columns = []
			extName = extName && extName[0] || ''
			template.data = yield csv.parse(template.fileData, {delimiter: locals.cfg.csvFileDelimiter || ';'})
			template.data[0].forEach((column, index) => {
				template.columns.push(column)
			})

			if (extName === '.csv') {
				parsedInputFileData = yield csv.parse(inputFileData, {delimiter: delimiter})
			}
			if (extName === '.xlsx') {
				parsedInputFileData = xlsx.parse(inputFileData)
				parsedInputFileData = parsedInputFileData[0] && parsedInputFileData[0].data || null
			}

			let actualFileData = []
			if ((parsedInputFileData instanceof Array) && parsedInputFileData.length) {
				parsedInputFileData[0].forEach((column, index) => {
					if (matchesTemplate && (template.columns[index] !== column)) {
						matchesTemplate = false
					}
					columns.push(column)
				})
				parsedInputFileData.forEach((row, index) => {
					let isBlank = true
					for (const i in row) {
						let colValue = row[i]
						if ((typeof colValue !== 'undefined') && (colValue !== null) && (colValue !== '')) {
							isBlank = false
							break
						}
					}
					if (isBlank) {
						return
					}
					actualFileData.push(row)
				})
			}
			return {matchesTemplate, columns, templateColumns: template.columns, fileData: actualFileData}
		})
	}

	create() {
		const instance = this
		return function* (req, res, next) {
			try {
				let response = {}
				response[instance.componentNameSingular] = yield req.locals.db.components[instance.componentName].create(req.body)
				res.json(response)
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	read() {
		const instance = this
		return function* (req, res, next) {
			try {
				let query = {},
					response = {}
				instance.decodeQueryValues(req.query, query)
				response[instance.componentNameSingular] = yield req.locals.db.components[instance.componentName].read(query)
				res.json(response)
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	readList() {
		const instance = this
		return function* (req, res, next) {
			try {
				res.json(yield req.locals.db.components[instance.componentName].readList(req.body))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	update() {
		const instance = this
		return function* (req, res, next) {
			try {
				res.json(yield req.locals.db.components[instance.componentName].update(req.body))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	checkImportFile() {
		const instance = this
		return function* (req, res, next) {
			try {
				res.json(yield instance.importFileCheck({
					locals: req.locals,
					inputFileName: decodeURIComponent(req.query.fileName),
					delimiter: ';'
				}))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	importFile() {
		const instance = this
		return function* (req, res, next) {
			try {
				let check = yield instance.importFileCheck({
						locals: req.locals,
						inputFileName: req.body.locationDataFile,
						delimiter: req.body.delimiter || ';'
					}),
					dbComponent = req.locals.dbComponents[instance.componentName],
					dataToInsert = [],
					dataToUpdate = []

				if (!(check.fileData instanceof Array) || (check.fileData.length < 2)) {
					throw {customMessage: 'The file is empty or does not contain any data.'}
				}

				if (check.matchesTemplate) {
					check.fileData.forEach((row, index) => {
						if (index > 0) {
							let item = {}
							check.columns.forEach((column, cIndex) => {
								item[column] = row[cIndex]
							})
							if (item.id) {
								dataToUpdate.push(toolbelt.emptyToNull(item))
							} else {
								dataToInsert.push(toolbelt.emptyToNull(item))
							}
						}
					})
				} else {
					let columnsToMatch = {}
					check.templateColumns.forEach((column, cIndex) => {
						let fileColumn = req.body[column]
						if (!fileColumn) {
							throw {customMessage: 'The file does not match the template and not all columns have been mapped.'}
						}
						columnsToMatch[column] = check.columns.indexOf(fileColumn)
					})
					check.fileData.forEach((row, index) => {
						if (index > 0) {
							let item = {}
							check.templateColumns.forEach((column, cIndex) => {
								item[column] = row[columnsToMatch[column]]
							})
							if (item.id) {
								dataToUpdate.push(toolbelt.emptyToNull(item))
							} else {
								dataToInsert.push(toolbelt.emptyToNull(item))
							}
						}
					})
				}

				req.body.UserId = req.session.passport.user

				yield req.locals.db.sequelize.transaction((t) => {
					return co(function*() {
						req.body.transaction = t

						if (dataToInsert.length) {
							yield dbComponent.bulkCreate({
								dbObjects: dataToInsert,
								options: req.body
							})
						}

						if (dataToUpdate.length) {
							for (let i in dataToUpdate) {
								let item = dataToUpdate[i]
								yield dbComponent.update({dbObject: item, where: {id: item.id}, transaction: t})
							}
						}

						return true
					})
				})

				res.json({success: true})
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	delete() {
		const instance = this
		return function* (req, res, next) {
			try {
				let query = {}
				for (const key in req.query) {
					let qItem = req.query[key]
					if (typeof qItem !== 'object') {
						query[decodeURIComponent(key)] = decodeURIComponent(qItem)
						continue
					}
					if (qItem instanceof Array) {
						let decodedItems = []
						for (const i in qItem) {
							if (typeof qItem[i] !== 'object') {
								decodedItems.push(decodeURIComponent(qItem[i]))
							}
						}
						query[decodeURIComponent(key)] = decodedItems
					}
				}
				res.json(yield req.locals.db.components[instance.componentName].delete(query))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}
}

module.exports = BaseClientComponent

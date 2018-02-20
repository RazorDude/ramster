'use strict'

const
	BaseServerComponent = require('../shared/base-server.component'),
	co = require('co'),
	csv = new (require('../csvPromise'))(),
	fs = require('fs-extra'),
	path = require('path'),
	spec = require('./base-client.component.spec'),
	toolbelt = require('../toolbelt')

class BaseClientComponent extends BaseServerComponent {
	constructor(data) {
		super(data)
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
	}

	importFileCheck(inputFileName, delimiter) {
		const instance = this,
			{componentName, module} = this,
			{config} = module
		return co(function*() {
			let fileName = inputFileName,
				extNameRegex = new RegExp(/\.[^/.]+$/),
				extName = extNameRegex.exec(fileName),
				inputFileData = (yield fs.readFile(path.join(config.globalUploadPath, inputFileName))).toString(),
				parsedInputFileData = null,
				template = {
					fileData: (yield fs.readFile(path.join(config.globalStoragePath, `/importTemplates/${componentName}.csv`))).toString(),
					columns: []
				},
				matchesTemplate = true,
				columns = []
			extName = extName && extName[0] || ''
			template.data = yield csv.parse(template.fileData, {delimiter: config.csvFileDelimiter || ';'})
			template.data[0].forEach((column, index) => {
				template.columns.push(column)
			})

			if (extName === '.csv') {
				parsedInputFileData = yield csv.parse(inputFileData, {delimiter: delimiter || config.csvFileDelimiter || ';'})
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
				let length = parsedInputFileData.length
				if (length > 1) {
					for (let i = 1; i < length; i++) {
						const row = parsedInputFileData[i]
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
					}
				}
			}
			return {matchesTemplate, columns, templateColumns: template.columns, fileData: actualFileData}
		})
	}

	readList() {
		const instance = this,
			{componentName, dbComponent, module} = this
		return function* (req, res, next) {
			try {
				if (!req.user) {
					let results = yield dbComponent.readList(query)
					results.savedSearchData = null
					res.json(results)
					return
				}
				let savedSearchData = null,
					query = instance.decodeQueryValues(req.query),
					staticFilters = query.staticFilters
				const currentUser = req.user,
					searchComponentName = query.searchComponentName || componentName

				// determine whether to use saved search data (first if), or save search data (second if)
				if (query.useSavedSearchData) {
					savedSearchData = yield module.generalStore.getStoredEntry(`user${currentUser.id}${searchComponentName}SavedSearchData`)
					if (savedSearchData) {
						query = JSON.parse(savedSearchData)
						savedSearchData = JSON.parse(savedSearchData)
					}
				} else if (query.saveSearchData) {
					if (!query.filters && (typeof query.filters !== 'object')) {
						throw {customMessage: 'No filters provided.'}
					}
					yield module.generalStore.storeEntry(`user${currentUser.id}${searchComponentName}SavedSearchData`, JSON.stringify(query))
				}

				if (!query.filters && (typeof query.filters !== 'object')) {
					throw {customMessage: 'No filters provided.'}
				}

				// map original and static filters, if provided
				let originalFilters = JSON.parse(JSON.stringify(query.filters))
				if (savedSearchData) {
					savedSearchData.filters = originalFilters
				}
				if (staticFilters && (typeof staticFilters === 'object')) {
					let filters = query.filters
					for (const filterField in staticFilters) {
						if (typeof filters[filterField] === 'undefined') {
							filters[filterField] = staticFilters[filterField]
							continue
						}
						filters[filterField] = {$and: [filters[filterField], staticFilters[filterField]]}
					}
				}

				// get results
				let results = yield dbComponent.readList(query)
				results.savedSearchData = savedSearchData
				res.json(results)
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
				res.json(yield instance.importFileCheck(decodeURIComponent(req.query.fileName), req.query.delimiter && decodeURIComponent(req.query.delimiter) || undefined))
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
				let check = yield instance.importFileCheck(req.body.fileName, req.body.delimiter),
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
}

module.exports = BaseClientComponent

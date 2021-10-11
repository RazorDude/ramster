'use strict'
/**
 * The base-client.component module. It contains the BaseClientComponent class.
 * @module baseClientComponent
 */

const
	BaseServerComponent = require('../shared/base-server.component'),
	ClientModule = require('./client.module'),
	co = require('co'),
	csv = new (require('../csvPromise'))(),
	{emptyToNull} = require('../toolbelt'),
	fs = require('fs-extra'),
	path = require('path'),
	spec = require('./base-client.component.spec')

/**
 * The BaseClientComponent class. It contains common client methods and inherits the BaseServerComponent class.
 * @class BaseClientComponent
 */
class BaseClientComponent extends BaseServerComponent {
	/**
	 * Creates an instance of BaseClientComponent. Sets test methods (defined in the accompanying .spec.js file) and calls the parent constructor.
	 * @param {object} data The options to pass to BaseServerComponent.
	 * @see module:clientModule
	 * @memberof BaseClientComponent
	 */
	constructor(data) {
		super(data)
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		/**
		 * The currently initialized instance of the ClientModule.
		 * @type {ClientModule}
		 */
		this.module = undefined
	}

	/**
	 * Performs a check of the data contained in a file being prepared for import. Gives data about whether it matches the template, its contets and the column list, among others.
	 * @param {string} inputFileName The name of the input file as it was uploaded in the globalUploadPath.
	 * @param {string} delimiter The delimiter to parse the csv file with. Can be ',' or ';'. It's ';' by default, unless specified otherwise in the config.
	 * @returns {Promise<object>} A promise which wraps a generator function.
	 * @memberof BaseClientComponent
	 */
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
							continue
						}
						actualFileData.push(row)
					}
				}
			}
			return {matchesTemplate, columns, templateColumns: template.columns, fileData: actualFileData}
		})
	}

	/**
	 * The returned method returns a paginated list of results based on the provided query params. Can save the query as "savedSearchData" and use it as "useSavedSearchData", again, based on the provided query params.
	 * @returns {function} An expressJs-style function, which accepts req, res and next as arguments.
	 * @memberof BaseClientComponent
	 */
	readList() {
		const {componentName, dbComponent, module} = this
		return function* (req, res, next) {
			try {
				let savedSearchData = null,
					query = req.query,
					staticFilters = query.staticFilters
				const currentUser = req.user,
					searchComponentName = query.searchComponentName || componentName
				if (!currentUser) {
					let results = yield dbComponent.readList(query)
					results.savedSearchData = null
					res.json(results)
					return
				}

				// determine whether to use saved search data (first if), or save search data (second if)
				if (query.useSavedSearchData) {
					savedSearchData = yield module.generalStore.getStoredEntry(`userId-${currentUser.id}-searchComponent-${searchComponentName}-savedSearchData`)
					if (savedSearchData) {
						query = JSON.parse(savedSearchData)
						savedSearchData = JSON.parse(savedSearchData)
					}
				} else if (query.saveSearchData) {
					if (!query.filters || (typeof query.filters !== 'object')) {
						// throw {customMessage: 'No filters provided.'}
						query.filters = {}
					}
					yield module.generalStore.storeEntry(`userId-${currentUser.id}-searchComponent-${searchComponentName}-savedSearchData`, JSON.stringify(query))
				}

				if (!query.filters && (typeof query.filters !== 'object')) {
					// throw {customMessage: 'No filters provided.'}
						query.filters = {}
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

	/**
	 * The returned method invokes importFileCheck.
	 * @returns {function} An expressJs-style function, which accepts req, res and next as arguments.
	 * @memberof BaseClientComponent
	 */
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

	/**
	 * The returned method imports a data file, based on the data given by importFileCheck.
	 * @param {object} additionalOptions A list of options to pass to dbComponent.bulkUpsert.
	 * @returns {function} An expressJs-style function, which accepts req, res and next as arguments.
	 * @memberof BaseClientComponent
	 */
	importFile(additionalOptions) {
		const instance = this,
			{dbComponent} = this
		return function* (req, res, next) {
			try {
				const addFields = instance.addFields || []
				let check = yield instance.importFileCheck(req.body.fileName, req.body.delimiter),
					data = []

				if (!(check.fileData instanceof Array) || !check.fileData.length) {
					throw {customMessage: 'The file is empty or does not contain any data.'}
				}

				if (check.matchesTemplate) {
					check.fileData.forEach((row, index) => {
						let item = {}
						check.columns.forEach((column, cIndex) => {
							item[column] = row[cIndex]
						})
						addFields.forEach((fieldData, fIndex) => {
							item[fieldData.fieldName] = fieldData.getValue(item, req.user)
						})
						data.push(emptyToNull(item))
					})
				} else {
					let columnsToMatch = {}
					check.templateColumns.forEach((column) => {
						let fileColumn = req.body[column]
						if (!fileColumn) {
							throw {customMessage: 'The file does not match the template and not all columns have been mapped.'}
						}
						columnsToMatch[column] = check.columns.indexOf(fileColumn)
					})
					check.fileData.forEach((row, index) => {
						let item = {}
						check.templateColumns.forEach((column, cIndex) => {
							item[column] = row[columnsToMatch[column]]
						})
						addFields.forEach((fieldData, fIndex) => {
							item[fieldData.fieldName] = fieldData.getValue(item, req.user)
						})
						data.push(emptyToNull(item))
					})
				}

				let options = {userId: req.user && req.user.id || null}
				if ((typeof additionalOptions === 'object') && (additionalOptions !== null)) {
					let {userId, ...goodOptions} = additionalOptions
					for (const key in goodOptions) {
						options[key] = goodOptions[key]
					}
				}
				yield dbComponent.bulkUpsert(data, options)
				res.json({success: true})
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}
}

module.exports = BaseClientComponent

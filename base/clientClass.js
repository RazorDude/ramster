'use strict'

let fs = require('fs'),
	path = require('path'),
	co = require('co'),
	csv = new (require('../modules/csvPromise/index'))(),
	xlsx = require('node-xlsx')

class Base {
	constructor({componentName, componentNameSingular, routes, addDefaultRoutes}) {
		this.componentName = componentName
		this.componentNameSingular = componentNameSingular

		this.routes = routes
		if (addDefaultRoutes instanceof Array) {
			let defaultRoutes = {
					create: {method: 'post', path: `/${this.componentName}/create`, func: 'create'},
					read: {method: 'get', path: `/${this.componentName}/read`, func: 'read'},
					readAssociated: {method: 'post', path: `/${this.componentName}/readAssociated`, func: 'readAssociated'},
					readList: {method: 'post', path: `/${this.componentName}/readList`, func: 'readList'},
					update: {method: 'post', path: `/${this.componentName}/update`, func: 'update'},
					delete: {method: 'get', path: `/${this.componentName}/delete`, func: 'delete'}
				},
				defaultRoutesToAdd = []
			addDefaultRoutes.forEach((route, index) => {
				if (defaultRoutes[route]) {
					defaultRoutesToAdd.push(defaultRoutes[route])
				}
			})
			this.routes = this.routes.concat(defaultRoutesToAdd)
		}
	}

	getRoutes() {
		return this.routes
	}

	importFileCheck({locals, inputFileName, delimiter}) {
		let instance = this
		return co(function*() {
			let fileName = inputFileName,
				extNameRegex = new RegExp(/\.[^/.]+$/),
				extName = extNameRegex.exec(fileName),
				inputFileData = fs.readFileSync(path.join(locals.cfg.globalUploadPath, inputFileName)),
				parsedInputFileData = null,
				template = {
					fileData: fs.readFileSync(path.join(locals.cfg.globalStoragePath, `/importTemplates/${instance.componentName}.csv`)),
					columns: []
				},
				matchesTemplate = true,
				columns = []
			extName = extName && extName[0] || ''
			template.data = yield csv.parse({data: template.fileData, options: {delimiter: ';'}})
			template.data[0].forEach((column, index) => {
				template.columns.push(column)
			})

			if (extName === '.csv') {
				parsedInputFileData = yield csv.parse({data: inputFileData, options: {delimiter: delimiter}})
			}
			if (extName === '.xlsx') {
				parsedInputFileData = xlsx.parse(inputFileData)
				parsedInputFileData = parsedInputFileData[0] && parsedInputFileData[0].data || null
			}

			if (parsedInputFileData && parsedInputFileData[0]) {
				parsedInputFileData[0].forEach((column, index) => {
					if (matchesTemplate && (template.columns[index] !== column)) {
						matchesTemplate = false
					}
					columns.push(column)
				})
			}
			return {matchesTemplate, columns, templateColumns: template.columns, fileData: parsedInputFileData}
		})
	}

	create() {
		let instance = this
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
		let instance = this
		return function* (req, res, next) {
			try {
				let query = {},
					response = {}
				for (let key in req.query) {
					if (typeof req.query[key] !== 'object') {
						query[decodeURIComponent(key)] = decodeURIComponent(req.query[key])
					}
				}
				response[instance.componentNameSingular] = yield req.locals.db.components[instance.componentName].read(query)
				res.json(response)
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	readAssociated() {
		let instance = this
		return function* (req, res, next) {
			try {
				res.json(yield req.locals.db.components[instance.componentName].readAssociated(req.body))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	readList() {
		let instance = this
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
		let instance = this
		return function* (req, res, next) {
			try {
				res.json(yield req.locals.db.components[instance.componentName].update(req.body))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	delete() {
		let instance = this
		return function* (req, res, next) {
			try {
				let query = {}
				for (let key in req.query) {
					if (typeof req.query[key] !== 'object') {
						query[decodeURIComponent(key)] = decodeURIComponent(req.query[key])
					}
				}
				res.json(yield req.locals.db.components[instance.componentName].destroy(query))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}
}

module.exports = Base

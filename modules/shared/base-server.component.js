'use strict'

const
	co = require('co'),
	{getNested} = require('../toolbelt'),
	spec = require('./base-server.component.spec')

class BaseServerComponent {
	constructor({componentName, routes, addDefaultRoutes, additionalDefaultRoutes, appendComponentNameToRoutes}) {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		this.allowedMethods = ['get', 'post', 'put', 'patch', 'delete']
		this.componentName = componentName
		this.setRoutes({addDefaultRoutes, additionalDefaultRoutes, appendComponentNameToRoutes, routes})
	}

	decodeQueryValues(object) {
		if (typeof object === 'undefined') {
			return null
		}
		if (typeof object === 'string') {
			return decodeURIComponent(object)
		}
		if ((typeof object !== 'object') || (object === null)) {
			return object
		}
		if (object instanceof Array) {
			let decodedObject = []
			object.forEach((item, index) => {
				decodedObject.push(this.decodeQueryValues(item))
			})
			return decodedObject
		}
		let decodedObject = {}
		for (const key in object) {
			decodedObject[decodeURIComponent(key)] = this.decodeQueryValues(object[key])
		}
		return decodedObject
	}

	setRoutes({addDefaultRoutes, additionalDefaultRoutes, appendComponentNameToRoutes, routes}) {
		const {allowedMethods, componentName} = this
		let appendString = appendComponentNameToRoutes ? `/${componentName}` : ''
		this.addedDefaultRoutes = []
		this.routes = routes || []
		this.routes.forEach((item, index) => {
			if (allowedMethods.indexOf(item.method.toLowerCase()) === -1) {
				throw {customMessage: `Invalid HTTP method "${item.method}" for route "${item.path}" in component "${componentName}".`}
			}
			if (typeof this[item.func] !== 'function') {
				throw {customMessage: `Method "${item.func}" (${item.method.toUpperCase()} route to "${item.path}") does not exist in component "${componentName}".`}
			}
			if (item.path instanceof Array) {
				let paths = []
				item.path.forEach((e, i) => paths.push(`${appendString}${e}`))
				this.routes[index].path = paths
				return
			}
			this.routes[index].path = `${appendString}${item.path}`
		})
		if (addDefaultRoutes instanceof Array) {
			let defaultRoutes = {
					create: {method: 'post', path: `/${componentName}`, func: 'create'},
					read: {method: 'get', path: `/${componentName}/item`, func: 'read'},
					readList: {method: 'get', path: `/${componentName}`, func: 'readList'},
					readSelectList: {method: 'get', path: `/${componentName}/selectList`, func: 'readSelectList'},
					update: {method: 'patch', path: `/${componentName}/item/:id`, func: 'update'},
					bulkUpsert: {method: 'put', path: `/${componentName}`, func: 'bulkUpsert'},
					checkImportFile: {method: 'get', path: `/${componentName}/checkImportFile`, func: 'checkImportFile'},
					importFile: {method: 'post', path: `/${componentName}/importFile`, func: 'importFile'},
					delete: {method: 'delete', path: `/${componentName}/:id`, func: 'delete'}
				},
				defaultRoutesToAdd = []
			if (typeof additionalDefaultRoutes === 'object') {
				for (let key in additionalDefaultRoutes) {
					defaultRoutes[key] = additionalDefaultRoutes[key]
					let newRoute = defaultRoutes[key]
					if (allowedMethods.indexOf(newRoute.method.toLowerCase()) === -1) {
						throw {customMessage: `Invalid HTTP method "${newRoute.method}" for route "${newRoute.path}" in component "${componentName}".`}
					}
					if (typeof this[newRoute.func] !== 'function') {
						throw {customMessage: `Method "${newRoute.func}" (${newRoute.method.toUpperCase()} route to "${newRoute.path}") does not exist in component "${componentName}".`}
					}
					newRoute.path = `/${componentName}${newRoute.path}`
				}
			}
			addDefaultRoutes.forEach((route, index) => {
				if (defaultRoutes[route]) {
					defaultRoutesToAdd.push(defaultRoutes[route])
				}
			})
			this.addedDefaultRoutes = defaultRoutesToAdd
			this.routes = this.routes.concat(defaultRoutesToAdd)
		}
	}

	accessFilter(options) {
		const instance = this
		return function* (req, res, next) {
			try {
				const user = req.user
				if ((typeof user !== 'object') || (user === null) || (typeof user.type !== 'object') || (user.type === null) || !(user.type.accessPoints instanceof Array)) {
					throw {customMessage: 'Unauthorized.', status: 401}
				}
				const type = user.type,
					userTypeAccessPoints = type.accessPoints,
					apIds = options.accessPointIds,
					nextMethod = typeof options.next === 'function' ? options.next : instance[options.next]()

				// check if we have a multitude of access points for this endpoint
				if (apIds instanceof Array) {
					let apIdMap = {}
					userTypeAccessPoints.forEach((ap, index) => {
						apIdMap[ap.id] = true
					})
					if (options.requireAllAPs) {
						let allPresent = true
						for (const i in apIds) {
							if (!apIdMap[apIds[i]]) {
								allPresent = false
								break
							}
						}
						if (allPresent) {
							yield* nextMethod(req, res, next)
							return
						}
					} else {
						for (const i in apIds) {
							if (apIdMap[apIds[i]]) {
								yield* nextMethod(req, res, next)
								return
							}
						}
					}
				}

				// throw the user out, because he's failed all checks
				throw {customMessage: 'Unauthorized.', status: 401}
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	create() {
		const instance = this,
			{dbComponent} = this
		return function* (req, res, next) {
			try {
				let options = null
				if (req.user) {
					options = {userId: req.user.id}
				}
				res.json({result: yield dbComponent.create(req.body, options)})
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	read() {
		const instance = this,
			{dbComponent} = this
		return function* (req, res, next) {
			try {
				res.json({result: yield dbComponent.read(instance.decodeQueryValues(req.query))})
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	readList() {
		const instance = this,
			{dbComponent} = this
		return function* (req, res, next) {
			try {
				res.json(yield dbComponent.readList(instance.decodeQueryValues(req.query)))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	readSelectList() {
		const instance = this,
			{dbComponent} = this
		return function* (req, res, next) {
			try {
				let query = instance.decodeQueryValues(req.query),
					options = {readAll: true, filters: query.filters, relReadKeys: query.relReadKeys || [], orderDirection: query.orderDirection || 'asc'},
					prependString = query.prependString || '',
					appendString = query.appendString || '',
					processTitleFields = query.processTitleFields || [],
					titleFields = query.titleFields,
					titleField = query.titleField || 'id'

				if (!query.orderBy) {
					if (titleFields instanceof Array) {
						for (const i in titleFields) {
							let field = titleFields[i]
							if (field.indexOf('.') === -1) {
								options.orderBy = field
								break
							}
						}
						if (!options.orderBy) {
							options.orderBy = 'id'
						}
					} else {
						options.orderBy = titleField
					}
				} else {
					options.orderBy = query.orderBy
				}

				let data = yield dbComponent.readList(options),
					results = []
				data.results.forEach((row, index) => {
					let text = '',
						concatenateWith = query.concatenateWith,
						lastConcatenator = null
					if (!(concatenateWith instanceof Array)) {
						concatenateWith = concatenateWith || ' '
						lastConcatenator = concatenateWith
					}
					if (titleFields instanceof Array) {
						titleFields.forEach((field, fIndex) => {
							let value = getNested(row, field),
								processValue = processTitleFields[fIndex] || null
							value = (typeof value === 'undefined') || (value === null) || (typeof value === 'object') ? '' : value
							if (processValue === 'yesNo') {
								value = value && (value !== '') ? 'Yes' : 'No'
							}
							text += value
							if (concatenateWith instanceof Array) {
								lastConcatenator = (concatenateWith[i] || ' ')
								text += lastConcatenator
							} else {
								text += concatenateWith
							}
						})
						if (text.length) {
							text = text.substr(0, text.length - lastConcatenator.length)
						}
					} else {
						text = getNested(row, titleField)
					}
					text = prependString + text + appendString
					results.push({value: row.id, text})
				})
				res.json(results)
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	update() {
		const instance = this,
			{dbComponent} = this
		return function* (req, res, next) {
			try {
				res.json(yield dbComponent.update({dbObject: req.body, where: {id: req.params.id}, userId: req.user.id}))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	bulkUpsert() {
		const instance = this,
			{dbComponent} = this
		return function* (req, res, next) {
			try {
				if (req.body.where) {
					if (req.user) {
						req.body.userId = req.user.id
					}
					res.json(yield dbComponent.update(req.body))
					return
				}
				let options = null
				if (req.user) {
					options = {userId: req.user.id}
				}
				res.json(yield dbComponent.bulkUpsert(req.body, options))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	delete() {
		const instance = this,
			{dbComponent} = this
		return function* (req, res, next) {
			try {
				yield dbComponent.delete({id: req.params.id, checkForRelatedModels: true})
				res.json({success: true})
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}
}

module.exports = BaseServerComponent

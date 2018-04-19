'use strict'
/**
 * The base-server.component module. Contains the BaseServerComponent class.
 * @module baseServerComponentModule
 */

const
	co = require('co'),
	{getNested} = require('../toolbelt'),
	spec = require('./base-server.component.spec')

/**
 * The base class for server (client and api) components. It contains common methods that are server-type agnostic.
 * @class BaseServerComponent
 */
class BaseServerComponent {
	/**
	 * Creates an instance of BaseServerComponent.
	 * @param {object} options The list of common options for the component.
	 * @param {string} options.componentName The name of the component. Automatically taken from the folder name the component .js file is in.
	 * @param {baseServerComponentRouteConfigObject[]} options.routes (optional) The list of routes to mount and their settings.
	 * @param {string[]} options.addDefaultRoutes (optional) The list of default routes to add - create, read, readList, readSelectList, update, bulkUpsert, delete.
	 * @param {baseServerComponentRouteConfigObject[]} options.additionalDefaultRoutes (optional) A list of routes to set as default ones for all components that inherit the class that sets them, in addition to the ramster-provided default routes.
	 * @param {boolean} options.appendComponentNameToRoutes (optional) If set to true, the component name will be added as a prefix too all routes in the "routes" array. In such a case, be sure to use "" instead of "/" for the route path of methods that are supposed to be at "/componentName". Otherwise you'll get a not found error, because the routes will mount at "/componentName/".
	 * @typedef {Object.<string, any>} baseServerComponentRouteConfigObject
	 * @property {string} method The HTTP method type - GET, POST, PUT, PATCH and DELETE. Case-insensitive.
	 * @property {string} path The HTTP REST path of the route (not including the server URL).
	 * @property {string} func The name of the component function to execute for the route.
	 * @property {Object.<string, any>} options (option) An options object to pass as an argument to the function.
	 * @memberof BaseServerComponent
	 */
	constructor(options) {
		const {componentName, routes, addDefaultRoutes, additionalDefaultRoutes, appendComponentNameToRoutes} = options
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		/**
		 * The list of allowed HTTP methods for routes.
		 * @type {string[]}
		 */
		this.allowedMethods = ['get', 'post', 'put', 'patch', 'delete']
		/**
		 * The name of the component.
		 * @type {string}
		 */
		this.componentName = componentName
		/**
		 * A reference to the dbComponent related to this server component (if any). See the baseDBComponent docs for more info.
		 * @type {object}
		 */
		this.dbComponent = undefined
		this.setRoutes({addDefaultRoutes, additionalDefaultRoutes, appendComponentNameToRoutes, routes})
	}

	/**
	 * Recursively performs decodeURIComponent on an object or value and returns the decoded object.
	 * @param {any} object The object / value to decode.
	 * @returns {any} The decoded object / value.
	 * @memberof BaseServerComponent
	 */
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

	/**
	 * Validates the provided data and populates the component.routes array.
	 * @param {object} options The list of options for the method.
	 * @param {string[]} options.addDefaultRoutes (optional) The list of default routes to add - create, read, readList, readSelectList, update, bulkUpsert, delete.
	 * @param {baseServerComponentRouteConfigObject[]} options.additionalDefaultRoutes (optional) A list of routes to set as default ones for all components that inherit the class that sets them, in addition to the ramster-provided default routes.
	 * @param {boolean} options.appendComponentNameToRoutes (optional) If set to true, the component name will be added as a prefix too all routes in the "routes" array. In such a case, be sure to use "" instead of "/" for the route path of methods that are supposed to be at "/componentName". Otherwise you'll get a not found error, because the routes will mount at "/componentName/".
	 * @param {baseServerComponentRouteConfigObject[]} options.routes (optional) The list of routes to mount and their settings.
	 * @returns {void}
	 * @memberof BaseServerComponent
	 */
	setRoutes(options) {
		const {allowedMethods, componentName} = this,
			{addDefaultRoutes, additionalDefaultRoutes, appendComponentNameToRoutes, routes} = options
		let appendString = appendComponentNameToRoutes ? `/${componentName}` : ''
		/**
		 * The default routes added to this.routes and their settings.
		 * @type {baseServerComponentRouteConfigObject[]}
		 */
		this.addedDefaultRoutes = []
		/**
		 * The class' HTTP routes and their settings.
		 * @type {baseServerComponentRouteConfigObject[]}
		 */
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

	/**
	 * Executed before certain methods. Limits access to routes based on the logged in user's accessPoints (see the permissions system) and the settings in the options object. Throws a 401 error if the user does not meet the criteria, and yields the route method if access is allowed.
	 * @param {object} options The list of options for the method.
	 * @param {number[]} options.accessPointIds An array containing the ids of the access points that the user must have in his role to access the route.
	 * @param {function} options.next A @generator function. The method to execute if the user has access.
	 * @param {boolean} requireAllAPs If set to true, all ids in the options.accessPointIds array must be present in the user's accessPoints to access the route. Otherwise, just one of them is needed.
	 * @returns {function} An express-js style generator function to be mounted using co-express.
	 * @memberof BaseServerComponent
	 */
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

	/**
	 * Create a new entry of the server component's related dbComponent model in the database. The request body must be the object to create.
	 * @returns {IterableIterator} An express-js style generator function to be mounted using co-express.
	 * @memberof BaseServerComponent
	 */
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

	/**
	 * Fetch a single database entry of the server component's related dbComponent model.
	 * @see module:baseDBComponentModule.read for the query params.
	 * @returns {IterableIterator} An express-js style generator function to be mounted using co-express.
	 * @memberof BaseServerComponent
	 */
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

	/**
	 * Fetch a list of database entries of the server component's related dbComponent model.
	 * @see module:baseDBComponentModule.readList for the query params.
	 * @returns {IterableIterator} An express-js style generator function to be mounted using co-express.
	 * @memberof BaseServerComponent
	 */
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

	/**
	 * Fetch a list of database entries of the server component's related dbComponent model.
	 * @returns {IterableIterator} An expressJS style generator function to be mounted using co-express.
	 * @memberof BaseServerComponent
	 */
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

	/**
	 * Update one or more database entries of the server component's related dbComponent model, matching the id provided in req.params.
	 * @returns {IterableIterator} An expressJS style generator function to be mounted using co-express.
	 * @memberof BaseServerComponent
	 */
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

	/**
	 * Create and/or update multiple database entries of the server component's related dbComponent model.
	 * @returns {IterableIterator} An expressJS style generator function to be mounted using co-express.
	 * @memberof BaseServerComponent
	 */
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

	/**
	 * Delete one or more database entries of the server component's related dbComponent model, matching the id provided in req.params.
	 * @returns {IterableIterator} An expressJS style generator function to be mounted using co-express.
	 * @memberof BaseServerComponent
	 */
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

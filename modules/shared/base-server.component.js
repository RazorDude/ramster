/**
 * The base-server.component module. Contains the BaseServerComponent class.
 * @module baseServerComponentModule
 */

const
	BaseDBComponent = require('../db/base-db.component'),
	BaseServerModule = require('./base-server.module'),
	co = require('co'),
	{decodeQueryValues, getNested, setNested} = require('../toolbelt'),
	moment = require('moment'),
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
	 * @param {string[]} options.afterRoutesMethodNames (optional) The list of method names to mount as net() for all routes. Must correspond to actual methods from the server component. Will be mounted in the order provided.
	 * @typedef {Object.<string, any>} baseServerComponentRouteConfigObject
	 * @property {string} method The HTTP method type - GET, POST, PUT, PATCH and DELETE. Case-insensitive.
	 * @property {string} path The HTTP REST path of the route (not including the server URL).
	 * @property {string} func The name of the component function to execute for the route.
	 * @property {Object.<string, any>} options (option) An options object to pass as an argument to the function.
	 * @memberof BaseServerComponent
	 */
	constructor(options) {
		const {componentName, routes, addDefaultRoutes, additionalDefaultRoutes, appendComponentNameToRoutes, afterRoutesMethodNames} = options
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		/**
		 * The currently initialized instance of the BaseServerModule.
		 * @type {string[]}
		 */
		this.afterRoutesMethodNames = afterRoutesMethodNames instanceof Array ? afterRoutesMethodNames : []
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
		 * A reference to the dbComponent related to this server component (if any).
		 * @type {BaseDBComponent}
		 */
		this.dbComponent = undefined
		this.decodeQueryValues = decodeQueryValues
		/**
		 * The currently initialized instance of the BaseServerModule.
		 * @type {BaseServerModule}
		 */
		this.module = undefined
		this.setRoutes({addDefaultRoutes, additionalDefaultRoutes, appendComponentNameToRoutes, routes})
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
					streamReadList: {method: 'get', path: `/${componentName}/streamList`, func: 'streamReadList'},
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
	 * Limits access to routes based on the logged in user's accessPoints (see the permissions system) and the settings in the options object. Throws a 401 error if the user does not meet the criteria.
	 * @param {object} req An expressJS req object
	 * @param {object} options The list of options for the method.
	 * @param {number[] | Array<number>[]} options.accessPointIds An array containing the ids of the access points that the user must have in his role to access the route.
	 * @param {function} options.next A @generator function. The method to execute if the user has access.
	 * @param {boolean} requireAllAPs Alias for requireAllUngroupedAPs, used for backwards compatibility.
	 * @param {boolean} requireAllUngroupedAPs If set to true, all ungrouped ids in the options.accessPointIds array must be present in the user's accessPoints to access the route. Otherwise, just one of them is needed.
	 * @returns {number[]} An array of the access point ids, because of which the user was granted access to the route
	 * @memberof BaseServerComponent
	 */
	filterAccess(req, options) {
		const user = req.user
		if ((typeof user !== 'object') || (user === null)) {
			throw {customMessage: 'Unauthorized.', status: 401}
		}
		if ((typeof user.type !== 'object') || (user.type === null) || !(user.type.accessPoints instanceof Array)) {
			throw {customMessage: 'You do not have access to this resource.', status: 403, stage: 0}
		}
		const type = user.type,
			userTypeAccessPoints = type.accessPoints,
			apIds = options.accessPointIds

		if (apIds instanceof Array) {
			const {requireAllAPs, requireAllUngroupedAPs} = options
			let requireAllAPsInGroupIndexes = [],
				apIdMap = {},
				accessPointGroups = [[]],
				userFieldNameAPIndexGroups = [[]],
				hasUserFieldValues = false,
				nonePresent = true,
				grantedAccessPointIds = []
			if (requireAllAPs || requireAllUngroupedAPs) {
				requireAllAPsInGroupIndexes.push(0)
			}
			userTypeAccessPoints.forEach((ap, index) => {
				apIdMap[ap.id] = {index, active: ap.active, hasUserFieldName: ap.userFieldName ? true : false}
			})
			// first pass - add all ungrouped access points to group index 0 and add the other groups to the array of groups
			for (const i in apIds) {
				if (apIds[i] instanceof Array) {
					accessPointGroups.push(apIds[i])
					userFieldNameAPIndexGroups.push([])
					requireAllAPsInGroupIndexes.push(accessPointGroups.length - 1)
				} else {
					accessPointGroups[0].push(apIds[i])
				}
			}
			// second pass - check for the existence of the grouped access points themselves
			for (const i in accessPointGroups) {
				let allAPsInGroupRequired = requireAllAPsInGroupIndexes.indexOf(parseInt(i, 10)) !== -1,
					allPresent = true,
					group = accessPointGroups[i],
					noneInGroupPresent = true
				for (const j in group) {
					const apData = apIdMap[group[j]]
					if ((typeof apData === 'undefined') || !apData.active) {
						allPresent = false
						if (allAPsInGroupRequired) {
							break
						}
						continue
					}
					if (noneInGroupPresent) {
						noneInGroupPresent = false
					}
					if (nonePresent) {
						nonePresent = false
					}
					// if the AP has the "userFieldName" field provided, add its index to the list for later evaluation
					if (apData.hasUserFieldName) {
						if (!hasUserFieldValues) {
							hasUserFieldValues = true
						}
						userFieldNameAPIndexGroups[i].push(apData.index)
					}
					else {
						grantedAccessPointIds.push(apData.id)
					}
				}
				// block access if APs in the group are required, but not all are present
				if (allAPsInGroupRequired && !allPresent && !noneInGroupPresent) {
					throw {customMessage: 'You do not have access to this resource.', status: 403, stage: 1}
				}
			}
			// block access if no APs are present
			if (nonePresent) {
				throw {customMessage: 'You do not have access to this resource.', status: 403, stage: 2}
			}
			// check the APs with the "userFieldName" field provided
			const valueProcessorMethod = options.userFieldValueProcessorMethodName ? instance[options.userFieldValueProcessorMethodName].bind(instance) : (req, value) => value
			nonePresent = true
			userFieldNameAPIndexGroups.forEach((groupData, groupIndex) => {
				const allAPsInGroupRequired = requireAllAPsInGroupIndexes.indexOf(groupIndex) !== -1
				groupData.forEach((apIndex) => {
					const ap = userTypeAccessPoints[apIndex],
						userFieldValue = getNested(user, ap.userFieldName),
						userFieldValueIsAnArray = (userFieldValue instanceof Array)
					if ((typeof userFieldValue === 'undefined') || !ap.active) {
						if (allAPsInGroupRequired) {
							throw {customMessage: 'You do not have access to this resource.', status: 403, stage: 3}
						}
						return
					}
					// if we have to check whether the request has the required value(s)
					if (ap.searchForUserFieldIn) {
						const requestFieldValue = getNested(req, ap.searchForUserFieldIn)
						if (typeof requestFieldValue === 'undefined') {
							if (allAPsInGroupRequired) {
								throw {customMessage: 'You do not have access to this resource.', status: 403, stage: 4}
							}
							return
						}
						const requestFieldValueIsAnArray = requestFieldValue instanceof Array,
							rfvActual = requestFieldValueIsAnArray ? requestFieldValue : [requestFieldValue]
						let allowedValues = []
						for (const index in rfvActual) {
							const rfvItem = rfvActual[index],
								requestFieldValues = [
									rfvItem, // the value as-is
									parseInt(rfvItem, 10), // the int value
									parseFloat(rfvItem), // the float value
									(rfvItem === true) || (rfvItem === 'true') // the boolean value
								]
							if (userFieldValueIsAnArray) {
								// if the request field value is an array, filter out only the items he has access to
								for (const i in userFieldValue) {
									const value = userFieldValue[i]
									for (const j in requestFieldValues) {
										if (requestFieldValues[j] === value) {
											allowedValues.push(value)
											break
										}
									}
								}
							} else {
								// if the request field value is an array, filter out only the items he has access to
								for (const j in requestFieldValues) {
									if (requestFieldValues[j] === userFieldValue) {
										allowedValues.push(userFieldValue)
										break
									}
								}
							}
						}
						if (allowedValues.length) {
							setNested(req, ap.searchForUserFieldIn, allowedValues)
						}
						else {
							if (allAPsInGroupRequired) {
								throw {customMessage: 'You do not have access to this resource.', status: 403, stage: 5}
							}
							// TODO: figure this out - it fucks up certain access points, for example if saerching for req.params.id - sets it to undefined
							// setNested(req, ap.searchForUserFieldIn, undefined)
							return
						}
					}
					// if we have to set the value of the userField under some key(s) in the request
					if (ap.setUserFieldValueIn) {
						// if we're setting the userField's value in multiple objects within an array
						if (ap.setUserFieldValueIn.indexOf('[]') !== -1) {
							let fieldPaths = ap.setUserFieldValueIn.split('[]'),
								containerPath = fieldPaths[0],
								inChildPath = fieldPaths[1],
								container = getNested(req, containerPath)
							if (!(container instanceof Array)) {
								if (allAPsInGroupRequired) {
									throw {customMessage: 'Could not set access-related field values in the request data object. Please check your data and try again.', status: 400, stage: 6}
								}
								return
							}
							const processedValue = valueProcessorMethod(req, userFieldValue)
							container.forEach((item, index) => {
								if (!setNested(req, `${containerPath}.${index}.${inChildPath}`, processedValue)) {
									if (allAPsInGroupRequired) {
										throw {customMessage: 'Could not set access-related field values in the request data object. Please check your data and try again.', status: 400, stage: 7}
									}
									return
								}
							})
						}
						// otherwise, if we have to set it for a single item but it didn't work
						else if (!setNested(req, ap.setUserFieldValueIn, valueProcessorMethod(req, userFieldValue))) {
							if (allAPsInGroupRequired) {
								throw {customMessage: 'Could not set access-related field values in the request data object. Please check your data and try again.', status: 400, stage: 8}
							}
							return
						}
					}
					if (nonePresent) {
						nonePresent = false
					}
					grantedAccessPointIds.push(ap.id)
				})
			})
			if (hasUserFieldValues && nonePresent) {
				throw {customMessage: 'You do not have access to this resource. Please check your data and try again if you think this is a mistake.', status: 403, stage: 9}
			}
			return grantedAccessPointIds
		}

		// throw the user out, because he's failed all checks
		throw {customMessage: 'You do not have access to this resource.', status: 403, stage: 10}
	}

	/**
	 * Executed before certain methods. Executes filterAccess and yields the route method if access is allowed.
	 * @param {object} options The list of options for the method.
	 * @param {number[] | Array<number>[]} options.accessPointIds An array containing the ids of the access points that the user must have in his role to access the route.
	 * @param {function} options.next A @generator function. The method to execute if the user has access.
	 * @param {boolean} requireAllAPs Alias for requireAllUngroupedAPs, used for backwards compatibility.
	 * @param {boolean} requireAllUngroupedAPs If set to true, all ungrouped ids in the options.accessPointIds array must be present in the user's accessPoints to access the route. Otherwise, just one of them is needed.
	 * @returns {function} An express-js style generator function to be mounted using co-express.
	 * @memberof BaseServerComponent
	 */
	accessFilter(options) {
		const instance = this
		return function* (req, res, next) {
			try {
				const nextMethod = (typeof options.next === 'function') ? options.next : instance[options.next]()
				req.locals.grantedAccessPointIds = instance.filterAccess(req, options)
				yield* nextMethod(req, res, next)
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
		const {dbComponent} = this
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
		const {dbComponent} = this
		return function* (req, res, next) {
			try {
				res.json({result: yield dbComponent.read(req.query)})
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
		const {dbComponent} = this
		return function* (req, res, next) {
			try {
				res.json(yield dbComponent.readList(req.query))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	/**
	 * Establish a peristent connection and continuously push the list of database items matching the search criteria to the front-end.
	 * @returns {IterableIterator} An expressJS-style generator function to be wrapped by co-wrap and mounted in the server's router.
	 * @memberof BaseServerComponent
	 */
	streamReadList() {
		const instance = this,
			{dbComponent} = this
		return function* (req, res, next) {
			try {
				const acceptHeader = req.get('accept')
				if (!acceptHeader || (acceptHeader.indexOf('text/event-stream') === -1)) {
					throw {customMessage: 'Please provide an accept header that contains text/event-stream to access this content.'}
				}
				res.status(200).set({
					'Content-Type': 'text/event-stream',
					'Cache-Control': 'no-cache',
					Connection: 'keep-alive',
					'X-Accel-Buffering': 'no'
				})
				res.write(`data: ${JSON.stringify(yield dbComponent.readList(req.query))}\n\n`)
				let interval = setInterval(() => {
					return co(function*() {
						return yield dbComponent.readList(req.query)
					}).then(
						(data) => {
							res.write(`data: ${JSON.stringify(data)}\n\n`)
						},
						(err) => {
							instance.module.logger.error(err)
							res.write(`data: ${JSON.stringify({error: 'Could not get data.'})}\n\n`)
						}
					)
				}, 5000)
				req.on('close', () => {
					clearInterval(interval)
				})
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
		const {dbComponent} = this
		return function* (req, res, next) {
			try {
				let query = req.query,
					options = {readAll: true, filters: query.filters, relReadKeys: query.relReadKeys || {}, orderDirection: query.orderDirection || 'asc'},
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
				data.results.forEach((row) => {
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
							value = (typeof value === 'undefined') || (value === null) || ((typeof value === 'object') && !(value instanceof Date)) ? '' : value
							if (processValue === 'yesNo') {
								value = value && (value !== '') ? 'Yes' : 'No'
							}
							if (processValue && processValue.match(/^dateFormat_/)) {
								let format = processValue.replace('dateFormat_', '')
								if (value instanceof Date) {
									value = moment(value.valueOf(), 'x').format(format)
								}
								else {
									value = moment(value, 'YYYY-MM-DD HH:mm:ss').format(format)
								}
							}
							text += value
							if ((typeof value !== 'undefined') && (`${value}`).length) {
								if (concatenateWith instanceof Array) {
									lastConcatenator = (concatenateWith[fIndex] || ' ')
									text += lastConcatenator
								} else {
									text += concatenateWith
								}
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
		const {dbComponent} = this
		return function* (req, res, next) {
			try {
				let filters =  {
						...(req.body.filters || req.body.where || {}),
						id: req.params.id
					},
					dbObject = {}
				if (filters.id.match(/,/)) {
					filters.id = filters.id.split(',')
				}
				delete req.body.filters
				delete req.body.where
				if (!req.body.dbObject) {
					Object.keys(req.body).forEach((key, index) => {
						dbObject[key] = req.body[key]
						delete req.body[key]
					})
				} else {
					dbObject = req.body.dbObject
				}
				res.json(
					yield dbComponent.update({
						dbObject,
						filters,
						where: filters,
						userId: req.user.id
					})
				)
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
		const {dbComponent} = this
		return function* (req, res, next) {
			try {
				if ((req.body.filters) || (req.body.where)) {
					if (req.user) {
						req.body.userId = req.user.id
					}
					res.json(yield dbComponent.update(req.body))
					return
				}
				let options = {}
				if (req.user) {
					options.userId = req.user.id
				}
				if (req.body instanceof Array) {
					res.json(yield dbComponent.bulkUpsert(req.body, options))
					return
				}
				let {additionalCreateFields, dbObjects, updateFilters} = req.body
				if (additionalCreateFields) {
					options.additionalCreateFields = additionalCreateFields
				}
				if (updateFilters) {
					options.updateFilters = updateFilters
				}
				res.json(yield dbComponent.bulkUpsert(dbObjects, options))
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
		const {dbComponent} = this
		return function* (req, res, next) {
			try {
				res.json(yield dbComponent.delete({id: req.params.id, additionalFilters: req.body.additionalFilters, checkForRelatedModels: true}))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}
}

module.exports = BaseServerComponent

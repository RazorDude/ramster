/**
 * The base-server.module module. Contains the BaseServerModule class.
 * @module baseServerModuleModule
 */

const _BaseServerComponent = require('./base-server.component')
const co = require('co')
const {changeKeyCase} = require('../toolbelt')
const _DBModule = require('../db/db.module')
const fs = require('fs-extra')
const _GeneralStore = require('../generalStore/generalStore.module')
const _Logger = require('../errorLogger/errorLogger.module')
const passport = require('passport')
const path = require('path')
const spec = require('./base-server.module.spec')
const _TokenManager = require('../tokenManager/tokenManager.module')

/**
 * The base class for server (client and api) modules. It loads the module components and set some pre- and post-route method defaults.
 * @class BaseServerModule
 */
class BaseServerModule {
	/**
	 * Creates an instance of BaseServerModule.
	 * @param {object} config The project config object.
	 * @see module:configModule
	 * @param {string} moduleName The name of the module.
	 * @param {string} moduleType The type of the module. Can be 'client' or 'api'.
	 * @param {object} options An object containing additonal properties.
	 * @param {string[]} options.afterRoutesMethodNames An array of strings, which represent module methods to be mounted after all routes as next() for the whole module.
	 * @param {_DBModule} options.db An instance of the DBModule class.
	 * @param {_Logger} options.logger An instance of the Logger class.
	 * @param {_GeneralStore} options.generalStore An instance of the GeneralStore class.
	 * @param {_TokenManager} options.tokenManager An instance of the TokenManager class
	 * @memberof BaseServerModule
	 */
	constructor(config, moduleName, moduleType, options) {
		const {afterRoutesMethodNames, db, generalStore, logger, tokenManager} = options
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		/**
		 * An array of strings, which represent module methods to be mounted after all routes as next() for the whole module.
		 * @type {string[]}
		 */
		this.afterRoutesMethodNames = afterRoutesMethodNames instanceof Array ? afterRoutesMethodNames : ['handleNextAfterRoutes']
		/**
		 * The project config object.
		 * @type {object}
		 */
		this.config = config
		/**
		 * The name of the module.
		 * @type {string}
		 */
		this.moduleName = moduleName
		/**
		 * The type of the module.
		 * @type {string}
		 */
		this.moduleType = moduleType
		/**
		 * The module config object. This is a sub-object of the project config object, specifically config[`${moduleType}`s][moduleName].
		 * @type {object}
		 */
		this.moduleConfig = config[`${moduleType}s`][moduleName]
		/**
		 * The list of instances of all baseServerComponents for this module.
		 * @type {Object.<string, _BaseServerComponent>}
		 */
		this.components = {}
		/**
		 * A passportJS instance.
		 * @type {passport}
		 */
		this.passport = passport
		/**
		 * An instance of the _DBModule class.
		 * @type {_DBModule}
		 */
		this.db = db
		/**
		 * An instance of the Logger class.
		 * @type {_Logger}
		 */
		this.logger = logger
		/**
		 * An instance of the GeneralStore class.
		 * @type {_GeneralStore}
		 */
		this.generalStore = generalStore
		/**
		 * An instance of the TokenManager class.
		 * @type {_TokenManager}
		 */
		this.tokenManager = tokenManager
		/**
		 * A key-value map of how to parse fields between upper and lower camelCase.
		 * @type {object[]}
		 */
		this.fieldCaseMap = null
		/**
		 * A list of expressJS-style methods to execute prior to all other methods.
		 * @type {object[]}
		 */
		this.precursorMethods = null
	}

	/**
	 * Loads all server components in the related folder and their tests. Sets the module as a property of each one, while dereferecing the component from the module's components object to avoid circularization. Runs the setup method for each component that has one. Also loads the moduleMethods.js file, if present in the module folder.
	 * @returns {Promise<boolean>} A promise wrapping a generator function.
	 * @memberof BaseServerModule
	 */
	loadComponents() {
		let instance = this,
			{config, moduleType, moduleName} = this
		return co(function*() {
			const modulesPath = config[`${moduleType}ModulesPath`]
			let modulePath = path.join(modulesPath, moduleName),
				moduleDirData = yield fs.readdir(modulePath),
					components = {}
			for (const index in moduleDirData) {
				const componentName = moduleDirData[index],
					componentPath = path.join(modulePath, componentName)
				if (componentName.indexOf('.') === -1) {
					let componentDirData = yield fs.readdir(componentPath),
						component = new (require(componentPath))(componentName),
						specMethodNames = []
					if (!component.componentName) {
						component.componentName = componentName
					}
					// load the mocha spec, if present
					for (const j in componentDirData) {
						let item = componentDirData[j]
						if (item === 'index.spec.js') {
							try {
								let spec = require(path.join(componentPath, 'index.spec.js'))
								if ((typeof spec !== 'object') || (spec === null)) {
									throw {customMessage: `Invalid spec file for "${moduleName}" client module component "${componentName}".`}
								}
								for (const key in spec) {
									let specMethod = spec[key]
									if (typeof specMethod === 'function') {
										component[key] = specMethod
										specMethodNames.push(key)
									}
								}
								component.specMethodNames = specMethodNames
							} catch (e) {
								throw {customMessage: `Invalid spec file for "${moduleName}" client module component "${componentName}".`}
							}
							break
						}
					}
					components[componentName] = component
				} else if (componentName === 'fieldCaseMap.js') {
					instance.fieldCaseMap = require(componentPath)
				} else if (componentName === 'precursorMethods.js') {
					instance.precursorMethods = require(componentPath)
				} else if (componentName === 'moduleMethods.js') {
					let moduleMethods = require(componentPath)
					if ((typeof moduleMethods !== 'object') || (moduleMethods === null)) {
						throw {customMessage: `Invalid moduleMethods file for the "${moduleName}" client module.`}
					}
					for (const methodName in moduleMethods) {
						let method = moduleMethods[methodName]
						if (typeof method === 'function') {
							instance[methodName] = method
						}
					}
				}
			}
			instance.components = components
			instance.setModuleInComponents()
			components = instance.components
			return true
		})
	}

	/**
	 * Sets the module as a property of each component, while dereferecing the component from the module's components object to avoid circularization. Sets the dbComponent for each component, if any.
	 * @returns {void}
	 * @memberof BaseServerModule
	 */
	setModuleInComponents() {
		let {components} = this
		for (const componentName in components) {
			let component = components[componentName],
				moduleClone = Object.assign({}, this),
				dbComponent = moduleClone.db.components[componentName]
			moduleClone.components = Object.assign({}, components)
			delete moduleClone.components[componentName]
			component.module = moduleClone
			if (dbComponent) {
				component.dbComponent = dbComponent
			}
		}
	}

	/**
	 * Sets up CORS-related headers and passess the request forward.
	 * @returns {function} An expressJS-style function to be mounted in the server router.
	 * @memberof BaseServerModule
	 */
	accessControlAllowOrigin() {
		const {moduleConfig} = this
		return function (req, res, next) {
			res.set('Access-Control-Allow-Origin', moduleConfig.allowOrigins)
			res.set('Access-Control-Allow-Headers', 'accept, accept-encoding, accept-language, authorization, connection, content-type, host, origin, referer, user-agent')
			res.set('Allow', 'OPTIONS, GET, POST, PUT, PATCH, DELETE')
			if (req.method.toLowerCase() === 'options') {
				res.status(200).end()
				return
			}
			next()
		}
	}

	/**
	 * Changes the field case of all variables in a container recursively, based on a provided fieldCaseChangeMap.
	 * @param {object} container The object containing the data and the field keys to be changed.
	 * @param {object} fieldCaseMap The rules by which to do the change.
	 * @param {object} fieldCaseChangeSettings (optional) Additional settings for the field change method.
	 * @returns {function} An expressJS-style function to be mounted in the server router.
	 * @memberof BaseServerModule
	 */
	changeFieldCase(container, fieldCaseMap, fieldCaseChangeSettings) {
		const instance = this
		return function (req, res, next) {
			try {
				if (req[container]) {
					req[container] = JSON.parse(changeKeyCase(fieldCaseMap, req[container], fieldCaseChangeSettings))
				}
				next()
			} catch (err) {
				instance.logger.error(err)
				res.status(err.status || 500).json({error: err.customMessage || 'An internal server error has occurred. Please try again.'})
			}
		}
	}

	/**
	 * Does error and not-found-route handling. Used to commonly handle such cases across all server modules.
	 * @returns {function} An expressJS-style function to be mounted in the server router.
	 * @memberof BaseServerModule
	 */
	handleNextAfterRoutes() {
		const instance = this,
			{moduleConfig} = this,
			notFoundRedirectRoutes = moduleConfig.notFoundRedirectRoutes
		return function (req, res) {
			if (!req.locals || !req.locals.error) {
				if (notFoundRedirectRoutes) {
					res.redirect(302, req.isAuthenticated() && notFoundRedirectRoutes.authenticated ? notFoundRedirectRoutes.authenticated : notFoundRedirectRoutes.default)
					return
				}
				res.status(404).json({error: 'Not found.'})
				return
			}
			const error = req.locals.error,
				sequelizeErrorMessage = error.name
			let errorMessage = 'An internal server error has occurred. Please try again.',
				errorStatus = 500
			instance.logger.error(error)
			if (sequelizeErrorMessage) {
				if (sequelizeErrorMessage === 'SequelizeUniqueConstraintError') {
					errorMessage = 'A similar item already exists. Please check your data and make sure it\'s unique before proceeding.'
					errorStatus = 400
				} else if (sequelizeErrorMessage === 'ValidationError') {
					errorMessage = 'Validation error - please make sure all required fields are present and in the correct format.'
					errorStatus = 400
				}
			} else if (error.customMessage) {
				errorMessage = req.locals.error.customMessage
				errorStatus = req.locals.errorStatus || req.locals.error.status || 400
			} else {
				if (req.locals.errorStatus) {
					errorStatus = req.locals.errorStatus
				} else if (error.status) {
					errorStatus = error.status
				}
			}
			let response = {}
			if (moduleConfig.responseType === 'serviceName') {
				response = {serviceName: req.locals.serviceName, data: null, message: errorMessage}
			} else {
				response = {error: errorMessage}
			}
			res.status(errorStatus).json(response)
		}
	}
}

module.exports = BaseServerModule

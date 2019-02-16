'use strict'
/**
 * The api module. Contains the APIModule class.
 * @module apiModule
 */

const
	BaseApiComponent = require('./base-api.component'),
	BaseServerModule = require('../shared/base-server.module'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	co = require('co'),
	express = require('express'),
	expressSession = require('express-session'),
	http = require('http'),
	path = require('path'),
	requestLogger = require('morgan'),
	spec = require('./api.module.spec'),
	wrap = require('co-express')

/**
 * The ramster APIModule class. It has its own server and contains a bunch of components, in which api endpoits are defined.
 * @class APIModule
 */
class APIModule extends BaseServerModule {
	/**
	 * Creates an instance of APIModule. Sets the config and test methods (defined in the accompanying .spec.js file) as class properties and passes the moduleName, type and options to the parent class constructor.
	 * @param {object} config A ramster config object.
	 * @see module:configModule
	 * @param {string} moduleName The name of the module. Ususally passed automatically by coreInstance.loadAPIs.
	 * @see module:core
	 * @param {object} options The options object for the BaseServerModule parent.
	 * @see module:baseServerModule
	 * @memberof APIModule
	 */
	constructor(config, moduleName, options) {
		super(config, moduleName, 'api', options)
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		/**
		 * An object, containing all api server components.
		 * @type {Object.<string, BaseApiComponent>}
		 */
		this.components = {}
	}

	/**
	 * If mounted properly, the returned method sets req.originalUrl and req.locals before evey request.
	 * @returns {function} An expressJs-style function, which accepts req, res and next as arguments.
	 * @memberof APIModule
	 */
	setDefaultsBeforeRequest() {
		const instance = this,
			{config, moduleConfig, moduleName} = this
		return function(req, res, next) {
			let originalUrl = req.originalUrl.split('?')[0]
			if (req.method.toLowerCase() !== 'get') {
				console.log(`[${moduleName} API]`, originalUrl, 'BODY Params: ', JSON.stringify(req.body || {}))
			}
			req.locals = {
				error: null,
				originalUrl
			}
			next()
		}
	}

	/**
	 * Sets up an expressJs server and mounts all routes from all components, then starts the server.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof APIModule
	 */
	mountRoutes() {
		let instance = this
		return co(function*() {
			const {afterRoutesMethodNames, config, moduleName, moduleConfig} = instance
			instance.app = express()
			instance.router = express.Router()
			instance.paths = []
			let app = instance.app,
				components = instance.components

			// set up request logging and request body parsing
			app.use(requestLogger(`[${moduleName} API] :method request to :url; result: :status; completed in: :response-time; :date`))
			app.use(bodyParser.json()) // for 'application/json' request bodies
			app.use(cookieParser())

			// set up access control by origin
			if (moduleConfig.allowOrigins) {
				app.use(instance.accessControlAllowOrigin())
			}

			// before every route - set up post params logging, redirects and locals
			app.use(instance.paths, wrap(instance.setDefaultsBeforeRequest()))

			// before every request - if query/body field case change is enabled
			const fieldCaseChangeSettings = config.fieldCaseChange,
				fieldCaseMap = instance.fieldCaseMap || instance.db.fieldCaseMap || null
			if (fieldCaseChangeSettings && fieldCaseMap) {
				if (fieldCaseChangeSettings.query) {
					app.use(instance.changeFieldCase('query', fieldCaseMap, fieldCaseChangeSettings.query))
				}
				if (fieldCaseChangeSettings.body) {
					app.use(instance.changeFieldCase('body', fieldCaseMap, fieldCaseChangeSettings.body))
				}
			}

			// before every request - add any precursor methods defined in the module config
			const precursorMethods = moduleConfig.precursorMethods
			if (precursorMethods && (typeof precursorMethods === 'object')) {
				for (const methodKey in precursorMethods) {
					if (typeof precursorMethods[methodKey] === 'function') {
						app.use(wrap(precursorMethods[methodKey]()))
					}
				}
			}

			// load all route paths
			for (const i in components) {
				components[i].routes.forEach((routeData, index) => {
					if (routeData.path instanceof Array) {
						routeData.path.forEach((path, pIndex) => {
							instance.paths.push(path)
						})
					} else {
						instance.paths.push(routeData.path)
					}
				})
			}

			// mount all routes
			for (const i in components) {
				let component = components[i]
				const componentAfterRoutesMethodNames = component.afterRoutesMethodNames
				component.routes.forEach((routeData, index) => {
					if (moduleConfig.anonymousAccessRoutes.indexOf(routeData.path) === -1) {
						instance.router[routeData.method](routeData.path, wrap(instance.tokenManager.validate()), wrap(component[routeData.func](routeData.options || {})))
						return
					}
					instance.router[routeData.method](routeData.path, wrap(component[routeData.func](routeData.options || {})))
				})
				if (componentAfterRoutesMethodNames && componentAfterRoutesMethodNames.length) {
					for (const i in componentAfterRoutesMethodNames) {
						instance.router.use(`/${component.componentName}/*`, component[componentAfterRoutesMethodNames[i]]())
					}
				}
			}
			app.use('/', instance.router)

			// after every route - return handled errors and set up redirects
			if (afterRoutesMethodNames.length) {
				for (const i in afterRoutesMethodNames) {
					app.use('*', instance[afterRoutesMethodNames[i]]())
				}
			}

			// add the express app to each component's module instance and run its setup method, if needed
			for (const i in components) {
				let component = components[i]
				component.module.app = app
				if (typeof component.setup === 'function') {
					component.setup()
				}
			}

			instance.server = http.createServer(app)
			instance.server.listen(moduleConfig.serverPort, () => {
				console.log(`[${moduleName} API] Server started.`)
				console.log(`[${moduleName} API] Port:`, moduleConfig.serverPort)
				console.log(`[${moduleName} API] Configuration profile:`, config.name)
			})

			return true
		})
	}
}

module.exports = APIModule

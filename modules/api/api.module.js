/**
 * The api module. Contains the APIModule class.
 * @module apiModule
 */

const BaseServerModule = require('../shared/base-server.module')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const co = require('co')
const {checkRoutes, decodeQueryValues} = require('../toolbelt')
const express = require('express')
const http = require('http')
const requestLogger = require('morgan')
const spec = require('./api.module.spec')
const wrap = require('co-express')

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
		const {moduleConfig, moduleName} = this,
			doNotLogRequestDataRoutes = moduleConfig.doNotLogRequestDataRoutes || []
		return function(req, res, next) {
			let originalUrl = req.originalUrl.split('?')[0]
			if (req.method.toLowerCase() !== 'get') {
				console.log(
					`[${moduleName} API]`,
					originalUrl,
					!checkRoutes(originalUrl, doNotLogRequestDataRoutes) ? `BODY Params: ${JSON.stringify(req.body || {})}` : ''
				)
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
		const instance = this
		return co(function*() {
			const { afterRoutesMethodNames, config, moduleName, moduleConfig } = instance
			const doNotLogRequestDataRoutes = moduleConfig.doNotLogRequestDataRoutes || []
			const loggedInUserFieldsToDisplayInRequestInfo = moduleConfig.loggedInUserFieldsToDisplayInRequestInfo || []
			const routesWithBodyParser =
				moduleConfig.withBodyParserRoutes ||
				moduleConfig.withBodyParserRoutesRegex ||
				moduleConfig.noBodyParserRoutesRegex ||
				'*'
			instance.app = express()
			instance.paths = []
			let app = instance.app,
				components = instance.components

			// set up request logging and request body parsing
			app.use(
				requestLogger(function (tokens, req, res) {
					return [
						`[${moduleName} API]` + (
							loggedInUserFieldsToDisplayInRequestInfo.length 
								? (
									req.user
										? `[user: ${loggedInUserFieldsToDisplayInRequestInfo.map((fieldName) => req.user[fieldName]).join(', ')}]`
										: '[user: no user data]'
								)
								: ''
						) +
						(moduleConfig.logRemoteAddress && req.connection ? `[remoteAddress: ${req.connection.remoteAddress}]` : '') +
						(moduleConfig.logForwardedForHeader && req.headers ? `[x-forwarded-for: ${req.headers['x-forwarded-for']}]` : '') +
						` ${tokens.method(req, res)} request to `,
						!checkRoutes(req.originalUrl, doNotLogRequestDataRoutes) ? tokens.url(req, res) : req.originalUrl.split('?')[0],
						`; result: ${tokens.status(req, res)}; completed in: ${tokens['response-time'](req, res)} ms; date: ${tokens.date(req, res)}`
					].join('')
				})
			)
			// for raw request bodies
			app.use(
				routesWithBodyParser,
				(req, _res, next) => {
					if (typeof req.get('Content-Type') === 'undefined') {
						let data = ''
						req.setEncoding('utf8')
						req.on('data', function(chunk) {
							data += chunk
						})
						req.on('end', function() {
							req.rawBody = data
							next()
						})
						return
					}
					next()
				}
			)
			// for 'application/json' request bodies
			app.use(routesWithBodyParser, bodyParser.json())
			// 'x-www-form-urlencoded' request bodies
			app.use(routesWithBodyParser, bodyParser.urlencoded({extended: false}))
			app.use(cookieParser())

			app.use((req, _res, next) => {
				if (req.method.toLowerCase() === 'get') {
					req.query = decodeQueryValues(req.query)
				}
				next()
			})

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
			const precursorMethods = instance.precursorMethods
			if (precursorMethods && (typeof precursorMethods === 'object')) {
				for (const methodKey in precursorMethods) {
					if (typeof precursorMethods[methodKey] === 'function') {
						app.use(wrap(precursorMethods[methodKey].call(instance)))
					}
				}
			}

			// load all route paths
			for (const i in components) {
				components[i].routes.forEach((routeData) => {
					if (routeData.path instanceof Array) {
						routeData.path.forEach((path) => {
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
				component.routes.forEach((routeData) => {
					if (!checkRoutes(routeData.path, moduleConfig.anonymousAccessRoutes)) {
						app[routeData.method](routeData.path, wrap(instance.tokenManager.validate()), wrap(component[routeData.func](routeData.options || {})))
						return
					}
					app[routeData.method](routeData.path, wrap(component[routeData.func](routeData.options || {})))
				})
				if (componentAfterRoutesMethodNames && componentAfterRoutesMethodNames.length) {
					for (const i in componentAfterRoutesMethodNames) {
						app.use(`/${component.componentName}/*`, component[componentAfterRoutesMethodNames[i]]())
					}
				}
			}

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
			instance.server.listen(moduleConfig.serverPort, moduleConfig.serverHost || '0.0.0.0', () => {
				console.log(`[${moduleName} API] Server started.`)
				console.log(`[${moduleName} API] Port:`, moduleConfig.serverPort)
				console.log(`[${moduleName} API] Configuration profile:`, config.name)
			})

			return true
		})
	}
}

module.exports = APIModule

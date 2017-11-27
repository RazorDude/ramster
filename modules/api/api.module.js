'use strict'

const
	BaseServerModule = require('../shared/base-server.module'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	co = require('co'),
	express = require('express'),
	expressSession = require('express-session'),
	http = require('http'),
	path = require('path'),
	requestLogger = require('morgan'),
	wrap = require('co-express')

class APIModule extends BaseServerModule {
	constructor(config, moduleName, options) {
		super(config, moduleName, 'api', options)
	}

	mountRoutes({sessionStore}) {
		let instance = this
		return co(function*() {
			const {config, moduleName, moduleConfig, passport} = instance
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
				app.use(instance.accessControlOrigin())
			}

			// before every request - add the service name
			if (moduleConfig.responseType === 'serviceName') {
				app.use(instance.prepareServiceNameTypeResponse())
			}

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

			// before every route - set up post params logging, redirects and locals
			app.use(instance.paths, wrap(instance.setDefaultsBeforeRequest()))

			// mount all routes
			for (const i in components) {
				let component = components[i]
				component.routes.forEach((routeData, index) => {
					if (moduleConfig.anonymousAccessRoutes.indexOf(routeData.path) === -1) {
						instance.router[routeData.method](routeData.path, instance.tokenManager.validate(), wrap(component[routeData.func](routeData.options || {})))
						return
					}
					instance.router[routeData.method](routeData.path, wrap(component[routeData.func](routeData.options || {})))
				})
			}
			app.use('/', instance.router)

			// after every route - return handled errors and set up redirects
			app.use('*', instance.handleNextAfterRoutes())

			instance.server = http.createServer(app)
			instance.server.listen(moduleConfig.serverPort, () => {
				console.log(`[${moduleName} API] Server started.`)
				console.log(`[${moduleName} API] Port:`, moduleConfig.serverPort)
				console.log(`[${moduleName} API] Configuration profile:`, config.name)
			})

			return true
		})
	}

	prepareServiceNameTypeResponse() {
		return function (req, res, next) {
			let originalUrl = req.originalUrl.split('?')[0],
				serviceNameData = originalUrl.split('/')
			req.locals = {serviceName: serviceNameData[serviceNameData.length - 1]}
			next()
		}
	}

	setDefaultsBeforeRequest() {
		const instance = this,
			{moduleName, moduleConfig, config} = this
		return function* (req, res, next) {
			let originalUrl = req.originalUrl.split('?')[0]
			console.log(`[${moduleName} API]`, originalUrl, 'POST Params: ', JSON.stringify(req.body || {}))

			req.locals = {
				moduleName,
				cfg: config, // #refactorAtV1.0.0
				settings: instance.settings, // #refactorAtV1.0.0
				serviceName: req.locals.serviceName,
				fieldCaseMap: instance.fieldCaseMap,
				logger: instance.logger,
				mailClient: instance.mailClient,
				generalStore: instance.generalStore,
				tokenManager: instance.tokenManager,
				db: instance.db,
				passport: instance.passport,
				error: null,
				errorStatus: 500,
				originalUrl
			}
			next()
		}
	}
}

module.exports = APIModule

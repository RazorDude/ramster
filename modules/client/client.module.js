'use strict'

const
	BaseServerModule = require('../shared/base-server.module'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	co = require('co'),
	Cookies = require('cookies'),
	{changeKeyCase, checkRoutes} = require('../toolbelt'),
	express = require('express'),
	expressSession = require('express-session'),
	fs = require('fs-extra'),
	http = require('http'),
	multipart = require('connect-multiparty'),
	path = require('path'),
	requestLogger = require('morgan'),
	spec = require('./client.module.spec'),
	wrap = require('co-express')

class ClientModule extends BaseServerModule {
	constructor(config, moduleName, options) {
		super(config, moduleName, 'client', options)
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
	}

	setDefaultsBeforeRequest() {
		const instance = this,
			{moduleName, moduleConfig, config} = this
		return function(req, res, next) {
			let originalUrl = req.originalUrl.split('?')[0],
				cookies = new Cookies(req, res)
			console.log(`[${moduleName} client]`, originalUrl, 'POST Params: ', JSON.stringify(req.body || {}))

			if (!checkRoutes(originalUrl, instance.paths)) {
				const notFoundRedirectRoutes = moduleConfig.notFoundRedirectRoutes
				if (notFoundRedirectRoutes) {
					res.redirect(302, req.isAuthenticated() && notFoundRedirectRoutes.authenticated ? notFoundRedirectRoutes.authenticated : notFoundRedirectRoutes.default)
					return
				}
				res.status(404).end()
				return
			}
			if (!req.isAuthenticated() && (!(moduleConfig.anonymousAccessRoutes instanceof Array) || !checkRoutes(originalUrl, moduleConfig.anonymousAccessRoutes))) {
				if (
					((instance.layoutRoutes instanceof Array) && checkRoutes(originalUrl, instance.layoutRoutes)) ||
					((moduleConfig.nonLayoutDirectRoutes instanceof Array) && checkRoutes(originalUrl, moduleConfig.nonLayoutDirectRoutes))
				) {
					cookies.set('beforeLoginURL', req.originalUrl, {httpOnly: false})
					if (moduleConfig.unauthorizedPageRedirectRoute) {
						res.redirect(302, moduleConfig.unauthorizedPageRedirectRoute)
						return
					}
					if (moduleConfig.redirectUnauthorizedPagesToNotFound && moduleConfig.notFoundRedirectRoutes && moduleConfig.notFoundRedirectRoutes.default) {
						res.redirect(302, moduleConfig.notFoundRedirectRoutes.default)
						return
					}
				}
				res.status(401).end()
				return
			}

			req.locals = {
				error: null,
				errorStatus: 500,
				originalUrl
			}
			next()
		}
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
			app.use(requestLogger(`[${moduleName} client] :method request to :url; result: :status; completed in: :response-time; :date`))
			app.use(bodyParser.json()) // for 'application/json' request bodies
			app.use(bodyParser.urlencoded({extended: false})) // 'x-www-form-urlencoded' request bodies
			if (config.globalUploadPath) {
				app.use(multipart({uploadDir: config.globalUploadPath})) // for multipart bodies - file uploads etc.
			}
			app.use(cookieParser())

			// set up access control by origin
			if (moduleConfig.allowOrigins) {
				app.use(instance.accessControlAllowOrigin())
			}

			// set up the passport session
			app.use(expressSession({
				secret: moduleConfig.session.secret,
				key: moduleConfig.session.key,
				resave: true,
				saveUninitialized: true,
				cookie: {
					httpOnly: false
				},
				store: sessionStore,
				passport: {}
			}))
			app.use(passport.initialize())
			app.use(passport.session())

			 // serve static files - not recommended; preferably use nginx or apache; ideally for SPAs, your server should serve only the layout.html (index) file
			if (moduleConfig.serveStaticFiles) {
				app.use(express.static(moduleConfig.publicPath))
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
			let layoutRoutes = []
			for (const i in components) {
				components[i].routes.forEach((routeData, index) => {
					if (routeData.path instanceof Array) {
						routeData.path.forEach((path, pIndex) => {
							instance.paths.push(path)
							if (routeData.isALayoutRoute) {
								layoutRoutes.push(path)
							}
						})
					} else {
						instance.paths.push(routeData.path)
						if (routeData.isALayoutRoute) {
							layoutRoutes.push(routeData.path)
						}
					}
				})
			}
			instance.layoutRoutes = layoutRoutes

			// before every route - set up post params logging, redirects and locals
			app.use(instance.paths, instance.setDefaultsBeforeRequest())

			// mount all routes
			for (const i in components) {
				let component = components[i]
				component.routes.forEach((routeData, index) => {
					instance.router[routeData.method](routeData.path, wrap(component[routeData.func](routeData.options || {})))
				})
			}
			app.use('/', instance.router)

			//after every route - return handled errors and set up redirects
			app.use('*', instance.handleNextAfterRoutes())

			instance.server = http.createServer(app)
			instance.server.listen(moduleConfig.serverPort, () => {
				console.log(`[${moduleName} client] Server started.`)
				console.log(`[${moduleName} client] Port:`, moduleConfig.serverPort)
				console.log(`[${moduleName} client] Configuration profile:`, config.name)
			})

			return true
		})
	}
}

module.exports = ClientModule

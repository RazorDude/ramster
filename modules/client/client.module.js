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
	handlebars = require('handlebars'),
	http = require('http'),
	multipart = require('connect-multiparty'),
	path = require('path'),
	pug = require('pug'),
	requestLogger = require('morgan'),
	wrap = require('co-express')

class ClientModule extends BaseServerModule {
	constructor(config, moduleName, options) {
		super(config, moduleName, 'client', options)
	}

	generateNGINXConfig() {
		let instance = this
		return co(function*() {
			const {wsPort, serverPort, nodeProxyProtocol, nodeProxyHostAddress, nodeProxyServerPort, publicPath, prependWSServerConfigFromFiles, appendWSServerConfigFromFiles, webpackHost, webpackBuildFolderName} = instance.moduleConfig,
				{projectName, wsConfigFolderPath, mountGlobalStorageInWebserver, globalStoragePath, hostProtocol, hostAddress} = instance.config
			let configFilePath = path.join(wsConfigFolderPath, `${projectName}-${instance.moduleName}.conf`),
				configFile = yield fs.open(configFilePath, 'w'),
				prependToServerConfig = '',
				appendToServerConfig = '',
				bundleConfig = ''

			if (prependWSServerConfigFromFiles instanceof Array) {
				for (const i in prependWSServerConfigFromFiles) {
					prependToServerConfig += (yield fs.readFile(prependWSServerConfigFromFiles[i])).toString()
				}
			}

			if (appendWSServerConfigFromFiles instanceof Array) {
				for (const i in appendWSServerConfigFromFiles) {
					appendToServerConfig += (yield fs.readFile(appendWSServerConfigFromFiles[i])).toString()
				}
			}

			if (mountGlobalStorageInWebserver) {
				let template = handlebars.compile((yield fs.readFile(path.join(__dirname, './nginxConfig/nginx-global-storage.config.conf'))).toString())
				prependToServerConfig += template({globalStoragePath: globalStoragePath.replace(/\\/g, '\\\\')})
			}

			if (webpackHost) {
				let template = handlebars.compile((yield fs.readFile(path.join(__dirname, './nginxConfig/nginx-bundle.config.conf'))).toString())
				bundleConfig += template({webpackHost, webpackFolder: webpackBuildFolderName || 'dist'})
			}

			let template = handlebars.compile((yield fs.readFile(path.join(__dirname, './nginxConfig/nginx-main.config.conf'))).toString())
			yield fs.writeFile(configFile, template({
				listeningPort: wsPort,
				serverName: hostAddress,
				serverRoot: /^win/.test(process.platform) ? publicPath.replace(/\\/g, '\\\\') : publicPath,
				prependToServerConfig,
				appendToServerConfig,
				bundleConfig,
				nodeProxyProtocol: nodeProxyProtocol || hostProtocol,
				nodeProxyHostAddress: nodeProxyHostAddress || hostAddress,
				nodeProxyServerPort: nodeProxyServerPort || serverPort
			}))
			yield fs.close(configFile)

			return true
		})
	}

	buildLayoutFile() {
		let instance = this
		return co(function*() {
			const {config, moduleName, moduleConfig} = instance
			let publicSourcesPath = path.join(config.clientModulesPublicSourcesPath, moduleName),
				layoutData = (pug.compileFile(path.join(publicSourcesPath, 'layout_' + config.name + '.pug'), {}))(),
				layoutFilePath = path.join(moduleConfig.publicPath, 'layout.html'),
				layoutFile = yield fs.open(layoutFilePath, 'w')
			yield fs.writeFile(layoutFile, layoutData)
			yield fs.close(layoutFile)
			return true
		})
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
			app.use(multipart({uploadDir: config.globalUploadPath})) // for multipart bodies - file uploads etc.
			app.use(cookieParser())

			// set up access control by origin
			if (moduleConfig.allowOrigins) {
				app.use(instance.accessControlOrigin())
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
			app.use(instance.paths, wrap(instance.setDefaultsBeforeRequest()))

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

	setDefaultsBeforeRequest() {
		const instance = this,
			{moduleName, moduleConfig, config} = this
		return function* (req, res, next) {
			let originalUrl = req.originalUrl.split('?')[0],
				cookies = new Cookies(req, res)
			console.log(`[${moduleName} client]`, originalUrl, 'POST Params: ', JSON.stringify(req.body || {}))

			if (!req.isAuthenticated() && !checkRoutes(originalUrl, moduleConfig.anonymousAccessRoutes)) {
				if (checkRoutes(originalUrl, instance.layoutRoutes) || checkRoutes(originalUrl, moduleConfig.nonLayoutDirectRoutes)) {
					cookies.set('beforeLoginURL', req.originalUrl, {httpOnly: false})
					if (moduleConfig.unauthorizedRedirectRoute) {
						res.redirect(302, moduleConfig.unauthorizedRedirectRoute)
						return
					}
				}
				const notFoundRedirectRoutes = moduleConfig.notFoundRedirectRoutes
				if (notFoundRedirectRoutes) {
					res.redirect(302, notFoundRedirectRoutes.default)
					return
				}
				res.status(401).end()
				return
			}
			if (!checkRoutes(originalUrl, instance.paths)) {
				const notFoundRedirectRoutes = moduleConfig.notFoundRedirectRoutes
				if (notFoundRedirectRoutes) {
					res.redirect(302, req.isAuthenticated() && notFoundRedirectRoutes.authenticated ? notFoundRedirectRoutes.authenticated : notFoundRedirectRoutes.default)
					return
				}
				res.status(404).end()
				return
			}


			req.locals = {
				moduleName,
				cfg: config, // #refactorAtV1.0.0
				settings: instance.settings, // #refactorAtV1.0.0
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

module.exports = ClientModule

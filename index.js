'use strict'

let csvPromise = require('./modules/csvPromise'),
	logger = require('./modules/errorLogger'),
	emails = require('./modules/emails'),
	generalStore = require('./modules/generalStore'),
	tokenManager = require('./modules/tokenManager'),
	migrations = require('./modules/migrations'),
	toolBelt = require('./modules/toolbelt'),
	Sequelize = require('sequelize'),
	express = require('express'),
	wrap = require('co-express'),
	expressSession = require('express-session'),
	passport = require('passport'),
	redis = require('redis'),
	RedisStore = require('connect-redis')(expressSession),
	http = require('http'),
	bodyParser = require('body-parser'),
	multipart = require('connect-multiparty'),
	cookieParser = require('cookie-parser'),
	Cookies = require('cookies'),
	requestLogger = require('morgan'),
	path = require('path'),
	pug = require('pug'),
	fs = require('fs'),
	moment = require('moment'),
	pd = require('pretty-data').pd,
	defaultConfig = require('./defaults/config'),
	baseDBClass = require('./base/dbClass'),
	baseClientClass = require('./base/clientClass'),
	baseApiClass = require('./base/apiClass'),
	CronJob = require('cron').CronJob,
	merge = require('deepmerge')

class Core {
	constructor(cfg) {
		try {
			this.cfg = cfg || defaultConfig
			this.logger = new logger(this.cfg)
			this.generalStore = new generalStore(this.cfg)
			this.tokenManager = new tokenManager({generalStore: this.generalStore})
			this.modules = {}

			// ####### ------------ LOAD THE DATABASE MODULE ---------- ####### \\
			let moduleDir = fs.readdirSync(this.cfg.db.modulePath),
				sequelize = new Sequelize(this.cfg.postgres.database, this.cfg.postgres.user, this.cfg.postgres.pass, {
					host: this.cfg.postgres.host,
					port: this.cfg.postgres.port,
					dialect: 'postgres',
					logging: (this.cfg.postgres.logging === true) ?
						(sql) => {
							console.log('================ /SQL\\ ==================')
							console.log(pd.sql(sql))
							console.log('================ \\SQL/ ==================')
						} : false
				}),
				CORE = this

			this.modules.db = {
				components: {},
				seedingOrder: this.cfg.db.seedingOrder
			}
			moduleDir.forEach((componentDir, index) => {
				if (componentDir.indexOf('.') === -1) {
					this.modules.db.components[componentDir] = new (require(path.join(this.cfg.db.modulePath, componentDir)))(sequelize, Sequelize, {
						mailClient: this.mailClient,
						cfg: this.cfg,
						logger: this.logger
					})
				} else if (componentDir === 'fieldCaseMap.js') {
					this.modules.db.fieldCaseMap = require(path.join(this.cfg.db.modulePath, componentDir))
				}
			})

			// ----- create the database associations and update the modules -------- \\
			for (let componentName in this.modules.db.components) {
				let component = this.modules.db.components[componentName],
					relKey = component.associate(this.modules.db.components)
			}
			this.modules.db.sequelize = sequelize
			this.modules.db.Sequelize = Sequelize

			if (this.cfg.emails.customModulePath) {
				let customMailClient = require(this.cfg.emails.customModulePath)
				this.mailClient = new customMailClient(this.cfg, this.modules.db)
			} else {
				this.mailClient = new emails(this.cfg, this.modules.db)
			}
			for (let componentName in this.modules.db.components) {
				let component = this.modules.db.components[componentName]
				component.setDb(this.modules.db)
				component.mailClient = this.mailClient
			}

			this.modules.db.sequelize.sync()

			if (!this.cfg.migrations) {
				this.cfg.migrations = defaultConfig.migrations
			}
			if (this.cfg.migrations.startAPI) {
				this.migrations = new migrations(this.cfg, this.modules.db)
			}


			// ####### ------------ LOAD THE CLIENT SERVER MODULES ---------- ####### \\
			this.modules.clients = {}

			let modulesDirPath = this.cfg.clientModulesPath,
				modulesDirData = fs.readdirSync(modulesDirPath),
				settings = {passport}
			modulesDirData.forEach((moduleDir, index) => {
				if (moduleDir.indexOf('.') === -1) {
					let moduleDirPath = path.join(modulesDirPath, moduleDir),
						moduleDirData = fs.readdirSync(moduleDirPath),
						moduleData = {},
						moduleSettings = this.cfg[moduleDir],
						currentSettings = merge(settings, moduleSettings)

					moduleDirData.forEach((componentDir, index) => {
						if (componentDir.indexOf('.') === -1) {
							moduleData[componentDir] = new (require(path.join(moduleDirPath, componentDir)))(settings)
						} else if (componentDir === 'fieldCaseMap.js') {
							currentSettings.fieldCaseMap = require(path.join(this.cfg.db.modulePath, componentDir))
						}
					})

					// add nginx support - configuration generation
					if (this.cfg.webserver === 'nginx') {
						let configFilePath = path.join(this.cfg.wsConfigFolderPath, `${this.cfg.projectName}-${moduleDir}.conf`),
							configFile = fs.openSync(configFilePath, 'w'),
							newFileContents = '',
							prependToServerCfg = '',
							appendToServerCfg = '',
							bundle = ''

						if (moduleSettings.prependWSServerConfigFromFiles instanceof Array) {
							moduleSettings.prependWSServerConfigFromFiles.forEach((cfgFilePath, i) => {
								prependToServerCfg += fs.readFileSync(cfgFilePath)
							})
						}

						if (moduleSettings.appendWSServerConfigFromFiles instanceof Array) {
							moduleSettings.appendWSServerConfigFromFiles.forEach((cfgFilePath, i) => {
								appendToServerCfg += fs.readFileSync(cfgFilePath)
							})
						}

						if (moduleSettings.webpackHost) {
							bundle = `
		location ~ ^/bundle(.*)$ {
			proxy_set_header Host $host;
			proxy_set_header X-Real-IP $remote_addr;
			proxy_pass ${moduleSettings.webpackHost}/dist$1;
		}
							`
						} else {
							bundle = ``
						}

						newFileContents += `
	server {
		listen       ${moduleSettings.wsPort};
		server_name  ${this.cfg.hostAddress};

		#charset koi8-r;

		${prependToServerCfg}

		${bundle}

		location ~ ^/static(.*)$ {
			root ${moduleSettings.publicPath};
			try_files $1 =404;
		}

		location / {
			proxy_set_header Host $host;
			proxy_set_header X-Real-IP $remote_addr;
			proxy_pass ${this.cfg.protocol}://127.0.0.1:${moduleSettings.serverPort};
		}

		${appendToServerCfg}

		error_page   500 502 503 504  /50x.html;
		location = /50x.html {
			root   html;
		}
	}
						`

						fs.writeFileSync(configFile, newFileContents)
						fs.closeSync(configFile)
					}

					this.modules.clients[moduleDir] = {moduleData, settings: currentSettings}
				}
			})


			// ####### ------------ LOAD THE API SERVER MODULES ---------- ####### \\
			this.modules.apis = {}

			modulesDirPath = this.cfg.apiModulesPath
			modulesDirData = fs.readdirSync(modulesDirPath)
			settings = {}

			modulesDirData.forEach((moduleDir, index) => {
				if ((moduleDir !== 'migrations') && (moduleDir.indexOf('.') === -1)) {
					let moduleDirPath = path.join(modulesDirPath, moduleDir),
						moduleDirData = fs.readdirSync(moduleDirPath),
						moduleData = {},
						moduleSettings = this.cfg[moduleDir],
						currentSettings = merge(settings, moduleSettings)

					moduleDirData.forEach((componentDir, index) => {
						if (componentDir.indexOf('.') === -1) {
							moduleData[componentDir] = new (require(path.join(moduleDirPath, componentDir)))(settings)
						} else if (componentDir === 'fieldCaseMap.js') {
							currentSettings.fieldCaseMap = require(path.join(this.cfg.db.modulePath, componentDir))
						}
					})

					this.modules.apis[moduleDir] = {moduleData, settings: currentSettings}
				}
			})

			// ####### ------------ SCHEDULE THE CRON JOBS ---------- ####### \\
			if (this.cfg.cronJobs) {
				try {
					let cronJobsModule = require(this.cfg.cronJobs.path),
						jobs = cronJobsModule.getJobs({
							cfg: CORE.cfg,
							logger: CORE.logger,
							mailClient: CORE.mailClient,
							generalStore: CORE.generalStore,
							tokenManager: CORE.tokenManager,
							db: CORE.modules.db
						})
					if (jobs instanceof Array) {
						jobs.forEach((jobData, index) => {
							try {
								if (!jobData.start) {
									jobData.start = true
								}
								new CronJob(jobData)
							} catch (e) {
								console.log('Error starting a cron job:')
								CORE.logger.error(e)
							}
						})
					}
				} catch (e) {
					console.log('Error loading the cron jobs module:')
					CORE.logger.error(e)
				}
			}
		} catch (e) {
			console.log(e)
		}
	}

	listen() {
		try {
			let CORE = this

			// ------------ LOAD THE CLIENTS' ROUTES ---------- \\
			let redisClient = redis.createClient(this.cfg.redis.port, this.cfg.redis.host, {}),
				sessionStore = new RedisStore({
					host: this.cfg.redis.host,
					port: this.cfg.redis.port,
					client: redisClient
				})

			for (let moduleName in this.modules.clients) {
				// build the layout.html file
				let publicSourcesPath = path.join(this.cfg.clientModulesPublicSourcesPath, moduleName),
					layoutData = (pug.compileFile(path.join(publicSourcesPath, 'layout_' + this.cfg.name + '.pug'), {}))(),
					layoutFilePath = path.join(this.cfg[moduleName].publicPath, 'layout.html'),
					layoutFile = fs.openSync(layoutFilePath, 'w'),
					clientModule = this.modules.clients[moduleName]

				fs.writeFileSync(layoutFile, layoutData)
				fs.closeSync(layoutFile)

				clientModule.app = express()
				clientModule.router = express.Router()
				clientModule.paths = []


				//set up request logging and request body parsing
				clientModule.app.use(requestLogger(`[${moduleName} client] :method request to :url; result: :status; completed in: :response-time; :date`))
				clientModule.app.use(bodyParser.json())  // for 'application/json' request bodies
				clientModule.app.use(bodyParser.urlencoded({extended: false})) // 'x-www-form-urlencoded' request bodies
				clientModule.app.use(multipart({uploadDir: this.cfg.globalUploadPath})) // for multipart bodies - file uploads etc.
				clientModule.app.use(cookieParser())

				//set up the passport session
				clientModule.app.use(expressSession({
					secret: this.cfg[moduleName].session.secret,
					key: this.cfg[moduleName].session.key,
					resave: true,
					saveUninitialized: true,
					cookie: {
						httpOnly: false
					},
					store: sessionStore,
					passport: {}
				}))
				clientModule.app.use(clientModule.settings.passport.initialize())
				clientModule.app.use(clientModule.settings.passport.session())

 				//serve static files - not recommended; preferrably use nginx or apache; ideally for SPAs, your server should serve only the layout.html (index) file
				if (this.cfg[moduleName].serveStaticFiles) {
					clientModule.app.use(express.static(this.cfg[moduleName].publicPath))
				}

				//before every request - if query/body field case change is enabled
				const fieldCaseChangeSettings = clientModule.settings.fieldCaseChange,
					fieldCaseMap = clientModule.settings.fieldCaseMap || CORE.modules.db.fieldCaseMap || null
				if (fieldCaseChangeSettings && fieldCaseMap) {
					if (fieldCaseChangeSettings.query) {
						clientModule.app.use(function (req, res, next) {
							try {
								if (req.query) {
									req.query = toolBelt.changeKeyCase(fieldCaseMap, req.query, fieldCaseChangeSettings.query)
								}
								next()
							} catch (err) {
								CORE.logger.error(err)
								res.status(err.status || 500).json({error: err.customMessage || 'An internal server error has occurred. Please try again.'})
							}
						})
					}
					if (fieldCaseChangeSettings.body) {
						clientModule.app.use(function (req, res, next) {
							try {
								if (req.body) {
									req.body = JSON.parse(toolBelt.changeKeyCase(fieldCaseMap, req.body, fieldCaseChangeSettings.body))
								}
								next()
							} catch (err) {
								CORE.logger.error(err)
								res.status(err.status || 500).json({error: err.customMessage || 'An internal server error has occurred. Please try again.'})
							}
						})
					}
				}

				//load all route paths
				for (let i in clientModule.moduleData) {
					let component = clientModule.moduleData[i],
						routes = component.getRoutes()
					routes.forEach((routeData, index) => {
						if (routeData.path instanceof Array) {
							routeData.path.forEach((path, pIndex) => {
								clientModule.paths.push(path)
							})
						} else {
							clientModule.paths.push(routeData.path)
						}
					})
				}

				//before every route - set up post params logging, redirects and locals
				clientModule.app.use(clientModule.paths, wrap(function* (req, res, next) {
					let originalUrl = req.originalUrl.split('?')[0],
						cookies = new Cookies(req, res)
					console.log(`[${moduleName} client]`, originalUrl, 'POST Params: ', JSON.stringify(req.body || {}))

					if (clientModule.settings.unathorizedRedirectRoute && !req.isAuthenticated() && (clientModule.settings.anonymousAccessRoutes.indexOf(originalUrl) === -1)) {
						cookies.set('beforeLoginURL', req.originalUrl, {httpOnly: false})
						res.redirect(302, clientModule.settings.unathorizedRedirectRoute)
						return;
					}


					req.locals = {
						moduleName,
						cfg: CORE.cfg,
						settings: clientModule.settings,
						fieldCaseMap,
						logger: CORE.logger,
						mailClient: CORE.mailClient,
						generalStore: CORE.generalStore,
						tokenManager: CORE.tokenManager,
						db: CORE.modules.db,
						passport: clientModule.settings.passport,
						error: null,
						errorStatus: 500,
						originalUrl
					}
					next()
				}))

				//mount all routes
				for (let i in clientModule.moduleData) {
					let component = clientModule.moduleData[i],
						routes = component.getRoutes()
					routes.forEach((routeData, index) => {
						clientModule.router[routeData.method](routeData.path, wrap(component[routeData.func]()))
					})
				}
				clientModule.app.use('/', clientModule.router)

				//after every route - return handled errors and set up redirects
				clientModule.app.use('*', function (req, res) {
					if (!req.locals || (req.locals.error === null)) {
						if (req.isAuthenticated()) {
							res.redirect(302, clientModule.settings.notFoundRedirectRoutes.authenticated)
							return;
						}
						res.redirect(302, clientModule.settings.notFoundRedirectRoutes.default)
						return;
					}
					CORE.logger.error(req.locals.error)
					if (req.locals.error.message && req.locals.error.message.indexOf('Validation error') !== -1) {
						req.locals.error.customMessage = 'Validation error - please make sure all required fields are present and in the correct format.'
					}
					res.status(req.locals.errorStatus).json({error: req.locals.error.customMessage || 'An internal server error has occurred. Please try again.'})
				})

				clientModule.server = http.createServer(clientModule.app)
				clientModule.server.listen(this.cfg[moduleName].serverPort, () => {
					console.log(`[${moduleName} client] Server started.`)
					console.log(`[${moduleName} client] Port:`, this.cfg[moduleName].serverPort)
					console.log(`[${moduleName} client] Configuration profile:`, this.cfg.name)
				})
			}



			// ------------ LOAD THE APIS' ROUTES ---------- \\
			for (let moduleName in this.modules.apis) {
				let apiModule = this.modules.apis[moduleName]

				apiModule.app = express()
				apiModule.router = express.Router()
				apiModule.paths = []


				//set up request logging and request body parsing
				apiModule.app.use(requestLogger(`[${moduleName} API] :method request to :url; result: :status; completed in: :response-time; :date`))
				apiModule.app.use(bodyParser.json())  // for 'application/json' request bodies

				//before every request - add the service name
				if (apiModule.settings.responseType === 'serviceName') {
					apiModule.app.use(function (req, res, next) {
						let originalUrl = req.originalUrl.split('?')[0],
							serviceNameData = originalUrl.split('/')
						req.locals = {serviceName: serviceNameData[serviceNameData.length - 1]}
						next()
					})
				}

				//before every request - if query/body field case change is enabled
				const fieldCaseChangeSettings = apiModule.settings.fieldCaseChange,
					fieldCaseMap = apiModule.settings.fieldCaseMap || CORE.modules.db.fieldCaseMap || null
				if (fieldCaseChangeSettings && fieldCaseMap) {
					if (fieldCaseChangeSettings.query) {
						apiModule.app.use(function (req, res, next) {
							try {
								if (req.query) {
									req.query = toolBelt.changeKeyCase(fieldCaseMap, req.query, fieldCaseChangeSettings.query)
								}
								next()
							} catch (err) {
								CORE.logger.error(err)
								let response = {},
									error = err.customMessage || 'An internal server error has occurred. Please try again.'
								if (apiModule.settings.responseType === 'serviceName') {
									response = {serviceName: req.locals.serviceName, data: null, message: error}
								} else {
									response = {error}
								}
								res.status(err.status || 500).json(response)
							}
						})
					}
					if (fieldCaseChangeSettings.body) {
						apiModule.app.use(function (req, res, next) {
							try {
								if (req.body) {
									req.body = JSON.parse(toolBelt.changeKeyCase(fieldCaseMap, req.body, fieldCaseChangeSettings.body))
								}
								next()
							} catch (err) {
								CORE.logger.error(err)
								let response = {},
									error = err.customMessage || 'An internal server error has occurred. Please try again.'
								if (apiModule.settings.responseType === 'serviceName') {
									response = {serviceName: req.locals.serviceName, data: null, message: error}
								} else {
									response = {error}
								}
								res.status(err.status || 500).json(response)
							}
						})
					}
				}

				//load all route paths
				for (let i in apiModule.moduleData) {
					let component = apiModule.moduleData[i],
						routes = component.getRoutes()
					routes.forEach((routeData, index) => {
						if (routeData.path instanceof Array) {
							routeData.path.forEach((path, pIndex) => {
								apiModule.paths.push(path)
							})
						} else {
							apiModule.paths.push(routeData.path)
						}
					})
				}

				//before every route - set up post params logging, redirects and locals
				apiModule.app.use(apiModule.paths, wrap(function* (req, res, next) {
					let originalUrl = req.originalUrl.split('?')[0]
					console.log(`[${moduleName} API]`, originalUrl, 'POST Params: ', JSON.stringify(req.body || {}))

					req.locals = {
						moduleName,
						cfg: CORE.cfg,
						settings: apiModule.settings,
						fieldCaseMap,
						logger: CORE.logger,
						mailClient: CORE.mailClient,
						generalStore: CORE.generalStore,
						tokenManager: CORE.tokenManager,
						db: CORE.modules.db,
						serviceName: req.locals && req.locals.serviceName || null,
						error: null,
						errorStatus: 500,
						originalUrl
					}
					next()
				}))

				//mount all routes
				for (let i in apiModule.moduleData) {
					let component = apiModule.moduleData[i],
						routes = component.getRoutes()
					routes.forEach((routeData, index) => {
						if(apiModule.settings.anonymousAccessRoutes.indexOf(routeData.path) === -1) {
							apiModule.router[routeData.method](routeData.path, this.tokenManager.validate(), wrap(component[routeData.func]()))
							return;
						}
						apiModule.router[routeData.method](routeData.path, wrap(component[routeData.func]()))
					})
				}
				apiModule.app.use('/', apiModule.router)

				//after every route - return handled errors and set up redirects
				apiModule.app.use('*', function (req, res, next) {
					if (!req.locals || (req.locals.error === null)) {
						res.status(404).json({error: 'Not found.'})
						return;
					}
					CORE.logger.error(req.locals.error)
					if (req.locals.error.message && req.locals.error.message.indexOf('Validation error') !== -1) {
						req.locals.error.customMessage = 'Validation error - please make sure all required fields are present and in the correct format.'
					}

					let response = {},
						error = req.locals.error.customMessage || 'An internal server error has occurred. Please try again.'
					if (apiModule.settings.responseType === 'serviceName') {
						response = {serviceName: req.locals.serviceName, data: null, message: error}
					} else {
						response = {error}
					}
					res.status(req.locals.errorStatus).json(response)
				})

				apiModule.server = http.createServer(apiModule.app)
				apiModule.server.listen(this.cfg[moduleName].serverPort, () => {
					console.log(`[${moduleName} API] Server started.`)
					console.log(`[${moduleName} API] Port:`, this.cfg[moduleName].serverPort)
					console.log(`[${moduleName} API] Configuration profile:`, this.cfg.name)
				})
			}

			if (this.cfg.migrations.startAPI) {
				let migrationsApiServer = http.createServer(this.migrations.app)
				migrationsApiServer.listen(this.cfg.migrations.serverPort, () => {
					console.log(`[Migrations Module API] Server started.`)
					console.log(`[Migrations Module API] Port:`, this.cfg.migrations.serverPort)
					console.log(`[Migrations Module API] Configuration profile:`, this.cfg.name)
				})
			}
		} catch (e) {
			this.logger.error(e)
		}
	}
}

module.exports = {
	Core,
	baseDBClass,
	baseClientClass,
	baseApiClass,
	csvPromise: new csvPromise(),
	toolBelt
}

'use strict'

// external dependencies
const
	CronJob = require('cron').CronJob,
	expressSession = require('express-session'),
	fs = require('fs-extra'),
	http = require('http'),
	merge = require('deepmerge'),
	moment = require('moment'),
	path = require('path'),
	redis = require('redis'),
	RedisStore = require('connect-redis')(expressSession),

// ramster modules
	{APIModule, BaseAPIComponent} = require('./modules/api'),
	csvPromise = require('./modules/csvPromise'),
	{ClientModule, BaseClientComponent} = require('./modules/client'),
	{DBModule, BaseDBComponent} = require('./modules/db'),
	defaultConfig = require('./defaults/config'),
	Emails = require('./modules/emails'),
	GeneralStore = require('./modules/generalStore'),
	Logger = require('./modules/errorLogger'),
	Migrations = require('./modules/migrations'),
	TokenManager = require('./modules/tokenManager'),
	toolbelt = require('./modules/toolbelt')

class Core {
	constructor(config) {
		try {
			this.cfg = config || defaultConfig // #refactorAtV1.0.0
			this.config = this.cfg
			this.logger = new Logger(config)
			this.generalStore = new GeneralStore(config)
			this.tokenManager = new TokenManager({generalStore: this.generalStore})
		} catch (e) {
			console.log(e)
		}
	}

	loadModules() {
		let instance = this
		return co(function*() {
			const {config, logger, generalStore, tokenManager} = instance
			// load and set up the db module
			instance.modules = {
				db: new DBModule(config, {logger, generalStore, tokenManager}),
				clients: {},
				apis: {}
			}
			let db = instance.modules.db
			yield db.loadComponents()

			// load the db module
			if (config.emails.customModulePath) {
				let CustomMailClient = require(config.emails.customModulePath)
				instance.mailClient = new CustomMailClient(config, db)
			} else {
				instance.mailClient = new Emails(config, db)
			}
			db.setComponentsProperties({db, mailClient: instance.mailClient})

			// load the migrations module
			if (config.migrations && config.migrations.startAPI) {
				instance.modules.migrations = new Migrations(config, db)
			}

			// load the client server modules
			if (instance.config.clientModulesPath) {
				let clientModules = instance.modules.clients
					modulesDirPath = config.clientModulesPath,
					modulesDirData = yield fs.readdir(modulesDirPath)
				for (const index in moduleDirData) {
					let moduleDir = moduleDirData[index]
					if (moduleDir.indexOf('.') === -1) {
						// create the module itself and load its components
						clients[moduleDir] = new ClientModule(config, moduleDir, {db, logger, generalStore, tokenManager})
						let clientModule = clients[moduleDir]
						yield clientModule.loadComponents()
						// generate config for the used webserver (if any)
						if (config.webserver === 'nginx') {
							yield clientModule.generateNGINXConfig()
						}
					}
				}
			}

			// load the api server modules
			if (instance.config.apiModulesPath) {
				let apiModules = instance.modules.apis,
					modulesDirPath = config.apiModulesPath,
					modulesDirData = yield fs.readdir(modulesDirPath)
				for (const index in moduleDirData) {
					let moduleDir = moduleDirData[index]
					if (moduleDir.indexOf('.') === -1) {
						// create the module itself and load its components
						apiModules[moduleDir] = new APIModule(config, moduleDir, {db, logger, generalStore, tokenManager})
						yield apiModules[moduleDir].loadComponents()
					}
				}
			}

			// schedule the cron jobs
			if (config.cronJobs) {
				try {
					let cronJobsModule = require(config.cronJobs.path),
						jobs = cronJobsModule.getJobs({
							cfg: config,
							logger,
							mailClient,
							generalStore,
							tokenManager,
							db
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
								logger.error(e)
							}
						})
					}
				} catch (e) {
					console.log('Error loading the cron jobs module:')
					logger.error(e)
				}
			}

			return true
		})
	}

	listen() {
		let instance = this
		return co(function*() {
			const {config} = instance
			// create the redis client (session storage)
			let redisClient = redis.createClient(config.redis),
				sessionStore = new RedisStore({
					host: config.redis.host,
					port: config.redis.port,
					client: redisClient
				})

			// load the client module server routes and start the servers
			let clientModules = instance.modules.clients
			for (const moduleName in clientModules) {
				let clientModule = clientModules[moduleName]
				yield clientModule.buildLayoutFile()
				yield clientModule.mountRoutes()
			}

			// load the api module server routes and start the servers
			let apiModules = instance.modules.apis
			for (const moduleName in apiModules) {
				apiModules[moduleName].mountRoutes()
			}

			if (config.migrations && config.migrations.startAPI) {
				instance.modules.migrations.listen()
			}

			return true
		})
	}
}

module.exports = {
	baseDBClass: BaseDBComponent, // #refactorAtV1.0.0
	BaseDBComponent,
	baseClientClass: BaseClientComponent, // #refactorAtV1.0.0
	BaseClientComponent,
	baseApiClass: BaseAPIComponent, // #refactorAtV1.0.0
	BaseAPIComponent,
	Core,
	csvPromise: new csvPromise(),
	toolBelt: toolbelt, // #refactorAtV1.0.0
	toolbelt
}

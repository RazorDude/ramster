'use strict'

// external dependencies
const
	co = require('co'),
	CronJob = require('cron').CronJob,
	expressSession = require('express-session'),
	fs = require('fs-extra'),
	merge = require('deepmerge'),
	moment = require('moment'),
	path = require('path'),
	redis = require('redis'),
	RedisStore = require('connect-redis')(expressSession),

// ramster modules
	{APIModule, BaseAPIComponent} = require('./modules/api'),
	{ClientModule, BaseClientComponent} = require('./modules/client'),
	CodeGenerator = require('./modules/codeGenerator'),
	codeGenerator = new CodeGenerator(),
	coreTests = require('./index.spec'),
	csvPromise = require('./modules/csvPromise'),
	{DBModule, BaseDBComponent} = require('./modules/db'),
	Emails = require('./modules/emails'),
	GeneralStore = require('./modules/generalStore'),
	Logger = require('./modules/errorLogger'),
	Migrations = require('./modules/migrations'),
	TokenManager = require('./modules/tokenManager'),
	toolbelt = require('./modules/toolbelt')

class Core {
	constructor(config) {
		try {
			this.config = config
			for (const testName in coreTests) {
				this[testName] = coreTests[testName]
			}
			this.modules = {}
		} catch (e) {
			console.log(e)
		}
	}

	loadDependencies() {
		let instance = this
		return co(function*() {
			instance.logger = new Logger(instance.config)
			instance.generalStore = new GeneralStore(instance.config)
			yield instance.generalStore.createClient()
			instance.tokenManager = new TokenManager(instance.config, instance.generalStore, instance.logger)
			instance.codeGenerator = new CodeGenerator(instance.config)
			return true
		})
	}

	loadDB() {
		let instance = this
		return co(function*() {
			const {config, logger, generalStore, tokenManager} = instance
			let db = new DBModule(config, logger, generalStore, tokenManager)
			yield db.connectToDB()
			yield db.loadComponents()
			yield db.createAssociations()
			instance.modules.db = db
			return true
		})
	}

	loadMailClient() {
		let instance = this
		return co(function*() {
			const {config, logger} = instance
			let db = instance.modules.db
			if (config.emails.customModulePath) {
				let CustomMailClient = require(config.emails.customModulePath)
				instance.mailClient = new CustomMailClient(config, logger, db)
			} else {
				instance.mailClient = new Emails(config, logger)
			}
			if (db) {
				db.mailClient = mailClient
				db.setDBInComponents()
			}
			return true
		})
	}

	loadMigrations() {
		let db = this.modules.db
		this.migrations = new Migrations(this.config, db.sequelize, db.components, db.seedingOrder)
		db.migrations = this.migrations
		db.setDBInComponents()
	}

	loadClients() {
		let instance = this
		return co(function*() {
			const {config, logger, generalStore, tokenManager} = instance
			let db = instance.db,
				clientModules = instance.modules.clients,
				modulesDirPath = config.clientModulesPath,
				modulesDirData = yield fs.readdir(modulesDirPath)
			for (const index in modulesDirData) {
				let moduleDir = modulesDirData[index]
				if (moduleDir.indexOf('.') === -1) {
					// create the module itself and load its components
					clientModules[moduleDir] = new ClientModule(config, moduleDir, {db, logger, generalStore, tokenManager})
					let clientModule = clientModules[moduleDir]
					yield clientModule.loadComponents()
				}
			}
			return true
		})
	}

	loadAPIs() {
		let instance = this
		return co(function*() {
			const {config, logger, generalStore, tokenManager} = instance
			let db = instance.db,
				apiModules = instance.modules.apis,
				modulesDirPath = config.apiModulesPath,
				modulesDirData = yield fs.readdir(modulesDirPath)
			for (const index in modulesDirData) {
				let moduleDir = modulesDirData[index]
				if (moduleDir.indexOf('.') === -1) {
					// create the module itself and load its components
					apiModules[moduleDir] = new APIModule(config, moduleDir, {db, logger, generalStore, tokenManager})
					yield apiModules[moduleDir].loadComponents()
				}
			}
			return true
		})
	}

	loadCRONJobs() {
		let cronJobsModule = require(config.cronJobs.path),
			jobs = cronJobsModule.getJobs({
				cfg: config,
				logger,
				mailClient: instance.mailClient,
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
				yield clientModule.mountRoutes({sessionStore})
			}

			// load the api module server routes and start the servers
			let apiModules = instance.modules.apis
			for (const moduleName in apiModules) {
				yield apiModules[moduleName].mountRoutes({sessionStore})
			}

			if (config.migrations && config.migrations.startAPI) {
				instance.modules.migrations.listen()
			}

			return true
		})
	}
}

module.exports = {
	BaseDBComponent,
	BaseClientComponent,
	BaseAPIComponent,
	Core,
	CodeGenerator,
	codeGenerator,
	csvPromise: new csvPromise(),
	toolbelt
}

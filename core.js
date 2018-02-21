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
	{APIModule} = require('./modules/api'),
	{ClientModule} = require('./modules/client'),
	CodeGenerator = require('./modules/codeGenerator'),
	coreTests = require('./core.spec'),
	{DBModule} = require('./modules/db'),
	Emails = require('./modules/emails'),
	GeneralStore = require('./modules/generalStore'),
	Logger = require('./modules/errorLogger'),
	Migrations = require('./modules/migrations'),
	TokenManager = require('./modules/tokenManager')

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
			const {config} = instance
			let db = instance.modules.db
			if (config.emails.customModulePath) {
				let CustomMailClient = require(config.emails.customModulePath)
				instance.mailClient = new CustomMailClient(config)
			} else {
				instance.mailClient = new Emails(config)
			}
			if (db) {
				db.mailClient = instance.mailClient
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
			const {config, generalStore, logger, modules, tokenManager} = instance,
				db = modules.db
			let clientModules = {},
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
			instance.modules.clients = clientModules
			return true
		})
	}

	loadAPIs() {
		let instance = this
		return co(function*() {
			const {config, generalStore, logger, modules, tokenManager} = instance,
				db = modules.db
			let apiModules = {},
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
			instance.modules.apis = apiModules
			return true
		})
	}

	loadCRONJobs() {
		const {config, generalStore, logger, mailClient, modules, tokenManager} = this
		let cronJobsModule = require(config.cronJobs.path),
			jobs = cronJobsModule.getJobs({
				config,
				db: modules.db,
				generalStore,
				logger,
				mailClient,
				tokenManager
			}),
			jobsModule = {jobs, activeJobs: []}
		if (jobs instanceof Array) {
			jobs.forEach((jobData, index) => {
				try {
					if (!jobData.start) {
						jobData.start = true
					}
					jobsModule.activeJobs.push(new CronJob(jobData))
				} catch (e) {
					console.log('Error starting a cron job:')
					logger.error(e)
				}
			})
		}
		this.modules.cronJobs = jobsModule
	}

	listen() {
		let instance = this
		return co(function*() {
			const {config, modules} = instance
			// create the redis client (session storage)
			let redisClient = redis.createClient(config.redis),
				sessionStore = new RedisStore({
					host: config.redis.host,
					port: config.redis.port,
					client: redisClient
				})

			// load the client module server routes and start the servers
			let clientModules = modules.clients
			for (const moduleName in clientModules) {
				let clientModule = clientModules[moduleName]
				yield clientModule.mountRoutes(sessionStore)
			}

			// load the api module server routes and start the servers
			let apiModules = modules.apis
			for (const moduleName in apiModules) {
				yield apiModules[moduleName].mountRoutes(sessionStore)
			}

			if (config.migrations && config.migrations.startAPI) {
				modules.db.migrations.listen()
			}

			return true
		})
	}
}

module.exports = Core

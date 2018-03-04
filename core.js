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
	{describeSuiteConditionally, runTestConditionally} = require('./modules/toolbelt'),
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

	loadDB(mockMode) {
		let instance = this
		return co(function*() {
			const {config, logger, generalStore, tokenManager} = instance
			let db = new DBModule(config, logger, generalStore, tokenManager)
			yield db.connectToDB(mockMode)
			yield db.loadComponents()
			yield db.createAssociations()
			if (mockMode) {
				yield db.sequelize.sync({force: true})
			}
			instance.modules.db = db
			return true
		})
	}

	loadMailClient(mockMode) {
		let instance = this
		return co(function*() {
			const {config} = instance
			let db = instance.modules.db
			if (config.emails.customModulePath) {
				let CustomMailClient = require(config.emails.customModulePath)
				instance.mailClient = new CustomMailClient(config, mockMode)
			} else {
				instance.mailClient = new Emails(config, mockMode)
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
			if (modules.clients) {
				let clientModules = modules.clients
				for (const moduleName in clientModules) {
					let clientModule = clientModules[moduleName]
					yield clientModule.mountRoutes(sessionStore)
				}
			}

			// load the api module server routes and start the servers
			if (modules.apis) {
				let apiModules = modules.apis
				for (const moduleName in apiModules) {
					yield apiModules[moduleName].mountRoutes(sessionStore)
				}
			}

			if (config.migrations && config.migrations.startAPI) {
				modules.db.migrations.listen()
			}

			return true
		})
	}

	runTests({testDB, testClients, testAPIs}) {
		const instance = this,
			{config} = instance
		describe(config.projectName, function() {
			before(function() {
				this.timeout(50000)
				return co(function*() {
					yield instance.loadDependencies()
					yield instance.loadDB(true)
					if (config.emails) {
						yield instance.loadMailClient(true)
					}
					instance.loadMigrations()
					if (testDB) {
						yield instance.loadClients()
					}
					if (testAPIs) {
						yield instance.loadAPIs()
					}
					if (config.cronJobs) {
						instance.loadCRONJobs()
					}
					yield instance.listen()
					try {
						let stats = yield fs.lstat(path.join(config.migrations.staticDataPath, 'mockStaticData.json'))
						if (stats.isFile()) {
							yield instance.migrations.insertStaticData('mockStaticData')
						}
					} catch(e) {
						console.log('Error while populating mockStaticData, skipping: ', e)
					}
					return true
				})
			})
			describeSuiteConditionally(testDB === true, 'db module', function() {
				it('should test all db module components successfully', function() {
					const dbModule = instance.modules.db,
						dbComponents = dbModule.components
					for (const i in dbComponents) {
						const dbComponent = dbModule.components[i],
							{componentName, specMethodNames} = dbComponent
						describeSuiteConditionally(
							(specMethodNames instanceof Array) && specMethodNames.length,
							`db module, component ${componentName}`,
							function() {
								for (const j in specMethodNames) {
									dbComponent[specMethodNames[j]]()
								}
							}
						)
					}
					return true
				})
			})
			describeSuiteConditionally((testClients === true) || ((typeof testClients === 'string') && testClients.length), 'client modules', function() {
				it('should test all client modules\'s components successfully', function() {
					const clientModules = instance.modules.clients
					let moduleNamesToTest = []
					if (typeof testClients === 'string') {
						moduleNamesToTest = testClients.split(',')
					} else {
						moduleNamesToTest = Object.keys(clientModules)
					}
					for (const i in moduleNamesToTest) {
						const clientModule = clientModules[moduleNamesToTest[i]]
						if (!clientModule) {
							continue
						}
						const clientComponents = clientModule.components
						for (const i in clientComponents) {
							const clientComponent = clientModule.components[i],
								{componentName, specMethodNames} = clientComponent
							describeSuiteConditionally(
								(specMethodNames instanceof Array) && specMethodNames.length,
								`client module ${clientModule.moduleName}, component ${componentName}`,
								function() {
									for (const j in specMethodNames) {
										clientComponent[specMethodNames[j]]()
									}
								}
							)
						}
					}
					return true
				})
			})
			describeSuiteConditionally((testAPIs === true) || ((typeof testAPIs === 'string') && testAPIs.length), 'client modules', function() {
				it('should test all client modules\'s components successfully', function() {
					const apiModules = instance.modules.apis
					let moduleNamesToTest = []
					if (typeof testAPIs === 'string') {
						moduleNamesToTest = testAPIs.split(',')
					} else {
						moduleNamesToTest = Object.keys(apiModules)
					}
					for (const i in moduleNamesToTest) {
						const apiModule = apiModules[moduleNamesToTest[i]]
						if (!apiModule) {
							continue
						}
						const apiComponents = apiModule.components
						for (const i in apiComponents) {
							const apiComponent = apiModule.components[i],
								{componentName, specMethodNames} = apiComponent
							describeSuiteConditionally(
								(specMethodNames instanceof Array) && specMethodNames.length,
								`client module ${apiModule.moduleName}, component ${componentName}`,
								function() {
									for (const j in specMethodNames) {
										apiComponent[specMethodNames[j]]()
									}
								}
							)
						}
					}
					return true
				})
			})
		})
	}
}

module.exports = Core

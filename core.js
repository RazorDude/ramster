/**
 * The core module. Contains the Core class.
 * @module coreModule
 */

// external dependencies
const
	assert = require('assert'),
	co = require('co'),
	{CLIEngine} = require('eslint'),
	CronJob = require('cron').CronJob,
	glob = require('glob'),
	expressSession = require('express-session'),
	fs = require('fs-extra'),
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
	TokenManager = require('./modules/tokenManager'),

// other
	webpackBuildSpec = require('./modules/codeGenerator/templates/webpackBuild.spec'),
	webpackDevserverSpec = require('./modules/codeGenerator/templates/webpackDevserver.spec')


/**
 * The core ramster class. Creating an instance of this is used to start your app.
 * @class Core
 */
class Core {
	/**
	 * Creates an instance of Core. Sets the config and test methods (defined in the accompanying .spec.js file) as class properties. Sets the "modules" property to an empty object.
	 * @param {object} config A ramster config object.
	 * @memberof Core
	 */
	constructor(config) {
		try {
			this.config = config
			for (const testName in coreTests) {
				this[testName] = coreTests[testName]
			}
			this.modules = {}
		} catch (e) {
			console.error(e)
		}
	}

	/**
	 * Loads the logger (error loger, Loger class), generalStore (redis store), tokenManager and codeGenerator, and sets them as class properties.
	 * @param {boolean} mockMode A flag which determines whether the method should run in "live" or "mock" mode (used in unit testing).
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof Core
	 */
	loadDependencies(mockMode) {
		let instance = this
		return co(function*() {
			instance.logger = new Logger(instance.config)
			instance.generalStore = new GeneralStore(instance.config, mockMode)
			yield instance.generalStore.createClient()
			instance.tokenManager = new TokenManager(instance.config, instance.generalStore, instance.logger)
			instance.codeGenerator = new CodeGenerator(instance.config)
			return true
		})
	}

	/**
	 * Creates an instance of the DBModule and sets it as a property of coreInstance.modules. Creates the db connection, triggers the loading of the db components and runs the associations setup. Also executes full (forced) Sequelize sync in mock mode.
	 * @param {boolean} mockMode A flag which determines whether the method should run in "live" or "mock" mode (used in unit testing).
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof Core
	 */
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
			const injectModules = config.db.injectModules
			if ((injectModules instanceof Array) && injectModules.length) {
				for (const i in injectModules) {
					const moduleName = injectModules[i]
					if (typeof db[moduleName].setup === 'function') {
						let setupResult = db[moduleName].setup()
						if (setupResult instanceof Promise) {
							yield setupResult
						}
					}
				}
			} else if (injectModules && (typeof injectModules === 'object')) {
				for (const moduleName in injectModules) {
					const moduleData = injectModules[moduleName]
					if (typeof db[moduleName].setup === 'function') {
						let setupResult = db[moduleName].setup(moduleData.setupOptions || {})
						if (setupResult instanceof Promise) {
							yield setupResult
						}
					}
				}
			}
			instance.modules.db = db
			return true
		})
	}

	/**
	 * Creates an instance of ramster's Emails class or the provided CustomMailClient class (if coreInstance.config.emails.customModulePath is provided). It then sets the class instance to the mailClient property of coreInstance.modules.db.
	 * @param {boolean} mockMode A flag which determines whether the method should run in "live" or "mock" mode (used in unit testing).
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof Core
	 */
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

	/**
	 * Creates an instance of ramster's Migrations class and sets it as a property of coreInstance.modules.db.
	 * @returns {void}
	 * @memberof Core
	 */
	loadMigrations() {
		let db = this.modules.db
		this.migrations = new Migrations(this.config, db.sequelize, db.components, db.seedingOrder)
		db.migrations = this.migrations
		db.setDBInComponents()
	}

	/**
	 * Creates an instance of the ClientModule for each client module in the specified clients folder and sets them it as properties of coreInstance.modules.clients. Triggers the loading of each module's components.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof Core
	 */
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

	/**
	 * Creates an instance of the APIModule for each api module in the specified apis folder and sets them it as properties of coreInstance.modules.apis. Triggers the loading of each module's components.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof Core
	 */
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

	/**
	 * Loads the cronJobs module, starts all cronJobs and sets the module to coreInstance.modules.cronJobs.
	 * @param {boolean} mockMode A flag which determines whether the method should run in "live" or "mock" mode (used in unit testing). In mock mode, cron jobs won't be started.
	 * @returns {void}
	 * @memberof Core
	 */
	loadCRONJobs(mockMode) {
		const {config, generalStore, logger, mailClient, modules, tokenManager} = this
		let cronJobsModule = require(config.cronJobs.path),
			jobTests = {}
		try {
			jobTests = require(`${config.cronJobs.path}/index.spec.js`)
		} catch (e) {
		}
		let jobs = cronJobsModule.getJobs({
				config,
				db: modules.db,
				generalStore,
				logger,
				mailClient,
				tokenManager
			}, mockMode),
			jobsModule = {jobs, jobTests, activeJobs: []}
		if (jobs instanceof Array) {
			jobs.forEach((jobData, index) => {
				try {
					if (mockMode) {
						return
					}
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

	/**
	 * Creates a redis session store and starts the servers for all client and api modules, as well as the migrations module api, if the config requires it.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof Core
	 */
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

	/**
	 * Fully loads all Core modules and components, in mock mode when applicable, inserts mockStaticData (if migrations are enabled in the config), and executes tests per the provided method options argument.
	 * @param {object} options The config object, whose properties specify which tests to execute.
	 * @param {boolean} options.exitProcessOnModuleTestFail If set to true, the ramster process will terminate if one of the module's test suites ends with an error.
	 * @param {boolean} options.testConfig If set to true, the ramster tests for the coreInstance config will be executed.
	 * @param {boolean} options.testDB If set to true, the user-built tests for each dbComponent will be executed.
	 * @param {boolean} options.testDBInjectedModules If set to true, the user-built tests for each module that was injected in the db module as per the config.db.injectModules property will be executed.
	 * @param {boolean} options.testClients If set to true, the user-built tests for each client module's components will be executed.
	 * @param {boolean} options.testAPIs If set to true, the user-built tests for each api module's components will be executed.
	 * @param {boolean} options.testCronJobs If set to true, the user-built tests for each cron job will be executed.
	 * @param {boolean} options.testWebpackBuildTools If set to true, the tests for the webpack built tools (webpackBuild.js and webpackDevserver.js) will be executed.
	 * @param {string[]} options.staticDataFileNames If provided, this array of string will be used to execute insertStaticData with all files with these names from the migrations/staticData folder.
	 * @param {additionalClassData[]} options.additionalClasses If provided, this object contains external classes whose testMethods have to be executed.
	 * @typedef {object} additionalClassData
	 * @property {function} getClassInstance A function that takes the ramster core instance as an argument and returns an instance of the class to be tested.
	 * @property {string} suiteDescription The name of the suite to be displayed by mocha when reporting the test results.
	 * @returns {void}
	 * @memberof Core
	 */
	runTests(options) {
		const instance = this,
			{config} = instance, {
				exitProcessOnModuleTestFail,
				testConfig,
				testDB,
				testDBInjectedModules,
				testClients,
				testAPIs,
				testCronJobs,
				testWebpackBuildTools,
				staticDataFileNames,
				additionalClasses
			} = options
		let syncHistoryFilesCount = 0,
			testsHaveErrors = false
		describe(config.projectName, function() {
			before(function() {
				this.timeout(50000)
				return co(function*() {
					yield instance.loadDependencies(true)
					yield instance.loadDB(true)
					if (config.emails) {
						yield instance.loadMailClient(true)
					}
					if (config.migrations) {
						instance.loadMigrations()
					}
					if (testClients) {
						yield instance.loadClients()
					}
					if (testAPIs) {
						yield instance.loadAPIs()
					}
					if (config.cronJobs) {
						instance.loadCRONJobs(true)
					}
					yield instance.listen()
					if (config.migrations) {
						try {
							syncHistoryFilesCount = (yield fs.readdir(config.migrations.syncHistoryPath)).length
						} catch(e) {
						}
						try {
							if (staticDataFileNames instanceof Array) {
								for (const i in staticDataFileNames) {
									let stats = yield fs.lstat(path.join(config.migrations.staticDataPath, `${staticDataFileNames[i]}.json`))
									if (stats.isFile()) {
										yield instance.migrations.insertStaticData(staticDataFileNames[i])
									}
								}
							}
							else {
								let stats = yield fs.lstat(path.join(config.migrations.staticDataPath, 'mockStaticData.json'))
								if (stats.isFile()) {
									yield instance.migrations.insertStaticData('mockStaticData')
								}
							}
						} catch(e) {
							console.log('Error while populating mockStaticData, skipping: ', e)
						}
					}
					// run the injected modules setup methods again - after the staticData has been inserted
					const injectModules = config.db.injectModules
					if ((injectModules instanceof Array) && injectModules.length) {
						let db = instance.modules.db
						for (const i in injectModules) {
							const moduleName = injectModules[i]
							if (typeof db[moduleName].setup === 'function') {
								let setupResult = db[moduleName].setup()
								if (setupResult instanceof Promise) {
									yield setupResult
								}
							}
						}
					} else if (injectModules && Object.keys(injectModules).length) {
						let db = instance.modules.db
						for (const moduleName in injectModules) {
							const moduleData = injectModules[moduleName]
							if (typeof db[moduleName].setup === 'function') {
								let setupResult = db[moduleName].setup(moduleData.setupOptions || {})
								if (setupResult instanceof Promise) {
									yield setupResult
								}
							}
						}
					}
					return true
				})
			})
			describeSuiteConditionally((testConfig === true) && (!exitProcessOnModuleTestFail || (exitProcessOnModuleTestFail && !testsHaveErrors)), 'config', function() {
				it('should execute testConfig successfully', function() {
					instance.testConfig()
					return true
				})
			})
			describeSuiteConditionally((testDB === true) && (!exitProcessOnModuleTestFail || (exitProcessOnModuleTestFail && !testsHaveErrors)), 'db module', function() {
				it('should test all db module components successfully', function() {
					const dbModule = instance.modules.db,
						dbComponents = dbModule.components
					for (const i in dbComponents) {
						const dbComponent = dbModule.components[i],
							{componentName, specMethodNames} = dbComponent
						describeSuiteConditionally(
							(specMethodNames instanceof Array) && specMethodNames.length && (!exitProcessOnModuleTestFail || (exitProcessOnModuleTestFail && !testsHaveErrors)),
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
			describeSuiteConditionally((testDBInjectedModules === true) && (!exitProcessOnModuleTestFail || (exitProcessOnModuleTestFail && !testsHaveErrors)), 'db injected modules', function() {
				it('should test all db injected modules components successfully', function() {
					const dbModule = instance.modules.db,
						dbInjectedModulesConfig =  dbModule.config.db.injectModules
					let dbInjectedModuleNames = []
					if (dbInjectedModulesConfig instanceof Array) {
						dbInjectedModuleNames = dbInjectedModulesConfig
					} else {
						dbInjectedModuleNames = Object.keys(dbInjectedModulesConfig)
					}
					if (!dbInjectedModuleNames.length) {
						return true
					}
					dbInjectedModuleNames.forEach((moduleName) => {
						const dbInjectedModule = dbModule[moduleName],
							{specMethodNames} = dbInjectedModule
						describeSuiteConditionally(
							(specMethodNames instanceof Array) && specMethodNames.length && (!exitProcessOnModuleTestFail || (exitProcessOnModuleTestFail && !testsHaveErrors)),
							`db injected modules, module ${moduleName}`,
							function() {
								for (const j in specMethodNames) {
									dbInjectedModule[specMethodNames[j]]()
								}
							}
						)
					})
					return true
				})
			})
			describeSuiteConditionally(((testClients === true) || ((typeof testClients === 'string') && testClients.length)) && (!exitProcessOnModuleTestFail || (exitProcessOnModuleTestFail && !testsHaveErrors)), 'client modules', function() {
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
								(specMethodNames instanceof Array) && specMethodNames.length && (!exitProcessOnModuleTestFail || (exitProcessOnModuleTestFail && !testsHaveErrors)),
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
			describeSuiteConditionally(((testAPIs === true) || ((typeof testAPIs === 'string') && testAPIs.length)) && (!exitProcessOnModuleTestFail || (exitProcessOnModuleTestFail && !testsHaveErrors)), 'client modules', function() {
				it('should test all api modules\'s components successfully', function() {
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
								(specMethodNames instanceof Array) && specMethodNames.length && (!exitProcessOnModuleTestFail || (exitProcessOnModuleTestFail && !testsHaveErrors)),
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
			describeSuiteConditionally((testCronJobs === true) && (!exitProcessOnModuleTestFail || (exitProcessOnModuleTestFail && !testsHaveErrors)), 'cronJobs', function() {
				it('should execute testCronJobs successfully', function() {
					instance.testCronJobs()
					return true
				})
			})
			describeSuiteConditionally((additionalClasses instanceof Array) && additionalClasses.length && (!exitProcessOnModuleTestFail || (exitProcessOnModuleTestFail && !testsHaveErrors)), 'additional classes for testing', function() {
				it('should test all classes successfully', function() {
					for (const i in additionalClasses) {
						const {getClassInstance, suiteDescription} = additionalClasses[i],
							classInstance = getClassInstance(instance),
							{specMethodNames} = classInstance
						describeSuiteConditionally(
							(specMethodNames instanceof Array) && specMethodNames.length && (!exitProcessOnModuleTestFail || (exitProcessOnModuleTestFail && !testsHaveErrors)),
							suiteDescription,
							function() {
								for (const i in specMethodNames) {
									classInstance[specMethodNames[i]]()
								}
							}
						)
					}
				})
			})
			describeSuiteConditionally((testWebpackBuildTools === true) && (!exitProcessOnModuleTestFail || (exitProcessOnModuleTestFail && !testsHaveErrors)), 'webpack build tools', function() {
				it('should execute webpackBuildSpec.testMe successfully', function() {
					webpackBuildSpec.testMe(instance.config, path.join(__dirname, 'test'))
					return true
				})
				it('should execute webpackDevserverSpec.testMe successfully', function() {
					webpackDevserverSpec.testMe(instance.config, path.join(__dirname, 'test'))
					return true
				})
			})
			afterEach(function() {
				if (!testsHaveErrors && (this.currentTest.state === 'failed')) {
					testsHaveErrors = true
				}
			})
			after(function() {
				return co(function*() {
					if (config.migrations) {
						let dirData = yield fs.readdir(config.migrations.syncHistoryPath)
						if (dirData.length > syncHistoryFilesCount) {
							yield fs.remove(path.join(config.migrations.syncHistoryPath, dirData[dirData.length - 1]))
						}
					}
					return true
				})
			})
		})
	}

	/**
	 * Run an ESLint check of all files in the rootPath, based on the .eslintrc file in the script CWD, the provided root path and provided pattern.
	 * @param {string} rootPath The folder containing the files to test.
	 * @param {string} pattern The pattern by which to match files.
	 * @param {string[]} postMatchIgnore A list of paths to ignore post-match, since I can't get glob's "ignore" to work.
	 * @returns {void}
	 * @memberof Core
	 */
	runLintTests(rootPath, pattern, postMatchIgnore) {
		const instance = this
		let results = []
		describe(`ESLint tests for root path ${rootPath}`, function() {
			before(function() {
				this.timeout(10000)
				return co(function*() {
					let paths = yield (new Promise((resolve, reject) => glob(
						path.join(rootPath, pattern),
						// {ignore: ['node_modules']},
						(err, matches) => err ? reject(err) : resolve(matches)
					)))
					if (paths.length && (postMatchIgnore instanceof Array)) {
						let pathsToIgnore = [],
							actualPaths = []
						postMatchIgnore.forEach((p, index) => {
							pathsToIgnore.push(path.join(rootPath, p).replace(/\\/g, '/'))
						})
						paths.forEach((p, index) => {
							let ignored = false
							for (const i in pathsToIgnore) {
								if (p.replace(pathsToIgnore[i], '').length !== p.length) {
									ignored = true
									break
								}
							}
							if (ignored) {
								return
							}
							actualPaths.push(p)
						})
						paths = actualPaths
					}
					const engine = new CLIEngine({
						envs: ['node', 'mocha'],
						useEslintrc: true
					})
					results = engine.executeOnFiles(paths).results
					return true
				})
			})
			it('should run the tests for all paths', function() {
				describe('ESLint tests beginning...', function() {
					results.forEach((e, i) => {
						const {filePath, messages} = e
						it(`should execute successfully and confirm that the file at ${filePath} is linted correctly`, function() {
							let firstMessage = messages[0] || {}
							assert.strictEqual(messages.length, 0, `Error on lines ${firstMessage.line}-${firstMessage.endLine}: ${firstMessage.message}`)
						})
					})
				})
			})
		})
	}
}

module.exports = Core

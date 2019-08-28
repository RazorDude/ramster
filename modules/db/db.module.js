'use strict'
/**
 * The db module. Contains the DBModule class.
 * @module dbModule
 */

const
	BaseDBComponent = require('./base-db.component'),
	co = require('co'),
	fs = require('fs-extra'),
	GeneralStore = require('../generalStore/generalStore.module'),
	Logger = require('../errorLogger/errorLogger.module'),
	path = require('path'),
	pd = require('pretty-data').pd,
	Sequelize = require('sequelize'),
	spec = require('./db.module.spec'),
	ssh = require('ssh2-promise'),
	TokenManager = require('../tokenManager/tokenManager.module')

/**
 * The DBModule class. This class connects to the database, loads all db components, creates associations and synchronizes the db tables. After it's fully loaded, it contains all dbComponents under its components key.
 * @class DBModule
 */
class DBModule {
	/**
	 * Creates an instance of DBModule and sets various class properties, such as the config, generalStore and sequelize, as well as the test methods (defined in the accompanying .spec.js file) and the component defaults.
	 * @param {object} config The project config object.
	 * @see module:configModule
	 * @param {Logger} logger An instance of the Logger class.
	 * @param {GeneralStore} generalStore An instance of the GeneralStore class.
	 * @param {TokenManager} tokenManager An instance of the TokenManager class.
	 * @memberof DBModule
	 */
	constructor(config, logger, generalStore, tokenManager) {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		/**
		 * The project config object.
		 * @type {object}
		 */
		this.config = config
		/**
		 * The db config. It's a shortcut to the "db" sub-object of the project config object.
		 * @type {object}
		 */
		this.moduleConfig = config.db
		/**
		 * The order of tables in which rows are to be inserted when doing a full database sync.
		 * @type {string[]}
		 */
		this.seedingOrder = config.db.seedingOrder
		/**
		 * An instance of the Logger class.
		 * @type {Logger}
		 */
		this.logger = logger
		/**
		 * An instance of the GeneralStore class.
		 * @type {GeneralStore}
		 */
		this.generalStore = generalStore
		/**
		 * An instance of the TokenManager class.
		 * @type {TokenManager}
		 */
		this.tokenManager = tokenManager
		/**
		 * An object, containing all dbComponents.
		 * @type {Object.<string, BaseDBComponent>}
		 */
		this.components = {}
		/**
		 * An object containing settings for how to parse upper to lower camel case and vice versa.
		 * @type {object}
		 */
		this.fieldCaseMap = null
		/**
		 * A Sequelize object.
		 * @type {Sequelize}
		 */
		this.Sequelize = null
		/**
		 * A Sequelize instance.
		 * @type {Sequelize}
		 */
		this.sequelize = null
		/**
		 * Whether the module is runnign in mockMode or not.
		 * @type {boolean}
		 */
		this.runningInMockMode = false
	}

	/**
	 * Connects to the db server and database, based on the provided config.
	 * @param {boolean} mockMode If set to true, the method will try to connect to the mockDatabase from the config (if set) and set instance.runningInMockMode to true.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof DBModule
	 */
	connectToDB(mockMode) {
		let instance = this
		return co(function*() {
			const {postgreSQL} = instance.config,
				{dbType} = instance.moduleConfig

			if (dbType === 'postgreSQL') {
				let databaseName = postgreSQL.database
				if (mockMode) {
					instance.runningInMockMode = true
					if (postgreSQL.mockDatabase) {
						databaseName = postgreSQL.mockDatabase
					}
				}
				if (postgreSQL.useSSH) {
					console.log('Establishing SSH tunnel...')
					let tunnel = new ssh({
						host: postgreSQL.sshHost,
						username: postgreSQL.sshUsername,
						identity: postgreSQL.pathToSSHKey,
						passphrase: postgreSQL.sshKeyPassphrase
					})
					yield tunnel.connect()
					yield tunnel.addTunnel({remoteAddr: '127.0.0.1', remotePort: postgreSQL.sshHostPostgreSQLPort, localPort: postgreSQL.port})
					console.log('SSH tunnel established.')
				}
				const sequelize = new Sequelize(
					databaseName,
					postgreSQL.user,
					postgreSQL.password, {
						host: postgreSQL.host,
						port: postgreSQL.port,
						dialect: 'postgres',
						logging: (postgreSQL.logging === true) ?
							(sql) => {
								console.log('================ /SQL\\ ==================')
								console.log(pd.sql(sql))
								console.log('================ \\SQL/ ==================')
							} : false
					}
				)
				console.log('Authenticating db...')
				try {
					yield sequelize.authenticate()
					console.log('DB authenticated.')
				} catch(e) {
					console.log('DB failed to authenticate.', e)
				}
				instance.Sequelize = Sequelize
				instance.sequelize = sequelize
				return true
			}

			throw {customMessage: 'Invalid dbType.'}
		})
	}

	/**
	 * Loads all db components in the provided folder, along with their .spec.js test files. Loads the filedCaseMap from the db folder, if it exists. Also sets the db property for each component.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof DBModule
	 */
	loadComponents() {
		let instance = this
		return co(function*() {
			const {config, sequelize, Sequelize} = instance,
				{injectableModulesPath, modulePath} = instance.moduleConfig,
				moduleDir = yield fs.readdir(modulePath)
			let components = instance.components
			for (const i in moduleDir) {
				const componentName = moduleDir[i]
				if (componentName.indexOf('.') === -1) {
					let componentPath = path.join(modulePath, componentName),
						componentDirData = yield fs.readdir(componentPath),
						component = new (require(componentPath))(sequelize, Sequelize),
						specMethodNames = []
					// check the validity of the components
					// here we have 'function' instead of 'object', beacuse that's how Sequelize creates the models
					if (!component.model || (typeof component.model !== 'function')) {
						throw {customMessage: `DB module component "${componentName}" loaded, does not have a valid model.`}
					}
					// load the mocha spec, if present
					for (const j in componentDirData) {
						let item = componentDirData[j]
						if (item === 'index.spec.js') {
							try {
								let spec = require(path.join(componentPath, 'index.spec.js'))
								if ((typeof spec !== 'object') || (spec === null)) {
									throw {customMessage: `Invalid spec file for DB module component "${componentName}".`}
								}
								for (const key in spec) {
									let specMethod = spec[key]
									if (typeof specMethod === 'function') {
										component[key] = specMethod
										specMethodNames.push(key)
									}
								}
							} catch (e) {
								throw {customMessage: `Invalid spec file for DB module component "${componentName}".`}
							}
							break
						}
					}
					component.componentName = componentName
					component.specMethodNames = specMethodNames
					components[componentName] = component
				} else if (componentName === 'fieldCaseMap.js') {
					instance.fieldCaseMap = require(path.join(modulePath, componentName))
				}
			}
			const injectModules = config.db.injectModules
			if ((injectModules instanceof Array) && injectModules.length) {
				const modulesPath = injectableModulesPath || path.join(modulePath, '../')
				for (const i in injectModules) {
					const moduleName = injectModules[i],
						moduleToInject = new (require(path.join(modulesPath, moduleName)))(config, instance.runningInMockMode)
					instance[moduleName] = moduleToInject
				}
			}
			instance.setDBInComponents()
			if ((injectModules instanceof Array) && injectModules.length) {
				for (const i in injectModules) {
					const moduleName = injectModules[i]
					if (typeof instance[moduleName].setup === 'function') {
						let setupResult = instance[moduleName].setup()
						if (setupResult instanceof Promise) {
							yield setupResult
						}
					}
				}
			}
			return true
		})
	}

	/**
	 * Executes the base-db.component's associate method and generates the seeding order for the whole db module. Also sets the db property for each component.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof DBModule
	 */
	createAssociations() {
		let instance = this
		return co(function*() {
			const {sequelize} = instance
			let components = instance.components,
				seedingOrder = [],
				seedingOrderIsCorrect = true
			// create the associations and dependencyMaps for each component
			for (const componentName in components) {
				let component = components[componentName]
				component.associate()
				seedingOrder.push(componentName)
			}
			// once the associations and dependencyMaps are created, do another run, mapping the realtions (and nested relations)
			for (const componentName in components) {
				let component = components[componentName]
				component.mapRelations()
			}
			// use the dependencyMap generated by each component's associate to create the seedingOrder
			do {
				seedingOrderIsCorrect = true
				for (const componentName in components) {
					let component = components[componentName],
						componentDependencyMap = component.dependencyMap,
						componentSeedingOrderIndex = seedingOrder.indexOf(componentName)
					componentDependencyMap.slaveOf.forEach((item, index) => {
						let itemSeedingOrderIndex = seedingOrder.indexOf(item)
						if (itemSeedingOrderIndex > componentSeedingOrderIndex) {
							if (seedingOrderIsCorrect) {
								seedingOrderIsCorrect = false
							}
							seedingOrder[componentSeedingOrderIndex] = item
							seedingOrder[itemSeedingOrderIndex] = componentName
							componentSeedingOrderIndex = itemSeedingOrderIndex
						}
					})
				}
			} while(!seedingOrderIsCorrect)
			instance.seedingOrder = seedingOrder
			instance.setDBInComponents()
			yield sequelize.sync()
			return true
		})
	}

	/**
	 * Sets the db property for each component, while at the same removing the particular component from each dbComponent's db.components to avoid circularization. Do the same for the injected modules.
	 * @returns {void}
	 * @memberof DBModule
	 */
	setDBInComponents() {
		let {components, config} = this
		for (const componentName in components) {
			let component = components[componentName],
				dbClone = Object.assign({}, this)
			dbClone.components = Object.assign({}, this.components)
			delete dbClone.components[componentName]
			component.db = dbClone
		}
		const injectModules = config.db.injectModules
		if ((injectModules instanceof Array) && injectModules.length) {
			for (const i in injectModules) {
				const moduleName = injectModules[i]
				let injectedModule = this[moduleName],
					dbClone = Object.assign({}, this)
				delete dbClone[moduleName]
				injectedModule.db = dbClone
			}
		}
	}

	/**
	 * Sets a list of properties to all dbComponents.
	 * @param {object} properties An object whose properties will be set to each component in instance.components.
	 * @returns {void}
	 * @memberof DBModule
	 */
	setComponentsProperties(properties) {
		if (!properties || (typeof properties !== 'object')) {
			throw {customMessage: 'Invalid properties object provided.'}
		}
		let components = this.components
		for (const key in components) {
			let component = components[key]
			for (const propertyName in properties) {
				component[propertyName] = properties[propertyName]
			}
		}
	}
}

module.exports = DBModule

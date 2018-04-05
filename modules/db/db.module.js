'use strict'

const
	co = require('co'),
	{findVertexByIdDFS} = require('../toolbelt'),
	fs = require('fs-extra'),
	path = require('path'),
	pd = require('pretty-data').pd,
	Sequelize = require('sequelize'),
	spec = require('./db.module.spec'),
	ssh = require('ssh2-promise')

class DBModule {
	constructor(config, logger, generalStore, tokenManager) {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		this.config = config
		this.moduleConfig = config.db
		this.seedingOrder = config.db.seedingOrder
		this.logger = logger
		this.generalStore = generalStore
		this.tokenManager = tokenManager
		this.components = {}
		this.fieldCaseMap = null
		this.Sequelize = null
		this.sequelize = null
	}

	connectToDB(mockMode) {
		let instance = this
		return co(function*() {
			const {postgreSQL} = instance.config,
				{dbType} = instance.moduleConfig

			if (dbType === 'postgreSQL') {
				let databaseName = postgreSQL.database
				if (mockMode && postgreSQL.mockDatabase) {
					instance.runningInMockMode = true
					databaseName = postgreSQL.mockDatabase
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
				yield sequelize.authenticate()
				console.log('DB authenticated...')
				instance.Sequelize = Sequelize
				instance.sequelize = sequelize
				return true
			}

			throw {customMessage: 'Invalid dbType.'}
		})
	}

	loadComponents() {
		let instance = this
		return co(function*() {
			const {sequelize, Sequelize} = instance,
				{modulePath} = instance.moduleConfig,
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
								component.specMethodNames = specMethodNames
							} catch (e) {
								throw {customMessage: `Invalid spec file for DB module component "${componentName}".`}
							}
							break
						}
					}
					component.componentName = componentName
					components[componentName] = component
				} else if (componentName === 'fieldCaseMap.js') {
					instance.fieldCaseMap = require(path.join(modulePath, componentName))
				}
			}
			instance.setDBInComponents()
			return true
		})
	}

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

	setDBInComponents() {
		let {components} = this
		for (const componentName in components) {
			let component = components[componentName],
				dbClone = Object.assign({}, this)
			dbClone.components = Object.assign({}, this.components)
			delete dbClone.components[componentName]
			component.db = dbClone
		}
	}

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

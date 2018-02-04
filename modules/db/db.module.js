'use strict'

const
	co = require('co'),
	fs = require('fs-extra'),
	path = require('path'),
	pd = require('pretty-data').pd,
	Sequelize = require('sequelize'),
	spec = require('./db.module.spec')

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

	// TODO: generate the seeding order object
	loadComponents() {
		let instance = this
		return co(function*() {
			const {postgreSQL} = instance.config,
				{dbType, modulePath} = instance.moduleConfig,
				moduleDir = yield fs.readdir(modulePath)
			let components = instance.components

			// load the database components (pg database)
			if (dbType === 'postgreSQL') {
				const sequelize = new Sequelize(postgreSQL.database, postgreSQL.user, postgreSQL.password, {
					host: postgreSQL.host,
					port: postgreSQL.port,
					dialect: 'postgres',
					logging: (postgreSQL.logging === true) ?
						(sql) => {
							console.log('================ /SQL\\ ==================')
							console.log(pd.sql(sql))
							console.log('================ \\SQL/ ==================')
						} : false
				})
				yield sequelize.authenticate()
				instance.Sequelize = Sequelize
				instance.sequelize = sequelize
				moduleDir.forEach((componentDir, index) => {
					if (componentDir.indexOf('.') === -1) {
						components[componentDir] = new (require(path.join(modulePath, componentDir)))(sequelize, Sequelize)
					} else if (componentDir === 'fieldCaseMap.js') {
						instance.fieldCaseMap = require(path.join(modulePath, componentDir))
					}
				})

				// after all components have been loaded, create the database associations
				for (const componentName in components) {
					let component = components[componentName]
					component.associate(components)
					component.rawAssociate(components)
				}

				instance.setComponentsProperties({db: instance})
				sequelize.sync()

				return true
			}

			throw {customMessage: 'Invalid dbType.'}
		})
	}

	setComponentsProperties(properties) {
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

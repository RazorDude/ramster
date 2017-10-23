'use strict'

const
	co = require('co'),
	fs = require('fs'),
	pd = require('pretty-data').pd,
	Sequelize = require('sequelize')

class DBModule {
	constructor(config, {logger, generalStore, tokenManager}) {
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

		this.loadComponents()
	}

	loadComponents() {
		const instance = this,
			{dbType, postgres} = this.config,
			{modulePath} = this.moduleConfig
		return co(function*() {
			const moduleDir = yield fs.readdir(modulePath),
				componentOptions = {
					cfg: instance.config,
					logger: instance.logger,
					generalStore: instance.generalStore,
					tokenManager: instance.tokenManager
				}
			let components = instance.components

			// load the database components (pg database)
			if ((dbType === 'postgres') || !dbType) {
				const sequelize = new Sequelize(postgres.database, postgres.user, postgres.pass, {
					host: postgres.host,
					port: postgres.port,
					dialect: 'postgres',
					logging: (postgres.logging === true) ?
						(sql) => {
							console.log('================ /SQL\\ ==================')
							console.log(pd.sql(sql))
							console.log('================ \\SQL/ ==================')
						} : false
				})
				instance.Sequelize = Sequelize
				instance.sequelize = sequelize
				moduleDir.forEach((componentDir, index) => {
					if (componentDir.indexOf('.') === -1) {
						components[componentDir] = new (require(path.join(modulePath, componentDir)))(sequelize, Sequelize, componentOptions)
					} else if (componentDir === 'fieldCaseMap.js') {
						instance.fieldCaseMap = require(path.join(modulePath, componentDir))
					}
				})

				// after all components have been loaded, create the database associations
				for (const componentName in components) {
					components[componentName].associate(this.modules.db.components)
				}

				sequelize.sync()
			}

			return true
		})
	}

	setComponentProperties(properties) {
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

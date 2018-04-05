'use strict'

const
	co = require('co'),
	{changeKeyCase} = require('../toolbelt'),
	fs = require('fs-extra'),
	merge = require('deepmerge'),
	passport = require('passport'),
	path = require('path'),
	spec = require('./base-server.module.spec')

class BaseServerModule {
	constructor(config, moduleName, moduleType, {db, logger, generalStore, tokenManager}) {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		this.config = config
		this.moduleName = moduleName
		this.moduleType = moduleType
		this.moduleConfig = config[`${moduleType}s`][moduleName]
		this.components = {}
		this.passport = passport
		this.db = db
		this.logger = logger
		this.generalStore = generalStore
		this.tokenManager = tokenManager
		this.fieldCaseMap = null
		this.precursorMethods = null
	}

	loadComponents() {
		let instance = this,
			{config, moduleType, moduleName} = this
		return co(function*() {
			const modulesPath = config[`${moduleType}ModulesPath`]
			let modulePath = path.join(modulesPath, moduleName),
				moduleDirData = yield fs.readdir(modulePath),
					components = {}
			for (const index in moduleDirData) {
				const componentName = moduleDirData[index],
					componentPath = path.join(modulePath, componentName)
				if (componentName.indexOf('.') === -1) {
					let componentDirData = yield fs.readdir(componentPath),
						component = new (require(componentPath))(componentName),
						specMethodNames = []
					if (!component.componentName) {
						component.componentName = componentName
					}
					// load the mocha spec, if present
					for (const j in componentDirData) {
						let item = componentDirData[j]
						if (item === 'index.spec.js') {
							try {
								let spec = require(path.join(componentPath, 'index.spec.js'))
								if ((typeof spec !== 'object') || (spec === null)) {
									throw {customMessage: `Invalid spec file for "${moduleName}" client module component "${componentName}".`}
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
								throw {customMessage: `Invalid spec file for "${moduleName}" client module component "${componentName}".`}
							}
							break
						}
					}
					components[componentName] = component
				} else if (componentName === 'fieldCaseMap.js') {
					instance.fieldCaseMap = require(componentPath)
				} else if (componentName === 'precursorMethods.js') {
					instance.precursorMethods = require(componentPath)
				}
			}
			instance.components = components
			instance.setModuleInComponents()
			components = instance.components
			for (const componentName in components) {
				const component = components[componentName]
				if (typeof component.setup === 'function') {
					component.setup()
				}
			}
			return true
		})
	}

	setModuleInComponents() {
		let {components} = this
		for (const componentName in components) {
			let component = components[componentName],
				moduleClone = Object.assign({}, this),
				dbComponent = moduleClone.db.components[componentName]
			moduleClone.components = Object.assign({}, components)
			delete moduleClone.components[componentName]
			component.module = moduleClone
			if (dbComponent) {
				component.dbComponent = dbComponent
			}
		}
	}

	accessControlAllowOrigin() {
		const {moduleConfig} = this
		return function (req, res, next) {
			res.set('Access-Control-Allow-Origin', moduleConfig.allowOrigins)
			res.set('Access-Control-Allow-Headers', 'accept, accept-encoding, accept-language, authorization, connection, content-type, host, origin, referer, user-agent')
			res.set('Allow', 'OPTIONS, GET, POST, PUT, PATCH, DELETE')
			if (req.method.toLowerCase() === 'options') {
				res.status(200).end()
				return
			}
			next()
		}
	}

	changeFieldCase(container, fieldCaseMap, fieldCaseChangeSettings) {
		const instance = this
		return function (req, res, next) {
			try {
				if (req[container]) {
					req[container] = JSON.parse(changeKeyCase(fieldCaseMap, req[container], fieldCaseChangeSettings))
				}
				next()
			} catch (err) {
				instance.logger.error(err)
				res.status(err.status || 500).json({error: err.customMessage || 'An internal server error has occurred. Please try again.'})
			}
		}
	}

	handleNextAfterRoutes() {
		const instance = this,
			{moduleName, moduleConfig, config} = this,
			notFoundRedirectRoutes = moduleConfig.notFoundRedirectRoutes
		return function (req, res) {
			if (!req.locals || !req.locals.error) {
				if (notFoundRedirectRoutes) {
					res.redirect(302, req.isAuthenticated() && notFoundRedirectRoutes.authenticated ? notFoundRedirectRoutes.authenticated : notFoundRedirectRoutes.default)
					return
				}
				res.status(404).json({error: 'Not found.'})
				return
			}
			instance.logger.error(req.locals.error)
			const errMessage = req.locals.error.message
			if (errMessage && ((errMessage.indexOf('Validation error') !== -1) || (errMessage.indexOf('ValidationError') !== -1))) {
				req.locals.error.customMessage = 'Validation error - please make sure all required fields are present and in the correct format.'
			}
			let response = {},
				error = req.locals.error.customMessage || 'An internal server error has occurred. Please try again.'
			if (moduleConfig.responseType === 'serviceName') {
				response = {serviceName: req.locals.serviceName, data: null, message: error}
			} else {
				response = {error}
			}
			res.status(req.locals.errorStatus || 500).json(response)
		}
	}
}

module.exports = BaseServerModule

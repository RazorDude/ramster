'use strict'

const
	co = require('co'),
	fs = require('fs-extra'),
	merge = require('deepmerge'),
	passport = require('passport'),
	path = require('path')

class BaseServerModule {
	constructor(config, moduleName, moduleType, {db, logger, generalStore, tokenManager}) {
		this.config = config
		this.moduleName = moduleName
		this.moduleType = moduleType
		this.moduleConfig = config[moduleName]
		this.components = {}
		this.settings = JSON.parse(JSON.stringify(this.moduleConfig)) // it's ugly, but I have to keep it at least until v1.0.0 due to backwards compatibility #refactorAtV1.0.0
		this.settings.cfg = JSON.parse(JSON.stringify(config))
		this.passport = passport
		this.db = db
		this.logger = logger
		this.generalStore = generalStore
		this.tokenManager = tokenManager
		this.fieldCaseMap = null
		this.precursorMethods = null
	}

	loadComponents() {
		let instance = this
		return co(function*() {
			const modulesPath = instance.config[`${instance.moduleType}ModulesPath`]
			let components = instance.components,
				settings = instance.settings,
				moduleDir = path.join(modulesPath, instance.moduleName),
				moduleDirData = yield fs.readdir(moduleDir)

			// load the module's components and the precursorMethods (if any)
			moduleDirData.forEach((componentDir, index) => {
				if (componentDir.indexOf('.') === -1) {
					let componentSettings = JSON.parse(JSON.stringify(settings))
					componentSettings.passport = instance.passport
					components[componentDir] = new (require(path.join(moduleDir, componentDir)))(componentSettings)
				} else if (componentDir === 'fieldCaseMap.js') {
					settings.fieldCaseMap = require(path.join(moduleDir, componentDir)) // #refactorAtV1.0.0
					instance.fieldCaseMap = settings.fieldCaseMap
				} else if (componentDir === 'precursorMethods.js') {
					settings.precursorMethods = require(path.join(moduleDir, componentDir)) // #refactorAtV1.0.0
					instance.precursorMethods = settings.precursorMethods
				}
			})

			return true
		})
	}

	accessControlOrigin() {
		const {moduleConfig} = this
		return function (req, res, next) {
			res.header('Access-Control-Allow-Origin', moduleConfig.allowOrigins)
			res.header('Access-Control-Allow-Headers', 'accept, accept-encoding, accept-language, authorization, connection, content-type, host, origin, referer, user-agent')
			res.header('Allow', 'OPTIONS, GET, POST, PUT, DELETE')
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
					req[container] = changeKeyCase(fieldCaseMap, req[container], fieldCaseChangeSettings)
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
			if (!req.locals || (req.locals.error === null)) {
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
				response = {serviceName: `${req.locals.originalUrl.split('/')[0].replace('/', '')}/${req.locals.serviceName}`, data: null, message: error}
			} else {
				response = {error}
			}
			res.status(req.locals.errorStatus || 500).json(response)
		}
	}
}

module.exports = BaseServerModule

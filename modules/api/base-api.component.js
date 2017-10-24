'use strict'

const
	co = require('co'),
	fs = require('fs'),
	path = require('path')
	

class BaseAPIComponent {
	constructor({componentName, componentNameSingular, routes, addDefaultRoutes, routePrefix}) {
		this.componentName = componentName
		this.componentNameSingular = componentNameSingular

		this.routes = routes
		routePrefix = routePrefix || ''
		if (addDefaultRoutes instanceof Array) {
			let defaultRoutes = {
					create: {method: 'post', path: `${routePrefix}/${this.componentName}/create`, func: 'create'},
					read: {method: 'get', path: `${routePrefix}/${this.componentName}/read`, func: 'read'},
					readAssociated: {method: 'post', path: `${routePrefix}/${this.componentName}/readAssociated`, func: 'readAssociated'},
					readList: {method: 'post', path: `${routePrefix}/${this.componentName}/readList`, func: 'readList'},
					update: {method: 'post', path: `${routePrefix}/${this.componentName}/update`, func: 'update'},
					delete: {method: 'get', path: `${routePrefix}/${this.componentName}/delete`, func: 'delete'}
				},
				defaultRoutesToAdd = []
			if (typeof additionalDefaultRoutes === 'object') {
				for (let key in additionalDefaultRoutes) {
					defaultRoutes[key] = additionalDefaultRoutes[key]
				}
			}
			addDefaultRoutes.forEach((route, index) => {
				if (defaultRoutes[route]) {
					defaultRoutesToAdd.push(defaultRoutes[route])
				}
			})
			this.routes = this.routes.concat(defaultRoutesToAdd)
		}
	}

	create() {
		const instance = this
		return function* (req, res, next) {
			try {
				let response = {}
				response[instance.componentNameSingular] = yield req.locals.db.components[instance.componentName].create(req.body)
				res.json(response)
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	read() {
		const instance = this
		return function* (req, res, next) {
			try {
				let query = {},
					response = {}
				for (let key in req.query) {
					if (typeof req.query[key] !== 'object') {
						query[decodeURIComponent(key)] = decodeURIComponent(req.query[key])
					}
				}
				response[instance.componentNameSingular] = yield req.locals.db.components[instance.componentName].read(query)
				res.json(response)
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	readAssociated() {
		const instance = this
		return function* (req, res, next) {
			try {
				res.json(yield req.locals.db.components[instance.componentName].readAssociated(req.body))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	readList() {
		const instance = this
		return function* (req, res, next) {
			try {
				res.json(yield req.locals.db.components[instance.componentName].readList(req.body))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	update() {
		const instance = this
		return function* (req, res, next) {
			try {
				res.json(yield req.locals.db.components[instance.componentName].update(req.body))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	delete() {
		const instance = this
		return function* (req, res, next) {
			try {
				let query = {}
				for (let key in req.query) {
					if (typeof req.query[key] !== 'object') {
						query[decodeURIComponent(key)] = decodeURIComponent(req.query[key])
					}
				}
				res.json(yield req.locals.db.components[instance.componentName].delete(query))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}
}

module.exports = BaseAPIComponent

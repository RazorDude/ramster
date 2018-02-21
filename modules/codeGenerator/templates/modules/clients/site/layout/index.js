'use strict'

const
	{BaseClientComponent} = require('ramster'),
	path = require('path')

class Component extends BaseClientComponent {
	constructor(data) {
		data.routes = [
			{
				method: 'get',
				path: [
					'/',
					'/login',
					'/dashboard',
					'/mySettings'
				],
				func: 'loadLayout',
				isALayoutRoute: true
			}
		]
		super(data)
	}

	loadLayout() {
		const instance = this,
			{module} = this
		return function* (req, res, next) {
			try {
				if (req.isAuthenticated()) {
					let permissionsData = req.user.permissionsData
					if ((req.locals.originalUrl === '/') || (req.locals.originalUrl === '/login')) {
						res.redirect(302, permissionsData.canViewDashboard ? '/dashboard' : '/mySettings')
						return
					}
					if ((req.locals.originalUrl === '/dashboard') && !permissionsData.canViewDashboard) {
						res.redirect(302, '/mySettings')
						return
					}
				} else {
					if (req.headers['authorization'] && !req.query.killRedirect) {
						res.redirect(302, '/tokenLogin')
						return
					}
					if (req.locals.originalUrl === '/') {
						res.redirect(302, '/login')
						return
					}
				}
				res.sendFile(path.join(module.config.clientModulesPublicPath, `${module.moduleName}/layout.html`))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}
}

module.exports = Component

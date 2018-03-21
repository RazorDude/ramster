'use strict'

const
	{BaseClientComponent} = require('ramster'),
	path = require('path')

class Component extends BaseClientComponent {
	constructor(componentName) {
		super({
			componentName,
			routes: [
				{
					method: 'get',
					path: [
						'/',
						'/login',
						'/dashboard',
						'/mySettings',
						'/four-oh-four'
					],
					func: 'loadLayout',
					isALayoutRoute: true
				}
			]
		})
	}

	loadLayout() {
		const instance = this,
			{module} = this
		return function* (req, res, next) {
			try {
				if (req.isAuthenticated()) {
					let permissionsData = req.user.permissionsData,
						canViewDashboard = permissionsData.Dashboard.text.canView
					if ((req.locals.originalUrl === '/') || (req.locals.originalUrl === '/login')) {
						res.redirect(302, canViewDashboard ? '/dashboard' : '/mySettings')
						return
					}
					if ((req.locals.originalUrl === '/dashboard') && !canViewDashboard) {
						res.redirect(302, '/mySettings')
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

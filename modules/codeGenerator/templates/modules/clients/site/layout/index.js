'use strict'
/**
 * The layoutSiteClientComponentModule. Contains the LayoutClientSiteComponent class.
 * @module layoutSiteClientComponentModule
 */

const
	{BaseClientComponent} = require('ramster'),
	path = require('path')

/**
 * The LayoutClientSiteComponent class. Contains routes and logic for rendering the layout.html file.
 * @class LayoutClientSiteComponent
 */
class LayoutClientSiteComponent extends BaseClientComponent {
	/**
	 * Creates and instance of LayoutClientSiteComponent.
	 * @param {string} componentName Automatically set by ramster when loading the module & component.
	 * @memberof LayoutClientSiteComponent
	 */
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

	/**
	 * Renders the layout.html file or redirects the user to a different page, based on whether he's logged in, his permission and the route he's trying to access.
	 * @returns {IterableIterator} An expressJS-style generator function to be wrapped by co-wrap and mounted in the server's router.
	 * @memberof LayoutClientSiteComponent
	 */
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

module.exports = LayoutClientSiteComponent

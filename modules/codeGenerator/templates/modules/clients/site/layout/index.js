'use strict'
/**
 * The layoutSiteClientComponentModule. Contains the LayoutSiteClientComponent class.
 * @module layoutSiteClientComponentModule
 */

const
	{BaseClientComponent} = require('ramster'),
	path = require('path')

/**
 * The LayoutSiteClientComponent class. Contains routes and logic for rendering the layout.html file.
 * @class LayoutSiteClientComponent
 */
class LayoutSiteClientComponent extends BaseClientComponent {
	/**
	 * Creates and instance of LayoutSiteClientComponent.
	 * @param {string} componentName Automatically set by ramster when loading the module & component.
	 * @memberof LayoutSiteClientComponent
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
	 * @memberof LayoutSiteClientComponent
	 */
	loadLayout() {
		const {module} = this
		return function* (req, res, next) {
			try {
				if (req.isAuthenticated()) {
					if ((req.locals.originalUrl === '/') || (req.locals.originalUrl === '/login')) {
						res.redirect(302, '/dashboard')
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

module.exports = LayoutSiteClientComponent

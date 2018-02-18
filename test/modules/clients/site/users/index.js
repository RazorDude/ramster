'use strict'

const
	{BaseClientComponent} = require('../../../../../index')

class Component extends BaseClientComponent {
	constructor(componentName) {
		super({
			componentName,
			routes: [
				{method: 'get', path: '/read', func: 'read'}
			],
			addDefaultRoutes: ['readList']
		})
		this.componentNameSingular = 'user'
	}
}

module.exports = Component

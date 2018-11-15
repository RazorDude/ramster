'use strict'
/**
 * The aferRoutesMethodNamesTestComponentSiteClientComponentModule. Contains the AfterRoutesMethodNamesTestComponentSiteClientComponent class.
 * @module aferRoutesMethodNamesTestComponentSiteClientComponentModule
 */

const
	{BaseClientComponent} = require('ramster')
/**
 * The AfterRoutesMethodNamesTestComponentSiteClientComponent class.
 * @class AfterRoutesMethodNamesTestComponentSiteClientComponent
 */
class AfterRoutesMethodNamesTestComponentSiteClientComponent extends BaseClientComponent {
	/**
	 * Creates and instance of AfterRoutesMethodNamesTestComponentSiteClientComponent.
	 * @param {string} componentName Automatically set by ramster when loading the module & component.
	 * @memberof AfterRoutesMethodNamesTestComponentSiteClientComponent
	 */
	constructor(componentName) {
		super({
			afterRoutesMethodNames: ['testAfterRoutesMethod'],
			appendComponentNameToRoutes: true,
			componentName,
			routes: []
		})
	}

	/**
	 * Just a test method
	 * @returns {boolean} Returns true.
	 * @memberof AfterRoutesMethodNamesTestComponentSiteClientComponent
	 */
	testAfterRoutesMethod() {
		return true
	}
}

module.exports = AfterRoutesMethodNamesTestComponentSiteClientComponent

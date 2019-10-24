'use strict'
/**
 * The aferRoutesMethodNamesTestComponentMobileAppAPIComponentModule. Contains the AfterRoutesMethodNamesTestComponentMobileAppAPIComponent class.
 * @module aferRoutesMethodNamesTestComponentMobileAppAPIComponentModule
 */

const
	{BaseAPIComponent} = require('ramster')
/**
 * The AfterRoutesMethodNamesTestComponentMobileAppAPIComponent class.
 * @class AfterRoutesMethodNamesTestComponentMobileAppAPIComponent
 */
class AfterRoutesMethodNamesTestComponentMobileAppAPIComponent extends BaseAPIComponent {
	/**
	 * Creates and instance of AfterRoutesMethodNamesTestComponentMobileAppAPIComponent.
	 * @param {string} componentName Automatically set by ramster when loading the module & component.
	 * @memberof AfterRoutesMethodNamesTestComponentMobileAppAPIComponent
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
	 * @memberof AfterRoutesMethodNamesTestComponentMobileAppAPIComponent
	 */
	testAfterRoutesMethod() {
		return true
	}
}

module.exports = AfterRoutesMethodNamesTestComponentMobileAppAPIComponent

'use strict'
/**
 * The base-api.component module. Contains the BaseAPIComponent class.
 * @module baseApiComponent
 */

const
	ApiModule = require('./api.module'),
	BaseServerComponent = require('../shared/base-server.component'),
	co = require('co'),
	fs = require('fs'),
	path = require('path'),
	spec = require('./base-api.component.spec')

/**
 * The BaseAPIComponent class. It contains common API methods and inherits the BaseServerComponent class.
 * @class BaseAPIComponent
 */
class BaseAPIComponent extends BaseServerComponent {
	/**
	 * Creates an instance of BaseAPIComponent. Sets test methods (defined in the accompanying .spec.js file) as class properties and calls the parent constructor.
	 * @param {object} data The options to pass to BaseServerComponent.
	 * @see module:apiModule
	 * @memberof BaseAPIComponent
	 */
	constructor(data) {
		super(data)
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		/**
		 * The currently initialized instance of the ApiModule.
		 * @type {ApiModule}
		 */
		this.module = undefined
	}
}

module.exports = BaseAPIComponent

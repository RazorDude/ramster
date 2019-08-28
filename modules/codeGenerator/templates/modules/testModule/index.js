/**
 * Just a test module, containing a test class.
 * @module testModule
 */

const
	co = require('co'),
	spec = require('./index.spec')

/**
 * The test class.
 * @class TestClass
 */
class TestClass {
	/**
	 * Creates an instance of TestClass.
	 * @param {object} config The project config object.
	 * @param {boolean} mockMode A flag used to determine whether the system is running in test (mock) mode.
	 * @memberof TestClass
	 */
	constructor(config, mockMode) {
		/**
		 * The project config object.
		 * @type {object}
		 */
		this.config = config
		/**
		 * A flag which is used to determine whether the class instance is running in test (mock) mode. Set based on mockMode === true, where mockMode comes from the constructor args.
		 * @type {boolean}
		 */
		this.runningInMockMode = mockMode === true
		/**
		 * The list of method names that are taken from the .spec.js file accompanying the component file. The methods in this list will be executed when running tests for the project.
		 * @type {string[]}
		 */
		this.specMethodNames = []
		for (const testName in spec) {
			this[testName] = spec[testName]
			this.specMethodNames.push(testName)
		}
	}

	/**
	 * Returns true, just for a test.
	 * @returns {Promise<object>} A promise which wraps a generator function. When resolved, returns true.
	 * @memberof TestClass
	 */
	setup() {
		return co(function*(){
			return true
		})
	}

	/**
	 * Returns true, just for a test.
	 * @returns {Promise<object>} A promise which wraps a generator function. When resolved, returns true.
	 * @memberof TestClass
	 */
	doSomething() {
		return co(function*(){
			return true
		})
	}
}
module.exports = TestClass

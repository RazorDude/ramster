'use strict'
/**
 * The toolbelt module. Contains various utility functions.
 * @module toolbeltModule
 */

const
	co = require('co'),
	fs = require('fs-extra'),
	moment = require('moment'),
	path = require('path'),
	/**
	 * Sorts an array by a list of inner properties.
	 * @param {any[]} array The array to sort.
	 * @param {toolbeltArraySortSortingOptionsObject[]} orderBy The sorting options.
	 * @param {boolean} caseSensitiveOption (optional) Whether string sorting should be case sensitive or not.
	 * @returns {any[]} The sorted array.
	 *
	 * @typedef {string[]} toolbeltArraySortSortingOptionsObject
	 * @property {string} 0 The field name to sort by.
	 * @property {string} 1 The ordering direction - 'asc' or 'desc'. Case insensitive.
	 * @property {string} 2 (optional) The "sortingType". Can be 'haveValuesOnly'.
	 */
	arraySort = (array, orderBy, caseSensitiveOption) => {
		if (!(array instanceof Array)) {
			throw {customMessage: 'Invalid array provided.'}
		}
		if (!(orderBy instanceof Array) || !orderBy.length) {
			throw {customMessage: 'Invalid orderBy array provided.'}
		}
		let caseSensitive = caseSensitiveOption === true
		return array.sort((item1, item2) => {
			for (const i in orderBy) {
				let sortingOptions = orderBy[i]
				let key = sortingOptions[0],
					sortingType = sortingOptions[2],
					a = item1[key],
					b = item2[key]
				if (!caseSensitive) {
					if (typeof a === 'string') {
						a = a.toLowerCase()
					}
					if (typeof b === 'string') {
						b = b.toLowerCase()
					}
				}
				if (sortingOptions[1].toLowerCase() === 'asc') {
					if (sortingType === 'haveValuesOnly') {
						let aIsDefined = (typeof a !== 'undefined') && (a !== null),
							bIsDefined = (typeof b !== 'undefined') && (b !== null)
						if (aIsDefined && !bIsDefined) {
							return 1
						}
						if (!aIsDefined && bIsDefined) {
							return -1
						}
					}
					if (a > b) {
						return 1
					}
					if (a < b) {
						return -1
					}
				} else {
					if (sortingType === 'haveValuesOnly') {
						let aIsDefined = (typeof a !== 'undefined') && (a !== null),
							bIsDefined = (typeof b !== 'undefined') && (b !== null)
						if (aIsDefined && !bIsDefined) {
							return -1
						}
						if (!aIsDefined && bIsDefined) {
							return 1
						}
					}
					if (a > b) {
						return -1
					}
					if (a < b) {
						return 1
					}
				}
			}
			return 0
		})
	},
	/**
	 * Changes the case of all keys in an object between loweCamelCase and UpperCamelCase.
	 * @param {object} keyMap The map of which key maps to which in different camel cases.
	 * @param {object} input The object to change the keys of.
	 * @param {stirng} outputType The type of conversion - "lower" or "upper".
	 * @returns {string} The stringified object with changed keys.
	 */
	changeKeyCase = (keyMap, input, outputType) => {
		if (!(keyMap instanceof Array)) {
			throw {customMessage: 'Invalid keyMap array provided.'}
		}
		let str = '',
			inputType = ''
		if (outputType === 'upper') {
			inputType = 'lower'
		} else if (outputType === 'lower') {
			inputType = 'upper'
		} else {
			throw {customMessage: 'Invalid outputType: should be "lower" or "upper"'}
		}

		if ((typeof input === 'object') && (input !== null)) {
			str = JSON.stringify(input)
			keyMap.forEach((e, i) => {
				str = str.replace(new RegExp(`("${e[inputType]}":)`, 'g'), `"${e[outputType]}":`)
			})
		} else if (typeof input === 'string') {
			str = input
			keyMap.forEach((e, i) => {
				str = str.replace(new RegExp(`(\\?${e[inputType]}=)`, 'g'), `?${e[outputType]}=`).replace(new RegExp(`(&${e[inputType]}=)`, 'g'), `&${e[outputType]}=`)
			})
		} else {
			str = input
		}
		return str
	},
	/**
	 * Checks whether a route exists in a list of routes.
	 * @param {string} route The route to check.
	 * @param {string[]} routes The list of routes to check in.
	 * @returns {boolean} True/false, based on the check result.
	 */
	checkRoutes = (route, routes) => {
		if ((typeof route !== 'string') || !route.length) {
			throw {customMessage: 'The route argument must be a non-empty string.'}
		}
		if (!(routes instanceof Array)) {
			throw {customMessage: 'The routes argument must be an array.'}
		}
		let splitRoute = route.split('/')
		for (const i in routes) {
			let thisRoute = routes[i],
				splitThisRoute = thisRoute.split('/')
			if (route === thisRoute) {
				return true
			}
			if ((thisRoute.indexOf(':') !== -1) && (splitThisRoute.length === splitRoute.length)) {
				let valid = true
				for (const j in splitThisRoute) {
					let thisRouteItem = splitThisRoute[j],
						routeItem = splitRoute[j]
					if ((routeItem !== thisRouteItem) && (thisRouteItem.indexOf(':') === -1)) {
						valid = false
						break
					}
				}
				if (valid) {
					return true
				}
			}
		}
		return false
	},
	/**
	 * Run chai describe or describe.skip, based on a provided condition.
	 * @param {boolean} condition The condition that determines whether the suite will be executed or not.
	 * @param {string} suiteText The description of the suite.
	 * @param {function} suiteMethod The method containing the tests to be ran for the suite.
	 * @returns {number} 1 or -1, based on whether the suite was ran.
	 */
	describeSuiteConditionally = (condition, suiteText, suiteMethod) => {
		if (condition) {
			describe(suiteText, suiteMethod)
			return 1
		}
		describe.skip(suiteText, suiteMethod)
		return -1
	},
	/**
	 * Takes an object or value and transforms undefined, null and empty strings to null. Recursively does so for objects without mutating the provided data.
	 * @param {any} data The object or value to transform.
	 * @returns {any} The object or value, with any instances of undefined, null and '' set to null.
	 */
	emptyToNull = (data) => {
		if ((typeof data === 'undefined') || (data === null)) {
			return null
		}
		if (typeof data === 'string') {
			return data.length ? data : null
		}
		if (typeof data !== 'object') {
			return data
		}
		if (data instanceof Array) {
			let outputData = []
			for (const key in data) {
				outputData.push(emptyToNull(data[key]))
			}
			return outputData
		}
		let outputData = {}
		for (const key in data) {
			outputData[key] = emptyToNull(data[key])
		}
		return outputData
	},
	/**
	 * Finds or deletes a vertex in a graph by its id. Returns null if not found.
	 * @param {any} vertexId The id of the vertext to search for.
	 * @param {toolbeltVertexObject} graph The graph to search in.
	 * @param {string} action The action to perform - can be 'get' and 'delete'.
	 * @returns {null|boolean|toolbeltVertexObject} The found vertex if its found and the action is 'get', null if not found. True if no action is provided or the action is 'delete' and the vertex is found. Null if the vertex is not found.
	 * 
	 * @typedef {object} toolbeltVertexObject
	 * @property {toolbeltVertexObject} vertices The vertex's list of connected vertices.
	 */
	findVertexByIdDFS = (vertexId, graph, action) => {
		if ((typeof vertexId === 'undefined') || (vertexId === null)) {
			throw {customMessage: 'Invalid vertexId provided.'}
		}
		if (!graph || (typeof graph !== 'object')) {
			return null
		}
		if (graph[vertexId]) {
			if (action === 'get') {
				return graph[vertexId]
			}
			if (action === 'delete') {
				delete graph[vertexId]
				return true
			}
			return true
		}
		for (const id in graph) {
			let currentVertex = graph[id]
			if (!currentVertex || !currentVertex.vertices) {
				continue
			}
			let targetVertex = findVertexByIdDFS(vertexId, currentVertex.vertices, action)
			if (targetVertex) {
				return targetVertex
			}
		}
		return null
	},
	/**
	 * Get the size of a folder in bytes, kB, etc.
	 * @param {string} folderPath The path to the folder.
	 * @param {number} unit (optional) The times the size in bytes should be divided by 1000.
	 * @returns {number} The folder size.
	 */
	getFolderSize = (folderPath, unit) => co(function*() {
		let folderSize = 0,
			folderData = yield fs.stat(folderPath)
		if (folderData.isFile()) {
			folderSize = folderData.size
			// convert to KB/MB/GB/TB etc.
			for (let i = 0; i < unit; i++) {
				folderSize /= 1000.0
			}
			return folderSize
		}
		folderData = yield fs.readdir(folderPath)
		for (const i in folderData) {
			folderSize += yield getFolderSize(path.join(folderPath, folderData[i]), unit)
		}
		return folderSize
	}),
	/**
	 * Get a nested object property's value by its keys path in the object.
	 * @param {object} parent The object to search in.
	 * @param {string} field The path to the desired value, comprised of the object keys leading to it, delimited by dots ("."). I.e. 'results.0.roles.0.id'.
	 * @returns {any} The value or null if not found.
	 */
	getNested = (parent, field) => {
		if ((typeof parent !== 'object') || (parent === null) || (typeof field !== 'string') || !field.length) {
			return null
		}
		let fieldData = field.split('.'),
			currentElement = parent
		for (let i in fieldData) {
			let innerElement = fieldData[i]
			if ((typeof currentElement === 'undefined') || (currentElement === null) || (typeof currentElement[innerElement] === 'undefined')) {
				return null
			}
			currentElement = currentElement[innerElement]
		}
		return currentElement
	},
	/**
	 * Generate a random decimal number with the specified digit count (length).
	 * @param {number} length The digit count of the generated number.
	 * @returns {number} The generated number.
	 */
	generateRandomNumber = (length) => {
		if ((typeof length !== 'number') || (length < 1)) {
			throw {customMessage: 'Invalid length number provided.'}
		}
		let number = ''
		for (let i = 0; i < length; i++) {
			number += Math.floor(Math.random() * 9)
		}
		return parseInt(number, 10)
	},
	/**
	 * Generate a random string with the specified length.
	 * @param {number} length The length of the generated string.
	 * @param {string} stringType (optional) The argument to provide to buffer.toString() - nothing, 'base64', etc.
	 * @returns {number} The generated string.
	 */
	generateRandomString = (length, stringType) => {
		if ((typeof length !== 'number') || (length < 1)) {
			throw {customMessage: 'Invalid length number provided.'}
		}
		let buf = new Buffer(length)
		for (let i = 0; i < buf.length; i++) {
			buf[i] = Math.floor(Math.random() * 256)
		}
		return buf.toString(stringType)
	},
	/**
	 * Parse a string/Date date and create a moment object. Supports YYYY-MM-DD and DD/MM/YYYY strings.
	 * @param {string|object} date The date to parse.
	 * @returns {object} A momentjs object.
	 */
	parseDate = (date) => {
		if (typeof date === 'string') {
			if (date.indexOf('/') !== -1) {
				let tempDate = moment.utc(date, 'DD/MM/YYYY')
				if (tempDate.isValid()) {
					return tempDate
				}
			}
			return moment.utc(date, 'YYYY-MM-DD')
		}
		if (date && (typeof date === 'object')) {
			return moment.utc(date.getTime(), 'x')
		}
		return moment.utc('Invalid date', 'YYYY-MM-DD')
	},
	/**
	 * Similarly to describeSuiteConditionally, runs a mocha 'it' or it.skip if a condition is met.
	 * @param {boolean} condition The condition that determines whether the test will be executed or not.
	 * @param {string} testText The description of the text.
	 * @param {function} testMethod The method containing the code to be execute for the test.
	 * @returns {number} 1 or -1, based on whether the test was ran.
	 */
	runTestConditionally = (condition, testText, testMethod) => {
		if (condition) {
			it(testText, testMethod)
			return 1
		}
		it.skip(testText, testMethod)
		return -1
	},
	/**
	 * Set a value in an object under a certain key, based on its key path in the object.
	 * @param {object} parent The object to search in.
	 * @param {string} field The path to the desired value, comprised of the object keys leading to it, delimited by dots ("."). I.e. 'results.0.roles.0.id'.
	 * @param {any} value The value to set.
	 * @returns {number} 1 or -1, based on whether the test was ran.
	 */
	setNested = (parent, field, value) => {
		if ((typeof parent !== 'object') || (parent === null) || (typeof field !== 'string') || !field.length) {
			return
		}
		let fieldData = field.split('.'),
			fieldName = fieldData.pop(),
			currentElement = parent
		for (let i in fieldData) {
			let innerElement = fieldData[i]
			if ((typeof currentElement === 'undefined') || (currentElement === null) || (typeof currentElement[innerElement] === 'undefined')) {
				return
			}
			currentElement = currentElement[innerElement]
		}
		currentElement[fieldName] = value
	}

module.exports = {arraySort, changeKeyCase, checkRoutes, describeSuiteConditionally, emptyToNull, findVertexByIdDFS, getFolderSize, getNested, generateRandomNumber, generateRandomString, parseDate, runTestConditionally, setNested}

'use strict'

const moment = require('moment')

const
	co = require('co'),
	fs = require('fs-extra'),
	path = require('path'),
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
	describeSuiteConditionally = (condition, suiteTest, suiteMethod) => {
		if (condition) {
			describe(suiteTest, suiteMethod)
			return 1
		}
		describe.skip(suiteTest, suiteMethod)
		return -1
	},
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
	runTestConditionally = (condition, testText, testMethod) => {
		if (condition) {
			it(testText, testMethod)
			return 1
		}
		it.skip(testText, testMethod)
		return -1
	},
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

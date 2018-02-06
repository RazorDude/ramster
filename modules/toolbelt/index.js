'use strict'

const
	co = require('co'),
	fs = require('fs-extra'),
	path = require('path'),
	arraySort = (array, orderBy, caseSensitive) => {
		if (caseSensitive !== true) {
			caseSensitive = false
		}
		return array.sort((item1, item2) => {
			for (const i in orderBy) {
				let sortingOptions = orderBy[i],
					key = sortingOptions[0],
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
					} else {
						if (a > b) {
							return 1
						}
						if (a < b) {
							return -1
						}
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
					} else {
						if (a > b) {
							return -1
						}
						if (a < b) {
							return 1
						}
					}
				}
			}
			return 0
		})
	},
	changeKeyCase = (keyMap, input, outputType) => {
		let str = '',
			inputType = ''
		if (outputType === 'upper') {
			inputType = 'lower'
		} else if (outputType === 'lower') {
			inputType = 'upper'
		}

		if (typeof input === 'object') {
			str = JSON.stringify(input)
			keyMap.forEach((e, i) => {
				str = str.replace(new RegExp(`("${e[inputType]}":)`, 'g'), `"${e[outputType]}":`)
			})
		} else if (typeof input === 'string') {
			keyMap.forEach((e, i) => {
				str = str.replace(new RegExp(`(?${e[inputType]}=)`, 'g'), `?${e[outputType]}=`).replace(new RegExp(`(&${e[inputType]}=)`, 'g'), `&${e[outputType]}=`)
			})
		} else {
			str = input
		}
		return str
	},
	checkRoutes = (route, routes) => {
		for (const i in routes) {
			let thisRoute = routes[i],
				splitThisRoute = thisRoute.split('/'),
				splitRoute = route.split('/')
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
	emptyToNull = (data, outputData) => {
		for (let key in data) {
			let currentValue = null

			if (data[key] instanceof Array) {
				currentValue = emptyToNull(data[key], [])
			} else if (typeof data[key] === 'object') {
				currentValue = emptyToNull(data[key], {})
			} else if (data[key] === '') {
				currentValue = null
			} else {
				currentValue = data[key]
			}

			if (outputData instanceof Array) {
				outputData.push(currentValue)
				continue;
			}
			outputData[key] = currentValue
		}
		return outputData
	},
	findVertexByIdDFS = (vertexId, graph, action) => {
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
			let targetVertex = findVertexByIdDFS(vertexId, graph[id].vertices, 'get')
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
				folderSize /= 1000000.0
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
		if ((typeof parent !== 'object') || (parent === null) || (typeof field !== 'string')) {
			return null
		}
		let fieldData = field.split('.'),
			currentElement = parent
		for (let i in fieldData) {
			let innerElement = fieldData[i]
			if ((typeof currentElement === 'undefined') || (currentElement === null) || (typeof currentElement[innerElement] === 'undefined')) {
				return currentElement
			}
			currentElement = currentElement[innerElement]
		}
		return currentElement
	},
	runTestConditionally = (condition, testText, testMethod) => {
		if (condition) {
			it(testText, testMethod)
			return 1
		}
		it.skip(testText, testMethod)
		return -1
	}

module.exports = {arraySort, changeKeyCase, checkRoutes, describeSuiteConditionally, emptyToNull, findVertexByIdDFS, getFolderSize, getNested, runTestConditionally}

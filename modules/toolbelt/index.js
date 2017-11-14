'use strict'

let emptyToNull = (data, outputData) => {
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
	objSort = function() {
		let args = arguments,
			array = args[0],
			case_sensitive, keys_length, key, desc, a, b, i

		if (typeof arguments[arguments.length - 1] === 'boolean') {
			case_sensitive = arguments[arguments.length - 1]
			keys_length = arguments.length - 1
		} else {
			case_sensitive = false
			keys_length = arguments.length
		}

		return array.sort((obj1, obj2) => {
			for (i = 1; i < keys_length; i++) {
				key = args[i]
				if (typeof key !== 'string') {
					desc = key[1]
					key = key[0]
					a = obj1[args[i][0]]
					b = obj2[args[i][0]]
				} else {
					desc = false
					a = obj1[args[i]]
					b = obj2[args[i]]
				}

				if (case_sensitive === false && typeof a === 'string') {
					a = a.toLowerCase()
					b = b.toLowerCase()
				}

				if (!desc) {
					if (a < b) return -1
					if (a > b) return 1
				} else {
					if (a > b) return -1
					if (a < b) return 1
				}
			}
			return 0
		})
	}

module.exports = {emptyToNull, getNested, changeKeyCase, checkRoutes, objSort}

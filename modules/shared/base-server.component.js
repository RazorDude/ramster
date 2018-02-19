'use strict'

const
	spec = require('./base-server.component.spec')

class BaseServerComponent {
	constructor() {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
	}

	decodeQueryValues(object) {
		if (typeof object === 'undefined') {
			return null
		}
		if (typeof object === 'string') {
			return decodeURIComponent(object)
		}
		if ((typeof object !== 'object') || (object === null)) {
			return object
		}
		if (object instanceof Array) {
			let decodedObject = []
			object.forEach((item, index) => {
				decodedObject.push(this.decodeQueryValues(item))
			})
			return decodedObject
		}
		let decodedObject = {}
		for (const key in object) {
			decodedObject[decodeURIComponent(key)] = this.decodeQueryValues(object[key])
		}
		return decodedObject
	}
}

module.exports = BaseServerComponent

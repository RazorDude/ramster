'use strict'

class BaseServerComponent {
	decodeQueryValues(object, decodedObject) {
		for (const key in object) {
			let item = object[key],
				decodedKey = decodeURIComponent(key)
			if (item && (typeof item === 'object')) {
				if (item instanceof Array) {
					if (decodedObject instanceof Array) {
						decodedObject.push([])
						this.decodeQueryValues(item, decodedObject[decodedObject.length])
						continue
					}
					decodedObject[decodedKey] = []
					this.decodeQueryValues(item, decodedObject[decodedKey])
					continue
				}
				decodedObject[decodedKey] = {}
				this.decodeQueryValues(item, decodedObject[decodedKey])
				continue
			}
			decodedObject[decodedKey] = decodeURIComponent(item)
		}
	}
}

module.exports = BaseServerComponent

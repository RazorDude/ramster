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
}

module.exports = {emptyToNull}

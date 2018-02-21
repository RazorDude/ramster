'use strict'

const
	BaseServerComponent = require('../shared/base-server.component'),
	co = require('co'),
	fs = require('fs'),
	path = require('path'),
	spec = require('./base-api.component.spec')
	

class BaseAPIComponent extends BaseServerComponent {
	constructor(data) {
		super(data)
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
	}
}

module.exports = BaseAPIComponent

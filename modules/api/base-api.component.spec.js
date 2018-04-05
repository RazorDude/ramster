// const
// 	assert = require('assert'),
// 	co = require('co'),
// 	fs = require('fs-extra'),
// 	path = require('path'),
// 	wrap = require('co-express')

module.exports = {
	testMe: function() {
		const instance = this
		let req = {
				headers: {},
				connection: {},
				locals: {}
			},
			res = {
				headers: {},
				getHeader: function(headerName) {
				},
				set: function(headerName, headerValue) {
					res.fakeVar = true
					if (!res.headers) {
						res.headers = {}
					}
					res.headers[headerName] = headerValue
				},
				status: function(statusCode) {
					res.fakeVar = true
					if (typeof res.response === 'undefined') {
						res.response = {}
					}
					res.response.statusCode = statusCode
					return res
				},
				jsonTemplate: function(resolvePromise, jsonObject) {
					res.fakeVar = true
					if (typeof res.response === 'undefined') {
						res.response = {}
					}
					res.response.jsonBody = jsonObject
					if (typeof resolvePromise === 'function') {
						resolvePromise()
						return
					}
					return res
				},
				endTemplate: function(resolvePromise) {
					if (typeof resolvePromise === 'function') {
						resolvePromise()
						return
					}
				},
				redirectTemplate: function(resolvePromise, statusCode, route) {
					res.fakeVar = true
					if (typeof res.response === 'undefined') {
						res.response = {}
					}
					res.response.statusCode = statusCode
					res.response.redirectRoute = route
					if (typeof resolvePromise === 'function') {
						resolvePromise()
						return
					}
					return res
				}
			},
			next = function(resolvePromise, errorObject) {
				next.fakeVar = true
				if (errorObject) {
					next.fail = true
					next.errorStatus = errorObject.status
					next.errorMessage = errorObject.message
				} else {
					next.fail = false
				}
				if (typeof resolvePromise === 'function') {
					resolvePromise()
				}
			}
		this.componentName = 'users'
		this.dbComponent = this.module.db.components[this.componentName]
	}
}

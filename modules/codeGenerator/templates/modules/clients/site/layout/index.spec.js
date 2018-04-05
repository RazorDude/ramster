const
	assert = require('assert'),
	co = require('co'),
	fs = require('fs-extra'),
	path = require('path'),
	request = require('request-promise-native')

module.exports = {
	testLoadLayout: function() {
		const instance = this,
			{config, moduleConfig, moduleName} = this.module
		let sessionCookie = null,
			layoutFileData = null
		describe('client.layout.loadLayout: GET to various routes', function() {
			before(function() {
				return co(function*() {
					let result = yield request({
						method: 'post',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
						body: {email: 'admin@ramster.com', password: 'testPassword4321'},
						json: true,
						resolveWithFullResponse: true
					})
					sessionCookie = result.headers['set-cookie']
					layoutFileData = (yield fs.readFile(path.join(config.clientModulesPublicPath, `${moduleName}/layout.html`))).toString()
					return true
				})
			})
			it('should execute successfully and return the layout.html file if the route is "/" and the user is not logged in', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/`,
						resolveWithFullResponse: true
					})
					assert((result.request.href === `http://127.0.0.1:${moduleConfig.serverPort}/`) && (result.body === layoutFileData))
					return true
				})
			})
			it('should execute successfully, redirect to "/dashboard" and return the layout.html file if the route is "/" and the user is logged in and can view the dashboard', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						headers: {cookie: sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/`,
						resolveWithFullResponse: true
					})
					assert(
						(result.request.headers.referer === `http://127.0.0.1:${moduleConfig.serverPort}/`) &&
						(result.request.href === `http://127.0.0.1:${moduleConfig.serverPort}/dashboard`) &&
						(result.body === layoutFileData)
					)
					return true
				})
			})
			it('should execute successfully and return the layout.html file if the route is "/login" and the user is not logged in', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/login`,
						resolveWithFullResponse: true
					})
					assert((result.request.href === `http://127.0.0.1:${moduleConfig.serverPort}/login`) && (result.body === layoutFileData))
					return true
				})
			})
			it('should execute successfully, redirect to "/dashboard" and return the layout.html file if the route is "/login" and the user is logged in and can view the dashboard', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						headers: {cookie: sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/login`,
						resolveWithFullResponse: true
					})
					assert(
						(result.request.headers.referer === `http://127.0.0.1:${moduleConfig.serverPort}/login`) &&
						(result.request.href === `http://127.0.0.1:${moduleConfig.serverPort}/dashboard`) &&
						(result.body === layoutFileData)
					)
					return true
				})
			})
			it('should execute successfully, redirect to "/login" and return the layout.html file if the route is "/dashboard" and the user is not logged in', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/dashboard`,
						resolveWithFullResponse: true
					})
					assert(
						(result.request.headers.referer === `http://127.0.0.1:${moduleConfig.serverPort}/dashboard`) &&
						(result.request.href === `http://127.0.0.1:${moduleConfig.serverPort}/login`) &&
						(result.body === layoutFileData)
					)
					return true
				})
			})
			it('should execute successfully and return the layout.html file if the route is "/dashboard" and the user is logged in and can view the dashboard', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						headers: {cookie: sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/dashboard`,
						resolveWithFullResponse: true
					})
					assert(
						(result.request.href === `http://127.0.0.1:${moduleConfig.serverPort}/dashboard`) &&
						(result.body === layoutFileData)
					)
					return true
				})
			})
			it('should execute successfully, redirect to "/login" and return the layout.html file if the route is "/mySettings" and the user is not logged in', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/mySettings`,
						resolveWithFullResponse: true
					})
					assert(
						(result.request.headers.referer === `http://127.0.0.1:${moduleConfig.serverPort}/mySettings`) &&
						(result.request.href === `http://127.0.0.1:${moduleConfig.serverPort}/login`) &&
						(result.body === layoutFileData)
					)
					return true
				})
			})
			it('should execute successfully and return the layout.html file if the route is "/mySettings" and the user is logged in', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						headers: {cookie: sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/mySettings`,
						resolveWithFullResponse: true
					})
					assert(
						(result.request.href === `http://127.0.0.1:${moduleConfig.serverPort}/mySettings`) &&
						(result.body === layoutFileData)
					)
					return true
				})
			})
			it('should execute successfully and return the layout.html file if the route is "/four-oh-four" and the user is not logged in', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/four-oh-four`,
						resolveWithFullResponse: true
					})
					assert((result.request.href === `http://127.0.0.1:${moduleConfig.serverPort}/four-oh-four`) && (result.body === layoutFileData))
					return true
				})
			})
			it('should execute successfully and return the layout.html file if the route is "/four-oh-four" and the user is logged in', function() {
				return co(function*() {
					let result = yield request({
						method: 'get',
						headers: {cookie: sessionCookie},
						uri: `http://127.0.0.1:${moduleConfig.serverPort}/four-oh-four`,
						resolveWithFullResponse: true
					})
					assert(
						(result.request.href === `http://127.0.0.1:${moduleConfig.serverPort}/four-oh-four`) &&
						(result.body === layoutFileData)
					)
					return true
				})
			})
		})
	}
}

'use strict'

const
	{BaseClientComponent, csvPromise, toolbelt} = require('ramster'),
	co = require('co'),
	saveSession = (req) => new Promise((res, rej) => {
		req.session.save((err) => {
			if (err) {
				rej(err)
				return
			}
			res(true)
		})
	})

class Component extends BaseClientComponent {
	constructor(componentName) {
		super({
			componentName,
			routes: [
				{method: 'get', path: '/users/loadLoggedInUserData', func: 'loadLoggedInUserData'},
				{method: 'get', path: '/users/checkEmail', func: 'checkEmail'},
				{method: 'get', path: '/users/sendPasswordResetRequest', func: 'sendPasswordResetRequest'},
				{method: 'get', path: '/users/sendEmailUpdateRequest', func: 'sendEmailUpdateRequest'},
				{method: 'post', path: `/users`, func: 'accessFilter', options: {next: 'create', keyAccessPointIds: []}},
				{method: 'get', path: `/users/item`, func: 'accessFilter', options: {next: 'read', moduleIds: []}},
				{method: 'get', path: `/users`, func: 'accessFilter', options: {next: 'readList', moduleIds: []}},
				{method: 'get', path: `/users/selectList`, func: 'accessFilter', options: {next: 'readSelectList', moduleIds: []}},
				{method: 'put', path: `/users`, func: 'accessFilter', options: {next: 'bulkUpsert', keyAccessPointIds: []}},
				{method: 'patch', path: '/users/password', func: 'updatePassword'},
				{method: 'patch', path: '/users/profile', func: 'updateProfile'},
				{method: 'patch', path: '/users/email', func: 'updateEmail'},
				{method: 'delete', path: `/users/delete/:id`, func: 'accessFilter', options: {next: 'delete', keyAccessPointIds: []}}
			]
		})

		this.addFields = [
			{fieldName: 'password', getValue: () => (new Date()).getTime().toString()},
			{fieldName: 'resetPassword', getValue: () => true}
		]
	}

	loadLoggedInUserData() {
		return function* (req, res, next) {
			try {
				res.json({user: req.user})
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	checkEmail() {
		const instance = this
		return function* (req, res, next) {
			try {
				let user = yield instance.dbComponent.read({email: decodeURIComponent(req.query.email)})
				res.json({emailInUse: user ? true : false})
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	sendPasswordResetRequest() {
		const instance = this
		return function* (req, res, next) {
			try {
				yield instance.dbComponent.sendPasswordResetRequest({email: decodeURIComponent(req.query.email)})
				res.json({success: true})
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	sendEmailUpdateRequest() {
		const instance = this
		return function* (req, res, next) {
			try {
				req.query.id = req.user.id
				yield instance.dbComponent.sendEmailUpdateRequest(instance.decodeQueryValues(req.query))
				res.json({success: true})
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	updatePassword() {
		const instance = this
		return function* (req, res, next) {
			try {
				req.body.id = req.user.id
				res.json(yield instance.dbComponent.updatePassword(req.body))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	updateProfile() {
		const instance = this
		return function* (req, res, next) {
			try {
				req.body.id = req.user.id
				res.json(yield instance.dbComponent.updateProfile(req.body))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	updateEmail() {
		const instance = this
		return function* (req, res, next) {
			try {
				req.body.id = req.user.id
				res.json(yield instance.dbComponent.updateEmail(req.body))
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}
}

module.exports = Component

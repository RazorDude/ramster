'use strict'
/**
 * The usersSiteClientComponentModule. Contains the UsersClientSiteComponent class.
 * @module usersSiteClientComponentModule
 */

const
	{BaseClientComponent} = require('ramster'),
	co = require('co'),
	localStrategy = require('passport-local').Strategy,
	moment = require('moment'),
	saveSession = (req) => new Promise((res, rej) => {
		req.session.save((err) => {
			if (err) {
				rej(err)
				return
			}
			res(true)
		})
	})
/**
 * The UsersClientSiteComponent class. Contains routes and logic for rendering the layout.html file.
 * @class UsersClientSiteComponent
 */
class UsersClientSiteComponent extends BaseClientComponent {
	/**
	 * Creates and instance of UsersClientSiteComponent.
	 * @param {string} componentName Automatically set by ramster when loading the module & component.
	 * @memberof UsersClientSiteComponent
	 */
	constructor(componentName) {
		super({
			componentName,
			appendComponentNameToRoutes: true,
			routes: [
				{method: 'post', path: '/login', func: 'login'},
				{method: 'get', path: '/logout', func: 'logout'},
				{method: 'get', path: '/loggedInUserData', func: 'getLoggedInUserData'},
				{method: 'get', path: '/checkEmail', func: 'checkEmail'},
				{method: 'get', path: '/sendPasswordResetRequest', func: 'sendPasswordResetRequest'},
				{method: 'get', path: '/sendEmailUpdateRequest', func: 'sendEmailUpdateRequest'},
				{method: 'post', path: ``, func: 'accessFilter', options: {next: 'create', keyAccessPointIds: []}},
				{method: 'get', path: `/item`, func: 'accessFilter', options: {next: 'read', moduleIds: []}},
				{method: 'get', path: ``, func: 'accessFilter', options: {next: 'readList', moduleIds: []}},
				{method: 'get', path: `/selectList`, func: 'accessFilter', options: {next: 'readSelectList', moduleIds: []}},
				{method: 'put', path: ``, func: 'accessFilter', options: {next: 'bulkUpsert', keyAccessPointIds: []}},
				{method: 'patch', path: '/password', func: 'updatePassword'},
				{method: 'patch', path: '/email', func: 'updateEmail'},
				{method: 'patch', path: '/profile', func: 'updateProfile'},
				{method: 'delete', path: `/delete/:id`, func: 'accessFilter', options: {next: 'delete', keyAccessPointIds: []}}
			]
		})
	}

	/**
	 * Does an initial post-load component set-up, in this case - sets up the passportJS login flow. This method does not have separate tests in the spec file, but its full functionality is extensively tested in the login method's spec
	 * @returns {void}
	 * @memberof UsersClientSiteComponent
	 */
	setup() {
		// login setup
		const instance = this,
			module = this.module,
			moduleConfig = module.moduleConfig
		let passport = module.passport
		passport.serializeUser((user, done) => {
			done(null, user)
		})
		passport.deserializeUser((user, done) => {
			done(null, user)
		})
		passport.use(new localStrategy({
			usernameField: 'email',
			passwordField: 'password',
			passReqToCallback: true
		}, function (req, username, password, done) {
			co(function*() {
				// api token login
				if (req.headers.authorization && moduleConfig.useApiModuleConfigForAuthTokens) {
					return yield module.tokenManager.verifyToken(
						(req.headers.authorization.split(' '))[1],
						module.confg.apis[moduleConfig.useApiModuleConfigForAuthTokens].jwt.secret
					)
				}
				// reset password token login
				if (req.body.token) {
					return yield instance.dbComponent.tokenLogin(req.body.token)
				}
				// username and password login
				return yield instance.dbComponent.login({email: username, password})
			}).then(function (user) {
				done(null, user)
			}, function (err) {
				done(err, false)
			})
		}))
	}

	/**
	 * Logs the user in, creating an express session.
	 * @returns {IterableIterator} An expressJS-style generator function to be wrapped by co-wrap and mounted in the server's router.
	 * @memberof UsersClientSiteComponent
	 */
	login() {
		const instance = this
		return function* (req, res, next) {
			try {
				const nextRoute = req.query.next && decodeURIComponent(req.query.next) || null
				if (req.isAuthenticated()) {
					throw {customMessage: 'Already logged in.'}
				}
				let body = req.body
				if (!body) {
					body = {}
				}
				if (body.token || req.headers.authorization) {
					req.body = {email: 'fakeEmail', password: 'fakePassword', ...body}
				}
				instance.module.passport.authenticate('local', function (err, user, data) {
					if (err) {
						req.locals.error = err
						next()
						return
					}
					if (!user) {
						req.locals.errorStatus = 401
						req.locals.error = {customMessage: 'User not found.'}
						next()
						return
					}
					req.login(user, function (err) {
						if (err) {
							req.locals.error = err
							next()
							return
						}
						if (req.body.rememberMe) {
							req.session.cookie.expires = false
							req.session.cookie.maxAge = null
						} else {
							req.session.cookie.expires = moment().add(1, 'hour').toDate()
							req.session.cookie.maxAge = 3600000
						}
						if (nextRoute) {
							res.redirect(302, nextRoute)
							return
						}
						res.json(user)
					})
				})(req, res, next)
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	/**
	 * Logs the user out, deleting the express session.
	 * @returns {IterableIterator} An expressJS-style generator function to be wrapped by co-wrap and mounted in the server's router.
	 * @memberof UsersClientSiteComponent
	 */
	logout() {
		return function* (req, res, next) {
			try {
				req.logout()
				res.redirect(302, '/login')
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	/**
	 * Gets the current logged in user's data, if logged in.
	 * @returns {IterableIterator} An expressJS-style generator function to be wrapped by co-wrap and mounted in the server's router.
	 * @memberof UsersClientSiteComponent
	 */
	getLoggedInUserData() {
		const instance = this,
			generalStore = this.module.generalStore
		return function* (req, res, next) {
			try {
				if (req.user) {
					let permissionsUpdatedFlag = yield generalStore.getStoredEntry(`db-userTypeId-${req.user.typeId}-permissionsUpdated`)
					if (permissionsUpdatedFlag !== null) {
						permissionsUpdatedFlag = JSON.parse(permissionsUpdatedFlag)
						if ((permissionsUpdatedFlag instanceof Array) && (permissionsUpdatedFlag.indexOf(req.user.id) !== -1)) {
							let user = yield instance.dbComponent.getUserWithPermissionsData({id: req.user.id})
							delete user.password
							req.session.passport.user = user
							req.user = user
							yield saveSession(req)
							let newFlag = []
							permissionsUpdatedFlag.forEach((e, i) => {
								if (e !== user.id) {
									newFlag.push(e)
								}
							})
							if (newFlag.length) {
								yield generalStore.storeEntry(`db-userTypeId-${req.user.typeId}-permissionsUpdated`, JSON.stringify(newFlag))
							} else {
								yield generalStore.removeEntry(`db-userTypeId-${req.user.typeId}-permissionsUpdated`)
							}
						}
					}
				}
				res.json(req.user)
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	/**
	 * Checks whether an email address is in use.
	 * @returns {IterableIterator} An expressJS-style generator function to be wrapped by co-wrap and mounted in the server's router.
	 * @memberof UsersClientSiteComponent
	 */
	checkEmail() {
		const instance = this
		return function* (req, res, next) {
			try {
				let user = yield instance.dbComponent.model.findOne({where: {email: decodeURIComponent(req.query.email)}, attributes: ['id']})
				res.json({emailInUse: user ? true : false})
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	/**
	 * Triggers the sendPasswordReset functionality of db.components.users.
	 * @returns {IterableIterator} An expressJS-style generator function to be wrapped by co-wrap and mounted in the server's router.
	 * @memberof UsersClientSiteComponent
	 */
	sendPasswordResetRequest() {
		const instance = this
		return function* (req, res, next) {
			try {
				yield instance.dbComponent.sendPasswordResetRequest(decodeURIComponent(req.query.email))
				res.json({success: true})
			} catch (e) {
				req.locals.error = e
				next()
			}
		}
	}

	/**
	 * Triggers the sendEmailUpdateRequest functionality of db.components.users.
	 * @returns {IterableIterator} An expressJS-style generator function to be wrapped by co-wrap and mounted in the server's router.
	 * @memberof UsersClientSiteComponent
	 */
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

	/**
	 * Triggers the updatePassword functionality of db.components.users.
	 * @returns {IterableIterator} An expressJS-style generator function to be wrapped by co-wrap and mounted in the server's router.
	 * @memberof UsersClientSiteComponent
	 */
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

	/**
	 * Triggers the updateEmail functionality of db.components.users.
	 * @returns {IterableIterator} An expressJS-style generator function to be wrapped by co-wrap and mounted in the server's router.
	 * @memberof UsersClientSiteComponent
	 */
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

	/**
	 * Triggers the updateProfile functionality of db.components.users.
	 * @returns {IterableIterator} An expressJS-style generator function to be wrapped by co-wrap and mounted in the server's router.
	 * @memberof UsersClientSiteComponent
	 */
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
}

module.exports = UsersClientSiteComponent

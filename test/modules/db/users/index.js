'use strict'
/**
 * The usersDBComponentModule. Contains the UsersDBComponent class.
 * @module usersDBComponentModule
 */

const
	{BaseDBComponent, toolbelt} = require('../../../../index'),
	bcryptjs = require('bcryptjs'),
	co = require('co'),
	{generateRandomString} = toolbelt,
	merge = require('deepmerge'),
	moment = require('moment')

/**
 * The UsersDBComponent class. Contains the sequelize db model and the business logic for the users. User items are central to the whole platform.
 * @class UsersDBComponent
 */
class UsersDBComponent extends BaseDBComponent {
	/**
	 * Creates an instance of UsersDBComponent.
	 * @param {object} sequelize An instance of Sequelize.
	 * @param {object} Sequelize A Sequelize static object.
	 * @memberof UsersDBComponent
	 */
	constructor(sequelize, Sequelize) {
		super()

		this.model = sequelize.define('user', {
				typeId: {type: Sequelize.INTEGER, allowNull: false, validate: {min: 1}},
				firstName: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
				lastName: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
				email: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
				unconfirmedEmail: {type: Sequelize.STRING, allowNull: true, validate: {notEmpty: true}},
				phone: {type: Sequelize.STRING, allowNull: true, validate: {notEmpty: true}},
				password: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
				gender: {type: Sequelize.ENUM('male', 'female', 'other'), allowNull: true},
				active: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true},
				lastLogin: {type: Sequelize.DATE, allowNull: true, validate: {isDate: true}}
			}, {
				indexes: [
					{unique: true, fields: ['email'], where: {deletedAt: null}}
				],
				setterMethods: {
					id: function (value) {
					},
					password: function (value) {
						if (typeof value !== 'undefined') {
							if ((typeof value !== 'string') || (value.length < 4)) {
								throw {customMessage: 'The password must be at least 4 characters long.'}
							}
							this.setDataValue('password', bcryptjs.hashSync(value, 10))
						}
					},
					email: function (value) {
						if (typeof value !== 'undefined') {
							this.setDataValue('unconfirmedEmail', null)
							this.setDataValue('email', value)
						}
					}
				},
				scopes: {
					default: {
						attributes: ['id', 'typeId', 'firstName', 'lastName', 'email', 'unconfirmedEmail', 'phone', 'gender', 'active', 'lastLogin', 'createdAt', 'updatedAt', 'deletedAt']
					},
					full: {
						attributes: ['id', 'typeId', 'firstName', 'lastName', 'email', 'unconfirmedEmail', 'phone', 'password', 'gender', 'active', 'lastLogin', 'createdAt', 'updatedAt', 'deletedAt']
					}
				},
				paranoid: true
			}
		)

		this.model = this.model.scope('default')
		this.associationsConfig = {
			type: {type: 'belongsTo', componentName: 'userTypes', foreignKey: 'typeId'}
		}
		this.relationsConfig = {
			typeWithAccessData: {
				associationName: 'type',
				attributes: ['id', 'name'],
				required: true,
				include: [{
					associationName: 'accessPoints',
					attributes: ['id', 'name', 'description'],
					required: true,
					include: [{associationName: 'displayModule', required: true, include: [{associationName: 'category', attributes: ['id', 'name', 'icon']}]}]
				}]
			}
		}

		/**
		 * An array, containing the fields allowed for update in the updateProfile method.
		 * @type {string[]}
		 */
		this.profileUpdateFields = ['firstName', 'lastName', 'phone', 'gender', 'active']

		this.searchFields = [
			{field: 'id'},
			{field: 'typeId'},
			{field: 'firstName', like: '-%'},
			{field: 'lastName', like: '-%'},
			{field: 'email', like: '-%'},
			{field: 'unconfirmedEmail', like: '-%'},
			{field: 'phone', like: '-%'},
			{field: 'gender'},
			{field: 'active'},
			{field: 'lastLogin'},
			{field: 'createdAt'},
			{field: 'updatedAt'},
			{field: 'deletedAt'}
		]
	}

	/**
	 * Returns a user's data, with his permissions mapped in a permissionsData object.
	 * @param {Object.<string, any>} filters An object, containing the fields to find the user by. Must be valid instance.searchFields items.
	 * @returns {Promise<object>} A promise which wraps a generator function. Resolves with the user object, containing a permissionsData object.
	 * @memberof UsersDBComponent
	 */
	getUserWithPermissionsData(filters) {
		const instance = this,
			{userTypes, accessPoints, displayModules} = this.db.components
		return co(function*() {
			if (!filters || (typeof filters !== 'object') || !Object.keys(filters).length) {
				throw {customMessage: 'The filters argument must be a non-empty object.'}
			}
			let alwaysAccessibleModules = yield displayModules.model.findAll({
					where: {alwaysAccessible: true},
					include: [{model: accessPoints.model, as: 'accessPoints'}]
				}),
				user = yield instance.model.scope('full').findOne({
					where: filters,
					include: [{
						model: userTypes.model,
						as: 'type',
						include: [{model: accessPoints.model, as: 'accessPoints', include: [{model: displayModules.model, as: 'displayModule', attributes: ['name']}]}]
					}]
				})
			if (user) {
				user = user.dataValues
				let permissionsData = {displayModuleAccessPointIds: {}, displayModuleNames: {}, accessPointsById: {}}
				user.type.accessPoints.forEach((ap, index) => {
					if (ap.displayModuleId) {
						if (!permissionsData.displayModuleAccessPointIds[ap.displayModuleId]) {
							permissionsData.displayModuleAccessPointIds[ap.displayModuleId] = [ap.id]
							permissionsData.displayModuleNames[ap.displayModule.name] = ap.displayModuleId
						} else {
							permissionsData.displayModuleAccessPointIds[ap.displayModuleId].push(ap.id)
						}
						delete ap.displayModule
					}
					if (!permissionsData.accessPointsById[ap.id]) {
						permissionsData.accessPointsById[ap.id] = ap
					}
				})
				alwaysAccessibleModules.forEach((displayModule, index) => {
					let pd = permissionsData.displayModuleAccessPointIds[displayModule.id]
					if (!pd) {
						pd = []
						permissionsData.displayModuleAccessPointIds[displayModule.id] = pd
						permissionsData.displayModuleNames[displayModule.name] = displayModule.id
					}
					displayModule.accessPoints.forEach((ap, apIndex) => {
						if (pd.indexOf(ap.id) === -1) {
							pd.push(ap.id)
						}
						if (!permissionsData.accessPointsById[ap.id]) {
							permissionsData.accessPointsById[ap.id] = ap
						}
					})
				})
				user.permissionsData = permissionsData
			}
			return user
		})
	}

	/**
	 * Finds a user by email and compares his password with the provided one. If successfull, updates his lastLogin field, removes his dbLoginToken and returns his data.
	 * @param {Object.<string, string>} options The data object containing the email and password.
	 * @param {string} options.email The user's email.
	 * @param {string} options.password The user's password.
	 * @returns {Promise<object>} A promise which wraps a generator function. Resolves with the user object, containing a permissionsData object.
	 * @memberof UsersDBComponent
	 */
	login(options) {
		const {email, password} = options,
			instance = this,
			dbComponents = this.db.components
		return co(function*() {
			let user = yield instance.getUserWithPermissionsData({email})
			if (!user) {
				throw {customMessage: 'Invalid email or password.'}
			}
			if (!user.active || !user.type.active) {
				throw {customMessage: 'Your account is currently inactive.'}
			}
			if (!bcryptjs.compareSync(password, user.password)) {
				throw {customMessage: 'Invalid email or password.'}
			}
			yield instance.model.update({lastLogin: moment.utc().format('YYYY-MM-DD H:mm:ss')}, {where: {id: user.id}})
			yield instance.db.generalStore.removeEntry(`user-${user.id}-dbLoginToken`)
			delete user.password
			return user
		})
	}

	/**
	 * Finds a user by dbLoginToken and validates the token. If successfull, updates the user's lastLogin field, removes his dbLoginToken and returns his data.
	 * @param {string} token The user's dbLoginToken.
	 * @returns {Promise<object>} A promise which wraps a generator function. Resolves with the user object, containing a permissionsData object.
	 * @memberof UsersDBComponent
	 */
	tokenLogin(token) {
		const instance = this,
			generalStore = this.db.generalStore
		return co(function*() {
			let decoded = null
			try {
				decoded = yield instance.db.tokenManager.verifyToken(token, instance.db.config.db.tokensSecret)
			} catch(e) {
				if (e && e.tokenExpired) {
					throw {customMessage: 'Invalid or expired token.', stage: 0}
				}
				throw {customMessage: 'Invalid or expired token.', stage: 1}
			}
			if (!decoded || !decoded.id) {
				throw {customMessage: 'Invalid or expired token.', stage: 2}
			}
			let user = yield instance.getUserWithPermissionsData({id: decoded.id})
			if (!user) {
				throw {customMessage: 'Invalid or expired token.', stage: 3}
			}
			if (!user.active || !user.type.active) {
				throw {customMessage: 'Your account is currently inactive.'}
			}
			let tokenData = yield generalStore.getStoredEntry(`user-${user.id}-dbLoginToken`)
			if (!tokenData) {
				throw {customMessage: 'Invalid or expired token.', stage: 4}
			}
			tokenData = JSON.parse(tokenData)
			if ((tokenData.token !== token) || tokenData.alreadyUsedForLogin) {
				throw {customMessage: 'Invalid or expired token.', stage: 5}
			}
			tokenData.alreadyUsedForLogin = true
			yield instance.model.update({lastLogin: moment.utc().format('YYYY-MM-DD H:mm:ss')}, {where: {id: user.id}})
			yield generalStore.storeEntry(`user-${user.id}-dbLoginToken`, JSON.stringify(tokenData))
			delete user.password
			return user
		})
	}

	/**
	 * Finds a user by email, creates a dbLoginToken and sends a "forgotten password" to the user's email, with a link for loggin in with the token.
	 * @param {string} email The user's email.
	 * @returns {Promise<object>} A promise which wraps a generator function. Resolves with {success: true}.
	 * @memberof UsersDBComponent
	 */
	sendPasswordResetRequest(email) {
		const instance = this,
			db = this.db
		return co(function*() {
			let user = yield instance.model.findOne({where: {email}})
			if (!user) {
				throw {customMessage: 'User not found.'}
			}
			user = user.dataValues
			delete user.password
			let clientModuleConfig = db.config.clients[db.config.emails.useClientModule],
				host = clientModuleConfig ? clientModuleConfig.host : '',
				token = yield db.tokenManager.signToken(user, db.config.db.tokensSecret, 15)
			yield db.generalStore.storeEntry(`user-${user.id}-dbLoginToken`, JSON.stringify({token, alreadyUsedForLogin: false}))
			yield db.mailClient.sendEmail('resetPassword', user.email, 'Reset Password Request', {
				fields: {
					userFirstName: user.firstName,
					resetPasswordLink: `${host}/login?token=${encodeURIComponent(token)}&next=${encodeURIComponent('/mySettings')}`
				}
			})
			return {success: true}
		})
	}

	/**
	 * Finds a user by id, creates a dbLoginToken, sets his unconfirmedEmail field to the provided newEmail and sends an "confirm email update" email to the user's email, with a link for loggin in with the token.
	 * @param {Object.<string, number|string>} options The data object containing the user id and newEmail.
	 * @param {number} options.id The user's id.
	 * @param {string} options.newEmail The user's new email.
	 * @returns {Promise<object>} A promise which wraps a generator function. Resolves with {success: true}.
	 * @memberof UsersDBComponent
	 */
	sendEmailUpdateRequest(options) {
		const {id, newEmail} = options,
			instance = this,
			db = this.db
		return co(function*() {
			let user = yield instance.model.update({unconfirmedEmail: newEmail}, {where: {id}, returning: true})
			if (!user || !user[0] || !user[1][0]) {
				throw {customMessage: 'User not found.'}
			}
			user = user[1][0].dataValues
			let clientModuleConfig = db.config.clients[db.config.emails.useClientModule],
				host = clientModuleConfig ? clientModuleConfig.host : '',
				token = yield db.tokenManager.signToken(user, db.config.db.tokensSecret, 15)
			yield db.generalStore.storeEntry(`user-${user.id}-dbLoginToken`, JSON.stringify({token, alreadyUsedForLogin: false}))
			yield db.mailClient.sendEmail('updateEmail', user.email, 'Email Update Request', {
				fields: {
					userFirstName: user.firstName,
					updateEmailLink: `${host}/login?token=${encodeURIComponent(user.resetPasswordToken)}&next=${encodeURIComponent('/mySettings')}&tokenKeyName=emailToken`
				}
			})
			return {success: true}
		})
	}

	/**
	 * Finds a user by id and updates his password to the provided newPassword if the provided currentPassword or dbLoginToken are correct.
	 * @param {Object.<string, number|string>} options The data object containing the user id, token and/or passwords.
	 * @param {number} options.id The user's id.
	 * @param {string} options.passwordResetToken The user's new dbLoginToken.
	 * @param {string} options.currentPassword The user's current password.
	 * @param {string} options.newPassword The user's new password.
	 * @returns {Promise<object>} A promise which wraps a generator function. Resolves with {success: true}.
	 * @memberof UsersDBComponent
	 */
	updatePassword(options) {
		const {id, passwordResetToken, currentPassword, newPassword} = options,
			instance = this,
			{generalStore, tokenManager} = this.db
		return co(function*() {
			let user = yield instance.model.scope('full').findOne({where: {id}})
			if (!user) {
				throw {customMessage: 'User not found, wrong current password, or an invalid or expired token.', stage: 0}
			}
			user = user.dataValues
			if (passwordResetToken) {
				try {
					let tokenData = JSON.parse(yield generalStore.getStoredEntry(`user-${user.id}-dbLoginToken`))
					if (passwordResetToken !== tokenData.token) {
						throw true
					}
				} catch(e) {
					throw {customMessage: 'User not found, wrong current password, or an invalid or expired token.', stage: 1}
				}
				try {
					yield tokenManager.verifyToken(passwordResetToken, instance.db.config.db.tokensSecret)
				} catch(e) {
					if (e && e.tokenExpired) {
						throw {customMessage: 'User not found, wrong current password, or an invalid or expired token.', stage: 2}
					}
					throw e
				}
				yield generalStore.removeEntry(`user-${user.id}-dbLoginToken`)
			} else if (currentPassword) {
				if (!bcryptjs.compareSync(currentPassword, user.password)) {
					throw {customMessage: 'User not found, wrong current password, or an invalid or expired token.', stage: 3}
				}
			} else {
				throw {customMessage: 'User not found, wrong current password, or an invalid or expired token.', stage: 4}
			}
			yield instance.model.update({password: newPassword}, {where: {id}})
			return {success: true}
		})
	}

	/**
	 * Finds a user by id and sets his current email to his previously set unconfirmedEmail field if the provided dbLoginToken is correct.
	 * @param {Object.<string, number|string>} options The data object containing the user id and token.
	 * @param {number} options.id The user's id.
	 * @param {string} options.token The user's new dbLoginToken.
	 * @returns {Promise<object>} A promise which wraps a generator function. Resolves with {success: true}.
	 * @memberof UsersDBComponent
	 */
	updateEmail(options) {
		const {id, token} = options,
			instance = this,
			db = this.db
		return co(function*() {
			let user = yield instance.model.findOne({where: {id}})
			if (!user) {
				throw {customMessage: 'User not found, or an invalid or expired token has been provided.', stage: 0}
			}
			user = user.dataValues
			if (!token) {
				throw {customMessage: 'User not found, or an invalid or expired token has been provided.', stage: 1}
			}
			try {
				let tokenData = JSON.parse(yield db.generalStore.getStoredEntry(`user-${user.id}-dbLoginToken`))
				if (token !== tokenData.token) {
					throw true
				}
			} catch(e) {
				throw {customMessage: 'User not found, or an invalid or expired token has been provided.', stage: 2}
			}
			try {
				yield db.tokenManager.verifyToken(token, db.config.db.tokensSecret)
			} catch(e) {
				if (e && e.tokenExpired) {
					throw {customMessage: 'User not found, or an invalid or expired token has been provided.', stage: 3}
				}
				throw e
			}
			yield db.generalStore.removeEntry(`user-${user.id}-dbLoginToken`)
			user = yield instance.model.update({email: user.unconfirmedEmail}, {where: {id: user.id}, returning: true})
			user = user[1][0].dataValues
			let clientModuleConfig = db.config.clients[db.config.emails.useClientModule],
				host = clientModuleConfig ? clientModuleConfig.host : ''
			yield db.mailClient.sendEmail('emailUpdatedSuccessfully', user.email, 'Email Updated', {
				fields: {
					userFirstName: user.firstName
				}
			})
			return {success: true}
		})
	}

	/**
	 * Updates the user's profile data
	 * @param {Object.<string, any>} data The data object containing the user id and profile fields to update. See the component's profileUpdateFields array for more info.
	 * @returns {Promise<object>} A promise which wraps a generator function. Resolves with the updated user object.
	 * @memberof UsersDBComponent
	 */
	updateProfile(data) {
		const instance = this
		return co(function*() {
			let userToUpdate = {}
			instance.profileUpdateFields.forEach((field, index) => {
				if (typeof data[field] !== 'undefined') {
					userToUpdate[field] = data[field]
				}
			})
			let result = yield instance.model.update(userToUpdate, {where: {id: data.id}, returning: true})
			if (!result || !result[1] || !result[1][0]) {
				throw {customMessage: 'User not found.'}
			}
			return result[1][0].dataValues
		})
	}
}

module.exports = UsersDBComponent

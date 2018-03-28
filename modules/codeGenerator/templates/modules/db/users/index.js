'use strict'

const
	{BaseDBComponent, toolbelt} = require('ramster'),
	bcryptjs = require('bcryptjs'),
	co = require('co'),
	{generateRandomString} = toolbelt,
	merge = require('deepmerge'),
	moment = require('moment')

class Component extends BaseDBComponent {
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
				status: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true},
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
						attributes: ['id', 'typeId', 'firstName', 'lastName', 'email', 'unconfirmedEmail', 'phone', 'gender', 'status', 'lastLogin', 'createdAt', 'updatedAt', 'deletedAt']
					},
					full: {
						attributes: ['id', 'typeId', 'firstName', 'lastName', 'email', 'unconfirmedEmail', 'phone', 'password', 'gender', 'status', 'lastLogin', 'createdAt', 'updatedAt', 'deletedAt']
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
					include: [{associationName: 'module', required: true, include: [{associationName: 'category', attributes: ['id', 'name', 'icon']}]}]
				}]
			}
		}

		this.profileUpdateFields = ['firstName', 'lastName', 'phone', 'gender', 'status']

		this.searchFields = [
			{field: 'id'},
			{field: 'typeId'},
			{field: 'firstName', like: '-%'},
			{field: 'lastName', like: '-%'},
			{field: 'email', like: '-%'},
			{field: 'unconfirmedEmail', like: '-%'},
			{field: 'phone', like: '-%'},
			{field: 'gender'},
			{field: 'status'},
			{field: 'lastLogin'},
			{field: 'createdAt'},
			{field: 'updatedAt'},
			{field: 'deletedAt'}
		]
	}

	getUserWithPermissionsData(filters) {
		const instance = this,
			{userTypes, moduleAccessPoints, modules} = this.db.components
		return co(function*() {
			if (!filters || (typeof filters !== 'object') || !Object.keys(filters).length) {
				throw {customMessage: 'The filters argument must be a non-empty object.'}
			}
			let alwaysAccessibleModules = yield modules.model.findAll({
					where: {alwaysAccessible: true},
					include: [{model: moduleAccessPoints.model, as: 'accessPoints'}]
				}),
				user = yield instance.model.scope('full').findOne({
					where: filters,
					include: [{
						model: userTypes.model,
						as: 'type',
						include: [{model: moduleAccessPoints.model, as: 'accessPoints', include: [{model: modules.model, as: 'module', attributes: ['name']}]}]
					}]
				})
			if (user) {
				user = user.dataValues
				let permissionsData = {}
				user.type.accessPoints.forEach((ap, index) => {
					let pd = permissionsData[ap.moduleId],
						mName = ap.module.name.replace(/\s/g, ''),
						pdText = permissionsData[mName]
					if (!pd) {
						pd = {text: {}, ids: []}
						permissionsData[ap.moduleId] = pd
					}
					if (!pdText) {
						pdText = {text: {}, ids: []}
						permissionsData[mName] = pdText
					}
					pd.ids.push(ap.id)
					pd.text[`can${ap.name.replace(/\s/g, '')}`] = true
					pdText.ids.push(ap.id)
					pdText.text[`can${ap.name.replace(/\s/g, '')}`] = true
				})
				alwaysAccessibleModules.forEach((module, index) => {
					let pd = permissionsData[module.id],
						mName = module.name.replace(/\s/g, ''),
						pdText = permissionsData[mName]
					if (!pd) {
						pd = {text: {}, ids: []}
						permissionsData[module.id] = pd
					}
					if (!pdText) {
						pdText = {text: {}, ids: []}
						permissionsData[mName] = pdText
					}
					module.accessPoints.forEach((ap, apIndex) => {
						if (pd.ids.indexOf(ap.id) === -1) {
							pd.ids.push(ap.id)
							pd.text[`can${ap.name.replace(/\s/g, '')}`] = true
						}
						if (pdText.ids.indexOf(ap.id) === -1) {
							pdText.ids.push(ap.id)
							pdText.text[`can${ap.name.replace(/\s/g, '')}`] = true
						}
					})
				})
				user.permissionsData = permissionsData
			}
			return user
		})
	}

	login({email, password}) {
		const instance = this,
			dbComponents = this.db.components
		return co(function*() {
			let user = yield instance.getUserWithPermissionsData({email})
			if (!user) {
				throw {customMessage: 'Invalid email or password.'}
			}
			if (!user.status || !user.type.status) {
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
			if (!user.status || !user.type.status) {
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

	sendEmailUpdateRequest({id, newEmail}) {
		const instance = this,
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

	updatePassword({id, passwordResetToken, currentPassword, newPassword}) {
		const instance = this,
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

	updateEmail({id, token}) {
		const instance = this,
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

module.exports = Component

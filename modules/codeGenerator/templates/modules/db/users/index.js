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
				},
				resetPasswordToken: function (value) {
				},
				resetPasswordExpires: function (value) {
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
		})

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

		this.allowedUpdateFields = ['firstName', 'lastName', 'phone', 'gender', 'status']

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
						include: [{model: moduleAccessPoints.model, as: 'accessPoints'}]
					}]
				})
			if (user) {
				user = user.dataValues
				let permissionsData = {}
				user.type.accessPoints.forEach((ap, index) => {
					let pd = permissionsData[ap.moduleId]
					if (!pd) {
						pd = {text: {}, ids: []}
						permissionsData[ap.moduleId] = pd
					}
					pd.ids.push(ap.id)
					pd.text[`can${ap.name.replace(/\s/g, '')}`] = true
				})
				alwaysAccessibleModules.forEach((module, index) => {
					let pd = permissionsData[module.id]
					if (!pd) {
						pd = {text: {}, ids: []}
						permissionsData[module.id] = pd
					}
					module.accessPoints.forEach((ap, apIndex) => {
						if (pd.ids.indexOf(ap.id) === -1) {
							pd.ids.push(ap.id)
							pd.text[`can${ap.name.replace(/\s/g, '')}`] = true
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
			if (!user.status) {
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
			if (!user.status) {
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
		const instance = this
		return co(function*() {
			let user = yield instance.model.scope('full').update({resetPassword: true}, {
				where: {email},
				returning: true
			})
			if (!user || !user[0] || !user[1][0]) {
				throw {customMessage: 'User not found.'}
			}
			user = user[1][0]

			let clientModuleConfig = instance.config.clients[instance.config.emails.useClientModule],
				host = clientModuleConfig ? clientModuleConfig.host : ''
			let mailSendResult = yield instance.mailClient.sendEmail('resetPassword', user.email, 'Reset Password Request', {
				fields: {
					userFirstName: user.firstName,
					resetPasswordLink: `${host}/tokenLogin?token=${encodeURIComponent(user.resetPasswordToken)}&next=${encodeURIComponent('/mySettings')}`
				}
			})

			delete user.password
			delete user.resetPasswordToken
			delete user.resetPasswordExpires
			return user
		})
	}

	updatePassword({id, passwordResetToken, currentPassword, newPassword}) {
		const instance = this
		return co(function*() {
			let user = yield instance.model.scope('full').findOne({where: {id}})
			if (!user || (!passwordResetToken && !currentPassword)) {
				throw {customMessage: 'User not found.'}
			}
			if (passwordResetToken && ((passwordResetToken !== user.resetPasswordToken) || (moment.utc().valueOf() > moment.utc(user.resetPasswordExpires, 'YYYY-MM-DD H:mm:ss')))) {
				throw {customMessage: 'Invalid or expired token.'}
			}
			if (currentPassword && !bcryptjs.compareSync(currentPassword, user.password)) {
				throw {customMessage: 'Incorrect current password.'}
			}
			yield instance.model.update({password: newPassword}, {where: {id}})
			return {success: true}
		})
	}

	update(data) {
		const instance = this
		return co(function*() {
			let userToUpdate = {}
			instance.allowedUpdateFields.forEach((field, index) => {
				if (typeof data[field] !== 'undefined') {
					userToUpdate[field] = data[field]
				}
			})
			let result = yield instance.model.update(userToUpdate, {where: {id: data.id}, returning: true})
			if (!result || !result[1] || !result[1][0]) {
				throw {customMessage: 'User not found.'}
			}
			return {success: true}
		})
	}

	sendEmailUpdateRequest({id, email}) {
		const instance = this
		return co(function*() {
			let user = yield instance.model.scope('full').update({resetPassword: true, unconfirmedEmail: email}, {
				where: {id},
				returning: true
			})
			if (!user || !user[0] || !user[1][0]) {
				throw {customMessage: 'User not found.'}
			}
			user = user[1][0]
			let clientModuleConfig = instance.config.clients[instance.config.emails.useClientModule],
				host = clientModuleConfig ? clientModuleConfig.host : ''
			yield instance.mailClient.sendEmail('updateEmail', user.email, 'Email Update Request', {
				fields: {
					userFirstName: user.firstName,
					updateEmailLink: `${host}/tokenLogin?token=${encodeURIComponent(user.resetPasswordToken)}&next=${encodeURIComponent('/mySettings')}&tokenKeyName=emailToken`
				}
			})
			return {success: true}
		})
	}

	updateEmail({id, token}) {
		const instance = this
		return co(function*() {
			let user = yield instance.model.scope('full').findOne({where: {id}})
			if (!user) {
				throw {customMessage: 'User not found.'}
			}
			if ((token !== user.resetPasswordToken) || (moment.utc().valueOf() > moment.utc(user.resetPasswordExpires, 'YYYY-MM-DD H:mm:ss'))) {
				throw {customMessage: 'Invalid or expired token.'}
			}

			user = yield instance.model.update({email: user.unconfirmedEmail}, {where: {id: user.id}, returning: true})
			user = user[1][0]
			let clientModuleConfig = instance.config.clients[instance.config.emails.useClientModule],
				host = clientModuleConfig ? clientModuleConfig.host : ''
			yield instance.mailClient.sendEmail('emailUpdatedSuccessfully', user.email, 'Email Updated', {
				fields: {
					userFirstName: user.firstName,
					userEmail: user.email
				}
			})
			return {success: true}
		})
	}
}

module.exports = Component

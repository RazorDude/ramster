'use strict'

const
	Base = require('ramster').BaseDBComponent,
	bcryptjs = require('bcryptjs'),
	co = require('co'),
	{generateRandomString} = require('ramster').toolbelt,
	merge = require('deepmerge'),
	moment = require('moment')

class Component extends Base {
	constructor(sequelize, Sequelize) {
		super()

		const instance = this

		this.model = sequelize.define('user', {
			typeId: {type: Sequelize.INTEGER, allowNull: false, validate: {min: 1}},
			firstName: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
			lastName: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
			email: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
			unconfirmedEmail: {type: Sequelize.STRING, allowNull: true, validate: {notEmpty: true}},
			phone: {type: Sequelize.STRING, allowNull: true, validate: {notEmpty: true}},
			password: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
			resetPassword: {type: Sequelize.VIRTUAL},
			resetPasswordToken: {type: Sequelize.STRING, allowNull: true, validate: {notEmpty: true}},
			resetPasswordExpires: {type: Sequelize.DATE, allowNull: true, validate: {isDate: true}},
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
						this.setDataValue('resetPasswordToken', null)
						this.setDataValue('resetPasswordExpires', null)
						if ((typeof value !== 'string') || (value.length < 4)) {
							throw {customMessage: 'The password must be at least 4 characters long.'}
						}
						this.setDataValue('password', bcryptjs.hashSync(value, 10))
					}
				},
				email: function (value) {
					if (typeof value !== 'undefined') {
						this.setDataValue('resetPasswordToken', null)
						this.setDataValue('resetPasswordExpires', null)
						this.setDataValue('unconfirmedEmail', null)
						this.setDataValue('email', value)
					}
				},
				resetPassword: function (value) {
					this.setDataValue('resetPasswordToken', generateRandomString(16, 'base64'))
					this.setDataValue('resetPasswordExpires', moment.utc().add(10, 'minutes').format())
				},
				resetPasswordToken: function (value) {
				},
				resetPasswordExpires: function (value) {
				}
			},
			scopes: {
				default: {
					attributes: ['id', 'typeId', 'firstName', 'lastName', 'email', 'unconfirmedEmail', 'phone', 'resetPassword', 'gender', 'status', 'lastLogin', 'createdAt', 'updatedAt', 'deletedAt']
				},
				full: {
					attributes: ['id', 'typeId', 'firstName', 'lastName', 'email', 'unconfirmedEmail', 'phone', 'password', 'resetPassword', 'resetPasswordToken', 'resetPasswordExpires', 'gender', 'status', 'lastLogin', 'createdAt', 'updatedAt', 'deletedAt']
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

		this.profileUpdateFields = ['firstName', 'lastName', 'phone', 'gender', 'status']

		this.searchFields = [
			{field: 'id'},
			{field: 'roleId'},
			{field: 'firstName', like: '-%'},
			{field: 'lastName', like: '-%'},
			{field: 'email', like: '-%'},
			{field: 'phone', like: '-%'},
			{field: 'gender'},
			{field: 'status'},
			{field: 'lastLogin'},
			{field: 'createdAt'},
			{field: 'updatedAt'},
			{field: 'deletedAt'}
		]
	}

	getPermissionsData({keyAccessPoints}) {
		let data = {}
		keyAccessPoints.forEach((kap, index) => {
			data[`can${kap.name.replace(/\s/g, '')}`] = true
		})
		return data
	}

	getUserWithPermissionsData(filters) {
		const instance = this,
			{roles, keyAccessPoints, modules} = this.db.components
		return co(function*() {
			let alwaysAccessibleModules = yield modules.model.findAll({where: {alwaysAccessible: true}})
				let user = yield instance.model.scope('full').findOne({
					where: filters,
					include: {
						model: roles.model,
						as: 'role',
						include: [
							{model: keyAccessPoints.model, as: 'keyAccessPoints'},
							{model: modules.model, as: 'roleModules'}
						]
					}
				})
				if (user) {
					let moduleIds = [],
						roleModules = user.role.roleModules
					roleModules.forEach((module, index) => {
						if (module.alwaysAccessible) {
							moduleIds.push(module.id)
						}
					})
					alwaysAccessibleModules.forEach((module, index) => {
						if (moduleIds.indexOf(module.id) === -1) {
							roleModules.push(module)
						}
					})
					user.dataValues.permissionsData = instance.getPermissionsData({keyAccessPoints: user.role.keyAccessPoints})
				}
				return user
		})
	}

	login(data) {
		const instance = this,
			dbComponents = this.db.components
		return co(function*() {
			let user = yield instance.getUserWithPermissionsData(data.filters)
			if (!user) {
				throw {customMessage: 'Invalid email or password.'}
			}
			if (!user.status) {
				throw {customMessage: 'Your account is currently inactive.'}
			}
			if (!bcryptjs.compareSync(data.password, user.password)) {
				throw {customMessage: 'Invalid email or password.'}
			}
			yield instance.model.update({lastLogin: moment().format('YYYY-MM-DD H:mm:ss')}, {where: {id: user.id}})
			delete user.dataValues.password
			delete user.dataValues.resetPasswordToken
			delete user.dataValues.resetPasswordExpires
			return user
		})
	}

	tokenLogin({token, filters}) {
		const instance = this,
			dbComponents = this.db.components
		return co(function*() {
			let user = yield instance.getUserWithPermissionsData(filters)
			if (!user) {
				throw {customMessage: 'User not found / invalid or expired token.'}
			}
			if (moment.utc().valueOf() > moment.utc(user.resetPasswordExpires, 'YYYY-MM-DD H:mm:ss').valueOf()) {
				throw {customMessage: 'Invalid or expired token.'}
			}
			if (!user.status) {
				throw {customMessage: 'Your account is currently inactive.'}
			}
			yield instance.model.update({lastLogin: moment.utc().format('YYYY-MM-DD H:mm:ss')}, {where: {id: user.id}})
			delete user.dataValues.password
			delete user.dataValues.resetPasswordToken
			delete user.dataValues.resetPasswordExpires
			return user
		})
	}

	resetPassword({email}) {
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
					resetPasswordLink: `${host}/tokenLogin?token=${encodeURIComponent(user.resetPasswordToken)}&next=${encodeURIComponent('/users/me')}`
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
					updateEmailLink: `${host}/tokenLogin?token=${encodeURIComponent(user.resetPasswordToken)}&next=${encodeURIComponent('/users/me')}&tokenKeyName=emailToken`
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

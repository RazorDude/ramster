'use strict'

const
	{BaseDBComponent} = require('../../../../index'),
	co = require('co')

class Component extends BaseDBComponent {
	constructor(sequelize, Sequelize) {
		super()

		this.model = sequelize.define('userType', {
				name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
				description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
				status: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true}
			}, {
				indexes: [
					{unique: true, fields: ['name'], where: {deletedAt: null}}
				],
				setterMethods: {
					id: function (value) {
					}
				},
				paranoid: true
			}
		)

		this.associationsConfig = {
			users: {type: 'hasMany', foreignKey: 'typeId'},
			accessPoints: {type: 'belongsToMany', componentName: 'moduleAccessPoints', through: 'userTypeModuleAccessPoints', foreignKey: 'userTypeId', otherKey: 'moduleAccessPointId'}
		}

		this.searchFields = [
			{field: 'id'},
			{field: 'name', like: '-%'},
			{field: 'description', like: '-%'},
			{field: 'status'},
			{field: 'createdAt'},
			{field: 'updatedAt'},
			{field: 'deletedAt'}
		]

		this.systemCriticalIds = [1]
		this.fixedAccessIds = [1]

		this._update = super.update
	}

	update(data) {
		const instance = this
		return co(function*() {
			if (data && data.dbObject && data.where && (data.dbObject.status === false)) {
				const id = data.where.id
				if (id instanceof Array) {
					id.forEach((item, index) => {
						if (instance.systemCriticalIds.indexOf(item) !== -1) {
							throw {customMessage: 'Cannot deactivate a system-critical user type.'}
						}
					})
				} else if (instance.systemCriticalIds.indexOf(id) !== -1) {
					throw {customMessage: 'Cannot deactivate a system-critical user type.'}
				}
			}
			return yield instance._update(data)
		})
	}

	updateAccessPoints({id, moduleAccessPointIds}) {
		const instance = this,
			{modules, moduleAccessPoints, users} = this.db.components,
			sequelize = this.db.sequelize,
			queryInterface = sequelize.getQueryInterface()
		return sequelize.transaction((t) => {
			return co(function*() {
				let userType = yield instance.model.findOne({
					where: {id},
					include: [{model: users.model, as : 'users', attributes: ['id']}],
					transaction: t
				})
				if (!userType) {
					throw {customMessage: 'User type not found.'}
				}
				if (instance.fixedAccessIds.indexOf(userType.id) !== -1) {
					throw {customMessage: 'Cannot update the access points of a fixed-access user type.'}
				}
				yield sequelize.query(`delete from "userTypeModuleAccessPoints" where "userTypeId"=${userType.id};`, {transaction: t})
				if ((moduleAccessPointIds instanceof Array) && moduleAccessPointIds.length) {
					let apQuery = `insert into "userTypeModuleAccessPoints" ("userTypeId", "moduleAccessPointId", "createdAt", "updatedAt") values `,
						apList = yield moduleAccessPoints.model.findAll({where: {id: moduleAccessPointIds}, attributes: ['id'], transaction: t})
					apList.forEach((ap, index) => {
						apQuery += `(${userType.id}, ${ap.id}, now(), now())`
						if (index < (apList.length - 1)) {
							apQuery += ', '
						}
					})
					apQuery += ';'
					yield sequelize.query(apQuery, {transaction: t})
				}
				yield instance.db.generalStore.storeEntry(`db-userTypeId-${userType.id}-permissionsUpdated`, JSON.stringify(userType.users.map((e, i) => e.id)))
				return true
			})
		})
	}

	delete(data) {
		const instance = this,
			{systemCriticalIds} = this,
			{users} = this.db.components
		return instance.db.sequelize.transaction((t) => {
			return co(function*() {
				let typeList = yield instance.model.findAll({
						where: {id: data.id},
						include: [
							{model: users.model, as: 'users', limit: 1}
						],
						transaction: t
					}),
					typeIds = []
				if (!typeList.length) {
					throw {customMessage: 'User types not found.'}
				}
				typeList.forEach((type, index) => {
					if (systemCriticalIds.indexOf(parseInt(type.id, 10)) !== -1) {
						throw {customMessage: 'Cannot delete a system-critical user type.'}
					}
					if (type.users.length) {
						throw {customMessage: 'Cannot delete a user type that has users.'}
					}
					typeIds.push(type.id)
				})
				yield instance.db.sequelize.query(`delete from "userTypeModuleAccessPoints" where "userTypeId" in (${typeIds.join(',')});`, {transaction: t})
				return yield instance.model.destroy({where: {id: typeIds}, transaction: t})
			})
		})
	}
}

module.exports = Component

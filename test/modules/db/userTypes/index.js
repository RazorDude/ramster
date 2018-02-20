'use strict'

const
	Base = require('../../../../').BaseDBComponent,
	co = require('co')

class Component extends Base {
	constructor(sequelize, Sequelize, settings) {
		super(settings)

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
		})

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

		this.systemCriticalIds = []

		this._update = super.update
	}

	update({dbObject, where}) {
		const instance = this,
			dbComponents = this.db.components
		return co(function*() {
			if ((dbObject.status === false) && (instance.systemCriticalIds.indexOf(parseInt(where.id, 10)) !== -1)) {
				throw {customMessage: 'Cannot deactivate a system-critical user type.'}
			}
			return yield instance._update(data)
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
					throw {customMessage: 'Roles not found.'}
				}
				typeList.forEach((type, index) => {
					if (systemCriticalIds.indexOf(parseInt(type.id, 10)) !== -1) {
						throw {customMessage: 'Cannot delete a system-critical user type.'}
					}
					typeIds.push(type.id)
				})
				// yield instance.db.sequelize.query(`delete from "typeModules" where "typeId" in (${typeIds});`, {transaction: t})
				yield instance.db.sequelize.query(`delete from "userTypeModuleAccessPoints" where "userTypeId" in (${typeIds.join(',')});`, {transaction: t})
				return yield instance.model.destroy({where: {id: typeIds}, transaction: t})
			})
		})
	}
}

module.exports = Component

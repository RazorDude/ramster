'use strict'

const
	Base = require('ramster').BaseDBComponent

class Component extends Base {
	constructor(sequelize, Sequelize, settings) {
		super(settings)

		this.model = sequelize.define('moduleAccessPoint', {
			moduleId: {type: Sequelize.INTEGER, allowNull: false, validate: {min: 1}},
			name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
			description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
			status: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true}
		}, {
			indexes: [
				{unique: true, fields: ['name', 'moduleId'], where: {deletedAt: null}}
			],
			setterMethods: {
				id: function (value) {
				}
			},
			paranoid: true
		})

		this.associationsConfig = {
			module: {type: 'belongsTo', componentName: 'modules', foreignKey: 'moduleId'},
			userTypes: {type: 'belongsToMany', componentName: 'userTypes', through: 'userTypeModuleAccessPoints', foreignKey: 'moduleAccessPointId', otherKey: 'userTypeId'}
		}

		this.searchFields = [
			{field: 'id'},
			{field: 'name'},
			{field: 'description'},
			{field: 'status'},
			{field: 'createdAt'},
			{field: 'updatedAt'},
			{field: 'deletedAt'}
		]
	}
}

module.exports = Component

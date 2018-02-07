'use strict'

const
	Base = require('ramster').BaseDBComponent

class Component extends Base {
	constructor(sequelize, Sequelize, settings) {
		super(settings)

		this.model = sequelize.define('module', {
			name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
			route: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
			search: {type: Sequelize.STRING, allowNull: true, validate: {notEmpty: true}},
			description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
			order: {type: Sequelize.INTEGER, allowNull: false, validate: {min: 0}},
			alwaysAccessible: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false},
			status: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true}
		}, {
			indexes: [
				{unique: true, fields: ['name'], where: {categoryId: null, deletedAt: null}},
				{unique: true, fields: ['name', 'categoryId'], where: {categoryId: {$not: null}, deletedAt: null}},
				{unique: true, fields: ['categoryId', 'order'], where: {categoryId: {$not: null}, order: {$not: null}, deletedAt: null}},
				{unique: true, fields: ['order'], where: {categoryId: null, deletedAt: null}}
			],
			setterMethods: {
				id: function (value) {
				}
			},
			paranoid: true
		})

		this.associationsConfig = {
			category: {type: 'belongsTo', componentName: 'moduleCategories', foreignKey: 'categoryId'},
			accessPoints: {type: 'hasMany', componentName: 'moduleAccessPoints', foreignKey: 'moduleId'}
		}

		this.searchFields = [
			{field: 'id'},
			{field: 'categoryId'},
			{field: 'name'},
			{field: 'route'},
			{field: 'search'},
			{field: 'description'},
			{field: 'order'},
			{field: 'alwaysAccessible'},
			{field: 'status'},
			{field: 'createdAt'},
			{field: 'updatedAt'},
			{field: 'deletedAt'}
		]
	}
}

module.exports = Component

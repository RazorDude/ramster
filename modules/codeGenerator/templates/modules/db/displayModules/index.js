'use strict'
/**
 * The displayModulesDBComponentModule. Contains the DisplayModulesDBComponent class.
 * @module displayModulesDBComponentModule
 */

const
	{BaseDBComponent} = require('ramster')

/**
 * The DisplayModulesDBComponent class. Contains the sequelize db model and the business logic for the displayModules. DisplayModules are system entities which are used to logically group server components in the front-end as menu items if needed, creating dynamic, perimission-based menus, rather than hardcoded ones. Optionally, they can have access points assigned to them for a dynamic permissions system.
 * @class DisplayModulesDBComponent
 */
class DisplayModulesDBComponent extends BaseDBComponent {
	/**
	 * Creates an instance of DisplayModulesDBComponent.
	 * @param {object} sequelize An instance of Sequelize.
	 * @param {object} Sequelize A Sequelize static object.
	 * @memberof DisplayModulesDBComponent
	 */
	constructor(sequelize, Sequelize) {
		super()

		this.model = sequelize.define('displayModule', {
				name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
				route: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
				search: {type: Sequelize.STRING, allowNull: true, validate: {notEmpty: true}},
				description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
				order: {type: Sequelize.INTEGER, allowNull: false, validate: {min: 0}},
				alwaysAccessible: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false},
				visible: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true},
				active: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true}
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
			}
		)

		this.associationsConfig = {
			category: {type: 'belongsTo', componentName: 'displayModuleCategories', foreignKey: 'categoryId'},
			accessPoints: {type: 'hasMany', foreignKey: 'displayModuleId'}
		}

		this.systemCriticalIds = [1]

		this.searchFields = [
			{field: 'id'},
			{field: 'categoryId'},
			{field: 'name'},
			{field: 'route'},
			{field: 'search'},
			{field: 'description'},
			{field: 'order'},
			{field: 'alwaysAccessible'},
			{field: 'active'},
			{field: 'createdAt'},
			{field: 'updatedAt'},
			{field: 'deletedAt'}
		]
	}
}

module.exports = DisplayModulesDBComponent

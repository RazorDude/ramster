'use strict'
/**
 * The displayModuleCategoriesDBComponentModule. Contains the DisplayModuleCategoriesDBComponent class.
 * @module displayModuleCategoriesDBComponentModule
 */

const
	{BaseDBComponent} = require('ramster')

/**
 * The DisplayModuleCategoriesDBComponent class. Contains the sequelize db model and the business logic for the displayModuleCategories. DisplayModuleCategory items are used to visually group system modules for display in menus in a dynamic, non-hardcoded way.
 * @class DisplayModuleCategoriesDBComponent
 */
class DisplayModuleCategoriesDBComponent extends BaseDBComponent {
	/**
	 * Creates an instance of DisplayModuleCategoriesDBComponent.
	 * @param {object} sequelize An instance of Sequelize.
	 * @param {object} Sequelize A Sequelize static object.
	 * @memberof DisplayModuleCategoriesDBComponent
	 */
	constructor(sequelize, Sequelize) {
		super()

		this.model = sequelize.define('displayModuleCategory', {
				name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
				description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
				order: {type: Sequelize.INTEGER, allowNull: false, validate: {min: 0}},
				icon: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
			}, {
				indexes: [
					{unique: true, fields: ['name'], where: {deletedAt: null}},
					{unique: true, fields: ['order'], where: {deletedAt: null}}
				],
				setterMethods: {
					id: function (value) {
					}
				},
				paranoid: true
			}
		)

		this.associationsConfig = {
			displayModules: {type: 'hasMany', foreignKey: 'categoryId'}
		}

		this.searchFields = [
			{field: 'id'},
			{field: 'name'},
			{field: 'description'},
			{field: 'order'},
			{field: 'createdAt'},
			{field: 'updatedAt'},
			{field: 'deletedAt'}
		]
	}
}

module.exports = DisplayModuleCategoriesDBComponent

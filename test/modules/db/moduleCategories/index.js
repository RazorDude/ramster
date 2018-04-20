'use strict'
/**
 * The moduleCategoriesDBComponentModule. Contains the ModuleCategoriesDBComponent class.
 * @module moduleCategoriesDBComponentModule
 */

const
	{BaseDBComponent} = require('../../../../index')

/**
 * The ModuleCategoriesDBComponent class. Contains the sequelize db model and the business logic for the moduleCategories. ModuleCategory items are used to visually group system modules for display in menus in a dynamic, non-hardcoded way.
 * @class ModuleCategoriesDBComponent
 */
class ModuleCategoriesDBComponent extends BaseDBComponent {
	/**
	 * Creates an instance of ModuleCategoriesDBComponent.
	 * @param {object} sequelize An instance of Sequelize.
	 * @param {object} Sequelize A Sequelize static object.
	 * @memberof ModuleCategoriesDBComponent
	 */
	constructor(sequelize, Sequelize) {
		super()

		this.model = sequelize.define('moduleCategory', {
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
			modules: {type: 'hasMany', foreignKey: 'categoryId'}
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

module.exports = ModuleCategoriesDBComponent

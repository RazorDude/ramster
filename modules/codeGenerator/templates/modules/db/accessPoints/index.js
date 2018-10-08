'use strict'
/**
 * The accessPointsDBComponentModule. Contains the AccessPointsDBComponent class.
 * @module accessPointsDBComponentModule
 */

const
	{BaseDBComponent} = require('ramster')

/**
 * The AccessPointsDBComponent class. Contains the sequelize db model and the business logic for the accessPoints. AccessPoints are assigned to userTypes and filtered in the server module's accessFilter method, effectively creating a modular, role-based permissions system. Optionally, they can have displayModules assigned to them as part of the dynamic permissions system.
 * @class AccessPointsDBComponent
 */
class AccessPointsDBComponent extends BaseDBComponent {
	/**
	 * Creates an instance of AccessPointsDBComponent.
	 * @param {object} sequelize An instance of Sequelize.
	 * @param {object} Sequelize A Sequelize static object.
	 * @memberof AccessPointsDBComponent
	 */
	constructor(sequelize, Sequelize) {
		super()

		this.model = sequelize.define('accessPoint', {
				name: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
				description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
				active: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true},
				userFieldName: {type: Sequelize.STRING, allowNull: true, validate: {notEmpty: true}},
				searchForUserFieldIn: {type: Sequelize.STRING, allowNull: true, validate: {notEmpty: true}},
				setUserFieldValueIn: {type: Sequelize.STRING, allowNull: true, validate: {notEmpty: true}}
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
			displayModule: {type: 'belongsTo', componentName: 'displayModules', foreignKey: 'displayModuleId'},
			userTypes: {type: 'belongsToMany', through: 'userTypeAccessPoints', foreignKey: 'accessPointId', otherKey: 'userTypeId'}
		}

		this.searchFields = [
			{field: 'id'},
			{field: 'displayModuleId'},
			{field: 'name'},
			{field: 'description'},
			{field: 'active'},
			{field: 'userFieldName'},
			{field: 'searchForUserFieldIn'},
			{field: 'setUserFieldValueIn'},
			{field: 'createdAt'},
			{field: 'updatedAt'},
			{field: 'deletedAt'}
		]
	}
}

module.exports = AccessPointsDBComponent

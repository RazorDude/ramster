'use strict'
/**
 * The moduleAccessPointsDBComponentModule. Contains the ModuleAccessPointsDBComponent class.
 * @module moduleAccessPointsDBComponentModule
 */

const
	{BaseDBComponent} = require('ramster')

/**
 * The ModuleAccessPointsDBComponent class. Contains the sequelize db model and the business logic for the moduleAccessPoints. ModuleAccessPoints are assigned to userTypes and filtered in the server module's accessFilter method, effectively creating a modular, role-based permissions system.
 * @class ModuleAccessPointsDBComponent
 */
class ModuleAccessPointsDBComponent extends BaseDBComponent {
	/**
	 * Creates an instance of ModuleAccessPointsDBComponent.
	 * @param {object} sequelize An instance of Sequelize.
	 * @param {object} Sequelize A Sequelize static object.
	 * @memberof ModuleAccessPointsDBComponent
	 */
	constructor(sequelize, Sequelize) {
		super()

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
			}
		)

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

module.exports = ModuleAccessPointsDBComponent

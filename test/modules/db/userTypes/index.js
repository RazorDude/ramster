'use strict'
/**
 * The userTypessDBComponentModule. Contains the UserTypesDBComponent class.
 * @module userTypessDBComponentModule
 */

const
	{BaseDBComponent} = require('../../../../index'),
	co = require('co')

/**
 * The UserTypesDBComponent class. Contains the sequelize db model and the business logic for the usersTypes. UserType items are central to the whole platform, as they server as the basis for the permissions system. Access points for different modules are linked to them.
 * @class UserTypesDBComponent
 */
class UserTypesDBComponent extends BaseDBComponent {
	/**
	 * Creates an instance of UserTypesDBComponent.
	 * @param {object} sequelize An instance of Sequelize.
	 * @param {object} Sequelize A Sequelize static object.
	 * @memberof UserTypesDBComponent
	 */
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

		/**
		 * A list of userType ids, which are considered system-critial and cannot be deactivated or deleted.
		 * @type {number[]}
		 */
		this.systemCriticalIds = [1]
		/**
		 * A list of userType ids, which are considered fixed-access, meaning that no accessPoints can be added or removed to them.
		 * @type {number[]}
		 */
		this.fixedAccessIds = [1]

		this._update = super.update
	}

	/**
	 * Updates a userType. Performs a check to make sure no systemCriticalIds are deactivated.
	 * @param {Object.<string, any>} data The method input data, containing the dbObject to update and the conditions to update it by.
	 * @param {Object.<string, any>} data.dbObject The fields to update.
	 * @param {Object.<string, any>} data.where The criteria to update by. Must contain the id.
	 * @param {number} data.userId The id of the user performing the update, usually the currently logged-in user.
	 * @returns {Promise<array>} A promise which wraps a generator function. When resolved, the promise returns an array of the format [updatedItemsCount: number, updatedItems: array].
	 * @memberof UserTypesDBComponent
	 */
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

	/**
	 * Updates the access points of a userType, by setting its related access points to the provided array of ids. Performs a check to make sure no access points of a fixedAccess userType are updated.
	 * @param {Object.<string, any>} data The method input data, containing the id of the userType and its full list of accessPointIds.
	 * @param {number} data.id The fields to update.
	 * @param {number[]} data.moduleAccessPointIds The array of moduleAccessPoints to set.
	 * @returns {Promise<boolean>} A promise which wraps a generator function.
	 * @memberof UserTypesDBComponent
	 */
	updateAccessPoints(data) {
		const {id, moduleAccessPointIds} = data,
			instance = this,
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

	/**
	 * Deletes all userTypes that match a particular id. Performs a check to make sure no systemCriticalIds or ones that have related users are deleted.
	 * @param {Object.<string, any>} data The method input data, containing the id / ids to delete, under the "id" key.
	 * @param {number|number[]} data.id The ids to delete.
	 * @returns {Promise<{deleted: number}>} A promise which wraps a generator function. When resolved, the promise returns {deleted: <the number of deleted DB items>}.
	 * @memberof UserTypesDBComponent
	 */
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
				return {deleted: yield instance.model.destroy({where: {id: typeIds}, transaction: t})}
			})
		})
	}
}

module.exports = UserTypesDBComponent

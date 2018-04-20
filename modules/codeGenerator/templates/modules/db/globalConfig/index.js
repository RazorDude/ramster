'use strict'
/**
 * The globalConfigDBComponentModule. Contains the GlobalConfigDBComponent class.
 * @module globalConfigDBComponentModule
 */

const
	{BaseDBComponent} = require('ramster'),
	co = require('co')

/**
 * The GlobalConfigDBComponent class. Contains the sequelize db model and the business logic for the globalConfig. GlobalConfig items hold valuable platform-wide variables that would otherwise be hardcoded.
 * @class GlobalConfigDBComponent
 */
class GlobalConfigDBComponent extends BaseDBComponent {
	/**
	 * Creates an instance of GlobalConfigDBComponent.
	 * @param {object} sequelize An instance of Sequelize.
	 * @param {object} Sequelize A Sequelize static object.
	 * @memberof GlobalConfigDBComponent
	 */
	constructor(sequelize, Sequelize) {
		super()

		this.model = sequelize.define('globalConfig', {
				field: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
				value: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
				description: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}}
			}, {
				setterMethods: {
					id: function (value) {
					},
					field: function (value) {
					}
				},
				paranoid: true
			}
		)

		this.searchFields = [
			{field: 'id'},
			{field: 'field', like: '-%'},
			{field: 'value'},
			{field: 'description', like: '-%'},
			{field: 'createdAt'},
			{field: 'updatedAt'},
			{field: 'deletedAt'}
		]
	}

	/**
	 * Finds a globalConfig field by field name and returns its value.
	 * @param {string} fieldName The "field" name to search by.
	 * @returns {Promise<string|null>} A promise which wraps a generator function. Resolves with the value of the found field, or null if not found.
	 * @memberof GlobalConfigDBComponent
	 */
	getField(fieldName) {
		const instance = this
		return co(function*() {
			let data = yield instance.model.findOne({where: {field: fieldName}})
			return data && data.value || null
		})
	}

	/**
	 * Finds a list of globalConfig field by their field names and returns a key-value object.
	 * @param {string[]} fieldNames The "field" names to search by.
	 * @returns {Promise<object>} A promise which wraps a generator function. Resolves with an object, containing the values of the found field, with the object keys being the values of the "field" columns.
	 * @memberof GlobalConfigDBComponent
	 */
	getFields(fieldNames) {
		const instance = this
		return co(function*() {
			let data = yield instance.model.findAll({where: {field: fieldNames}}),
				resultData = {}
			data.forEach((row, index) => {
				resultData[row.field] = row.value
			})
			return resultData
		})
	}
}

module.exports = GlobalConfigDBComponent

'use strict'

const
	Base = require('../../../../').BaseDBComponent,
	co = require('co')

class Component extends Base {
	constructor(sequelize, Sequelize, settings) {
		super(settings)

		this.componentName = 'globalConfig'
		this.relReadKeys = []

		this.model = sequelize.define('GlobalConfig', {
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
		})

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

	getField(fieldName) {
		const instance = this
		return co(function*() {
			let data = yield instance.model.findOne({where: {field: fieldName}})
			return data && data.value || null
		})
	}

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

module.exports = Component

'use strict'

const
	Base = require('ramster').BaseDBComponent

class Component extends Base {
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
		})

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

module.exports = Component

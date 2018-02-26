'use strict'

const
	argv = require('yargs').argv,
	commonConfig = require(`./common.js`),
	merge = require('deepmerge'),
	profileConfig = require(`./profiles/${argv.configProfile || 'local'}`)

module.exports = merge(commonConfig, profileConfig)

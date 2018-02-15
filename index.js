'use strict'

const
	{BaseAPIComponent} = require('./modules/api'),
	{BaseClientComponent} = require('./modules/client'),
	{BaseDBComponent} = require('./modules/db'),
	CodeGenerator = require('./modules/codeGenerator'),
	codeGenerator = new CodeGenerator(),
	Core = require('./core'),
	CsvPromise = require('./modules/csvPromise'),
	toolbelt = require('./modules/toolbelt')

module.exports = {
	BaseDBComponent,
	BaseClientComponent,
	BaseAPIComponent,
	Core,
	CodeGenerator,
	codeGenerator,
	csvPromise: new CsvPromise(),
	toolbelt
}

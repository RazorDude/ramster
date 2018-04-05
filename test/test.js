'use strict'

const
	co = require('co'),
	config = require('./config'),
	{Core} = require('../index')

let core = new Core(config)
core.testMe()

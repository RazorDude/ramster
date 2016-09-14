'use strict'

let ramster = require('../index'),
	config = require('./config'),
	core = new ramster.Core(config)

core.listen()

'use strict'

const
	assert = require('assert'),
	co = require('co'),
	// config = require('./config'),
	{Core} = require('../index')

let core = new Core({})
core.testMe()
// co(function* () {
// 	yield core.testMe()
// 	return true
// }).then((res) => true, (err) => console.log(err))


// describe('top-level', function() {
// 	describe('mid-level 1', function() {
// 		it('should return true', function() {
// 			assert(true)
// 		})
// 		it('should return true 2', function() {
// 			assert(true)
// 		})
// 	})

// 	describe('mid-level 2', function() {
// 		it('should return true', function() {
// 			return co(function*() {

// 				assert(true)
// 				return true
// 			})
// 		})
// 		it('should return true 2', function() {
// 			assert(true)
// 		})
// 	})

// 	describe('mid-level 3', function() {
// 		it('should return true', function() {
// 			assert(true)
// 		})
// 		it('should return true 2', function() {
// 			assert(true)
// 		})
// 	})

// 	afterEach(function() {
// 		console.log('top-level afterEach')
// 	})
// 	after(function() {
// 		console.log('top-level after')
// 	})
// })

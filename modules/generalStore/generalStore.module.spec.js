'use strict'

const
	assert = require('assert'),
	co = require('co'),
	moment = require('moment')

module.exports = {
	testMe: function() {
		const instance = this
		let entryKey = `${moment.utc().valueOf()}_test_key`,
			entryValue = 'test_value'
		describe('generalStore', function() {
			it('should execute testCreateClient successfully', function() {
				instance.testCreateClient()
			})
			it('should execute testStoreEntry successfully', function() {
				instance.testStoreEntry(entryKey, entryValue)
			})
			it('should execute testGetStoredEntry successfully', function() {
				instance.testGetStoredEntry(entryKey, entryValue)
			})
			it('should execute testRemoveEntry successfully', function() {
				instance.testRemoveEntry(entryKey, entryValue)
			})
		})
	},
	testCreateClient: function() {
		const instance = this
		describe('generalStore.createClient', function() {
			it('should create a client successfully', function() {
				return co(function*() {
					yield instance.createClient()
					return true
				})
			})
		})
	},
	testStoreEntry: function(entryKey, entryValue) {
		const instance = this
		describe('generalStore.storeEntry', function() {
			it('should throw an error if no handle is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.storeEntry()
					} catch (e) {
						didThrowAnError = true
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error if an empty handle string is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.storeEntry('')
					} catch (e) {
						didThrowAnError = true
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error if no entry value is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.storeEntry(entryKey)
					} catch (e) {
						didThrowAnError = true
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully if all parameters are correct', function() {
				return co(function*() {
					yield instance.storeEntry(entryKey, entryValue)
					return true
				})
			})
		})
	},
	testGetStoredEntry: function(entryKey, entryValue) {
		const instance = this
		describe('generalStore.getStoredEntry', function() {
			it('should throw an error if no handle is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.getStoredEntry()
					} catch (e) {
						didThrowAnError = true
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error if an empty handle string is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.getStoredEntry('')
					} catch (e) {
						didThrowAnError = true
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should return the correct value for the handle if all parameters are correct', function() {
				return co(function*() {
					assert((yield instance.getStoredEntry(entryKey)) === entryValue)
					return true
				})
			})
		})
	},
	testRemoveEntry: function(entryKey) {
		const instance = this
		describe('generalStore.removeEntry', function() {
			it('should throw an error if no handle is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.removeEntry()
					} catch (e) {
						didThrowAnError = true
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should throw an error if an empty handle string is provided', function() {
				return co(function*() {
					let didThrowAnError = false
					try {
						yield instance.removeEntry('')
					} catch (e) {
						didThrowAnError = true
					}
					assert(didThrowAnError)
					return true
				})
			})
			it('should execute successfully if all parameters are correct', function() {
				return co(function*() {yield instance.removeEntry(entryKey)
					return true
				})
			})
		})
	}
}

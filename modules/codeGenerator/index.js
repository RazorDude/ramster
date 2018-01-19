'use strict'

const
	co = require('co'),
	fs = require('fs-extra'),
	path = require('path'),
	spec = require('./index.spec')

class CodeGenerator {
	constructor() {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
	}

	generateConfigFile(outputPath, outputFileName, templateFilePath) {
		const instance = this
		return co(function*() {
			let configTemplate = yield fs.readFile(templateFilePath)
			try {
				let dirStats = yield fs.lstat(outputPath)
				if (!dirStats.isDirectory()) {
					throw {customMessage: 'The provided output path already exists, but is not a directory.'}
				}
			} catch (e) {
				if (!e || (e.customMessage !== 'The provided output path already exists, but is not a directory.')) {
					yield fs.mkdirp(outputPath)
				} else {
					throw e
				}
			}
			let fd = yield fs.open(path.join(outputPath, outputFileName), 'w')
			yield fs.writeFile(fd, configTemplate)
			yield fs.close(fd)
			return true
		})
	}

	generateIndexConfigFile(outputPath) {
		return this.generateConfigFile(outputPath, 'index.js', path.join(__dirname, '../shared/templates/config/index.js'))
	}

	generateCommonConfigFile(outputPath) {
		return this.generateConfigFile(outputPath, 'common.js', path.join(__dirname, '../shared/templates/config/common.js'))
	}

	generateProfileConfigFile(outputPath, profileName) {
		if ((typeof profileName !== 'string') || !profileName.length) {
			throw {customMessage: 'The profileName argument must be a non-empty string.'}
		}
		return this.generateConfigFile(path.join(outputPath, './profiles'), `${profileName}.js`, path.join(__dirname, '../shared/templates/config/profiles/local.js'))
	}
}

module.exports = CodeGenerator

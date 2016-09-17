let deepmerge = require('deepmerge'),
	localProfileConfig = require('./local'),
	path = require('path'),
	migrations = {
		baseMigrationsPath: path.join(__dirname, '../../../../migrations'),
		syncHistoryFolder: 'syncHistory',
		seedfilesFolder: 'seedfiles',
		backupFolder: 'backup'
	},
	commonConfig = {
		clientModulesPath: path.join(__dirname, '../../../../modules/clients'),
		clientModulesPublicSourcesPath: path.join(__dirname, '../../../../clients'),
		apiModulesPath: path.join(__dirname, '../../../../modules/apis'),
		globalUploadPath: path.join(__dirname, '../../../../storage/tmp'),
		logsPath: path.join(__dirname, '../../../../logs'),
		emails: {
			sendgridApiKey: 'test',
			emailSender: 'noreply@ramster.com',
			bcc: 'admin@ramster.com',
			templatesPath: path.join(__dirname, '../../../../modules/emails/templates')
		},
		db: {
			modulePath: path.join(__dirname, '../../../../modules/db'),
			seedingOrder: [],
		},
		sampleClientModule: {
			publicPath: path.join(__dirname, '../../../../public/sampleClientModule')
		},
		migrations: {
			baseMigrationsPath: migrations.baseMigrationsPath,
			syncHistoryPath: path.join(migrations.baseMigrationsPath, migrations.syncHistoryFolder),
			seedFilesPath: path.join(migrations.baseMigrationsPath, migrations.seedfilesFolder),
			backupPath: path.join(migrations.baseMigrationsPath, migrations.backupFolder),
			defaultSeedfileName: 'seedfile_current'
		}
	}

module.exports = deepmerge(commonConfig, localProfileConfig)

/**
 * The emails module. Contains the Emails class.
 * @module emailsModule
 */

const
	co = require('co'),
	fs = require('fs-extra'),
	pug = require('pug'),
	path = require('path'),
	sendgrid = require('@sendgrid/mail'),
	spec = require('./emails.module.spec')

/**
 * The Emails class. This class takes care of compiling email template files from .pug into .html, inserting local varibles and sending emails afterwards.
 * @class Emails
 */
class Emails {
	/**
	 * Creates an instance of Emails, sets the class defaults and the sendgrid instance.
	 * @param {object} config The project config object.
	 * @param {boolean} mockMode A flag used to determine whether the system is running in test (mock) mode. If set to true, everything up to the email send point will be executed, but emails will not be sent.
	 * @memberof Emails
	 */
	constructor(config, mockMode) {
		/**
		 * The project config object.
		 * @type {object}
		 */
		this.config = config
		/**
		 * The project db module, if it exists. It's a clone of db itself, with db.mailClient deleted to avoid circular references.
		 * @type {object}
		 */
		this.db = undefined
		/**
		 * The project config object's emails property.
		 * @type {object}
		 */
		this.emailsConfig = config.emails
		/**
		 * The sendgrid client instance.
		 * @type {sendgrid}
		 */
		this.sendgrid = null
		if (config.emails.sendgridApiKey) {
			this.sendgrid = sendgrid
			this.sendgrid.setApiKey(config.emails.sendgridApiKey)
		}
		/**
		 * The email sender's email address. Set in config.emails.emailSender
		 * @type {string}
		 */
		this.sender = config.emails.emailSender
		/**
		 * The names of the test methods from the spec file.
		 * @type {string[]}
		 */
		this.specMethodNames = []
		for (const testMethodName in spec) {
			this[testMethodName] = spec[testMethodName]
			this.specMethodNames.push(testMethodName)
		}
		/**
		 * A flag which is used to determine whether the class instance is running in test (mock) mode. Set based on mockMode === true, where mockMode comes from the constructor args.
		 * @type {boolean}
		 */
		this.runningInMockMode = mockMode === true
	}

	/**
	 * Compiles a .pug email template file into .html, inserting local variables, and sends an email to the designated receivers.
	 * @param {string} templateName The name of the .pug template file to be used. Must exist in the config.emails.templatesPath folder.
	 * @param {string|string[]} to An email address string or an array of email address strings, which the email will be sent to.
	 * @param {string} subject The subject of the email.
	 * @param {object} options An object containing further details for the emails sending process, most notably the local variables (fields key).
	 * @param {string[]} options.bcc (optional) An array containing emails for bcc. Adds them to config.emails.bcc, rather than overwriting it.
	 * @param {string} options.cssFilePath (optional) An absolute path to the css file to be injected in the email's html head style tag. Overwrites config.emails.cssFilePath.
	 * @param {object} options.fields (optional) The object containing the local variables.
	 * @returns {Promise<object>} A promise which wraps a generator function. When resolved, returns the result from the email send request (or {success: true} in mockMode).
	 * @memberof Emails
	 */
	sendEmail(templateName, to, subject, options) {
		const instance = this,
			{emailsConfig, runningInMockMode, sender} = this
		return co(function*(){
			if ((typeof templateName !== 'string') || !templateName.length) {
				throw {customMessage: 'Invalid templateName string provided.'}
			}
			if ((typeof to !== 'string') || !to.length) {
				throw {customMessage: 'Invalid "to" email string provided.'}
			}
			if ((typeof subject !== 'string') || !subject.length) {
				throw {customMessage: 'Invalid subject string provided.'}
			}
			const actualOptions = options || {},
				{bcc, cssFilePath, fields} = actualOptions
			let actualFields = fields ? Object.assign({}, fields) : {},
				actualCssFilePath = cssFilePath || emailsConfig.cssFilePath
			actualFields._head_style = actualCssFilePath ? (yield fs.readFile(actualCssFilePath)).toString() : ''
			let template = (pug.compileFile(path.join(emailsConfig.templatesPath, `${templateName}.pug`), {}))(actualFields),
				receivers = [],
				bccs = []

			if (to instanceof Array) {
				to.forEach((el, i) => {
					receivers.push(el)
				})
			} else {
				receivers.push(to)
			}

			let bccMails = emailsConfig.bcc
			if (bccMails instanceof Array) {
				bccMails.forEach((el, i) => {
					bccs.push(el)
				})
			} else if (typeof bccMails === 'string'){
				bccs.push(bccMails)
			}
			if (bcc instanceof Array) {
				bcc.forEach((email, index) => {
					if (bccs.indexOf(email) === -1) {
						bccs.push(email)
					}
				})
			}

			let rq = {
				to: receivers,
				from: sender,
				subject,
				html: template
			}
			if (bccs.length > 0) {
				rq.bcc = bccs
			}

			if (runningInMockMode) {
				return {success: true}
			}
			return yield instance.sendgrid.send(rq)
		})
	}
}
module.exports = Emails

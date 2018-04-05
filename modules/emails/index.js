'use strict'

const
	co = require('co'),
	pug = require('pug'),
	path = require('path'),
	sendgrid = require('@sendgrid/mail'),
	spec = require('./index.spec')

class Emails {
	constructor(config, mockMode) {
		for (const testName in spec) {
			this[testName] = spec[testName]
		}
		this.config = config
		this.emailsConfig = config.emails
		this.sendgrid = sendgrid
		this.sendgrid.setApiKey(config.emails.sendgridApiKey)
		this.sender = config.emails.emailSender
		this.runningInMockMode = mockMode === true
	}

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
				{fields, bcc} = actualOptions
			let template = (pug.compileFile(path.join(emailsConfig.templatesPath, `${templateName}.pug`), {}))(fields || {}),
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
				from: instance.sender,
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

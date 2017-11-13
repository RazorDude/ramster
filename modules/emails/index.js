'use strict'

const
	co = require('co'),
	pug = require('pug'),
	path = require('path'),
	sendgrid = require('@sendgrid/mail')

class Emails {
	constructor(cfg) {
		this.cfg = cfg
		this.sendgrid = sendgrid
		this.sendgrid.setApiKey(this.cfg.emails.sendgridApiKey)
		this.sender = this.cfg.emails.emailSender
	}

	sendEmail({to, subject, templateName, fields}) {
		let instance = this
		return co(function*(){
			let template = (pug.compileFile(path.join(instance.cfg.emails.templatesPath, `${templateName}.pug`), {}))(fields || {}),
				receivers = [],
				bccs = []

			if (to instanceof Array) {
				to.forEach((el, i) => {
					receivers.push(el)
				})
			} else {
				receivers.push(to)
			}

			let bccMails = instance.cfg.emails.bcc
			if (bccMails instanceof Array) {
				bccMails.forEach((el, i) => {
					bccs.push(el)
				})
			} else if (typeof bccMails === 'string'){
				bccs.push(bccMails)
			}

			let options = {
				to: receivers,
				from: instance.sender,
				subject,
				html: template
			}
			if (bccs.length > 0) {
				options.bcc = bccs
			}

			return yield instance.sendgrid.send(options)
		})
	}
}
module.exports = Emails

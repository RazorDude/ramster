'use strict'

let sendgrid = require('sendgrid'),
    pug = require('pug'),
    path = require('path')

let emails = class Emails {
    constructor(cfg) {
		this.cfg = cfg
        this.sendgrid = sendgrid(this.cfg.emails.sendgridApiKey)
        this.sender = this.cfg.emails.emailSender
    }

    sendEmail({to, subject, templateName, fields}) {
        let template = (pug.compileFile(path.join(this.cfg.emails.templatesPath, `${templateName}.pug`), {}))(fields || {})
        return this.sendgrid.API(this.sendgrid.emptyRequest({
			method: 'POST',
		  	path: '/v3/mail/send',
			body: {
				personalizations: [
					{
						to: [
							{
								email: to,
							},
						],
						bcc: this.cfg.emails.bcc,
						subject: subject
					}
				],
				from: {
					email: this.sender,
				},
				content: [
					{
					    type: 'text/html',
					    value: template,
					}
				]
			}
		}))
    }
}
module.exports = emails

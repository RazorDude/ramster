'use strict'

let sendgrid = require('sendgrid'),
    pug = require('pug'),
    path = require('path')

let emails = class Emails {
    constructor(cfg) {
        this.sendgrid = sendgrid(cfg.emails.sendgridApiKey)
        this.sender = cfg.emails.emailSender
    }

    sendEmail({to, sender, subject, templateName, fields}) {
        return new Promise((res, rej) => {
            let template = (pug.compileFile(path.join(__dirname, `./templates/${data.templateName}.pug`), {}))(data.fields || {})
            this.sendgrid.send({
                to: data.to,
                from: this.sender,
                bcc: this.cfg.emails.bcc,
                subject: data.subject,
                html: template
            }, (err, json) => {
                if (err) {
                    rej(err)
                }
                res(json)
            })
        })
    }
}
module.exports = emails

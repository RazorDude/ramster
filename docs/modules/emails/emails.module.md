<a name="module_emailsModule"></a>

## emailsModule
The emails module. Contains the Emails class.


* [emailsModule](#module_emailsModule)
    * [~Emails](#module_emailsModule..Emails)
        * [new Emails()](#new_module_emailsModule..Emails_new)
        * [.config](#module_emailsModule..Emails+config) : <code>object</code>
        * [.emailsConfig](#module_emailsModule..Emails+emailsConfig) : <code>object</code>
        * [.sendgrid](#module_emailsModule..Emails+sendgrid) : <code>sendgrid</code>
        * [.sender](#module_emailsModule..Emails+sender) : <code>string</code>
        * [.runningInMockMode](#module_emailsModule..Emails+runningInMockMode) : <code>boolean</code>

<a name="module_emailsModule..Emails"></a>

### emailsModule~Emails
**Kind**: inner class of [<code>emailsModule</code>](#module_emailsModule)  

* [~Emails](#module_emailsModule..Emails)
    * [new Emails()](#new_module_emailsModule..Emails_new)
    * [.config](#module_emailsModule..Emails+config) : <code>object</code>
    * [.emailsConfig](#module_emailsModule..Emails+emailsConfig) : <code>object</code>
    * [.sendgrid](#module_emailsModule..Emails+sendgrid) : <code>sendgrid</code>
    * [.sender](#module_emailsModule..Emails+sender) : <code>string</code>
    * [.runningInMockMode](#module_emailsModule..Emails+runningInMockMode) : <code>boolean</code>

<a name="new_module_emailsModule..Emails_new"></a>

#### new Emails()
The Emails class. This class takes care of compiling email template files from .pug into .html and inserting local varibles, and sending emails afterwards.

<a name="module_emailsModule..Emails+config"></a>

#### emails.config : <code>object</code>
The project config object.

**Kind**: instance property of [<code>Emails</code>](#module_emailsModule..Emails)  
<a name="module_emailsModule..Emails+emailsConfig"></a>

#### emails.emailsConfig : <code>object</code>
The project config object's emails property.

**Kind**: instance property of [<code>Emails</code>](#module_emailsModule..Emails)  
<a name="module_emailsModule..Emails+sendgrid"></a>

#### emails.sendgrid : <code>sendgrid</code>
The sendgrid client instance.

**Kind**: instance property of [<code>Emails</code>](#module_emailsModule..Emails)  
<a name="module_emailsModule..Emails+sender"></a>

#### emails.sender : <code>string</code>
The email sender's email address. Set in config.emails.emailSender

**Kind**: instance property of [<code>Emails</code>](#module_emailsModule..Emails)  
<a name="module_emailsModule..Emails+runningInMockMode"></a>

#### emails.runningInMockMode : <code>boolean</code>
A flag which is used to determine whether the class instance is running in test (mock) mode. Set based on mockMode === true, where mockMode comes from the constructor args.

**Kind**: instance property of [<code>Emails</code>](#module_emailsModule..Emails)  

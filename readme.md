![npm](https://img.shields.io/npm/v/ramster.svg)
![node](https://img.shields.io/node/v/ramster.svg)
[![dependencies Status](https://david-dm.org/razordude/ramster/status.svg)](https://david-dm.org/razordude/ramster)
[![Build Status](https://travis-ci.org/RazorDude/ramster.svg?branch=master)](https://travis-ci.org/RazorDude/ramster)
<br/>
![npm](https://img.shields.io/npm/dt/ramster.svg)
![npm](https://img.shields.io/npm/dm/ramster.svg)
<br/>
ramster
==
Ramster is an all-around standalone NodeJS MVC boilerplate, based on <a href="https://github.com/expressjs/express">expressjs</a>, <a href="https://github.com/tj/co">co</a> and <a href='https://github.com/sequelize/sequelize'>sequelize</a>.<br/> It always supports the latest NodeJS LTS version.<br/>
The goal of this module is to speed up development as much as possible, by providing a fast, reliable, customizable and secure standalone boilerplate, that can cover a lot of use cases with the proper configuration. By using ramster, you get to focus on developing your business logic and the actual specifics of your project, instead of worrying about the wireframe and the architecture.<br/>
Be sure to checkout out the <a href="https://github.com/RazorDude/ramster-cli">ramster-cli</a> package as well.
<br/>



Key Features
==
* Extensive - covers a wide variety of use cases
* Easy to use - download the module, read the docs, and you're good to go
* Powerful - built on top of the best and cutting edge dependencies; used in live projects, which guarantees it's stability and up-to-date status
* Completely open source - don't like something? Fork it and do it the way you want to
* Documentation full of bullet lists...
<br/><br/>



Overview
==
The package is comprised of several components that aim to cover as much common cases as possible. They're used to help build up the core architecture and maximize code reusability. Ramster is intended for single page apps, but you can use it any way - and to any extent, based on your preferences.
* The core modules - the db, the clients and the APIs. The DBModule's components house your database models and business logic. The client and api modules' components house your HTTP endpoints and any additional case-specific logic.
* The extra modules - ramster utilizes a variety of custom-built modules, such as the sendgrid emailer, the token manager, the DB migrations module, the code generator and the toolbelt, which contain useful functionality that you'd need anyway, and are ready to use out of the box.
* Webserver support - serving static files is an important, but often overlooked thing, especially in development or by beginners. Ramster gives you two options - use node's express, or use an external webserver (the RAM munching hamster's personal recommendation). For the second option, ramster also generates os-independent NGINX server configuration at a specified path for each client module.
<br/><br/>



Architecture
==
Ramster uses its core modules to build the following architecture:
* The DB module - the components that inherit the BaseDBComponent contain the database models and the business logic. They are grouped together by the DB module, which the client and API modules have access to internally. A single instance of the DB module is initialized at runtime, the reference to which is added to each client/api module.
* The client modules - the components that inherit the BaseClientComponent contain the endpoints intended for websites. They are grouped at your discretion; each group forms a client module.<br/>
&nbsp;&nbsp;&nbsp;&nbsp;The client module requests are meant to be secured using passport authentication strategies.<br/>
&nbsp;&nbsp;&nbsp;&nbsp;Example: let's say you have a website platform for your customers and a CMS for your support staff. Although those two share the DB module, each of them has a client module of its own. They're in separate folders, each folder containing a number of components that inherit the BaseClientComponent. Effectively, each client module is the API for a specific front-end client.<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<i>Tip: for single page apps, define a "layout" component for each client component, and use ramster's built-in functionality to build and serve your layout.html file, which is the entry point for your front-end code. More on that later.</i>
* The API modules - the components that inherit the BaseAPIComponent contain the endpoints intended for pure REST APIs (mobile apps and external integrations, for example). Just like the client modules, they are grouped by you in separate folders.<br/>
&nbsp;&nbsp;&nbsp;&nbsp;API module requests are intended to be secured using JWTs. The tokenManager module was built specifically to serve that purpose, as you'll se later in the docs.<br/><br/>
Here's a visual representation of the architecture proposed above: <br/>
<img src='https://github.com/RazorDude/ramster/blob/master/docs/exampleArchitecture.svg' width='576' height='432' alt='Example Architecture' />
<br/><br/>




Core modules
==

The DB
--
The DB module, as mentioned briefly above, is the very heart of your project. Its components contain the models for your database tables and the business logic related to them. Because ramster adopts a code-first database architecture, it relies heavily on <a href='https://github.com/sequelize/sequelize'>sequelize</a> to generate the tables, associations, primary keys, constraints and so on, as well as to build all queries to the database.<br/>Currently, only postgreSQL is supported, but support for MySQL may be added in future versions.<br/><br/>
The full reference for the DBModule class can be found <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/db/db.module.md'>here</a>.<br/>
The full reference for the BaseDBComponent class can be found <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/db/base-db.componnt.md'>here</a>.<br/><br/>
All DB components must be placed in a single folder, the path to which must be specified in config.db.modulePath. Each DB component must be in its own folder and is recommended that it extends the BaseDBComponent provided by ramster. If a .spec.js file is provided, ramster will automatically load it and attach the methods written in it to the respsective dbComponent.<br/>
Here's an example directory structure:<br/>
<img src='https://github.com/RazorDude/ramster/blob/master/docs/exampleDirStructureDB.png' width='326' height='422' alt='Example Directory Structure (DB module and components)' />
<br/>
For a practical example of how to create a ramster dbComponent, click <a href='https://github.com/RazorDude/ramster/blob/master/docs/db.md'>here</a>.
<br/>

The Clients
--
Client modules are used to create <a href="https://github.com/expressjs/express">ExpressJS</a> REST APIs for use with web clients and are secured with <a href='https://github.com/jaredhanson/passport'>PassportJS</a>. Just like the db module, client modules are made out of components grouped together in separate folders. For each client component in a client module, if a dbComponent of the same name exists in the db module, a class property "dbComponent" will be set as a direct reference to that dbComponent.<br/><br/>
The full reference for the ClientModule class can be found <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/clients/clients.module.md'>here</a> and for its parent, the BaseServerModule - <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/shared/base-server.module.md'>here</a>.<br/>
The full reference for the BaseClientComponent class can be found <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/clients/base-client.componnt.md'>here</a>.<br/><br/>
All client modules must be placed in a single folder, the path to which must be specified in config.clientModulesPath. Each api module must be in its own folder, which contains all components for it. Each component must also be in its own folder and is recommended that it extends the BaseClientComponent provided by ramster. If a .spec.js file is provided, ramster will automatically load it and attach the methods written in it to the respsective clientComponent.<br/>
Additionally, each client module can have its front-end source code in a subfolder of the client public sources folder (defined in config.clientModulesPublicSourcesPath) and its front-end build folder in the project's public folder (defined in config.clientModulesPublicPath).</br>
Here's an example directory structure:<br/>
<img src='https://github.com/RazorDude/ramster/blob/master/docs/exampleDirStructureClients.png' width='326' height='422' alt='Example Directory Structure (one client module, its components public sources and public build folder)' />
<br/>
For a practical example of how to create a ramster client component, click <a href='https://github.com/RazorDude/ramster/blob/master/docs/clients.md'>here</a>.
<br/>

The APIs
--
API modules are used to create <a href="https://github.com/expressjs/express">ExpressJS</a> REST APIs for use in external integrations and are secured using JWTs by ramster's custom-built <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/tokenManager/tokenManager.module.md'>tokenManager</a> module. Just like the client modules, API modules are made out of components grouped together in separate folders. For each api component in a api module, if a dbComponent of the same name exists in the db module, a class property "dbComponent" will be set as a direct reference to that dbComponent.<br/><br/>
The full reference for the APIModule class can be found <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/api/api.module.md'>here</a> and for its parent, the BaseServerModule - <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/shared/base-server.module.md'>here</a>.<br/>
The full reference for the BaseAPIComponent class can be found <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/api/base-api.componnt.md'>here</a>.<br/><br/>
All api modules must be placed in a single folder, the path to which must be specified in config.apiModulesPath. Each api module must be in its own folder, which contains all components for it. Each component must also be in its own folder and is recommended that it extends the BaseAPIComponent provided by ramster. If a .spec.js file is provided, ramster will automatically load it and attach the methods written in it to the respsective apiComponent.<br/>
Here's an example directory structure:<br/>
<img src='https://github.com/RazorDude/ramster/blob/master/docs/exampleDirStructureApis.png' width='326' height='422' alt='Example Directory Structure (one client module, its components public sources and public build folder)' />
<br/>
For a practical example of how to create a ramster api component, click <a href='https://github.com/RazorDude/ramster/blob/master/docs/apis.md'>here</a>.

<br/><br/>


The utility modules
==
In addition to the core modules, ramster has a number of utility modules that it uses internally and are also available for use in your code.
- <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/codeGenerator/codeGenerator.module.md'>The codeGenerator</a> - contains various methods for building and generating a wide variety of code files for a new or an existing project.
- <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/csvPromise/csvPromise.module.md'>The csvPromise module</a> - a promise wrapper around the "csv" npm package's parse and stringify methods.
- <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/emails/emails.module.md'>The emails module</a> - This class takes care of compiling email template files from .pug into .html, inserting local varibles and sending emails afterwards.
- <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/errorLogger/errorLogger.module.md'>The errorLogger</a> - displays errors in the console and writes them in a file.
- <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/generalStore/generalStore.module.md'>The generalStore</a> - creates a redis client and wraps with promises the redis module's hget, hset and hdel methods.
- <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/migrations/migrations.module.md'>The migrations module</a> - takes care of synchronizing the actual database tables with the current state of the code models, generating backups and inserting various sets of data. It also starts an api server, if configured, which can be used as an interface for running sync, generateSeed, generateBackup, seed and insertStaticData.
- <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/tokenManager/tokenManager.module.md'>The tokenManager</a> - used to create, validate and delete JWTs.
- <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/toolbelt/toolbelt.module.md'>The toolbelt module</a> - contains a variety of smaller utility functions.



Roadmap
==
A lot of things were added in v1.0, including (but by far not limited to):
- Extensive tests of all modules and components that can cover as much cases as possible.
- The ability to execute tests for each db, client and api module's components, based on a .spec file inside the component folder. This will greatly aid the user with continuous integration.
- The ability to generate certain files, like the bootstrapping index.js file of the whole project, webpack build tools and configs.
- Webpack build tools; base and default configurations for React and Angular.
- The ability to generate project templates, such as blank and basic (users and permissions system).
- Complete removal of all not-so-good practices that exist at the moment for the sake of backwards compatibility with v0.4.x and v0.5.x (at the time of writing this they have several thousand downloads each).
- In the migrations module, the DB state is auto-restore for failed data inserts.
- Created a buildAssociation method for the db models, that automates the old associate method.
- Added a built-in permissions system for client and api servers.
- Created a separate cli package (ramster-cli) that can be used to run commands from the console - migrations, config and file generation, testing, etc.
- Added a lot of good an informative badges on top of this readme, all of which must shine in bright green :)
- Added valid JSDoc comments everywhere.
- Added a lot of docs & examples.
<br/>

For further details, see the <a href='https://github.com/RazorDude/ramster/blob/master/changelog.md'>changelog</a> for v1.0. <br/> <br/>


I've got things in mind for post-v1 releases as well:
- Add more project templates: blog, cms.
- The ability to generate Swagger documentation out of db models, as well as endpoints based on their route params and possibly what they return. Ramster should be able to validate the request object and the response data.
- Consider adding MySQL support.
<br/><br/>



Security issues
==
Please report any security issues privately at mmetalonlyy@gmail.com.

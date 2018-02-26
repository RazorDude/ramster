ramster [![npm version](https://badge.fury.io/js/ramster.svg)](https://badge.fury.io/js/ramster)
[![dependencies Status](https://david-dm.org/razordude/ramster/status.svg)](https://david-dm.org/razordude/ramster)
[![Known Vulnerabilities](https://snyk.io/test/github/razordude/ramster/badge.svg)](https://snyk.io/test/github/razordude/ramster)
==
Ramster is a standalone NodeJS MVC boilerplate, based on the <a href="https://github.com/expressjs/express">express</a> framework and <a href="https://github.com/tj/co">co</a>.<br/> It runs on node 6+.<br/>
The goal of this module is to speed up development as much as possible, by providing a fast, reliable, customizable and secure standalone boilerplate, that can cover a lot of use cases with the proper configuration. By using ramster, you get to focus on developing your business logic and the actual specifics of your project, instead of worrying about the wireframe and the architecture.<br>
With the new v1.0 out, it is of utmost importance that proper docs are created, which I will do in the very near future and make it a v1.1 release.<br><br>


___
Key Features
==
* Extensive - covers a wide variety of use cases
* Easy to use - download the module, read the docs, and you're good to go
* Powerful - built on top of the best and cutting edge dependencies; used in live projects, which guarantees it's stability and up-to-date status
* Completely open source - don't like something? Fork it and do it the way you want to
* Documentation full of bullet lists...<br><br>


___
Overview
==
The boilerplate is comprised of several components that aim to cover as much common cases as possible. They're used to help build up the core architecture and maximize code reusability. Ramster is intended for single page apps, but you can use it any way - and to any extent, based on your preferences.
* The core modules - the db, the clients and the APIs. The dbClass houses your database models and business logic. The client and api classes house your HTTP endpoints and any additional case-specific logic.
* The extra modules - ramster utilizes a variety of custom-built modules, such as the sendgrid emailer, the token manager and the DB migrations module, which contain useful functionality that you'd need anyway, and are ready to use out of the box.
* Webserver support - serving static files is an important, but often overlooked thing, especially in development or by beginners. Ramster gives you two options - use node's express, or use an external webserver (the RAM munching hamster's personal recommendation). For the second option, ramster also generates os-independent NGINX server configuration at a specified path for each client module.<br><br>


___
Architecture
==
Ramster uses its core classes to comprise the following architecture:
* The DB module - the components that inherit the baseDBComponent contain the database models and the business logic. Grouped together, the comprise the DB module, which the client and API modules have access to internally. A single instance of the DB module is initialized at runtime, the reference to which is pointed to each client/api module request's locals.
* The client modules - the components that inherit the baseClientComponent contain the endpoints intended for websites. They are grouped at your discretion; each group forms a client module.<br/>
&nbsp;&nbsp;&nbsp;&nbsp;The client module requests are meant to be secured using passport authentication strategies.<br/>
&nbsp;&nbsp;&nbsp;&nbsp;Example: let's say you have a website platform for your customers and a CMS for your support staff. Although those two share the DB module, each of them has a client module of its own. They're in separate folders, each folder containing a number of components that inherit the baseClientComponent. Effectively, each client module is the API for a specific front-end client.<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<i>Tip: for single page apps, define a "layout" component for each client component, and use ramster's built-in functionality to build and serve your layout.html file, which is the entry point for your front-end code. More on that later.</i>
* The API modules - the components that inherit the baseAPIComponent contain the endpoints intended for APIs (mobile apps and external integrations, for example). Just like the client modules, they are grouped by you in separate folders.<br/>
&nbsp;&nbsp;&nbsp;&nbsp;API module requests are intended to be secured using JWTs. The tokenManager module was built specifically to server that purpose, as you'll se later in the docs.<br><br>


___
Core modules
==

The DB
--
The DB module, as mentioned briefly above, is the very heart of your project. Its components contain the models for your database tables and the business logic related to them. Currently, only postgreSQL is supported, but support for MySQL may be added in future versions.<br><br>


___
Roadmap
==
A lot of things were added in v1.0, including:
- Extensive tests of all modules and components that can cover as much cases as possible.
- The ability to execute tests for each db, client and api module's components, based on a .spec file inside the component folder. This will greatly aid the user with continuous integration.
- The ability to generate certain files, like the bootstrapping index.js file of the whole project, webpack build tools and configs.
- Webpack build tools; base and default configurations for React and Angular.
- The ability to generate project templates, such as blank and basic (users and permissions system).
- Complete removal of all not-so-good practices that exist at the moment for the sake of backwards compatibility with v0.4.x and v0.5.x (at the time of writing this they have several thousand downloads each).
- In the migrations module, the DB state is auto-restore for failed data inserts.
- Created a buildAssociation method for the db models, that automates the old associate method.
- Added a built-in permissions system for client and api servers.
- Added a cli that will be used to run commands from the console - migrations, config and file generation, testing, etc.
- Added a lot of good an informative badges on top of this readme, all of which must shine in bright green :)

<br/>

For further details, see the changelog for v1.0. <br/>
I've got things in mind for post-v1 releases as well:
- Add more project templates: blog, cms.
- The ability to generate Swagger documentation out of db models, as well as endpoints based on their route params and possibly what they return. Ramster should be able to validate the request object and the response data.
- Loads and loads of docs and a website that hosts them, not just .md files in the repo.
- Consider adding MySQL support.


___
Security issues
==
Please report any security issues privately at mmetalonlyy@gmail.com.

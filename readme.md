ramster
==
Ramster is a standalone NodeJS MVC boilerplate, based on the <a href="https://github.com/expressjs/express">express</a> framework and <a href="https://github.com/tj/co">co</a>.<br/> It runs on node 6+.<br/>
The goal of this module is to speed up development as much as possible, by providing a fast, reliable, customizable and secure standalone boilerplate, that can cover a lot of use cases with the proper configuration. By using ramster, you get to focus on developing your business logic and the actual specifics of your project, instead of worrying about the wireframe and architecture.

Key features
--
* Extensive - covers a wide variety of use cases
* Easy to use - download the module, read the docs, and you're good to go
* Powerful - built on top of the best and cutting edge dependencies; used in live projects, which guarantees it's stability and up-to-date status
* Completely open source - don't like something? Fork it and do it the way you want to
* Documentation full of bullet lists...

___
Overview
==
The boilerplate is comprised of several components that aim to cover as much common cases as possible. They're used to help build up the core architecture and maximize code reusability. Ramster is intended for SPAs, but you can use it any way - and to any extent, based on your preferences.
* The core classes - the dbClass, the clientClass and the apiClass. The dbClass houses your database models and business logic. The client and api classes house your HTTP endpoints and any additional case-specific logic.
* The modules - ramster utilizes a variety of custom-built modules, such as the sendgrid emailer, the token manager and the DB migrations module, which contain additional boilerplate code, ready to use out of the box.
* Webserver support - serving static files is an important, but overlooked thing. Ramster gives you two options - use node's express, or use an external webserver (the RAM munching hamster's personal recommendation). For the second option, ramster also generates os-independent NGINX server configuration at a specified path for each client module.


___
Architecture
==
Ramster uses its core classes to comprise the following architecture:
* The DB module - the classes that inherit the dbClass contain the database models and the business logic. Grouped together, the comprise the DB module, which the client and API modules communicate with internally. A single instance of the DB module is initialized at runtime, the reference to which is pointed to each client/api module request's locals.
* The client modules - the classes that inherit the clientClass contain the endpoints intended for websites. They are grouped at your discretion; each group forms a client module.<br/>
&nbsp;&nbsp;&nbsp;&nbsp;Client module requests (and access, in general) are secured with passport authentication strategies.<br/>
&nbsp;&nbsp;&nbsp;&nbsp;Example: let's say you have a website platform for your customers and a CMS for your support staff. Although those two share the DB module, each of them has a client module of its own. They're in separate folders, each folder containing a number of classes that inherit the clientClass. Effectively, each client module is the API for a specific front-end client.<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<i>Tip: for SPAs, define a "layout" client module for each front-end client, and use ramster's built-in functionality to build and serve your layout.html file, which is the entry point for your front-end code. More on that later.</i>
* The API modules - the classes that inherit the apiClass contain the endpoints intended for APIs (mobile apps and external integrations, for example). Just like the client modules, they are grouped by you in separate folders.<br/>
&nbsp;&nbsp;&nbsp;&nbsp;API module requests using JWTs.

___
Core modules
==

The DB
--

API Module & Component example
==

Let's take a deeper look into the api module and components by building the users apiComponent in the site api module.

Creating a component
--

Here's a quick reminder of the folder structure:<br/>
<img src='https://github.com/RazorDude/ramster/blob/master/docs/exampleDirStructureApis.png' width='326' height='422' alt='Example Directory Structure (one api module and its components)' /><br/>

First, we need to import ramster's BaseAPIComponent:<br/>

```javascript
/**
 * The usersMobileAppAPIComponentModule. Contains the UsersMobileAppAPIComponent class.
 * @module usersMobileAppAPIComponentModule
 */

const
  {BaseAPIComponent} = require('ramster')
```


Then, we create the class and the constructor:

```javascript
/**
 * The UsersMobileAppAPIComponent class. Contains routes and logic for rendering the layout.html file.
 * @class UsersMobileAppAPIComponent
 */
class UsersMobileAppAPIComponent extends BaseAPIComponent {
  /**
   * Creates and instance of UsersMobileAppAPIComponent.
   * @param {string} componentName Automatically set by ramster when loading the module & component.
   * @memberof UsersMobileAppAPIComponent
   */
  constructor(componentName) {
    super({
      addDefaultRoutes: ['readList', 'update']
      appendComponentNameToRoutes: true,
      componentName,
      routes: [
        {method: 'post', path: ``, func: 'create'},
        {method: 'get', path: `/item`, func: 'read'},
      ]
    })
  }
}

module.exports = UsersMobileAppAPIComponent
```

<br/>
The api module for this component, which is automatically generated and initialized by Ramster, will pass the componentName argument to the construcor, which we'll then pass down to the parent with the rest of the config. The component name correcponds to the name of the folder that the component is in.<br/>
The 'addDefaultRoutes' array tells the BaseServerComponent (the parent of the BaseAPIComponent) which of ramster's default REST API routes to add to the component. For more info, see the BaseServerComponent docs linked below.<br/>
The 'appendComponentNameToRoutes' option will transform all route paths provided in the 'routes' array into `${componentName}${routePath}`. I.e. '/item' will become '/users/item'.<br/>
The 'routes' array tells the BaseServerComponent (the parent of the BaseAPIComponent) what HTTP endpoints will be mounted and which methods will handle them. For more info, see the BaseServerComponent docs linked below.<br/>
For more info on the BaseAPIComponent's constructor click <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/apis/base-api.component.md'>here</a> and for its parent, the BaseServerComponent - <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/shared/base-server.component.md'>here</a>.<br/><br/>


Adding endpoints (routes) and handler functions
--
We've instructed ramster to add the 'create' and 'readList' default methods, which have built-in handler functions in the BaseAPI and BaseServer components. If we needed, we could override them. The 'read' and 'update' endpoints and their handler functions are also default and present in the base classes, but we'll add them manually now for the sake of the example:

```javascript
/**
 * The usersMobileAppAPIComponentModule. Contains the UsersMobileAppAPIComponent class.
 * @module usersMobileAppAPIComponentModule
 */

const
  {BaseAPIComponent} = require('ramster')

/**
 * The UsersMobileAppAPIComponent class. Contains routes and logic for rendering the layout.html file.
 * @class UsersMobileAppAPIComponent
 */
class UsersMobileAppAPIComponent extends BaseAPIComponent {
  /**
   * Creates and instance of UsersMobileAppAPIComponent.
   * @param {string} componentName Automatically set by ramster when loading the module & component.
   * @memberof UsersMobileAppAPIComponent
   */
  constructor(componentName) {
    super({
      addDefaultRoutes: ['create', 'readList']
      appendComponentNameToRoutes: true,
      componentName,
      routes: [
        {method: 'get', path: `/item`, func: 'read'},
        {method: 'patch', path: `/item/:id`, func: 'update'}
      ]
    })
  }

  /**
   * Fetch a single database entry of the server component's related dbComponent model.
   * @see BaseAPIComponent.read for the query params.
   * @returns {IterableIterator} An express-js style generator function to be mounted using co-express.
   * @memberof BaseServerComponent
   */
  read() {
    const instance = this,
      {dbComponent} = this
    return function* (req, res, next) {
      try {
        res.json({result: yield dbComponent.read(instance.decodeQueryValues(req.query))})
      } catch (e) {
        req.locals.error = e
        next()
      }
    }
  }

  /**
   * Update one or more database entries of the server component's related dbComponent model, matching the id provided in req.params.
   * @returns {IterableIterator} An expressJS style generator function to be mounted using co-express.
   * @memberof BaseServerComponent
   */
  update() {
    const instance = this,
      {dbComponent} = this
    return function* (req, res, next) {
      try {
        res.json(yield dbComponent.update({dbObject: req.body, where: {id: req.params.id}, userId: req.user.id}))
      } catch (e) {
        req.locals.error = e
        next()
      }
    }
  }
}

module.exports = UsersMobileAppAPIComponent
```

As you can see, the handler functions return expressJs-style functions, with the only difference from the usual expressJs methods is that they're generator-functions. When mounting the routes, ramster will wrap them using <a href='https://www.npmjs.com/package/co-express'>co-express</a>.<br/>
In this example, "this.dbComponent" is a reference to "this.db.components.users", because we have a dbComponent matching the name of the api component.<br/><br/>

Testing wtih mochajs
--
Ramster supports running (unit) tests with <a href='https://github.com/mochajs/mocha'>mocha</a>. Simply place an 'index.spec.js' file with its exports being an object containing all test methods. Upon component initialization, ramster will add them to the component class as class functions. Here's an example:

```javascript
const
	assert = require('assert'),
	co = require('co')

module.exports = {
  testUpdate: function() {
    const instance = this,
      {dbComponent, module} = this,
      {moduleConfig} = module
    let sessionCookie = null,
      userId = null
    describe('apis.site.users.update: PATCH /users/item/:id', function() {
      before(function() {
        return co(function*() {
          let user = yield dbComponent.model.create({
              typeId: 1,
              firstName: 'Test',
              lastName: 'User',
              email: 'test2@ramster.com',
              password: 'testPassword1234',
              status: true
            },
            {returning: true}
          )
          userId = user.id
          let result = yield request({
            method: 'post',
            uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/login`,
            body: {email: 'admin@ramster.com', password: '1234abcd'},
            json: true,
            resolveWithFullResponse: true
          })
          sessionCookie = result.headers['set-cookie']
          return true
        })
      })
      it('should end with status 401 if the user is not logged in', function() {
        return co(function*() {
          let didThrowAnError = false
          try {
            yield request({
              method: 'patch',
              uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/item/${userId}`,
              body: {},
              json: true
            })
          } catch(e) {
            if (e && e.response && (e.response.statusCode === 401)) {
              didThrowAnError = true
            } else {
              throw e
            }
          }
          assert.strictEqual(didThrowAnError, true, 'no error thrown')
          return true
        })
      })
      it('should execute successfully and update the provided fields if all parameters are correct', function() {
        return co(function*() {
          let user = yield request({
              method: 'patch',
              headers: {cookie: sessionCookie},
              uri: `http://127.0.0.1:${moduleConfig.serverPort}/users/item/${userId}`,
              body: {firstName: 'Updated', lastName: 'Test'},
              json: true
            }),
            userShouldBe = {id: userId, firstName: 'Updated', lastName: 'Test', status: true}
          for (const i in userShouldBe) {
            const shouldBeField = userShouldBe[i],
              isField = user[i]
            assert.strictEqual(isField, shouldBeField, `Bad value '${isField}' for field "${i}", expected '${shouldBeField}'.`)
          }
          return true
        })
      })
    })
  }
}
```

<br/><br/>
That concludes the api module & apiComponent example.
<!-- If you'd like to play around and test stuff, here's a <a href=''>fiddle</a>. -->

DB Component example
==

Let's take a deeper look into the db module and components by building the users dbComponent.

Creating a component
--

Here's a quick reminder of the folder structure:<br/>
<img src='https://github.com/RazorDude/ramster/blob/master/docs/exampleDirStructureDB.png' width='326' height='422' alt='Example Directory Structure (DB module and components)' /><br/>

First, we need to import ramster's BaseDBComponent; we'll also need bcryptjs to hash the password:<br/>

```javascript
/**
 * The usersDBComponentModule. Contains the UsersDBComponent class.
 * @module usersDBComponentModule
 */

const
  {BaseDBComponent} = require('ramster'),
  bcryptjs = require('bcryptjs')
```


Then, we create the class and the constructor:

```javascript
/**
 * The UsersDBComponent class. Contains the sequelize db model and the business logic for the users. User items are central to the whole platform.
 * @class UsersDBComponent
 */
class UsersDBComponent extends BaseDBComponent {
  /**
   * Creates an instance of UsersDBComponent.
   * @param {object} sequelize An instance of Sequelize.
   * @param {object} Sequelize A Sequelize static object.
   * @memberof UsersDBComponent
   */
  constructor(sequelize, Sequelize) {
    super()
  }
}

module.exports = UsersDBComponent
```

<br/>
Ramster's DB module will pass the sequelize and Sequelize args to each component's constructor, which we'll then use to define our PostgreSQL table model. For more info on model definitions, check the <a href='http://docs.sequelizejs.com/manual/tutorial/models-definition.html'>sequelize docs</a> on the matter.

```javascript
/**
 * The UsersDBComponent class. Contains the sequelize db model and the business logic for the users. User items are central to the whole platform.
 * @class UsersDBComponent
 */
class UsersDBComponent extends BaseDBComponent {
  /**
   * Creates an instance of UsersDBComponent.
   * @param {object} sequelize An instance of Sequelize.
   * @param {object} Sequelize A Sequelize static object.
   * @memberof UsersDBComponent
   */
  constructor(sequelize, Sequelize) {
    super()

    this.model = sequelize.define('user', {
        userTypeId: {type: Sequelize.INTEGER, allowNull: false, validate: {min: 1}},
        firstName: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
        lastName: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
        email: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
        unconfirmedEmail: {type: Sequelize.STRING, allowNull: true, validate: {notEmpty: true}},
        phone: {type: Sequelize.STRING, allowNull: true, validate: {notEmpty: true}},
        password: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
        gender: {type: Sequelize.ENUM('male', 'female', 'other'), allowNull: true},
        status: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true},
        lastLogin: {type: Sequelize.DATE, allowNull: true, validate: {isDate: true}}
      }
    )
  }
}
```

You'll notice that there's no definition for "id", "createdAt" and "updatedAt" - that's because sequelize creates them by default.<br/>
Now it's time to add some config to the model - a unique index for the "email" column, a setter method that makes sure the "id" field is not changeable, and a setter method that will hash the password every time it's updated. Furthermore, setting "paranoid" to true will instruct sequelize to add a "deletedAt" field and work with it to delete records, instead of deleting rows directly form the table.<br/>
Finally, we'll add two <a href='http://docs.sequelizejs.com/manual/tutorial/scopes.html'>scopes</a> - "default" and "full". We do this because we don't wat to return the user's password (even though it's hashed) anywhere - only in the login method. That's why we'll use the "default" scope .... by default :P And the "full" scope only when checking the user's password on login.

```javascript
/**
 * The UsersDBComponent class. Contains the sequelize db model and the business logic for the users. User items are central to the whole platform.
 * @class UsersDBComponent
 */
class UsersDBComponent extends BaseDBComponent {
  /**
   * Creates an instance of UsersDBComponent.
   * @param {object} sequelize An instance of Sequelize.
   * @param {object} Sequelize A Sequelize static object.
   * @memberof UsersDBComponent
   */
  constructor(sequelize, Sequelize) {
    super()

    this.model = sequelize.define('user', {
        userTypeId: {type: Sequelize.INTEGER, allowNull: false, validate: {min: 1}},
        firstName: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
        lastName: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
        email: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
        unconfirmedEmail: {type: Sequelize.STRING, allowNull: true, validate: {notEmpty: true}},
        phone: {type: Sequelize.STRING, allowNull: true, validate: {notEmpty: true}},
        password: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
        gender: {type: Sequelize.ENUM('male', 'female', 'other'), allowNull: true},
        status: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true},
        lastLogin: {type: Sequelize.DATE, allowNull: true, validate: {isDate: true}}
      }, {
        indexes: [
          {unique: true, fields: ['email'], where: {deletedAt: null}}
        ],
        setterMethods: {
          id: function (value) {
          },
          password: function (value) {
            if (typeof value !== 'undefined') {
              if ((typeof value !== 'string') || (value.length < 4)) {
                throw {customMessage: 'The password must be at least 4 characters long.'}
              }
              this.setDataValue('password', bcryptjs.hashSync(value, 10))
            }
          },
        },
        scopes: {
          default: {
            attributes: ['id', 'userTypeId', 'firstName', 'lastName', 'email', 'unconfirmedEmail', 'phone', 'gender', 'status', 'lastLogin', 'createdAt', 'updatedAt', 'deletedAt']
          },
          full: {
            attributes: ['id', 'userTypeId', 'firstName', 'lastName', 'email', 'unconfirmedEmail', 'phone', 'password', 'gender', 'status', 'lastLogin', 'createdAt', 'updatedAt', 'deletedAt']
          }
        },
        paranoid: true
      }
    )
    this.model = this.model.scope('default')
  }
}
```
<br/>

Adding associations
--
With the correct config provided, ramster will instruct sequelize how to create the relations between tables and their foreign keys. That's achieved by additing two different configration objects as class propeties in the constructor - assoiationsConfig and relationsConfig.<br/><br/>
Lets take a look at the associationsConfig object first:

```javascript
this.associationsConfig = {
  userType: {type: 'belongsTo', componentName: 'userTypes', foreignKey: 'userTypeId'}
}
```

The keys of the associationsConfig object are the names of the associations that sequelize will create. Each config object item has the following list of properties:
<table>
	<thead>
		<tr>
			<th>Property name</th>
			<th>Required</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>type</td>
			<td>yes</td>
			<td>The type of the association - belongsTo, hasOne, hasMany or belongsToMany.</td>
		</tr>
		<tr>
			<td>componentName</td>
			<td>no</td>
			<td>The name of the dbComponent to associate to, in case it doesn't match the association name.</td>
		</tr>
		<tr>
			<td>foreignKey</td>
			<td>yes</td>
			<td>The name of the field that will be used as a foreign key.</td>
		</tr>
		<tr>
			<td>through</td>
			<td>no</td>
			<td>The name of the junction table for belongsToMany associations. Required and only works when type is 'belongsToMany'.</td>
		</tr>
		<tr>
			<td>otherKey</td>
			<td>no</td>
			<td>The name of the field that will be used to represent the key of this component in the association in the junction table. Required and only works when type is 'belongsToMany'.</td>
		</tr>
	</tbody>
</table>
<br/>
So, in the above example, we're creating a belongsTo association (oneToMany) named "userType" between the "users" table and the "userTypes" table, with the foreignKey (set in the users table) being "userTypeId".<br/>
By default, this field will be generated by sequelize so there's no need to explicitly describe it in the model definition. We've added it there only because we want it to be required - the "allowNull": false part.<br/>
Using this object, ramster will create all associations for the dbComponent and add the association names to a class property called "relReadKeys", which is an array of strings. Thе association names from "relReadKeys" can be used in the component's <a href=''>read</a> and <a href=''>readList</a> methods to join associated items to the result rows when querying the database.
<br/><br/>
Now lets dive into the "relationsConfig" object as well. We use it when we want to customize the associated items that will be joined when querying the database. Just like with "associationsConfig", ramster will add the keys of the object to the dbComponent's "relReadKeys" array to make them available when querying.<br/>
To summarize, there are two things we can do with the "relationsConfig":<br/>
1. Customize and extend the existing associations from "associationsConfig".<br/>
2. Add new definitions of items to join when querying on top of existing associations.<br/>
<br/>

We will now look at these cases in greater detail.<br/>
1. Lets say we want the "userType" association from above example to give us only the "id" field, instead of the whole model defined in the userTypes dbComponent. We can add a new "relationsConfig" item for it like this:

```javascript
this.relationsConfig = {
  userType: {attributes: ['id']}
}
```

This will instruct the sequelize query builder to add this object - {id} - under the "userType" key for each returned user item.<br/><br/>
2. Now lets try and define an additional relation based on the userType association with customized properties, make it an inner join and add some nested associations:

```javascript
this.relationsConfig = {
  userType: {attributes: ['id']}
  typeWithAccessData: {
    associationName: 'userType',
    attributes: ['id', 'name'],
    required: true,
    include: [{
      associationName: 'accessPoints', // this refers to the accessPoints association from the "userTypes" dbComponent's "associationsConfig"
      attributes: ['id', 'name', 'description'],
      required: true
    }]
  }
}
```

You'll notice that we have a new property here - "associationName". This is required when the config object key (the relation name) - in our case it's "typeWithAccessData" - doesn't match the association's name from the "associationsConfig" object.<br/>
All other properties are from sequelize and you can find more info about them in the related sequelize docs page <a href=''>here</a>.
<br/><br/>

Configuring filters
--

We've briefly mentioned (and linked the docs for) ramster's BaseDBComponent "read" and "readList" methods. If haven't checked the docs for them, now's a good time to do so.<br/>
After doing that, you'll notice the "filters" object. In order to tell ramster what filters are available to be used for each dbComponent, we can set the "searchFields" array as a class property in the constructor. Here's an example:

```javascript
this.searchFields = [
  {field: 'id'},
  {field: 'userTypeId'},
  {field: 'firstName', like: '-%'},
  {field: 'lastName', like: '-%'},
  {field: 'email', like: '-%'},
  {field: 'unconfirmedEmail', like: '-%'},
  {field: 'phone', like: '-%'},
  {field: 'gender'},
  {field: 'status'},
  {field: 'lastLogin'},
  {field: 'createdAt'},
  {field: 'updatedAt'},
  {field: 'deletedAt'}
]
```

And the full info about what properties these config objects have:
<table>
	<thead>
		<tr>
			<th>Porperty name</th>
			<th>Required</th>
			<th>Type</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>field</td>
			<td>yes</td>
			<td>string</td>
			<td>The name of the field to search by. If searching in nested components, use the following syntax: '$relationName.fieldName$'.</td>
		</tr>
		<tr>
			<td>like</td>
			<td>no</td>
			<td>string</td>
			<td>Instructs sequelize to use '$like' instead of '='. Set to '%-' for "LIKE '%value'", '-%' for "LIKE 'value%'" and '%%' for "LIKE '%value%'".</td>
		</tr>
		<tr>
			<td>fieldNameFrom</td>
			<td>no</td>
			<td>boolean</td>
			<td>Used when you need '$gt' and '$gte'. If set to true, this field will be treated as a range start filter and the "From" suffix will be removed from the field name (if present). It is false by default. Example: we have a 'rating' field, we want to search for ratings above a certain value. To do this, we will add the following object to the searchFields array - {field: 'ratingFrom', betweenFrom: true}</td>
		</tr>
		<tr>
			<td>fieldNameTo</td>
			<td>no</td>
			<td>boolean</td>
			<td>Used when you need '$lt' and '$lte'. If set to true, this field will be treated as a range end filter and the "To" suffix will be removed from the field name (if present). It is false by default. Example: we have a 'rating' field, we want to search for ratings below a certain value. To do this, we will add the following object to the searchFields array - {field: 'ratingTo', betweenTo: true}</td>
		</tr>
		<tr>
			<td>exactMatch</td>
			<td>no</td>
			<td>boolean</td>
			<td>If set to true and is a range filter, it will be inclusive. I.e. >= ($gte) instead of > ($gt).</td>
		</tr>
	</tbody>
</table>
<br/><br/>

Brief recap
--
Lets take a quick look at the current state of our "users" dbComponent:

```javascript
/**
 * The usersDBComponentModule. Contains the UsersDBComponent class.
 * @module usersDBComponentModule
 */

const
  {BaseDBComponent} = require('ramster'),
  bcryptjs = require('bcryptjs')

/**
 * The UsersDBComponent class. Contains the sequelize db model and the business logic for the users. User items are central to the whole platform.
 * @class UsersDBComponent
 */
class UsersDBComponent extends BaseDBComponent {
  /**
   * Creates an instance of UsersDBComponent.
   * @param {object} sequelize An instance of Sequelize.
   * @param {object} Sequelize A Sequelize static object.
   * @memberof UsersDBComponent
   */
  constructor(sequelize, Sequelize) {
    super()

    this.model = sequelize.define('user', {
        userTypeId: {type: Sequelize.INTEGER, allowNull: false, validate: {min: 1}},
        firstName: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
        lastName: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
        email: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
        unconfirmedEmail: {type: Sequelize.STRING, allowNull: true, validate: {notEmpty: true}},
        phone: {type: Sequelize.STRING, allowNull: true, validate: {notEmpty: true}},
        password: {type: Sequelize.STRING, allowNull: false, validate: {notEmpty: true}},
        gender: {type: Sequelize.ENUM('male', 'female', 'other'), allowNull: true},
        status: {type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true},
        lastLogin: {type: Sequelize.DATE, allowNull: true, validate: {isDate: true}}
      }, {
        indexes: [
          {unique: true, fields: ['email'], where: {deletedAt: null}}
        ],
        setterMethods: {
          id: function (value) {
          },
          password: function (value) {
            if (typeof value !== 'undefined') {
              if ((typeof value !== 'string') || (value.length < 4)) {
                throw {customMessage: 'The password must be at least 4 characters long.'}
              }
              this.setDataValue('password', bcryptjs.hashSync(value, 10))
            }
          },
        },
        scopes: {
          default: {
            attributes: ['id', 'userTypeId', 'firstName', 'lastName', 'email', 'unconfirmedEmail', 'phone', 'gender', 'status', 'lastLogin', 'createdAt', 'updatedAt', 'deletedAt']
          },
          full: {
            attributes: ['id', 'userTypeId', 'firstName', 'lastName', 'email', 'unconfirmedEmail', 'phone', 'password', 'gender', 'status', 'lastLogin', 'createdAt', 'updatedAt', 'deletedAt']
          }
        },
        paranoid: true
      }
    )
    this.model = this.model.scope('default')

    this.associationsConfig = {
      userType: {type: 'belongsTo', componentName: 'userTypes', foreignKey: 'userTypeId'}
    }
    this.relationsConfig = {
      userType: {attributes: ['id']}
      typeWithAccessData: {
            associationName: 'userType',
            attributes: ['id', 'name'],
            required: true,
            include: [{
                  associationName: 'accessPoints', // this refers to the accessPoints association from the "userTypes" dbComponent's "associationsConfig"
                  attributes: ['id', 'name', 'description'],
                  required: true
            }]
      }
    }

    this.searchFields = [
        {field: 'id'},
        {field: 'userTypeId'},
        {field: 'firstName', like: '-%'},
        {field: 'lastName', like: '-%'},
        {field: 'email', like: '-%'},
        {field: 'unconfirmedEmail', like: '-%'},
        {field: 'phone', like: '-%'},
        {field: 'gender'},
        {field: 'status'},
        {field: 'lastLogin'},
        {field: 'createdAt'},
        {field: 'updatedAt'},
        {field: 'deletedAt'}
    ]
  }
}

module.exports = UsersDBComponent
```

<br/>
So far we've created the class for the component, defined its Sequelize model, configured the associations and set the search fields. We could leave it like that, since ramster's BaseDBComponent class gives us a number of handy methods - create, bulkCreate, update, read, readList, update, bulkUpsert and delete. The full reference for the BaseDBComponent class can be found <a href='https://github.com/RazorDude/ramster/blob/master/docs/modules/db/base-db.componnt.md'>here</a>.<br/><br/>


There's one more thing we haven't done - create a business logic method. Lets go ahead and override BaseDBComponent's 'create' method.

```javascript

/**
 * The usersDBComponentModule. Contains the UsersDBComponent class.
 * @module usersDBComponentModule
 */

const
  {BaseDBComponent} = require('ramster'),
  bcryptjs = require('bcryptjs'),
  co = require('co')

/**
 * The UsersDBComponent class. Contains the sequelize db model and the business logic for the users. User items are central to the whole platform.
 * @class UsersDBComponent
 */
class UsersDBComponent extends BaseDBComponent {
  /**
   * Creates an instance of UsersDBComponent.
   * @param {object} sequelize An instance of Sequelize.
   * @param {object} Sequelize A Sequelize static object.
   * @memberof UsersDBComponent
   */
  constructor(sequelize, Sequelize) {
    super()
    // model definition, associations, searchFields, etc.
  }



  /**
   * Creates a new DB item.
   * @param {object} data The object to create.
   * @param {object} options Transaction, current userId, as well as other options to be passed to sequelize.
   * @param {object} options.transaction A sequelize transaction to be passed to sequelize.
   * @param {number} options.userId The id of the user to be set as "changeUserId", usually the current logged in user.
   * @returns {Promise<object>} A promise which wraps a generator function. When resolved, the promise returns the created DB item.
   * @memberof BaseDBComponent
   */
  create(data, options) {
     const instance = this
     return co(function*() {
         if ((typeof options === 'object') && (options !== null)) {
            if (options.userId) {
              data.changeUserId = options.userId
            }
            return yield instance.model.create(data, options)
         }
         return yield instance.model.create(data)
     })
  }
}

module.exports = UsersDBComponent
```

The method itself is pretty straightforward. Notice how we added the 'co' module to the imports. This is needed because we want to return promises from each dbComponent method. By using co-routines and generators (or async-await if you prefer), we avoid callback hell and greatly improve code quality.<br/>

Testing wtih mochajs
--
Ramster supports running (unit) tests with <a href='https://github.com/mochajs/mocha'>mocha</a>. Simply place an 'index.spec.js' file with its exports being an object containing all test methods. Upon component initialization, ramster will add them to the component class as class functions. Here's an example:

```javascript
const
	assert = require('assert'),
	co = require('co')

module.exports = {
  testUpdateProfile: function() {
    const instance = this,
      {db, model} = this
    let userId = null
    describe('db.users.updateProfile', function() {
      before(function() {
        return co(function*() {
          let user = yield model.create({
              typeId: 1,
              firstName: 'Admin',
              lastName: 'User',
              email: 'admin@ramster.com',
              password: '1234abcd',
              status: true
            },
            {returning: true}
          )
          userId = user.id
          return true
        })
      })
      it('should execute successfully and update the provided fields', function() {
        return co(function*() {
          let userData = yield model.update({firstName: 'Updated'}, {where: {id: user.id, returning: true}}),
            updatedFieldValue = userData[1][0].firstName
          assert.strictEqual(updatedFieldValue, 'Updated', `bad value ${updatedFieldValue} for 'firstName', expected Updated`)
          return true
        })
      })
      after(function() {
        return co(function*() {
          yield model.destroy({where: {id: userId}})
          return true
        })
      })
    })
  }
}
```

<br/><br/>
That concludes the db module & dbComponent example.
<!-- If you'd like to play around and test stuff, here's a <a href=''>fiddle</a>. -->

# Neo4jose
## Instalation
First you need to install `neo4j-driver`
`npm install neo4j-driver --save`
After this...
`const neo4j = require('neo4j-driver');`
`const auth = neo4j.v1.auth.basic(USERNSME, PASSWORD);`
`const driver = neo4j.v1.driver("bolt://localhost", auth);`
`const session = driver.session();`

So, we have a `session`, it's required parameter.
Instalation of `neo4jose`:
`npm install neo4jose --save`
## Importing
So, after we need to import `neo4jose`
`const neo4jose = require('neo4jose');`
## Using
If we need to make model(example):
`const User = neo4jose.model("User");`
`const user1 = new User({
	username: 'user1',
	age: '10'
});`
## Methods
### save
Save object in database, that was initialized, exapmle:
`const result = user1.save(session);`
First Arg: required arg for making request. Method returns saved object.
### saveWithRelationship
Save object in database, that was initialized, but not like a single node, but with relationship with another node, example:
*     const result =  user1.saveWithRelationship(session,[{
	      obj: {username: 'user2', label: 'User'},
	      relation: 'FRIEND', direction: 'INTO'
      },{
	      obj: {username: 'user3', label: 'User'},
	      relation: 'FRIEND', direction: 'OUTTO'
      }]
    Second Argument must be array of object(s):
    each of them must have next properties:
    - `obj`, another object, that will be in relationship with caller of method, structure of `obj`:
*             {
				    propertyForSearch : Value
			        labelOfThisObject : Value
			    }
	    
  - `relation`
 - `direction`
    * INTO
    * OUTTO
### findAll
Returns all nodes of this model, expample:
`const allUsers = User.findAll(session);`
### isAlreadyExist
Check if nodes is already created. Method returns boolean. Example:
*     const result = User.isAlreadyExist(session, {
			  username: 'user1', 
			  age: '10'
      });
### findAndUpdate
Method to update selected node. Example:
*     const result = await User.findAndUpdate(session, {
	      username: 'user1', 
			  age: '10'
       },{
			  age: '50'
       });
First Arg: required arg for making request
Second Arg: object that will be searched in db
   *     structure of object:{
	         propertyForSearch : Value
	         labelOfThisObject : Value
         }
Third Arg: object with new properties of node
Method returns new object if it was updated
### findAndDelete
Expample:
*      const result = await User.findAndDelete(session,{
	      username: 'user1', 
		   age: '10'
       });

module.exports = {
  model : function(nameOfLabel){
    return class ClassName{
      constructor(obj){
        //setting properties of class from obj
        Object.keys(obj).forEach((params)=>{
          this[params] = obj[params];
        })

        //field that contains all properties as object
        this._mainObj = obj;
      }

      /**
      * Method for saving object
      * First Arg: required arg for making request
      * Method returns saved object
      */
      async save(session){
        let stringOfProperties = '';

        Object.keys(this._mainObj).forEach((prop)=>{
          stringOfProperties += (prop + ": " +
          "'" + this._mainObj[prop] + "',"
          );
        });

        stringOfProperties = stringOfProperties.slice(0, stringOfProperties.length-1);

        await session.run(`
          CREATE (n:${nameOfLabel} {
            ${stringOfProperties}
          })
          RETURN n
        `)
          .then(()=>{        
            session.close();
          })
          .catch(function(error) {
              console.log(error);
          }
        );
    
        return this._mainObj;
      }

      /**
      * Method for saving object
      * First Arg: required arg for making request
      * Second Arg: array of objects
      * structure of arrayOfObjects: [
      *   { obj: secondObject, relation: relation, direction: direction }
      * ]
      * structure of secondObject:
      * {
      *   propertyForSearch : Value
      *   labelOfThisObject : Value
      * }
      * Types of direction ship: 
      * -INTO(<-[r]-)
      * -OUTTO(-[r]->)
      * Method returns saved object
      */
      async saveWithRelationship(session, arrayOfObjects){
        let stringOfProperties = '',
            resultStr = '';
        
        const arrOfKeysProp = arrayOfObjects.map((object)=>{
          return object.obj[Object.keys(object.obj)[0]];
        });

        const arrOfRelation = arrayOfObjects.map((object)=>{
          return object.relation;
        });

        const arrOfDirection = arrayOfObjects.map((object)=>{
          return object.direction;
        });

        const arrOfNamesSecLabels = arrayOfObjects.map((object)=>{
          return object.obj[Object.keys(object.obj)[1]];
        });

        //making part with properties of node that will be created
        Object.keys(this._mainObj).forEach((prop)=>{
          stringOfProperties += (prop + ": " +
            "'" + this._mainObj[prop] + "',"
          );
        });

        //deleting last coma
        stringOfProperties = stringOfProperties.slice(0, stringOfProperties.length-1);

        //add part of selecting needed nodes that will in relationship with created
        for(let i = 0; i < arrayOfObjects.length; i++){
          let symbolLat = String.fromCharCode(97 + i);
          resultStr += `MATCH (${symbolLat}:${arrOfNamesSecLabels[i]} {
            ${Object.keys(arrayOfObjects[i].obj)[0]}: '${arrOfKeysProp[i]}' 
          })`;
        }

        //add keyword to working with selected nodes
        resultStr += `WITH `

        for(let i = 0; i < arrayOfObjects.length; i++){
          resultStr += `${String.fromCharCode(97 + i)},`;
        }

        resultStr = await resultStr.slice(0, resultStr.length - 1);

        //add ro request part of creating node
        resultStr += `
          CREATE (iam:${nameOfLabel} {${stringOfProperties}}),
        `;

        for(let i = 0; i < arrayOfObjects.length; i++){
          const arrow = {
            left: "",
            right: ""
          }

          //setting arrows that in request mean direction of relationship
          //beetween nodes
          switch(arrOfDirection[i]){
          case "INTO":
            arrow.left = "<-";
            arrow.right = "-";
            break;
          case "OUTTO":
            arrow.left = "-";
            arrow.right = "->";
            break;
          default:
            arrow.left = "-";
            arrow.right = "->";
          }

          //add to request relationship with another nodes in db
          resultStr += `(iam)${arrow.left}[${'r' + String.fromCharCode(97 + i)}:${arrOfRelation[i]}]${arrow.right}(${String.fromCharCode(97 + i)}),`;
        }

        //deleting last coma
        resultStr = await resultStr.slice(0, resultStr.length - 1);

        await session.run(resultStr + ' RETURN iam')//making request
          .then(()=>{        
            session.close();
          })
          .catch(function(error) {
              console.log(error);
          }
        );
    
        return this._mainObj;
      }

      /**
      * Method for finding all nodes with this label
      * First Arg: required arg for making request
      * Second Arg: object to search him, full
      * Method returns full node
      */
      static async findOne(session, object){
        let res;
        const keyProp = object[Object.keys(object)[0]];
        await session.run(`
          MATCH (n:${nameOfLabel} {${Object.keys(object)[0]}: '${keyProp}'})
          RETURN n LIMIT 1
        `)
        .then((result)=>{
          res = result.records;
        })
        .then(()=>{        
            session.close();
          })
          .catch(function(error) {
              console.log(error);
          }
        );
        return res;
      }

      /**
      * Method for finding all nodes with this label
      * First Arg: required arg for making request
      * Method returns array of objects
      */
      static async findAll(session){
        let res;
        await session.run(`
          MATCH (n:${nameOfLabel})
          RETURN n
        `)
        .then((result)=>{
          res = result.records;
        })
        .then(()=>{        
            session.close();
          })
          .catch(function(error) {
              console.log(error);
          }
        );
        return res;
      }

      /**
       * Method to say if this node
       * is already exists
       * First Arg: required arg for making request
       * Second Arg: object that will be searched in db
       * structure of object:{
       *   propertyForSearch : Value
       *   labelOfThisObject : Value
       * }
       * Method returns boolean value
       */
      static async isAlreadyExist(session, object){
        let arr = '';
        const keyProp = object[Object.keys(object)[0]];

        //making request    
        await session.run(`
          MATCH (n:${nameOfLabel} {${Object.keys(object)[0]}: '${keyProp}'}) 
          RETURN n
        `)
          .then((result)=>{
            arr = (result.records.length > 0) || '';
          })
          .then(()=>{        
              session.close();
          })
          .catch((error)=>{
                console.log(error);
          });

        return arr !== '';
      }

      /**
       * Method to update selected node
       * First Arg: required arg for making request
       * Second Arg: object that will be searched in db
       * structure of object:{
       *   propertyForSearch : Value
       *   labelOfThisObject : Value
       * }
       * Third Arg: object with new properties of node
       * Method returns new object if it was updated
       */
      static async findAndUpdate(session, objectF, objectNew){
        const keyProp = objectF[Object.keys(objectF)[0]];
        let stringOfProperties = '',
            res;

        //setting part of request with new properties    
        Object.keys(objectNew).forEach((prop)=>{
          stringOfProperties += ("n." + prop + " = " + "'" + objectNew[prop] + "',");
        });
    
        stringOfProperties = stringOfProperties.slice(0, stringOfProperties.length-1);    
    
        //Making request
        await session.run(`
          MATCH (n:${nameOfLabel} {${Object.keys(objectF)[0]}: '${keyProp}'})
          SET ${stringOfProperties}
          RETURN n 
        `)
          .then((result)=>{
            res = result.records;
          })
          .then(()=>{        
            session.close();
          })
          .catch((error)=>{
              console.log(error);
          });
          return res;
      }

      /**
       * Method to delete nodes from db
       * First Arg: required arg for making request
       * Second Arg: object that will be searched in db
       * structure of object:{
       *   propertyForSearch : Value
       *   labelOfThisObject : Value
       * }
       */
      static async findAndDelete(session, object){
        const keyProp = object[Object.keys(object)[0]];
        let res;

        //making request
        //deleting node and all relationships of this node
        await session.run(`
          MATCH (n:${nameOfLabel} {${Object.keys(object)[0]}: '${ keyProp}'})
          OPTIONAL MATCH (n)-[r]-()
          DELETE n, r
        `)
          .then(()=>{        
            session.close();
          })
          .catch((error)=>{
              console.log(error);
          });
          return res;
      }

       /**
       *Stict Format
        {
          sender: {username: 'roik'},
          reciever: {
            label: 'User',
            obj: {
              username: 'yuragon'
            }
          }
        }
       */
      static async findRelationAndDelete(session, obj){
        let res;
        const firstNode = obj.sender;
        const secondNode = obj.reciever;

        const labelSecond = secondNode.label;
        const objSecond = secondNode.obj;

        const propFirst = Object.keys(firstNode)[0];
        const propSecond = Object.keys(objSecond)[0];

        console.log('propF: ',firstNode);

        const request = `
        MATCH (a:${nameOfLabel} {${propFirst}: '${firstNode[propFirst]}'})
        MATCH (b:${labelSecond} {${propSecond}: '${objSecond[propSecond]}'})
        MATCH (a)-[r]->(b)
        DELETE r
        RETURN a
        `;

        console.log(request);

        await session.run(request)//making request
          .then((result)=>{
            res = result.records;
          })
          .then(()=>{        
            session.close();
          })
          .catch(function(error) {
              console.log(error);
          }
        );

        return res;
      }

      /**
       *MATCH (n:User {username: 'nefertiti'})
        MATCH (v:User {username: 'gawrylo'})
        MERGE (n)-[r:LOVE]->(v)
        {
          sender: {
            label: 'User',
            obj: {
              username: 'roik'
            }
          },
          reciever: {
            label: 'User',
            obj: {
              username: 'yuragon'
            }
          },
          type: 'typeORelationShip'
        }
       */
      static async createRelation(session, obj){
        let res;
        const { sender } = obj;//sender of relation
        const { reciever } = obj;//object of reciever
        const { type } = obj;

        const senderLabel = sender.label;//label of sender
        const recieverLabel = reciever.label;//label of sender

        const senderObject = sender.obj;//sender of relation object prop
        const recieverObject = reciever.obj;//reviever of relation object prop

        const senderProp = Object.keys(senderObject)[0];
        const recieverProp = Object.keys(recieverObject)[0];

        const request = `
        MATCH (a:${senderLabel} {${senderProp}: '${senderObject[senderProp]}'})
        MATCH (b:${recieverLabel} {${recieverProp}: '${recieverObject[recieverProp]}'})
        MERGE (a)-[r:${type}]->(b)
        RETURN a, b
        `;


        await session.run(request)//making request
          .then((result)=>{
            res = result.records;
          })
          .then(()=>{        
            session.close();
          })
          .catch(function(error) {
              console.log(error);
          }
        );

        return res;
      }
    }
  }
}

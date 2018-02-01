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
      * Second Arg: another Object with relationship to our Object
      * structure of another Object:
      * {
      *   fieldOfSearch : Value
      *   nameOfLabelOfSecond : Value
      * }
      * Third Arg: type of relationship between objects
      * Forth Arg: direction of relationship between objects:
      * -INTO(<-[r]-)
      * -OUTTO(-[r]->)
      * structure of arrayOfObjects: [
      *   { obj: secondObject, relation: relation, direction: direction }
      * ]
      * structure of secondObject:
      * {
      *   propertyForSearch : Value
      *   labelOfThisObject : Value
      * }
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
    }
  }
}

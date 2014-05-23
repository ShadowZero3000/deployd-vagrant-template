/**
 * Module dependencies
 */

var Resource = require('deployd/lib/resource');
var util = require('util');

function ApiDocs( options ) {
  Resource.apply(this, arguments);
}


util.inherits(ApiDocs, Resource);

ApiDocs.label = 'ApiDocs';

ApiDocs.prototype.clientGeneration = true;

ApiDocs.basicDashboard ={
  settings: [{
    name: 'basePath'
    ,type: 'text'
    ,description: 'The url where all paths are relative to for your docs. I.E. http://localhost/ (Include http/https)'
  },{
    name: 'title'
    ,type: 'text'
    ,description: 'The heading for your docs'
  },{
    name: 'description'
    ,type: 'text'
    ,description: 'The description of your application'
  },{
    name: 'contact'
    ,type: 'text'
    ,description: 'Whom to contact regarding your app'
  }]
}
/**
 * Module methods
 **/

handleRoot = function(myResources,resourceNames,api,basePath){
	var swaggerSpec={
      info:{
        contact:api.config.contact || "Author"
        ,description:api.config.description || "In order to customize this documentation"
        ,title:api.config.title || "Please edit the ApiDocs settings"
      }
      ,swaggerVersion:"1.2"
      ,apis:[]
      ,basePath:basePath
    };
    for(var i=0;i<resourceNames.length;i++){
      swaggerSpec.apis.push({
        path:'/'+api.name+myResources[resourceNames[i]].path
        ,description:myResources[resourceNames[i]].name +' '+ myResources[resourceNames[i]].config.type
      });
    }
    return swaggerSpec;
}
handlePath = function(myResources,resourceName,basePath){
    var paramNames=Object.getOwnPropertyNames(myResources[resourceName]['properties']);
    var params=[];
    for(var i=0;i<paramNames.length;i++){
      var resource=myResources[resourceName]['properties'][paramNames[i]];
      params.push({
        name:paramNames[i]
        ,type:resource.type
        ,required:resource.required
        ,paramType:'form'
      })
    }
    var swaggerSpec={
      apiVersion:"1.0.0"
      ,apis:[{
        operations:[{
          method:'POST'
          ,nickname:resourceName
          ,summary:'Create a '+resourceName.replace(/s$/,'')
          ,parameters:params
        },{
          method:'GET'
          ,nickname:resourceName
          ,summary:'Retrieve '+resourceName
          ,parameters:[{
            name:'id'
            ,type:'string'
            ,required:false
            ,paramType:'query'
          }]
        }]
        ,path:'/'+resourceName
      },{
        operations:[{
          method:'GET'
          ,nickname:resourceName
          ,summary:'ID path retrieval of a '+resourceName.replace(/s$/,'')
          ,parameters:[{
            name:'id'
            ,required:true
            ,description:'Unique ID of '+resourceName.replace(/s$/,'')
            ,paramType:'path'
            ,type:'json'
          }]
        },{
          method:'PUT'
          ,nickname:resourceName
          ,summary:'ID path update of a '+resourceName.replace(/s$/,'')
          ,parameters:[{
            name:'id'
            ,required:true
            ,description:'Unique ID of '+resourceName.replace(/s$/,'')
            ,paramType:'path'
            ,type:'json'
          }].concat(params)
        },{
          method:'DELETE'
          ,nickname:resourceName
          ,summary:'ID path deletion of a '+resourceName.replace(/s$/,'')
          ,parameters:[{
            name:'id'
            ,required:true
            ,description:'Unique ID of '+resourceName.replace(/s$/,'')
            ,paramType:'path'
            ,type:'json'
          }]
        }]
        ,path:'/'+resourceName+'/{id}'
      },{
        operations:[{
          method:'GET'
          ,nickname:resourceName
          ,summary:'Filtered retrieval of '+resourceName
          ,parameters:[{
            name:'filter'
            ,description:'Open text query (Json object: {"id":"1234"})'
            ,paramType:'path'
            ,type:'json'
          }]
        }]
        ,path:'/'+resourceName+'?{filter}'
      }]
      ,basePath:basePath
      ,resourcePath:'/'+resourceName
      ,produces:['application/json']
    };
    return swaggerSpec;
}

ApiDocs.prototype.handle = function(ctx, next){
  if(ctx.req && ctx.req.method !== 'GET') {
    return next();
  }
  var options = ctx.body || {};
  var errors = {};
  var that = this;

	var finishedUrl=ctx.req.url+'/';
  var urlParts=finishedUrl.split('/');
  for (var i = 0; i < urlParts.length; i++) {
    if (urlParts[i] == '') {         
      urlParts.splice(i, 1);
      i--;
    }
  }
  var myResources={};
  var resourceNames=[];
  for(var i=0; i<ctx.server.resources.length;i++){
    if(typeof(ctx.server.resources[i].options.configPath)!="undefined"){
    	if(this.name!==ctx.server.resources[i].name){
      	myResources[ctx.server.resources[i].name]=ctx.server.resources[i];
      	resourceNames.push(ctx.server.resources[i].name);
      }
    }
  }
  var spec={};
	var basePath=this.config.basePath ? this.config.basePath : 'http://localhost';
  if(urlParts[urlParts.length-1]==this.name){
  	spec=handleRoot(myResources,resourceNames,this,basePath);
  }else{
  	spec=handlePath(myResources,urlParts[urlParts.length-1],basePath);
  }
  return ctx.done(null,spec);
}

module.exports = ApiDocs;


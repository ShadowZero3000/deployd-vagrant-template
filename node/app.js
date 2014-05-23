// deployed1.js
var nconf = require('nconf');
nconf.argv().env();
var configFile=nconf.get('o') || nconf.get('configfile') || 'config.json';
nconf.file(configFile);
//In case your config doesn't have some required default parameters
nconf.file('config.json');
//In case you broke that config
nconf.defaults({
  port: 3001
});
port=nconf.get('port');

var deployd = require('deployd');
var options = {
  port: process.env.PORT || port
  ,env: 'development'
  ,db: {
    host: 'localhost'
    ,name: 'deployd-app'
    ,port: 27018
  }
};

var server = deployd(options);

server.listen();

server.on('request',function(req,res){
  // dont handle socket.io requests
  var finishedUrl=req.url+'/';
  if(finishedUrl.indexOf('/apidoc/') === -1) return;
  var urlParts=finishedUrl.split('/');
  for (var i = 0; i < urlParts.length; i++) {
    if (urlParts[i] == '') {         
      urlParts.splice(i, 1);
      i--;
    }
  }
  var myResources={};
  var resourceNames=[];
  for(var i=0; i<server.resources.length;i++){
    if(typeof(server.resources[i].options.configPath)!="undefined"){
      myResources[server.resources[i].name]=server.resources[i];
      resourceNames.push(server.resources[i].name);
    }
  }
  var swaggerSpec={}
  if(urlParts[urlParts.length-1]=="apidoc"){
    //The root doc, so we need to return our full structure
    swaggerSpec={
      info:{
        title:"Application docs"
        ,contact:"Author"
        ,description:"In order to customize this documentation"
        ,title:"Please edit app.js"
      }
      ,swaggerVersion:"1.2"
      ,apis:[]
      ,basePath:'http://'+req.headers.host+'/'
    };
    for(var i=0;i<resourceNames.length;i++){
      swaggerSpec.apis.push({
        path:urlParts[urlParts.length-1]+myResources[resourceNames[i]].path
        ,description:myResources[resourceNames[i]].name +' '+ myResources[resourceNames[i]].config.type
      });
    }
    res.statusCode=200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.write(JSON.stringify(swaggerSpec));
    req._routed=true;
    return res.end();
  }else{
    var resourceName=urlParts[urlParts.length-1];
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
    swaggerSpec={
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
      ,basePath:'/'
      ,resourcePath:'/'+resourceName
      ,produces:['application/json']
    };

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.write(JSON.stringify(swaggerSpec));
    req._routed=true;
    return res.end();
  }
});
server.on('listening', function(){
  console.log('Server is listening on port: '+port);
});

server.on('error', function(err){
  console.error(err);
  process.nextTick(function(){
    process.exit();
  });
});

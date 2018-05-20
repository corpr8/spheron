"use strict";

/*
* Realtime monitoring of processing status / evolution.
* Currently single threaded...
*/

//https://appdividend.com/2018/02/16/node-js-socket-io-tutorial/

const opn = require('opn');
const mongoUtils = require('./mongoUtils.js');
const UdpUtils = require('./udpUtils.js');
var udpUtils = new UdpUtils()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const isJSON = require('./isJSON.js')
const server = require('http').createServer(app);
const connections = [];
var io = require('socket.io')(server);

app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

app.get('/', function(req, res){
	res.send('Hello World!')	
})

/*
* Endpoint for job uploading.
*/
app.post('/postJob', function (req, res) {
	console.log(req.body.jobData)
  	

  	/*
  	* TODO: Upload the job to the mongodb and kick off processing if it is not already kicked off
  	*/
  	mongoUtils.importSpheronet(JSON.parse(req.body.jobData) ,function(){
  		console.log('we have imported a spheronet')
  		//console.log('generating some offspring - finding a valid spheronetId first.')
  		mongoUtils.generateOffspring([0],0,100,function(){
  			res.send('ok - imported: ' + req.body.jobData)
  		})
  	})
})

app.use(express.static('public'))

//socket handling for client diagnostics.
io.sockets.on('connection',(socket) => {
   connections.push(socket);
   console.log(' %s sockets is connected', connections.length);

   socket.on('disconnect', () => {
      connections.splice(connections.indexOf(socket), 1);
   });

   socket.on('sending message', (message) => {
      console.log('Message is received :', message);

      io.sockets.emit('new message', {message: message});
   });
});

server.listen(3000, function(){
	console.log('monitor listening on port 3000!')	
})

var monitor = {
	init: function(){

		
	}
}

udpUtils.on('message', function(thisMsg){
	console.log(thisMsg)
	io.sockets.emit('new message', {message: thisMsg});
})

mongoUtils.init(function(){
	monitor.init()
	
	// Specify the app to open in
	opn('http://localhost:3000/monitor.html');
})


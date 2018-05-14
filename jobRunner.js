"use strict";

/*
* The purpose of this (these) servers is to act as an edpoint for spheronets and training.
* The server will watch for UDP notices that tick has progressed 
* and then check for tasks (which are flagged as honed on this server) which have passed their tick timeout
* Actions may then be taken - i.e.:
* 1) assessing results against a testplan and storing that in the 'meta' record for this specific child network????
* 2) signalling completion of the testplan (into meta) for this child
* (and therefore new evolution / mutation.)
* 3) Act as an endpoint for processes (i.e. Spheral network Input and Output spherons terminate here)
* 4) call an arbitrary user defined module with some output
* 5) 
* 
* Jobs are loaded and viewed via the monitor web interface
* Job scoring etc is done here.
*
*/
var mongoUtils = require('./mongoUtils.js');
var UdpUtils = require('./udpUtils')
var udpUtils = new UdpUtils()

var jobRunner = {
	isProcessing: false,
	init: function(){
		//setup the basics.
	}
}

udpUtils.on('message',function(thisMessage){
	console.log('got message: ' + JSON.stringify(thisMessage))
	/*
	* Now we should handle and do something with this message...
	*/
})

jobRunner.init()
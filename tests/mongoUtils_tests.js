"use strict";

/*
* Tests mongoUtils.js in various ways - used as a diagnostic. 
*/

var fs = require("fs")
var mongoUtils = require('../mongoUtils.js');


mongoUtils.init(function(){
	mongoUtils.dropCollection(function(){
		mongoUtils.createSpheron(null ,function(result){
			var thisSpheronId = result
			console.log("Created a spheron with id: " + thisSpheronId + "\r\n");
			mongoUtils.createConnection(null ,function(result){
				var thisConnectionId = result
				console.log("Created a Connection with id: " + thisConnectionId + "\r\n");
				mongoUtils.find(function(result){
					console.log('find result: ' + JSON.stringify(result) + "\r\n")
					mongoUtils.readSpheron(thisSpheronId, function(result){
						console.log('read spheron: ' + JSON.stringify(result) + "\r\n")
						mongoUtils.readConnection(thisConnectionId, function(result){
							console.log('read connection: ' + JSON.stringify(result) + "\r\n")

							mongoUtils.updateSpheron(thisSpheronId, {io:{input1:{angle:90}}}, function(result){
								console.log('updated spheron: ' + "\r\n")
								mongoUtils.readSpheron(thisSpheronId, function(result){
									console.log('read spheron: ' + JSON.stringify(result) + "\r\n")



									mongoUtils.deleteConnection(thisConnectionId, function(result){
										console.log('successful connection delete')
										mongoUtils.deleteSpheron(thisSpheronId, function(result){
											console.log('successful spheron delete')
											process.exit()
										})
									})	
								})
							})

						})
					})
				})
			})
		})
	})	
})


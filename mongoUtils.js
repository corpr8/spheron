var generateUUID = require('./generateUUID.js');
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
//var ObjectId = require('mongodb').ObjectID;
var url = "mongodb://localhost:27017/";
var db = [];
var dbo = [];
var mongoNet = [];

/*
* A way to persist Spherons and connections out to mongo
*/

var mongoUtils = {
	init: function(callback){
		MongoClient.connect(url, function(err, thisDb) {
			db = thisDb
			if (err) throw err;
			dbo = db.db("mydb");
			mongoNet = dbo.collection("brain")
			console.log('Connected to Mongo')
			callback()
		});

	},
	closeDb: function(){
		db.close()
	},
	find: function(callback){
		mongoNet.find({}).toArray(function(err, result) {
	    	if (err) throw err;
	    	callback(result)
		});
	},
	createSpheron: function(model, callback){
		model = (!!model) ? model : {
			io: {
				input1: {type: "input", angle: 0, val: 0},
				rst: {type: "input", angle: 0, val: 0},
				bias: {type: "bias", angle: 180, val: 1},
				Out1: {type: "output", angle: 45, val: 0}
			}
		};

		model.type = "spheron"
		model.spheronId = (model.spheronId) ? model.spheronId : generateUUID()
		model.name = (model.name) ? model.name : "testSpheron"
		model.state = (model.state) ? model.state : "idle"
		model.stateTickStamp = (model.stateTickStamp) ? model.stateTickStamp : "idle"

		mongoNet.insertOne(model, function(err, res) {
			if (err) throw err;

			//return the new spheron id.
			callback(model.spheronId)
		});
		
	},
	createConnection: function(model, callback){
		model = (!!model) ? model : {
			fromSpheronId : "AND", 
			fromOutputId : "ANDout", 
			toSpheronId : "NOT", 
			toInputId : "input1" 
		};

		model.type = "connection"
		model.connectionId = (model.connectionId) ? model.connectionId : generateUUID()
		//should return a connection object with an id.

		/*
		* TODO: We should validate that this connection connects to existent ports and spherons. 
		* TODO: We should consider the above as a background admin task also.
		*/

		mongoNet.insertOne(model, function(err, res) {
			if (err) throw err;
			//return the new connection id.
			callback(model.connectionId)
		});
	},
	readSpheron: function(spheronId, callback){
		mongoNet.findOne({
			type: "spheron",
			spheronId: spheronId
		}, function(err, result) {
	    	if (err) throw err;
	    	callback(result)
		});
	},
	readConnection: function(connectionId,callback){
		mongoNet.findOne({
			type: "connection",
			connectionId: connectionId
		}, function(err, result) {
	    	if (err) throw err;
	    	callback(result)
		});
	},
	updateSpheron: function(spheronId, updateJSON, callback){
		/*
		* note: this is broken currently
		*/
		try {
			mongoNet.find({
				type:"spheron",
				spheronId: spheronId
			}).forEach(function (doc) {
				console.log(doc)

				if(updateJSON.io){
					for (var port in updateJSON.io) {
					    console.log(port + " will be " + JSON.stringify(updateJSON.io[port]));
					    for (var setting in updateJSON.io[port]) {
					    	console.log(setting + " will be " + updateJSON.io[port][setting])
					    	doc.io[port][setting] = updateJSON.io[port][setting]
					    }
					}
				}

				console.log('new doc', doc)
				mongoNet.save(doc);
				callback()
			});

			
		} catch (e) {
			throw(e)
		}
	},
	updateConnection: function(connectionId, updateJSON, callback){
		/*
		* note: this is broken currently
		*/
		try {
			mongoNet.updateOne({
				type : "connection",
				connectionId: connectionId
			},
			{
				$set: updateJSON
			});
			callback()
		} catch (e) {
			throw(e)
		}
	},
	deleteSpheron: function(spheronId, callback){
		try {
			mongoNet.deleteOne( { type: "spheron", spheronId : spheronId } );
			callback()
		} catch (e) {
			console.log('bad delete: ' + e)
			throw(e);
		}
	},
	deleteConnection: function(connectionId, callback){
		try {
			mongoNet.deleteOne( { type: "connection", "connectionId" : connectionId } );
			callback()
		} catch (e) {
			console.log('bad delete: ' + e)
			throw(e);
		}
	},
	dropCollection: function(callback){
		mongoNet.drop()
		console.log('Collection dropped')
		callback()
	}
}

module.exports = mongoUtils;


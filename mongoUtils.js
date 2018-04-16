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
			dbo = db.db("myBrain");
			mongoNet = dbo.collection("brain")
			console.log('Connected to Mongo')

			mongoNet.insertOne({
				tick:"tock",
				globalTick: 0
			}, function(err,res){
				if(err){ 
					throw err
				} else { 
					console.log('inserted tick')
					callback()
				}
			})
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
		model.stateTickStamp = (model.stateTickStamp) ? model.stateTickStamp : 0

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
		//should return a connection object id.

		/*
		* TODO: We should validate that this connection connects to existent ports and spherons. 
		* TODO: We should consider the above as a background maintenance task also.
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
		try {
			mongoNet.find({
				type:"spheron",
				spheronId: spheronId
			}).forEach(function (doc) {
				if(updateJSON.io){
					for (var port in updateJSON.io) {
					    for (var setting in updateJSON.io[port]) {
					    	doc.io[port][setting] = updateJSON.io[port][setting]
					    }
					}
				}
				mongoNet.save(doc);
				process.nextTick(function(){
					callback()	
				})
				
			});
		} catch (e) {
			throw(e)
		}
	},
	updateConnection: function(connectionId, updateJSON, callback){
		/*
		* This can only possibly make sense in terms of re-honing a connection which is essentially modifying a Spheron.
		* Not true...
		*/
	},
	deleteSpheron: function(spheronId, callback){
		/*
		* TODO: We should make sure that deleting a spheron is safe - i.e. there are no connection objects pointing at or from it.
		* TODO: We should also make sure that deleting a spheron port is safe - 
		* i.e. the system is not mid activation and nothing is left as a dead end...
		*/
		try {
			mongoNet.deleteOne( { type: "spheron", spheronId : spheronId } );
			callback()
		} catch (e) {
			console.log('bad delete: ' + e)
			throw(e);
		}
	},
	deleteConnection: function(connectionId, callback){
		/*
		* TODO: We should make sure that deletes are safe - i.e. that we get rid of their corresponding spheron port.
		*/
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
	},
	getNextPendingSpheron: function(callback){
		//TODO: Works but needs to return the one with the lowest pendAct + state == pending
		mongoNet.findOneAndUpdate({
			type:"spheron",
			state:"pending"
		},{
			$set:{state:"running"}
		}, {
			new: true,
			sort: {stateTickStamp: -1}
		}, function(err,doc){
			if(err){ 
				throw err
			} else { 
				callback(doc)
			}	
		})
	},
	incrementTick: function(callback){
		mongoNet.findAndModify(
		    {tick: "tock"},
		    [],
		    { $inc: { "globalTick" :1 } },
		    {new: true,
		    upsert: true
			}
		    , function(err,res){
			if(err){ 
				throw err
			} else {
				callback(res.value.globalTick)
			}
		})
	},
	getTick: function(callback){
		mongoNet.findOne(
		    {tick: "tock"}, 
		function(err,res){
			if(err){ 
				throw err
			} else {
				console.log(JSON.stringify(res))
				callback(res.globalTick)
			}
		})
	},
	loadSpheronet: function(targetSpheronet){
		
	}
}

module.exports = mongoUtils;


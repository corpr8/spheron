var generateUUID = require('./generateUUID.js');
var mongo = require('mongodb');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
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
			callback()
		});
	},
	closeDb: function(){
		db.close()
		return
	},
	initTick:function(callback){
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
	},
	dropDb: function(){
		mongoNet.drop()
		console.log('dropped old database')
		return
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
	createSpheronetMetaData: function(model, callback){
		model = (!!model) ? model : {
			note: "a basic description of this spheronets purpose",
			tickMode : "timeout", 
			timeOut : 4,
			spheronetId: generateUUID()
		};
		//TODO:
		model.type = "meta"

		mongoNet.insertOne(model, function(err, res) {
			if (err) throw err;
			//return the new connection id.
			callback(model.spheronetId)
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
				callback({})
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
	loadSpheronet: function(targetSpheronet, callback){
		//this is an analogue of spheron_tests but pushing stuff into mongo
		//TODO: We need to work out how / where to push metadata which may/will change with each offspringId
		console.log('\r\ trying to load network: ' + targetSpheronet)
		var that = this
		var thisTestDocument = fs.readFileSync( __dirname + "/tests/data/" + targetSpheronet +'.json')
		thisTestDocument = JSON.parse(thisTestDocument)

		console.log('inserting spherons')
		this._insertSpheronIterator(thisTestDocument.spherons, 0, 0, 0, 0, function(){
			//ok we have inserted all of the spherons
			console.log('inserting connections')
			that._insertConnectionIterator(thisTestDocument.connections, 0, 0, 0, 0, function(){
				//a quick hack - we should consider if the element should live in options...
				if(thisTestDocument.note) thisTestDocument.options.note = thisTestDocument.note
				that._insertSpheronetMetaData(thisTestDocument.options, 0, 0, 0, function(){
					callback()	
				})
			})
		})
	},
	_insertSpheronetMetaData: function(spheronetDocument, spheronetId, generationId, offspringId, callback){
		//push the metatdata into a document.
		spheronetDocument.spheronetId = (spheronetId) ? spheronetId : 0
		spheronetDocument.generationId = (generationId) ? generationId : 0
		spheronetDocument.offspringId = (offspringId) ? offspringId : 0
		mongoUtils.createSpheronetMetaData(spheronetDocument, function(){
			callback()
		})
	},
	_insertSpheronIterator: function(spheronsDocument, idx, spheronetId, generationId, offspringId, callback){
		//note: spheronetId is a unique identifier for this network across all iterations and evolutions
		//note: generationId is a unique identifier for everything in this network, for this specific generation 
		//note: offspringId is a unique identifier for a specific instance of a spheronet - i.e. a child network within a generation.
		//note: all in - spheronets have generations and generations have offspring
		var that = this
		if(Object.keys(spheronsDocument)[idx]){
			spheronsDocument[Object.keys(spheronsDocument)[idx]].spheronetId = (spheronetId) ? spheronetId : 0
			spheronsDocument[Object.keys(spheronsDocument)[idx]].generationId = (generationId) ? generationId : 0
			spheronsDocument[Object.keys(spheronsDocument)[idx]].offspringId = (offspringId) ? offspringId : 0
			mongoUtils.createSpheron(spheronsDocument[Object.keys(spheronsDocument)[idx]], function(){
				idx += 1
				that._insertSpheronIterator(spheronsDocument, idx, spheronetId, generationId, offspringId, callback)
			})
		} else {
			callback()
		}
	},
	_insertConnectionIterator: function(connectionsDocument, idx, spheronetId, generationId, offspringId, callback){
		var that = this
		if(Object.keys(connectionsDocument)[idx]){
			connectionsDocument[Object.keys(connectionsDocument)[idx]].spheronetId = (spheronetId) ? spheronetId : 0
			connectionsDocument[Object.keys(connectionsDocument)[idx]].generationId = (generationId) ? generationId : 0
			connectionsDocument[Object.keys(connectionsDocument)[idx]].offspringId = (offspringId) ? offspringId : 0

			mongoUtils.createConnection(connectionsDocument[Object.keys(connectionsDocument)[idx]], function(){
				idx += 1
				that._insertConnectionIterator(connectionsDocument, idx, spheronetId, generationId, offspringId, callback)
			})
		} else {
			callback()
		}
	},
	generateMutantOffspringIterator: function(parentSpheronetIdList, idx, limit, callback){
		//iterativbely mutate offspring based on 1 of the spheronets referred to in the list...
	},
	generateOffspring: function(parentSpheronetIdList, idx, limit, callback){
		//copy random network to a new, identical instance.
		if(idx < limit){
			var that = this
			var parentSpheronetId = parentSpheronetIdList[Math.floor(Math.random() * parentSpheronetIdList.length)]
			var newSpheronetId = generateUUID()
			console.log('parentSpheronetId ' + parentSpheronetId)
			var myCursor = mongoNet.find({"spheronetId": parentSpheronetId });

			myCursor.forEach(function(doc){
				console.log('iterating cursor')
				if(doc){
					console.log(doc)
					doc._id = new ObjectId()
					doc.spheronetId = newSpheronetId
					mongoNet.insert(doc)
				}else {
					console.log('no docs')
				}
			})
			idx += 1
			that.generateOffspring(parentSpheronetIdList, idx, limit, callback)	
		} else {
			//we've done enough
			callback()
		}

	},
	mutateSpheronet: function(spheronetId, callback){
		//mutate an existent spheronet
	}
}

module.exports = mongoUtils;

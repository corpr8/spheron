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
	createSpheron: function(spheronName, model, callback){
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
		model.name = (spheronName) ? spheronName : "testSpheron"
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
			tickMode : "timeout", 
			timeOut : 4,
			spheronetId: generateUUID()
		};
		delete(model.note)
		//TODO:
		model.type = "child-meta"

		mongoNet.insertOne(model, function(err, res) {
			if (err) throw err;
			//return the new connection id.
			callback(model.spheronetId)
		});
	},
	createJobMetaData: function(inputModel, callback){
		var model = {
			note : inputModel.note,
			type : "job-meta",
			jobId : generateUUID(),
			tests: inputModel.tests,
			popSize: inputModel.options.popSize
		}

		mongoNet.insertOne(model, function(err, res) {
			if (err) throw err
			//return the new connection id.
			callback(model.jobId)
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
	findConnectionByInputId: function(from, outputId, spheronetId, callback){
		mongoNet.findOne({
			fromId: from,
			outputId: outputId
		}, function(err,result){
			if(err) throw err;
			callback(result)
		})
	},
	updateSpheron: function(spheronId, spheronetId, updateJSON, callback){
		console.log('about to update spheron: ' + spheronId)
		try {
			mongoNet.find({
				type:"spheron",
				spheronetId: spheronetId,
				spheronId: spheronId
			}).forEach(function (doc) {
				if(updateJSON.io){
					for (var port in updateJSON.io) {
					    for (var setting in updateJSON.io[port]) {
					    	console.log(doc.io)
					    	console.log(port)
					    	console.log(doc.io[port][setting])
					    	console.log(updateJSON.io[port][setting])
					    	doc.io[port][setting] = updateJSON.io[port][setting]
					    }
					}
				}
				if(updateJSON.state){
					doc.state = updateJSON.state
				}
				if(updateJSON.stateTickStamp){
					doc.stateTickStamp = updateJSON.stateTickStamp
				}

				console.log('updated doc is: ' + JSON.stringify(doc))
				mongoNet.save(doc);
				process.nextTick(function(){
					callback()	
				})				
			});
		} catch (e) {
			throw(e)
		}
	},
	updateConnection: function(connectionId, spheronetId, updateJSON, callback){
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
			mongoNet.deleteOne({
				type: "connection", 
				connectionId : connectionId 
			});
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
		//Load a spheronet from disk into mongodb
		//TODO: We need to work out how / where to push metadata which may/will change with each offspringId
		console.log('\r\ trying to load network: ' + targetSpheronet)
		var that = this
		var thisTestDocument = fs.readFileSync( __dirname + "/tests/data/" + targetSpheronet +'.json')
		thisTestDocument = JSON.parse(thisTestDocument)

		console.log('inserting spherons')
		this._insertSpheronIterator(thisTestDocument, 0, 0, 0, 0, function(thisTestDocument){
			//ok we have inserted all of the spherons
			console.log('inserting connections')
			that._updateSpheronReferencesInConnections(thisTestDocument, function(thisTestDocument){
				that._insertConnectionIterator(thisTestDocument.connections, 0, 0, 0, 0, function(){
					//a quick hack - we should consider if the element should live in options...
					if(thisTestDocument.note) thisTestDocument.options.note = thisTestDocument.note
					that._insertSpheronetMetaData(thisTestDocument.options, 0, 0, 0, function(){
						callback()	
					})
				})
			})
		})
	},
	importSpheronet: function(targetSpheronetJSON, callback){
		//Load a spheronet from disk into mongodb
		//TODO: We need to work out how / where to push metadata which may/will change with each offspringId
		console.log('\r\ trying to import network: ' + JSON.stringify(targetSpheronetJSON))
		var that = this

		console.log('inserting spherons')
		this._insertSpheronIterator(targetSpheronetJSON, 0, 0, 0, 0, function(targetSpheronetJSON){
			//ok we have inserted all of the spherons
			console.log('inserting connections')
			that._updateSpheronReferencesInConnections(targetSpheronetJSON, function(targetSpheronetJSON){
				that._insertConnectionIterator(targetSpheronetJSON.connections, 0, 0, 0, 0, function(){
					//a quick hack - we should consider if the element should live in options...
					if(targetSpheronetJSON.note) targetSpheronetJSON.options.note = targetSpheronetJSON.note
					that._insertSpheronetMetaData(targetSpheronetJSON.options, 0, 0, 0, function(){
						that._insertJobMetaData(targetSpheronetJSON, 0, 0, 0, function(){
							callback()
						})
					})
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
	_insertJobMetaData: function(spheronetDocument, spheronetId, generationId, offspringId, callback){
		//push the metatdata into a document.
		//TODO: Some validation
		mongoUtils.createJobMetaData(spheronetDocument, function(){
			callback()
		})
	},
	_insertSpheronIterator: function(spheronsDocument, idx, spheronetId, generationId, offspringId, callback){
		//note: spheronetId is a unique identifier for this network across all iterations and evolutions
		//note: generationId is a unique identifier for everything in this network, for this specific generation 
		//note: offspringId is a unique identifier for a specific instance of a spheronet - i.e. a child network within a generation.
		//note: all in - spheronets have generations and generations have offspring
		console.log("_insertSpheronIterator received: " + spheronsDocument)
		var that = this
		if(Object.keys(spheronsDocument.spherons)[idx]){
			console.log("iterated to: " + Object.keys(spheronsDocument.spherons)[idx])
			spheronsDocument.spherons[Object.keys(spheronsDocument.spherons)[idx]].spheronetId = (spheronetId) ? spheronetId : 0
			spheronsDocument.spherons[Object.keys(spheronsDocument.spherons)[idx]].generationId = (generationId) ? generationId : 0
			spheronsDocument.spherons[Object.keys(spheronsDocument.spherons)[idx]].offspringId = (offspringId) ? offspringId : 0
			mongoUtils.createSpheron(Object.keys(spheronsDocument.spherons)[idx], spheronsDocument.spherons[Object.keys(spheronsDocument.spherons)[idx]], function(newSpheronId){

				idx += 1
				that._insertSpheronIterator(spheronsDocument, idx, spheronetId, generationId, offspringId, callback)
			})
		} else {
			callback(spheronsDocument)
		}
	},
	_updateSpheronReferencesInConnections: function(spheronetDocument, callback){
		//update connections in the input document with references to the created Spherons...
		for(var thisConnection in spheronetDocument.connections){
			if(spheronetDocument.spherons[spheronetDocument.connections[thisConnection].from]){
				spheronetDocument.connections[thisConnection].fromId = spheronetDocument.spherons[spheronetDocument.connections[thisConnection].from].spheronId
			}
			if(spheronetDocument.spherons[spheronetDocument.connections[thisConnection].to]){
				spheronetDocument.connections[thisConnection].toId = spheronetDocument.spherons[spheronetDocument.connections[thisConnection].to].spheronId
			}
		}

		console.log(JSON.stringify(spheronetDocument) + '\r\n')
		callback(spheronetDocument)

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
	generateOffspring: function(parentSpheronetIdList, idx, limit, callback){
		//copy random network to a new, identical instance - then call mutate on it!
		if(idx == 0){
			console.log('we are at idx 0 of generating offspring')
		} else {
			console.log('we are at: ' + idx + ' of ' + limit)
		}

		if(idx <= (limit -1)){
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
					mongoNet.insert(doc, function(err, records){
						that.mutateSpheronet(newSpheronetId, function(){
						})
					})
				}else {
					console.log('no more docs')
				}
			})

			idx += 1
			that.generateOffspring(parentSpheronetIdList, idx, limit, callback)					

		} else {
			console.log('finished generate offspring iterator...')
			//we've done enough
			callback()
		}

	},
	mutateSpheronet: function(spheronetId, callback){
		//mutate an existent spheronet within mongo by Id
		console.log('mutating spheronet: ' + spheronetId)
		var that = this
		var thisChoice = Math.floor(Math.random() * 7)

		switch (thisChoice) {
			case 0:
				console.log('tweaking timeout')
				that._mutationOperators.tweakTimeout(spheronetId, function(){
					callback()
				})
				break;
			case 1:
				console.log('inserting spheron')
				that._mutationOperators.insertSpheron(spheronetId, function(){
					callback()
				})
				break;
			case 2:
				console.log('removing spheron')
				that._mutationOperators.removeSpheron(spheronetId, function(){
					callback()
				})
				break;
			case 3:
				console.log('inserting connection')
				that._mutationOperators.insertConnection(spheronetId, function(){
					callback()
				})
				break;
			case 4:
			console.log('removing connection')
				that._mutationOperators.removeConnection(spheronetId, function(){
					callback()
				})
				break;
			case 5:
				console.log('tweaking port')
				that._mutationOperators.tweakPort(spheronetId, function(){
					callback()
				})
				break;
			default:
				// we didn't do anything so lets just callback
				callback()
				break;
		}
	},
	_mutationOperators: {
		tweakTimeout: function(spheronetId, callback){
			//increase or decrease the timeout for this specific spheronet
			//this variable is in child-meta and is called timeout
			console.log('spheronetId is: ' + spheronetId)
			mongoNet.findOne({
				"type": "child-meta",
				"spheronetId": spheronetId
			}, function(err, doc) {
		    	if (err) throw err;
		    	if(!doc){
		    		console.log('no result to tweak: ' + err + " " + doc)
					callback()
		    	} else {
		    		doc.timeout = (Math.random() > .5) ? doc.timeout -= 1: doc.timeout += 1
		    		mongoNet.save(doc, {"upsert": true}, function(err){
		    			console.log((err) ? 'We went bang whilst tweaking timeout' : 'We tweaked the timeout ok')
		    			callback()
		    		})
		    	}
			});
		},
		insertSpheron:  function(spheronetId, callback){
			//find a random connection within this spheronet
			//insert a new spheron into the connection with associated ports...
			callback()
		},
		removeSpheron:  function(spheronetId, callback){
			//1: find a random spheron within this spheronet
			//2: find all connections to the spheron
			//3: create ports on other spherons and connect the end of each connection to the new port
			//4: delete this spheron
			callback()
		},
		insertConnection:  function(spheronetId, callback){
			//1: find a random spheron within this spheronet
			//2: find another random spheron
			//3: create ports on each
			//4: create a connection object.
			//Note: must also insert associated spheron ports
			callback()
		},
		removeConnection:  function(spheronetId, callback){
			//find a random connection wihtin this spheronet.
			//Note: must also remove associated spheron ports
			callback()
		},
		tweakPort:  function(spheronetId, callback){
			//find a random spheron within this spheronet
			//find a random port in this spheron
			//Note: Will change the angle slightly of either a port or a bias.
			callback()
		}
	}

}

module.exports = mongoUtils;

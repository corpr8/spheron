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

		console.log('creating spheron')

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
		console.log('about to update spheron: ' + spheronId + ' in spheronetId: ' + spheronetId)
		var hadDocuments = false
			mongoNet.find({
				type:"spheron",
				spheronetId: spheronetId,
				spheronId: spheronId
			}).forEach(function (doc) {
				if(doc){
					hadDocuments = true
					console.log('in a doc: ' + JSON.stringify(doc))
					if(updateJSON.io){
						for (var port in updateJSON.io) {
						    for (var setting in updateJSON.io[port]) {
						    	console.log(doc.io)
						    	console.log(port)
						    	if(doc.io[port]){
							    	console.log(doc.io[port][setting])
							    	console.log(updateJSON.io[port][setting])
							    	doc.io[port][setting] = updateJSON.io[port][setting]
						    	}
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
					mongoNet.save(doc, function(doc){
						process.nextTick(function(){
							callback()	
						})	
					});
				} else {
					callback()
				}					
			})
			if(!hadDocuments){
				console.log('weirdly we are here. Is this because of exactly 0 results???')
				callback()
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
		* Note: This function is deprecated and replaced by mongoUtils._mutationHelps.deleteConnection()
		*/
		throw('we should not be using this function')
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
				that._mutationOperators.removeRandomConnection(spheronetId, function(){
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
			/*
			* Work in progress. Still validating...
			*/

			
			console.log('inserting a spheron into spheronet: ' + spheronetId)
			//1: find a random connection...
			mongoUtils._mutationHelpers.getRandomConnectionBySpheronetId(spheronetId, function(thisConnection){
				//2: create a spheron (maybe with bias...)
				var thisBiasAngle = Math.floor(Math.random() * 3600) /10
				var thisInputAngle = Math.floor(Math.random() * 3600) /10
				var thisOutputAngle = Math.floor(Math.random() * 3600) /10
				var newSpheronId = generateUUID()
				var newConnectionId = generateUUID()
				var thisInputId = generateUUID()
				var thisOutputId = generateUUID()

				var newSpheronJSON = {
					"io" : { 
						"bias" : { "type" : "bias", "angle" : thisBiasAngle, "val" : 1 }
					}, 
					"state" : "idle", 
					"stateTickStamp" : -10, 
					"spheronetId" : thisConnection.spheronetId,
					"generationId" : 0, 
					"offspringId" : 0, 
					"type" : "spheron", 
					"spheronId" : newSpheronId, 
					"name" : newSpheronId 
				}

				newSpheronJSON[thisInputId] = { "type" : "input", "angle" : thisInputAngle, "val" : 0 }
				newSpheronJSON[thisOutputId] = { "type" : "output", "angle" : thisOutputAngle, "val" : 0 }

				var newConnectionJSON = {
					"from" : newSpheronId, 
					"outputId" : thisOutputId, 
					"to" : thisConnection.to, 
					"inputId" : thisConnection.inputId, 
					"fromId" : newSpheronId, 
					"toId" : thisConnection.toId, 
					"spheronetId" : spheronetId, 
					"generationId" : thisConnection.generationId, 
					"offspringId" : thisConnection.offspringId, 
					"type" : "connection", 
					"connectionId" : newConnectionId
				}

				//3 create the new connection (utilising the old b end of the existent connection)
				mongoUtils.createConnection(newConnectionJSON, function(docs){
					//4 create the spheron

					console.log('new spheron JSON is: ' + JSON.stringify(newSpheronJSON))

					mongoUtils.createSpheron(newSpheronId, newSpheronJSON, function(docs1){
						//5 update the existent connection
						thisConnection.to = newSpheronId
						thisConnection.toId = newSpheronId
						thisConnection.inputId = thisInputId
						console.log('trying to save a spheron')

						mongoNet.save(thisConnection, function(err, result){
							if(err){
								throw(err)
							} else {
								console.log('we appear to have inserted a spheron')
								callback()
							}
						})
					})	
				})
			})
		},
		removeSpheron:  function(spheronetId, callback){
			/*
			* Work in Progress... ***
			*/

			//1: find a random spheron within this spheronet
			mongoUtils._mutationHelpers.getRandomSpheronBySpheronetId(spheronetId, function(targetSpheron){

				//inputs and outputs should be of the form {inputs:{connectionId: {..connection data..}},outputs:{connectionId: {..connection data..}}} - lets just return the whole lump as JSON to lower further impact on the db????

				//2: iterate connections
				mongoUtils._mutationHelpers.removeConnectionIterator(spheronetId, targetSpheron.spheronId, targetSpheron.io, 0, function(){
					console.log('returned from removeConnectionIterator...')
					//6: delete targetSpheron
					mongoNet.deleteOne({spheronetId: spheronetId, spheronId: targetSpheron.spheronId}, function(result){
						console.log('we deleted the spheron (eventually)')
						callback()
					})
				})				
			})
		},
		insertRandomMacro: function(spheronetId, callback){
			//TODO:
			//Insert a link out to a previously trained network
			//wait until that networks timeout has expired
			//check output value and propagate that into the next set of downstream
			//note: this does not affect the timeout of this network. That must evolve all on its own.
			callback()
		},
		removeRandomMacro: function(spheronetId, callback){
			//TODO: (only if this spheronet has random macros obviously)...

			//essentially short this macro function out by connecting the output to the input and then optimising.
			callback()

		},
		insertConnection:  function(spheronetId, callback){
			//1: find a random spheron within this spheronet
			//2: find another random spheron
			//3: create an output port on the first, create an input port on the second
			//4: create a connection object 1st > 2nd.

			mongoUtils._mutationHelpers.getRandomSpheronBySpheronetId(spheronetId, function(fromSpheron){
				mongoUtils._mutationHelpers.getRandomSpheronBySpheronetId(spheronetId, function(toSpheron){
					var fromPortId = generateUUID()
					var fromAngle = (Math.floor(Math.random() * 3600) /10)

					var toPortId = generateUUID()
					var toAngle = (Math.floor(Math.random() * 3600) /10)
					toSpheron.io[toPortId] = {
						type:'input',
						angle: toAngle,
						val: 0
					}

					mongoNet.save(toSpheron, function(docs){
						console.log('save response: ' + docs)
						//now create the actual connection object.
						var connectionObject = {
							from: fromSpheron.name,
							fromId: fromSpheron.spheronId,
							outputId: toPortId,
							to: toSpheron.name,
							toId: toSpheron.spheronId,
							inputId: fromPortId,
							generationId: fromSpheron.generationId,
							offspringId: fromSpheron.offspringId
						}

						console.log('saving connection object: ' + JSON.stringify(connectionObject))
						mongoUtils.createConnection(connectionObject, function(){
							console.log('connection object created')
							fromSpheron.io[fromPortId] = {
								type:'output',
								angle: fromAngle,
								val: 0
							}

							mongoNet.save(fromSpheron, function(docs2){
								console.log('mongonet save response: ' + docs2)
								callback()
							})
						})
					})
				})
			})
		},
		removeRandomConnection:  function(spheronetId, callback){
			/*
			* This function will delete a collection and associated to and from ports in spherons. 
			*/

			//1: find a random connection within this spheronet.
			mongoUtils._mutationHelpers.getRandomConnectionBySpheronetId(spheronetId, function(thisConnection){
				//this is stupid - but its to late to fix this.... Next major.
				//from is: fromId, outputId
				//to it: toId, inputId
				console.log('link from: sp=' + thisConnection.fromId + ' : ' + thisConnection.outputId + ' to this connection object: ')
					//delete the port in the from spheron
					
				mongoUtils._mutationHelpers.deletePortFromSpheron(thisConnection.fromId, spheronetId, thisConnection.outputId, function(){
					console.log('we have deleted one end of the connection')
					mongoUtils._mutationHelpers.deletePortFromSpheron(thisConnection.toId, spheronetId, thisConnection.inputId, function(){
						console.log('we have deleted the other end of the connection')
						mongoNet.deleteOne({spheronetId: spheronetId, connectionId: thisConnection.connectionId}, function(err, obj){
							if(err) throw err
							console.log('we deleted connection: ' + thisConnection.connectionId + ' from spheronet: ' + spheronetId)
							callback()
						})
					})
				})
			})
		},
		tweakPort:  function(spheronetId, callback){
			console.log("tweaking port of a spheron in spheronetId: " + spheronetId)
			mongoUtils._mutationHelpers.getRandomSpheronBySpheronetId(spheronetId, function(thisSpheron){
				var randomPort = Object.keys(thisSpheron.io)[Math.floor(Math.random() * Object.keys(thisSpheron.io).length)]
				//console.log('a random port: ' +  randomPort)
				//console.log("portSettings: " + JSON.stringify(thisDoc.io[randomPort]))
				var newAngle = (Math.random > 0.5) ? thisSpheron.io[randomPort].angle + (Math.floor(Math.random() * 300) /10) : thisSpheron.io[randomPort].angle - (Math.floor(Math.random() * 300) /10)
				thisSpheron.io[randomPort].angle = newAngle
				mongoNet.save(thisSpheron)
				callback()
			})
		}
	},
	_mutationHelpers:{
		/*
		* Work in progress... Iterator...
		*/
		removeConnectionIterator(spheronetId, spheronId, ports, portIdx, callback){
			/*
			* Requires validation...
			*/
			console.log('ports: ' + JSON.stringify(ports))
			
			if(Object.keys(ports)[portIdx]){
				var thisPort = ports[Object.keys(ports)[portIdx]]
				console.log('this Port: ' + JSON.stringify(thisPort))
				//3: find the far end Spheron
				if(thisPort.type == "input"){
					console.log('Found an input port - now I need to find the connection, delete the far end outport and the connection...')
					console.log(spheronetId, spheronId, Object.keys(ports)[portIdx])
					mongoUtils._mutationHelpers.getConnectionBySpheronetToSpheronToPort(spheronetId, spheronId, Object.keys(ports)[portIdx], function(thisConnection){
						if(thisConnection){
							console.log('back from connection finder with: ' +  JSON.stringify(thisConnection))
							mongoUtils._mutationHelpers.getSpheronBySpheronIdAndSpheronetId(spheronetId, thisConnection.fromId, function(targetSpheron){
								console.log('far end spheron to delete port from is: ' + JSON.stringify(targetSpheron))
								//4: delete the correspondibg port from the far end spheron
								if(targetSpheron){
									delete(targetSpheron.io[thisConnection.outputId])
									mongoNet.save(targetSpheron, function(){
										//5: delete the conection object.
										mongoNet.deleteOne({spheronetId: spheronetId, connectionId: thisConnection.connectionId}, function(err,doc){
											//console.log('*')
											console.log('deleted spheronetId: ' +  spheronetId + ' connectionId: ' + thisConnection.connectionId)
											//Future TODO: if the far end spheron has no outputs then we should recurisvely delete it as well...
											portIdx += 1
											mongoUtils._mutationHelpers.removeConnectionIterator(spheronetId, spheronId, ports, portIdx, callback)
										})
									})
								} else {
									portIdx += 1
									mongoUtils._mutationHelpers.removeConnectionIterator(spheronetId, spheronId, ports, portIdx, callback)
								}
							})
						} else {
							console.log('no connection found - perhaps this is an input.')
							portIdx += 1
							mongoUtils._mutationHelpers.removeConnectionIterator(spheronetId, spheronId, ports, portIdx, callback)
						}
					})
				} else if(thisPort.type == "output"){
					console.log('Found an output port - now I need to delete the far end inputPort and the connection object...')
					console.log(spheronetId, spheronId, Object.keys(ports)[portIdx])
					
					mongoUtils._mutationHelpers.getConnectionBySpheronetFromSpheronFromPort(spheronetId, spheronId, Object.keys(ports)[portIdx], function(thisConnection){
						console.log('got back from getConnectionBySpheronetFromSpheronFromPort')
						if(thisConnection){
							console.log('back from connection finder with: ' +  JSON.stringify(thisConnection))
							mongoUtils._mutationHelpers.getSpheronBySpheronIdAndSpheronetId(spheronetId, thisConnection.toId, function(targetSpheron){
								console.log('far end spheron to delete port to is: ' + JSON.stringify(targetSpheron))
								//4: delete the correspondibg port from the far end spheron

								delete(targetSpheron.io[thisConnection.inputId])
								mongoNet.save(targetSpheron, function(){
									console.log('*')

									//5: delete the conection object.
									//Future TODO: if the far end spheron has no outputs then we should recurisvely delete it as well...
									mongoNet.deleteOne({spheronetId: spheronetId, connectionId: thisConnection.connectionId}, function(err,doc){
										console.log('deleted spheronetId: ' +  spheronetId + ' connectionId: ' + thisConnection.connectionId)
										//Future TODO: if the far end spheron has no outputs then we should recurisvely delete it as well...
										portIdx += 1
										mongoUtils._mutationHelpers.removeConnectionIterator(spheronetId, spheronId, ports, portIdx, callback)
									})
								})
							})
						} else {
							console.log('no connection found - perhaps this is an input.')
							portIdx += 1
							mongoUtils._mutationHelpers.removeConnectionIterator(spheronetId, spheronId, ports, portIdx, callback)						
						}					
					})
				} else {
					console.log('This connection is not an input or output (bias most likely).')
					portIdx += 1
					mongoUtils._mutationHelpers.removeConnectionIterator(spheronetId, spheronId, ports, portIdx, callback)
				}
			} else {
				console.log('no more ports to iterate over - returning back from removeConnection Iterator...')
				callback()
			}
		},
		deletePortFromSpheron(spheronId, spheronetId, portId, callback){
			var unsetString = {}
			unsetString['io.' + portId] = ""
			console.log('unset string: ' + JSON.stringify(unsetString))
			mongoNet.update({
				spheronId: spheronId,	
				spheronetId: spheronetId
			},
			{
				$unset: unsetString
			}, function(err,doc){
				if(err){
					console.log(err)
					process.exit()
				} else{
					console.log('deleted the output from the A end')
					callback()
				}
			})
		},
		getSpheronBySpheronIdAndSpheronetId: function(spheronetId, spheronId, callback){
			mongoNet.findOne({
				spheronetId: spheronetId,
				spheronId: spheronId
			}, function(err,doc){
				if(err){
					callback()
				} else if(doc){
					callback(doc)
				} else {
					callback()
				}
			})
		},
		getConnectionBySpheronetToSpheronToPort: function(spheronetId, toId, portId, callback){
			//in other words a connection which is pointing at a given spheron and port combination...
			mongoNet.findOne({
				type: 'connection',
				spheronetId: spheronetId,
				toId: toId,
				inputId: portId
			}, function(err,doc){
				if(err){
					console.log(err)
					console.log('calling back null')
					callback()
				} else if(doc){
					console.log('calling back with: ' + JSON.stringify(doc))
					callback(doc)
				} else {
					callback()
				}
			})
		},		
		getConnectionBySpheronetFromSpheronFromPort: function(spheronetId, fromId, portId, callback){
			//in other words a connection which is pointing at a given spheron and port combination...
			console.log('***')
			console.log(spheronetId,fromId,portId)
			mongoNet.findOne({
				type: 'connection',
				spheronetId: spheronetId,
				fromId: fromId,
				inputId: portId
			}, function(err,doc){
				console.log('in callback')
				console.log('getConnectionBySpheronetFromSpheronFromPort')
				if(err){
					console.log(err)
					console.log('calling back null')
					//process.exit()
					callback()
				} else if(doc){
					console.log('calling back with: ' + JSON.stringify(doc))
					//process.exit()
					callback(doc)
				} else {
					console.log('we hit the default callback')
					//process.exit()
					callback()
				}
			})
		},
		getRandomSpheronBySpheronetId: function(spheronetId, callback){
			mongoNet.aggregate([ 
				  { $match: { "type": "spheron" }},
				  { $sample: {size: 1}}
				], 
				function(err,docs){
					docs.forEach(function(thisDoc){
						if(!thisDoc){
							/*
							* Note: We should never end up down this path - but just in case...
							*/
							console.log('finished iterating')
							callback()
						} else{
							callback(thisDoc)
						}						
					})
				}
			);
		},
		getRandomConnectionBySpheronetId: function(spheronetId, callback){
			mongoNet.aggregate([ 
				  { $match: { "type": "connection" }},
				  { $sample: {size: 1}}
				], 
				function(err,docs){
					docs.forEach(function(thisDoc){
						if(!thisDoc){
							/*
							* Note: We should never end up down this path - but just in case...
							*/
							console.log('finished iterating')
							callback()
						} else{
							callback(thisDoc)
						}						
					})
				}
			);
		}
	}
}

module.exports = mongoUtils;

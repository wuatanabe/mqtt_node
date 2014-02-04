var encode= require('mqtt_packet').mqtt_encode_msg.encode_msg;
var decode= require('mqtt_packet').mqtt_decode_msg;

var moment = require('moment');
 

var loglevel= 'debug'
var Logme = require('logme').Logme;
var logme = new Logme({ level: loglevel });


// Load the TCP Library
net = require('net');
var util = require('util');
var EventEmitter = require('events').EventEmitter;


// Track the clients
var clients = [];
var clients_connected = [];
 
 var topics =[];
 var subsciptions = [];
 
var messages={   'connect'  : 'CONNECT'
			, 'connack' : 'CONNACK'
			, 'pingresp' : 'PINGRESP'
			, 'pingreq'  : 'PINGREQ'
			, 'suback'  : 'SUBACK'
			, 'unsuback' : 'UNSUBACK'
			, 'subscribe' : 'SUBSCRIBE'
			, 'unsubscribe' : 'UNSUBSCRIBE'
			, 'disconnect' : 'DISCONNECT'
			, 'publish' : 'PUBLISH'
			, 'puback' : 'PUBACK'
			, 'pubrec': 'PUBREC'
			, 'pubrel' : 'PUBREL'
			, 'pubcomp' : 'PUBCOM'
	}

 
// MQTT Server
var MQTTServer = function(){
	 
  var self = this;	
  self.bubble_events= true;	
  self.server = net.createServer(function (socket) {
  
 
  // Identify this client
  socket.name = socket.remoteAddress + ":" + socket.remotePort 
  logme.info(moment().format("YYYY/MMMM/D hh:mm:ss ")+ " -  MQTTServer :: socket.name= "+socket.name);

  
 
  // Handle incoming messages from clients
  socket.on('data', function (data) {
	var ptype =decode.decode(data)['msg_type'];  
	logme.info(moment().format("YYYY/MMMM/D hh:mm:ss ")+ " -  MQTTServer<- received "+data);
	logme.info(moment().format("YYYY/MMMM/D hh:mm:ss ")+ " -  MQTTServer<- msg_type="+ptype);  
	var buff = new Buffer(data, 'utf8');

//~ Reserved	0	Reserved
//~ CONNECT	1	Client request to connect to Server
//~ CONNACK	2	Connect Acknowledgment
//~ PUBLISH		3	Publish message
//~ PUBACK		4	Publish Acknowledgment
//~ PUBREC		5	Publish Received (assured delivery part 1)
//~ PUBREL		6	Publish Release (assured delivery part 2)
//~ PUBCOMP	7	Publish Complete (assured delivery part 3)
//~ SUBSCRIBE	8	Client Subscribe request
//~ SUBACK		9	Subscribe Acknowledgment
//~ UNSUBSCRIBE	10	Client Unsubscribe request
//~ UNSUBACK	11	Unsubscribe Acknowledgment
//~ PINGREQ	12	PING Request
//~ PINGRESP	13	PING Response
//~ DISCONNECT	14	Client is Disconnecting
//~ Reserved		15

	  switch (ptype){
	  case 1:  _send_template('pingresp', encode.pingresp, undefined)
			logme.info(moment().format("YYYY/MMMM/D hh:mm:ss ")+ " -  MQTTServer :: connected clients= "+clients_connected.length);
			clients_connected.push(socket.name); 
			break;
		
	  case 3:   _send_template('puback', encode.puback, data);
			break;
		
	  case 5:   _send_template('pubrel', encode.puback, undefined);
			break;
		
	  case 6:   _send_template('pubcomp', encode.puback, undefined);
			break;
	  
	  case 7:   _send_template('pubcom', function(){logme('');},  d)
			break;
		
	  case 8:  _send_template('suback', encode.suback, data);	
			break;
		
	  case 10:  _send_template('suback', encode.unsuback, undefined);	
			break;
			
	  case 12: _send_template('pingresp', encode.pingresp, undefined);  
			break;
			
	  case 14: _send_template('disconnect', encode.disconnect, undefined)
			clients_connected.splice(clients_connected.indexOf(socket.name), 1);	
			logme.info(moment().format("YYYY/MMMM/D hh:mm:ss ")+ " -  MQTTServer :: Connected Clients= "+clients_connected.length);	  
			break;
			
	  default: received_unknown(socket, ptype, 'UNKNOWN');
	}
		
	});

  // Remove the client from the list when it leaves
  socket.on('error', function (err) {
	  logme.inspect(err);
	  if(err['code']=='ECONNRESET'){
		  logme.info(moment().format("YYYY/MMMM/D hh:mm:ss ")+ " -  MQTTServer :: Received ECONNRESET error from Client: "+socket.name);
		  clients_connected.splice(clients_connected.indexOf(socket.name), 1);
		  logme.info(moment().format("YYYY/MMMM/D hh:mm:ss ")+ " -  MQTTServer :: Client "+socket.name+ " removed.");
		  logme.info(moment().format("YYYY/MMMM/D hh:mm:ss ")+ " -  MQTTServer :: Connected Clients= "+clients_connected.length);
		  }
	});
 
  // Remove the client from the list when it leaves
  socket.on('end', function () {
	    logme.info(moment().format("YYYY/MMMM/D hh:mm:ss ")+ " -  MQTTServer :: <end> received from socket="+socket.name);	  
	    clients.splice(clients.indexOf(socket), 1);
	    clients_connected.splice(clients_connected.indexOf(socket.name), 1);	
	    logme.info(moment().format("YYYY/MMMM/D hh:mm:ss ")+ " -  MQTTServer :: connected clients= "+clients_connected.length);	  
	    broadcast(socket.name + " left.\n");
	});
  
  // Send a message to all clients
  function broadcast(message, sender) {
    clients.forEach(function (client) {
      // Don't send to the sender
      if (client === sender) return;
      client.write(message);
    });
     // Log it to the server output too
	logme.info(message)
  }
  
 
	  
 function conditional_emit(emitted_event, emit_params){
	 if(self.bubble_events == true){
						self.emit(emitted_event,  emit_params);
						}
	 }	  

 function _send_template(key, fun, d){
	  conditional_emit(key+'_received_event', socket);
	  if(d != undefined){
		  	  var dcdd = decode.decode(d);
			  logme.inspect(dcdd);	 
		  }
	  socket.write( fun());
	  conditional_emit(key+'_sent_event', socket);
	  logme.info(moment().format("YYYY/MMMM/D hh:mm:ss ")+ " -  MQTTServer-> sent "+ messages[key]);		
	 }

});
 
	// Put a friendly message on the terminal of the server.
	logme.info(moment().format("YYYY/MMMM/D hh:mm:ss ")+ " - MQTTServer> started at port 1883\n");
};

util.inherits(MQTTServer, EventEmitter);
module.exports = MQTTServer;
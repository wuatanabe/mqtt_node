var loglevel= 'debug'
var Logme = require('logme').Logme;
var logme = new Logme({ level: loglevel });

var packet =require('mqtt_packet');
var server_handler = require('./lib/server/server_handler.js');

//var client_handler = require('./lib/client/client_handler.js');
server_handler.builtin_handlers={
	'subscribe_received_event' : false,
	'suback_sent_event' : true,
	'subscribe_received_event' : false,
	'connect_decoded_msg' : false,
	};

server_handler.builtin_handlers['suback_sent_event']= true;
server_handler.bubble_events = true; 
	
server_handler.on('suback_sent_event', function(params) {
		logme.inspect(params);
});



server_handler.server.listen(1883);
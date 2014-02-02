var packet =require('mqtt_packet');
var server_handler = require('./lib/server/server_handler.js');

//var client_handler = require('./lib/client/client_handler.js');
server_handler.builtin_handlers={
	'subscribe_received_event' : false,
	'suback_sent_event' : false
	};

server_handler.builtin_handlers['suback_sent_event']= false;
server_handler.bubble_events = false; 
	
server_handler.on('suback_sent_event', function(socket) {
	console.log(socket);
});



server_handler.server.listen(1883);
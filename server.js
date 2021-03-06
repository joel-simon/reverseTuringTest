var express = require("express")
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , _ = require("underscore");

server.listen(9002);

io.set('log level', 1);

// var server = app.listen(9002);

/*
 The list of participants in our chatroom.
 The format of each participant will be:
 {
 id: "sessionId",
 name: "participantName"
 }
 */
var participants = []

/* Server config */

//Server's IP address
// app.set("ipaddr", "http://204.236.234.28");

//Server's port number
// app.set("port", 3030);

//Specify the views folder
app.set("views", __dirname + "/views");

//View engine is Jade
app.set("view engine", "jade");

//Specify where the static content is
app.use(express.static("public", __dirname + "/public"));

//Tells server to support JSON, urlencoded, and multipart requests
app.use(express.bodyParser());

/* Server routing */

//Handle route "GET /", as in "http://localhost:8080/"

app.get("/", function(request, response) {
  //Render the view called "index"
  response.render("index");
});

app.get("/human", function(request, response) {
  //Render the view called "index"
  response.render("player");

});
app.get("/bot", function(request, response) {
  //Render the view called "index"
  var name = request.query.n;
  response.render("bot", {'name': name});
});

app.get("/hidden", function(request, response) {
  //Render the view called "index"
  var name = request.query.n;
  response.render("hiddenPlayer", {'name': name});
});
app.get("/game", function(request, response) {
  response.render("game");
});

//POST method to create a chat message
app.post("/message", function(request, response) {

  //The request body expects a param named "message"
  var message = request.body.message;

  //If the message is empty or wasn't sent it's a bad request
  if(_.isUndefined(message) || _.isEmpty(message.trim())) {
    return response.json(400, {error: "Message is invalid"});
  }

  //We also expect the sender's name with the message
  var name = request.body.name;

  //Let our chatroom know there was a new message
  io.sockets.emit("incomingMessage", {message: message, name: name});

  //Looks good, let the client know
  response.json(200, {message: "Message received"});

});

/* Socket.IO events */
io.on("connection", function(socket){

  /*
   When a new user connects to our server, we expect an event called "newUser"
   and then we'll emit an event called "newConnection" with a list of all
   participants to all connected clients
   */
  socket.on("newUser", function(data) {
    participants.push({id: data.id, name: data.name});
    io.sockets.emit("newConnection", {participants: participants});
  });

  /*
   When a user changes his name, we are expecting an event called "nameChange"
   and then we'll emit an event called "nameChanged" to all participants with
   the id and new name of the user who emitted the original message
   */
  socket.on("nameChange", function(data) {
    _.findWhere(participants, {id: socket.id}).name = data.name;
    io.sockets.emit("nameChanged", {id: data.id, name: data.name});
  });

  /*
   When a client disconnects from the server, the event "disconnect" is automatically
   captured by the server. It will then emit an event called "userDisconnected" to
   all participants with the id of the client that disconnected
   */
  socket.on("disconnect", function() {
    participants = _.without(participants,_.findWhere(participants, {id: socket.id}));
    io.sockets.emit("userDisconnected", {id: socket.id, sender:"system"});
  });

});

//Start the http server at port and IP defined before


// http.listen(app.get("port"), app.get("ipaddr"), function() {
//   console.log("Server up and running. Go to http://" + app.get("ipaddr") + ":" + app.get("port"));
// });
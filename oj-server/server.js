const express = require('express');
const app = express();

const path = require('path');

var http = require('http');
var socketIO = require('socket.io');
var io = socketIO();
var editorSocketService = require('./services/editorSocketService')(io);

const restRouter = require('./routes/rest');

// connect monodb
const mongoose = require('mongoose');
mongoose.connect('mongodb://user:Welcome1@ds245150.mlab.com:45150/problemdb');

//app.get('/', (req, res) => res.send('Hello World!!!'));
app.use('/api/v1', restRouter);
// express.static: middleware, make the server to serve static files
// __dirname: current path where the file is located
// '../public' is relative path. therefore we join th e path or __dirname and '..public'
app.use(express.static(path.join(__dirname, '../public/')));
// if the url is not handled by roter on the server side
// the server send index.html from the public folder
app.use((req, res) => {
	res.sendFile('index.html', {root: path.join(__dirname, '../public/')});
})

// app.listen(3000, () => console.log('Example app listening on port 3000!'));
const server = http.createServer(app);
io.attach(server);
server.listen(3000);

server.on('listening', onListening);

function onListening() {
	console.log('App listening on port 3000');
}

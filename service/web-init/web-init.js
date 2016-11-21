'use strict';
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

const permissionMasterGen = require('permission-master');

//START OF moduleFunction() ============================================================

var moduleFunction = function(args) {

	qtools.validateProperties({
		subject: args || {},
		targetScope: this, //will add listed items to targetScope
		propList: [
			{
				name: 'config',
				optional: false
			},
			{
				name: 'initCallback',
				optional: false
			}
		]
	});

	this.permissionMaster = new permissionMasterGen(args);

	//LOCAL FUNCTIONS ====================================

	//METHODS AND PROPERTIES ====================================

	this.shutdown = (message, callback) => {
		callback('', message);
	}

	//START SERVER =======================================================

	this.startServer = () => {

		app.use(function(err, req, res, next) {
			err=err?err:{};
			if (!err.code || typeof (+err.code) != 'number'){
				err.code=500;
			}
			if (err.errorObject){
				err.errorText=err.errorObject;
			}
			res.status(err.code).send({errorSource:'web-init', errorText:(err.errorText || err.message || 'unexpected error')});
		});

		const server = app.listen(this.config.system.port);

		server.on('listening', function() {
			var address = server.address();
			var url = 'http://' + (address.address === '::' ?
				'localhost' : address.address) + ':' + address.port;

			qtools.message(`done-serve starting on ${url} 
at ${new Date().toLocaleDateString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			})} `);
		});

	}

	//SET UP SERVER =======================================================

	app.use(bodyParser.urlencoded({
		extended: true
	}))
	app.use(bodyParser.json())

	app.use((req, res, next) => {
		if (typeof (this.transactionCount) == 'undefined') {
			this.transactionCount = 0;
		}
		this.transactionCount++;
		//	console.log("transaction# " + this.transactionCount + " =======================\n");
		next();
	});

	app.use((req, res, next) => {
		const headers = {};
		for (var i in req.headers) {
			var element = req.headers[i];
			if (!(i.match(/^x-/) || i.match(/^host/))) {
				headers[i] = element;
			}
		}
		req.headers = headers;
		next();
	});
	app.use((req, res, next) => {
		console.log(`req.path= ${req.path}`);
		next();
	});

	const unpackRequest = (req, res, next) => {
		/*to accomodate the token, the transfer format is:
			{
				data://whatever the data source wants,
				token://whatever the security system wants
			}
		*/
		if (req.query) {
			if (req.query.token) {
				req.token = req.query.token;
			}
			delete req.query.token;
			req.query = req.query.data;
		}
		if (req.body) {
			if (req.body.token) {
				req.token = req.body.token;
			}
			delete req.body.token;
			req.body = req.body.data;
		}

			if (req.body && req.body.token){
			delete req.body.token;
			}


		next();
	};

	app.use(unpackRequest, this.permissionMaster.checkPath);

	//INITIALIZATION ====================================

	this.router = app;
	this.initCallback();

	return this;
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();


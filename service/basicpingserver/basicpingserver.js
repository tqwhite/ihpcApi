#!/usr/local/bin/node
'use strict';
var qtools = require('qtools');
var qtools = new qtools(module);
var events = require('events');
var util = require('util');


var express = require('express');
var app = express();
var bodyParser = require('body-parser');




/*

THIS FILE IS A SERVER RUN AT BOOT ON QBOOK BY LAUNCHCTL

/Library/LaunchDaemons/local.qbook.simplePingServer.plist
(yes, I know it's misspelled but I don't want to spend the time to change it.)

IT IS SERVED BY NGINX

/usr/local/conf/nginx.conf

There is an associated BASH script at

~/Scripts/bin/bash/basicPingServerMgmt

*/


//START OF moduleFunction() ============================================================

var moduleFunction = function(args) {
	events.EventEmitter.call(this);
	this.forceEvent = forceEvent;
	this.args = args;
	this.metaData = {};
	this.addMeta = function(name, data) {
		this.metaData[name] = data;
	}

	qtools.validateProperties({
		subject: args || {},
		targetScope: this, //will add listed items to targetScope
		propList: [
			{
				name: 'config',
				optional: true
			}
		]
	});


	var self = this;
	var forceEvent = function(eventName, outData) {
		this.emit(eventName, {
			eventName: eventName,
			data: outData
		});
	};

	//LOCAL FUNCTIONS ====================================

	var dummyDataSource = function() {
		return {
			dateNow: Date.now()
		}
	}

	var dumpToConsole = function(req) {

		// console.dir({"req.headers":req.headers});
		// console.dir({"req.body":req.body});
	}

	//METHODS AND PROPERTIES ====================================

	this.shutdown = () => {
		return '';
	}

	//INITIALIZATION ====================================

	//SET UP SERVER =======================================================


	//SET UP SERVER =======================================================

	app.use(bodyParser.urlencoded({
		extended: true
	}))
	app.use(bodyParser.json())

	app.use(function(req, res, next) {
		if (typeof (self.transactionCount) == 'undefined') {
			self.transactionCount = 0;
		}
		self.transactionCount++;
		//	console.log("transaction# " + self.transactionCount + " =======================\n");
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
		req.headers=headers;
		next();
	});

	var router = express.Router();
	app.use('/', router);

	//START SERVER AUTHENTICATION =======================================================

	//router.use(function(req, res, next) {});

	//START SERVER ROUTING FUNCTION =======================================================


	router.get(/.*/, function(req, res, next) {
		// 		console.log('access from empty path/get');
		// 		dumpToConsole(req);

		res.set({
			'content-type': 'application/json;charset=ISO-8859-1',
			messageid: qtools.newGuid(),
			messagetype: 'RESPONSE',
			responsesource: 'basicPingServer',
			connection: 'Close'
		});
		
		res.json({
			status: `hello from ${self.config.system.name}//${self.config.user}${req.path} GET reflector (${self.transactionCount})`,
			headers: req.headers,
			body: req.body,
			query: req.query,
			data: dummyDataSource()
		});
	});

	router.post(/.*/, function(req, res, next) {
		// 		console.log('access from empty path/post');
		// 		dumpToConsole(req);

		res.set({
			'content-type': 'application/json;charset=ISO-8859-1',
			messageid: qtools.newGuid(),
			messagetype: 'RESPONSE',
			responsesource: 'basicPingServer',
			connection: 'Close'
		});
		res.json({
			status: `hello from ${self.config.user}${req.path} POST reflector (${self.transactionCount})`,
			headers: req.headers,
			body: req.body,
			query: req.query,
			data: dummyDataSource()
		});
	});

	//START SERVER =======================================================

	app.listen(this.config.system.port);

	qtools.message('Magic happens on port ' + this.config.system.port);

	return this;
};

//END OF moduleFunction() ============================================================

util.inherits(moduleFunction, events.EventEmitter);
module.exports = moduleFunction;

//test urls
//curl 'http://localhost:9000/ping' --data 'x=y'
//curl 'http://localhost:9000/ping'
//curl 'http://localhost:9000/'



#!/usr/local/bin/node
'use strict';
var qtools = require('qtools');
var qtools = new qtools(module);
var events = require('events');
var util = require('util');

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
			},
			{
				name: 'router',
				optional: false
			},
			{
				name: 'permissionMaster', //I don't know if this will be needed but, it's standard equipment so I am passing it through
				optional: false
			},
			{
				name: 'initCallback',
				optional: false
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

	//METHODS AND PROPERTIES ====================================

	this.shutdown = (message, callback) => {
		callback('', message);
	}

	//START SERVER ROUTING FUNCTION =======================================================

	this.router.get(/ping/, function(req, res, next) {

		res.set({
			'content-type': 'application/json;charset=ISO-8859-1',
			messageid: qtools.newGuid(),
			messagetype: 'RESPONSE',
			responsesource: 'utilityServer',
			connection: 'Close'
		});

		res.json({
			status: `hello from ${self.config.system.name}//${self.config.user}${req.path} GET`,
			headers: req.headers,
			body: req.body,
			query: req.query
		});
	});

	this.router.post(/ping/, function(req, res, next) {

		res.set({
			'content-type': 'application/json;charset=ISO-8859-1',
			messageid: qtools.newGuid(),
			messagetype: 'RESPONSE',
			responsesource: 'utilityServer',
			connection: 'Close'
		});
		res.json({
			status: `hello from ${self.config.user}${req.path} POST`,
			headers: req.headers,
			body: req.body,
			query: req.query
		});
	});

	this.initCallback();
	return this;
};

//END OF moduleFunction() ============================================================

util.inherits(moduleFunction, events.EventEmitter);
module.exports = moduleFunction;

//test urls
//curl 'http://localhost:9000/ping' --data 'x=y'
//curl 'http://localhost:9000/ping'
//curl 'http://localhost:9000/'


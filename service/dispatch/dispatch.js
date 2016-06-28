#!/usr/local/bin/node
'use strict';
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);
const	multiIni = require('multi-ini');

const basicPingServerGen = require('../basicpingserver');

//START OF moduleFunction() ============================================================

var moduleFunction = function(args) {

	qtools.validateProperties({
		subject: args || {},
		targetScope: this, //will add listed items to targetScope
		propList: [
			{
				name: 'config',
				optional: false
			}
		]
	});
	let webReport = [];

	let reportStatus = (err, result) => {
		webReport.push({
			err: err,
			result: result
		});
	}

	//LOCAL FUNCTIONS ====================================

	let filterWebReport = (query) => {
		let outArray = [];

		for (var i = 0, len = webReport.length; i < len; i++) {
			var element = webReport[i];
			if (JSON.stringify(element).match(query.filter)) {
				outArray.push(element);
			}
		}
		return outArray;

	}

	//METHODS AND PROPERTIES ====================================


	this.shutdown = (message, callback) => {
		callback('', message);
	}

	//INITIALIZATION ====================================

	let basicPingServer;

	const startSystem = () => {

		basicPingServer = new basicPingServerGen({
			config: this.config
		});
		qtools.message("BasicPingServer system start");
	};

	const cleanup = () => {
		basicPingServer = null;
		webReport = [{
			err: '',
			result: `flushed at ${Date.now()}`
		}];
	}

	const restart = () => {
		basicPingServer.shutdown('restart', () => {
			qtools.message("RESTART");
			cleanup();
			startSystem();
		});

	}

	//START SYSTEM =======================================================
	startSystem();

	return this;
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();


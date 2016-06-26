#!/usr/local/bin/node
'use strict';
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);
const	multiIni = require('multi-ini');

const basicPingServerGen = require('./basicpingserver');

//START OF moduleFunction() ============================================================

var moduleFunction = function() {

	if (!process.env.srapiProjectPath) {
		var message = "there must be an environment variable: srapiProjectPath";

		console.log(message);
		return (message);
	}
	if (!process.env.USER) {
		var message = "there must be an environment variable: USER";

		console.log(message);
		return (message);
	}
	var configPath = process.env.srapiProjectPath + 'configs/instanceSpecific/ini/' + process.env.USER + '.ini';
	if (!qtools.realPath(configPath)) {
		var message = "configuration file " + configPath + " is missing";

		console.log(message);
		return (message);
	}

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

	//INITIALIZATION ====================================

	let config;
	let basicPingServer;

	const startSystem = () => {
		config = multiIni.read(configPath);
		config.user=process.env.USER;

		basicPingServer = new basicPingServerGen({
			config: config
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

//module.exports = moduleFunction;
module.exports = new moduleFunction();


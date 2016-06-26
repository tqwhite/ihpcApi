'use strict';
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);
const clientsGen = require('./clients');
const configGen = require('./config');
const jobcontrolGen = require('./jobcontrol');
const webcontrolGen = require('./webcontrol');

//START OF moduleFunction() ============================================================

var moduleFunction = function() {

	if (!process.env.csProjectPath) {
		var message = "there must be an environment variable: csProjectPath";
		console.log(message);
		return (message);
	}
	if (!process.env.USER) {
		var message = "there must be an environment variable: USER";
		console.log(message);
		return (message);
	}
	var configPath = process.env.csProjectPath + 'configs/instanceSpecific/ini/' + process.env.USER + '.ini';
	if (!qtools.realPath(configPath)) {
		var message = "configuration file " + configPath + " is missing";
		console.log(message);
		return (message);
	}
	var clientDirPath = process.env.csProjectPath + 'configs/clients/';
	if (!qtools.realPath(clientDirPath)) {
		var message = "configuration file " + clientDirPath + " is missing";
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

	let clientSpecList;

	let jobcontrol;

	const startSystem = () => {
		qtools.message("Cloverleaf SIF system start");
		config = new configGen({
			configPath: configPath
		});
		clientSpecList = new clientsGen({
			clientDirPath: clientDirPath
		});
		jobcontrol = new jobcontrolGen({
			config: config,
			clientSpecList: clientSpecList.get(),
			reportCallback: reportStatus
		});
	};

	const cleanup = () => {
		jobcontrol = null;
		webReport = [{
			err: '',
			result: `flushed at ${Date.now()}`
		}];
	}

	const restart = () => {
		jobcontrol.shutdown('restart', () => {
			qtools.message("RESTART");
			cleanup();
			startSystem();
		});

	}

	//START SYSTEM =======================================================
	startSystem();

	//SET UP WEB INTERFACE =======================================================
	const webControl = new webcontrolGen({
		webInterface: config.get('webInterface'),
		restart: restart,
		filterWebReport: filterWebReport
	});

	//SET UP SIGNAL LISTENERS =======================================================
	process.on('SIGINT', () => {
		qtools.writeSureFile('/Users/tqwhite/tmp/SIGINT', Date.now());
		jobcontrol.shutdown('SIGINT', () => {
			cleanup(); //not actually necessary until I make it restart, but won't hurt
			qtools.die('SIGINT');
		});
	});

	process.on('SIGTERM', () => {
		qtools.writeSureFile('/Users/tqwhite/tmp/SIGTERM', Date.now());
		jobcontrol.shutdown('SIGTERM', () => {
			cleanup(); //not actually necessary until I make it restart, but won't hurt
			qtools.die('SIGTERM');
		});
	});
	return this;
};

//END OF moduleFunction() ============================================================

//module.exports = moduleFunction;
module.exports = new moduleFunction();


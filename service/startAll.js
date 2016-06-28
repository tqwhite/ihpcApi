#!/usr/local/bin/node
'use strict';
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);
const multiIni = require('multi-ini');
const dispatchGen = require('./dispatch');
const async = require('async');

//START OF moduleFunction() ============================================================

var moduleFunction = function() {

	//VALIDATION ====================================

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

	//LOCAL VARIABLES ====================================

	let webReport = [];
	let workerList = {};

	//LOCAL FUNCTIONS ====================================

	//METHODS AND PROPERTIES ====================================

	//INITIALIZATION ====================================

	let config;

	const startSystem = () => {
		config = multiIni.read(configPath);
		config.user = process.env.USER;

		workerList.dispatch = new dispatchGen({
			config: config
		});;
	};

	const cleanup = () => {
		let nameString = '';
		for (var i in workerList) {
			workerList[i] = null;
			nameString = `${i}, `;
		}
		qtools.message(`[${nameString.replace(/, $/, '')}] were flushed at ${Date.now()}`);

		workerList={};
	}

	//START SYSTEM =======================================================
	startSystem();


	//for each thing that needs shutting down
	// 	workerList.dispatch = new dispatchGen({
	// 		config: config
	// 	});
	// 	workerList.push(workerList.dispatch);

	//SET UP SIGNAL LISTENERS =======================================================

	const buildShutdownList = (message) => {
		const shutdownList = [];
		for (var i in workerList) {
			var worker = workerList[i];
			shutdownList.push(
				(done) => {
					worker.shutdown(message, done)
				}
			);
		}
		return shutdownList;
	};

	//this is presently not attached to anything
	const restart = () => {
		async.parallel(buildShutdownList('restart'), () => {
			cleanup();
			startSystem();
		});
	}

	process.on('SIGINT', () => {
		async.parallel(buildShutdownList('SIGINT'), () => {
			cleanup();
			qtools.die('SIGINT');
		});
	});

	process.on('SIGTERM', () => {
		async.parallel(buildShutdownList('SIGTERM'), () => {
			cleanup();
			qtools.die('SIGTERM');
		});
	});
	return this;
};

//END OF moduleFunction() ============================================================

//module.exports = moduleFunction;
module.exports = new moduleFunction();


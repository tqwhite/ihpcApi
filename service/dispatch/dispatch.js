#!/usr/local/bin/node
'use strict';
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);
const multiIni = require('multi-ini');
const async = require('async');

const utilityServerGen = require('../utilityServer');

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
				name: 'router',
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
	let workerList = {};

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

	const startSystem = () => {
		workerList.utilityServer = new utilityServerGen({
			config: this.config,
			router: this.router
		});
	};

	const buildShutdownList = (message) => {
		const shutdownList = [];
		for (var i in workerList) {
			var worker = workerList[i];
			shutdownList.push(
				((i) => {
					return (done) => {
						workerList[i].shutdown(message, done)
					}
				})(i)
			);
		}
		return shutdownList;
	};

	const cleanup = () => {
		let nameString = '';
		for (var i in workerList) {
			workerList[i] = null;
			nameString += `${i}, `;
		}
		qtools.message(`[${nameString.replace(/, $/, '')}] were flushed at ${Date.now()}`);
		workerList = {};
	}

	//METHODS AND PROPERTIES ====================================

	this.shutdown = (message, callback) => {
		async.parallel(buildShutdownList(message), () => {
			cleanup();
			callback('', message);
		});
	}

	//INITIALIZATION ====================================

	let utilityServer;

	//START SYSTEM =======================================================
	startSystem();
	return this;
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();


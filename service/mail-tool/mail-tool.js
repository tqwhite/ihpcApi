'use strict';
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);
const async = require('async');

const mongoose = require('mongoose');

const collectorGen = require('mt-collector');
const messagesGen = require('mt-messages');
const senderGen = require('mt-sender');
const sourcesGen = require('mt-sources');

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
				name: 'apiManager',
				optional: true
			},
			{
				name: 'router',
				optional: false
			},
			{
				name: 'permissionMaster',
				optional: false
			},
			{
				name: 'initCallback',
				optional: false
			}
		]
	});

	//LOCAL VARIABLES ====================================

	let workerList = {};

	//NOTE: mongoose is a GLOBAL (yuck). It is initialized in
	// service/database-api-server/database-api-server.js


	//LOCAL FUNCTIONS ====================================

	const startSystem = () => {

		const startList = [];

		startList.push((done) => {
			const workerName = 'messages'
			new messagesGen({
				database: mongoose,
				apiManager:this.apiManager.init(workerName),
				config: this.config,
				initCallback: function() {
					workerList[workerName] = this; done();
				}
			});
		});

		startList.push((done) => {
			const workerName = 'collector'
			new collectorGen({
				messageQueue: workerList['messages'],
				database: mongoose,
				apiManager:this.apiManager.init(workerName),
				config: this.config,
				initCallback: function() {
					workerList[workerName] = this; done();
				}
			});
		});

		startList.push((done) => {
			const workerName = 'sender'
			new senderGen({
				apiManager:this.apiManager.init(workerName),
				config: this.config,
				initCallback: function() {
					workerList[workerName] = this; done();
				}
			});
		});

		startList.push((done) => {
			const workerName = 'sources'
			new sourcesGen({
				apiManager:this.apiManager.init(workerName),
				config: this.config,
				initCallback: function() {
					workerList[workerName] = this; done();
				}
			});
		});

		async.series(startList, () => {
			this.initCallback && this.initCallback();
		});
	};

	//METHODS AND PROPERTIES ====================================

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

	this.shutdown = (message, callback) => {
		async.parallel(buildShutdownList(message), () => {
			cleanup();
			callback('', message);
		});
	}

	//API ENDPOINTS ====================================

	//INITIALIZATION ====================================

	startSystem();

	return this;
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();


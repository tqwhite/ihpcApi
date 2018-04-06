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
	};

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
				name: 'apiManager',
				optional: true
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
		};
	};

	//METHODS AND PROPERTIES ====================================

	this.shutdown = (message, callback) => {
		callback('', message);
	};

	//START SERVER ROUTING FUNCTION =======================================================

	const encipher = (inData, secret, salt) => {
		secret = secret ? secret : this.config.system.secret;
		salt = salt ? salt : secret;

		const cryptoLocal = require('crypto');

		const cipher = cryptoLocal.createCipher('aes-256-cbc', secret + salt);
		var encrypted = cipher.update(inData, 'utf8', 'hex');
		encrypted += cipher.final('hex');

		return encrypted;
	};

	const decipher = (encryptedData, secret, salt) => {
		secret = secret ? secret : this.config.system.secret;
		salt = salt ? salt : secret;
		const crypto = require('crypto');
		let decrypted;
		try {
			const decipher = crypto.createDecipher('aes-256-cbc', secret + salt);

			decrypted = decipher.update(encryptedData, 'hex', 'utf8');
			decrypted += decipher.final('utf8'); //this gives a wrong block size error if hex is changed to base64, works for this without it
		} catch (e) {
			return { errmsg: e.toString() };
		}
		return decrypted.toString();
	};

	if (this.config.system.baseDomain == 'careplanner.local') {
		const stores = Object.keys(this.config.storeData);
		qtools.logDev(`================ ================\n`);
		stores.forEach(storeId => {
			qtools.logDev(
				`\n${storeId.toUpperCase()} (only on careplanner.local)\nhttps://${
					this.config.system.baseDomain
				}/api/utility/transactionToken/{"storeId":"${storeId}","months":"12","role":"nurse","transactionId":"${Math.floor(
					Math.random() * 100000
				)}","secret":"${this.config.storeData[storeId].secret}"}\n\n `
			);
		});
		qtools.logDev(`================ ================/n`);
	}

	let route = new RegExp('utility/transactionToken/.*$');
	this.permissionMaster.addRoute('get', route, 'all');
	this.router.get(route, (req, res, next) => {
		const tmpJsonInput = req.path.match(/utility\/transactionToken\/(.*)$/);
		const inData = JSON.parse(tmpJsonInput[1]);
		const secret = inData.secret;
		const tokenString = `${inData.transactionId}_${inData.months}_${
			inData.role
		}_${inData.storeId}`;

		const newToken = `${inData.storeId}_${inData.transactionId}_${encipher(
			tokenString,
			secret,
			inData.transactionId
		)}`;

		res.set({
			'content-type': 'application/json;charset=utf-8',
			messageid: qtools.newGuid(),
			messagetype: 'RESPONSE',
			responsesource: 'utilityServer',
			connection: 'Close'
		});
		res.json({
			status: `hello from ${self.config.system.name} ${self.config.user}${
				req.path
			} GET`,
			headers: req.headers,
			body: req.body,
			query: req.query,
			token: newToken,
			claims: tokenString + String.fromCharCode(11),
			url: `https://${
				this.config.system.baseDomain
			}/updateSubscription/${newToken}`
		});
	});

	route = new RegExp('ping$');
	this.permissionMaster.addRoute('post', route, 'all');
	this.router.post(route, function(req, res, next) {
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

	//INITIALIZATION ====================================

	this.apiManager.registerApi('encipher', encipher);
	this.apiManager.registerApi('decipher', decipher);

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

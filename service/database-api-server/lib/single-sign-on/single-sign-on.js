'use strict';
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);

const msalAzureGen=require('./lib/azure-msal-functions');

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
	
	const {placeholeder}=this.config['single-sign-on'];




	//LOCAL VARIABLES ====================================

	//LOCAL FUNCTIONS ====================================

	//METHODS AND PROPERTIES ====================================

	this.shutdown = (message, callback) => {
		console.log(
			`
		shutting down ${__dirname}`
		);
		callback('', message);
	};

	//API ENDPOINTS ====================================

	let route;
	let method;

	route = new RegExp('azureMsal/ssoReturn/(.*)$');
	method = 'post';
	this.permissionMaster.addRoute(method, route, 'all');
	this.router[method](route, (req, res, next) => {
	
	res.redirect(state.redirectTo);
	
	});
	//INITIALIZATION ====================================
	this.initCallback();
	return this;
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();

'use strict';
const qtoolsGen = require('qtools');
const qtools = new qtoolsGen(module);


var express = require('express');
var app = express();
var bodyParser = require('body-parser');


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


	//LOCAL FUNCTIONS ====================================



	//METHODS AND PROPERTIES ====================================


	this.shutdown = (message, callback) => {
		callback('', message);
	}

	//START SERVER =======================================================
	
	this.startServer=()=>{

		app.listen(this.config.system.port);

		qtools.message('Magic happens on port ' + this.config.system.port);
	
	}

	//SET UP SERVER =======================================================

	app.use(bodyParser.urlencoded({
		extended: true
	}))
	app.use(bodyParser.json())

	app.use((req, res, next) => {
		if (typeof (this.transactionCount) == 'undefined') {
			this.transactionCount = 0;
		}
		this.transactionCount++;
		//	console.log("transaction# " + this.transactionCount + " =======================\n");
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

	//INITIALIZATION ====================================

	this.router=router;


	return this;
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction;
//module.exports = new moduleFunction();







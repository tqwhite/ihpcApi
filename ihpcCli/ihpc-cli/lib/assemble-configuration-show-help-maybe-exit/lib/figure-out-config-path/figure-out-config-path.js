#!/usr/bin/env node
'use strict';
const path = require('path');
const fs = require('fs');

/*

From system to system, this file is almost always customized for particular needs.
This one is very specialized for use as a distributable app.

*/

//START OF moduleFunction() ============================================================
const moduleFunction = function({ xxx } = {}) {
	const { xLog, applicationBasePath } = process.global;
	
	const getConfigPath = ({ fileString } = {}) => {

		if (fileString && fs.existsSync(fileString)) {
			return fileString;
		}
		
		const configFilePath = path.join(
			applicationBasePath,
			'configs',
			'systemParameters.ini'
		);

		if (fs.existsSync(configFilePath)) {
			return configFilePath;
		}
		return;
	};
	return { getConfigPath };
};
//END OF moduleFunction() ============================================================
module.exports = moduleFunction;

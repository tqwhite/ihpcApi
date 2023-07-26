#!/usr/bin/env node
'use strict';

const commandLineParser = require('qtools-parse-command-line');
const commandLineParameters = commandLineParser.getParameters();

const qt = require('qtools-functional-library');
//console.dir(qt.help());

const chalk = require('chalk');
const util = require('util');
//START OF moduleFunction() ============================================================

const moduleFunction = function() {
	const annotation = `HELLO FROM: ${__filename}. Note: this function accesses commandLineParameters directly.`;

	const { silent, quiet, verbose, noColor } = commandLineParameters.switches; //flags used here need to be added to assemble-configuration-show-help-maybe-exit.js
	
	const outputFunction = (message, options = {}) => {

		const finalOptions = {
			...{
				depth: 4
			},
			...options,
			...{ colors: noColor ? false : true }
		};

		if (typeof message == 'object') {
			message = util.inspect(message, finalOptions);
		}

		console.error(message);
	};
	const color =
		'writing to file' === true ? new chalk.Instance({ level: 0 }) : chalk; //wanted to figure out how I could write clean messages to files if I ever want to

	const error = (message, options = {}) => {
		if (silent) {
			return;
		}
		outputFunction(color.red(message), options);
	};
	const result = (message, options = {}) => {
		console.log(message);
	};

	const status = (message, options = {}) => {
		if (silent || quiet) {
			return;
		}
		outputFunction(message, options);
	};
	
	const emphatic = (message, options = {}) => {
		if (silent || quiet) {
			return;
		}
		if (!noColor) {
			outputFunction(color.bgBlack.yellow(message)), options;
		} else {
			outputFunction(`*** ${message} ***`), options;
		}
	};

	const verboseFunction = (message, options = {}) => {
		if (silent || !verbose) {
			return;
		}

		outputFunction(message, options);
	};

	const xLog={
		annotation,
		error,
		result,
		status,
		emphatic,
		verbose: verboseFunction,
		color
	};
	


	return xLog;
};

//END OF moduleFunction() ============================================================

module.exports = moduleFunction();

/*

https://www.npmjs.com/package/chalk

eg,

const error = chalk.bold.red;

Styles

Modifiers
	reset - Resets the current color chain.
	bold - Make text bold.
	dim - Emitting only a small amount of light.
	italic - Make text italic. (Not widely supported)
	underline - Make text underline. (Not widely supported)
	inverse- Inverse background and foreground colors.
	hidden - Prints the text, but makes it invisible.
	strikethrough - Puts a horizontal line through the center of the text. (Not widely supported)
	visible- Prints the text only when Chalk has a color level > 0. Can be useful for things that are purely cosmetic.
Colors
	black
	red
	green
	yellow
	blue
	magenta
	cyan
	white
	blackBright (alias: gray, grey)
	redBright
	greenBright
	yellowBright
	blueBright
	magentaBright
	cyanBright
	whiteBright
Background colors
	bgBlack
	bgRed
	bgGreen
	bgYellow
	bgBlue
	bgMagenta
	bgCyan
	bgWhite
	bgBlackBright (alias: bgGray, bgGrey)
	bgRedBright
	bgGreenBright
	bgYellowBright
	bgBlueBright
	bgMagentaBright
	bgCyanBright
	bgWhiteBright

*/

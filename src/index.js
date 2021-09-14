const { run: readAndParse } = require("./ExecFromFile");
const { run } = require("./ExecFromSource");
const { TYPES } = require('./TokenTypes');
const Result = require('./Result');
const { Context, SymbolTable } = require('./Context');
const {RTError} = require('./Error');
const Ast = require('./Ast');

module.exports = {
	parse: run,
	readAndParse,
	Ast,
	RTError,
	Result,
	tokenTypes: TYPES,
	Context,
	SymbolTable
};

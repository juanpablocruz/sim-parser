const assert = require("chai").assert;
const fs = require("fs");
const { Lexer } = require("../../src/Lexer");
const { Parser } = require("../../src/Parser");
const Ast = require("../../src/Ast");

const getTokens = (filename) => {
	const sample = fs.readFileSync(filename).toString();
	const lexer = new Lexer(filename, sample);
	const { tokens } = lexer.makeTokens();
	return tokens;
};

describe("Ast", () => {

	describe("Test toSIM from ast", () => {
		const ast = require('../samples/from-ast.js')
		const sim = new Ast(ast).toSIM()
		assert.exists(sim)
	})
	
	describe("Check instantiation", () => {
		const tokens = getTokens("./test/samples/parser.test.sim");
		assert.exists(tokens);
		const parser = new Parser(tokens);

		const parsedResult = parser.parse();

		const ast = new Ast(parsedResult.value)
		const sim = ast.toSIM()
		
		assert.exists(ast);
	})
})
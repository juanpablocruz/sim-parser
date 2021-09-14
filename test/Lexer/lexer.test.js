const assert = require("chai").assert;
const fs = require("fs");
const { Lexer } = require("../../src/Lexer");
const { TYPES } = require("../../src/TokenTypes");

describe("Lexer", () => {
	const getTokens = (filename) => {
		const sample = fs.readFileSync(filename).toString();
		const lexer = new Lexer(filename, sample);
		const { tokens } = lexer.makeTokens();
		return tokens;
	};

	describe("Check instantiation", () => {
		it("should be able to instantiate with code", () => {
			const lexer = new Lexer("test", "with Form MyForm1");
			assert.exists(lexer);
		});

		it("should be able to instantiate without code", () => {
			const lexer = new Lexer("test");
			assert.exists(lexer);
		});
	});

	describe("Check advance", () => {
		it("should be able to advance", () => {
			const lexer = new Lexer("test", "with Form MyForm1");
			assert.equal(lexer.currentChar, "w");
			assert.equal(lexer.pos.col, 0);
			assert.equal(lexer.pos.line, 0);
			lexer.advance();
			assert.equal(lexer.currentChar, "i");
			assert.equal(lexer.pos.col, 1);
			assert.equal(lexer.pos.line, 0);
		});

		it("should be able to advance and reverse to same point", () => {
			const lexer = new Lexer("test", "with Form MyForm1");
			const firstPos = lexer.pos.copy();
			const firstPosObj = {
				col: firstPos.col,
				index: firstPos.index,
				line: firstPos.line,
				char: lexer.currentChar,
			};
			lexer.advance();
			const secondPos = lexer.pos.copy();
			const secondPosObj = {
				col: secondPos.col,
				index: secondPos.index,
				line: secondPos.line,
				char: lexer.currentChar,
			};
			assert.notDeepEqual(firstPosObj, secondPosObj);
			lexer.reverse();
			const thirdPos = lexer.pos.copy();
			const thirdPosObj = {
				col: thirdPos.col,
				index: thirdPos.index,
				line: thirdPos.line,
				char: lexer.currentChar,
			};
			assert.notDeepEqual(thirdPosObj, secondPosObj);
			assert.deepEqual(thirdPosObj, firstPosObj);
		});
	});

	describe("Check comparisons", () => {
		it("should be able to parse LTE", () => {
			const lexer = new Lexer("test", "is <=");
			const result = lexer.makeIdentifier();
			assert.equal(result.type, TYPES.TT_LTE);
		});
		it("should be able to parse GTE", () => {
			const lexer = new Lexer("test", "is >=");
			const result = lexer.makeIdentifier();
			assert.equal(result.type, TYPES.TT_GTE);
		});
		it("should be able to parse LT", () => {
			const lexer = new Lexer("test", "is <");
			const result = lexer.makeIdentifier();
			assert.equal(result.type, TYPES.TT_LT);
		});
		it("should be able to parse GT", () => {
			const lexer = new Lexer("test", "is >");
			const result = lexer.makeIdentifier();
			assert.equal(result.type, TYPES.TT_GT);
		});
		it("should be able to parse equals", () => {
			const lexer = new Lexer("test", "is");
			const result = lexer.makeIdentifier();
			assert.equal(result.type, TYPES.TT_EQ);
		});
		it("should be able to parse match", () => {
			const lexer = new Lexer("test", "match");
			const result = lexer.makeIdentifier();
			assert.equal(result.type, TYPES.TT_MATCH);
		});
	});

	describe("Check make number", () => {
		it("should be able to parse int", () => {
			const lexer = new Lexer("test", "5");
			const result = lexer.makeNumber();
			assert.equal(result.type, TYPES.TT_INT);
			assert.equal(result.value, "5");
		});
		it("should be able to parse float", () => {
			const lexer = new Lexer("test", "5.2");
			const result = lexer.makeNumber();
			assert.equal(result.type, TYPES.TT_FLOAT);
			assert.equal(result.value, "5.2");
		});
		it("should be able to parse negative numbers", () => {
			const lexer = new Lexer("test", "-25");
			const { tokens } = lexer.makeTokens();
			assert.deepEqual(
				tokens.map((t) => t.type),
				[TYPES.TT_MINUS, TYPES.TT_INT, TYPES.TT_EOF]
			);
			assert.deepEqual(
				tokens.map((t) => t.value),
				[null, 25, null]
			);
		});
	});
	describe("Check token parsing", () => {
		it("Should be able to parse comments", () => {
			const tokens = getTokens("./test/samples/lexer.comments.sim");

			assert.equal(tokens.length, 2);
			assert.deepEqual(
				tokens.map((t) => t.type),
				[TYPES.TT_NEWLINE, TYPES.TT_EOF]
			);
		});
		it("should handle line breaks", () => {
			const tokens = getTokens("./test/samples/lexer.newlines.sim");
			assert.deepEqual(
				tokens.map((t) => t.type),
				[
					TYPES.TT_NEWLINE,
					TYPES.TT_NEWLINE,
					TYPES.TT_NEWLINE,
					TYPES.TT_NEWLINE,
					TYPES.TT_NEWLINE,
					TYPES.TT_EOF,
				]
			);
		});
		it("should handle tabs", () => {
			const tokens = getTokens("./test/samples/lexer.tabs.sim");
			const indentations = tokens.map((t) => t.indent);
			assert.deepEqual(indentations, [0, 0, 0, 1, 1, 0, 0]);
		});
		it("should be able to create tokens", () => {
			const tokens = getTokens("./test/samples/lexer.tokens.sim");
			const expectedTypes = [
        TYPES.TT_KEYWORD,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_NEWLINE,
        TYPES.TT_KEYWORD,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_NEWLINE,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_INT,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_NEWLINE,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_STRING,
        TYPES.TT_NEWLINE,
        TYPES.TT_NEWLINE,
        TYPES.TT_KEYWORD,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_NEWLINE,
        TYPES.TT_KEYWORD,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_NEWLINE,
        TYPES.TT_KEYWORD,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_NEWLINE,
        TYPES.TT_KEYWORD,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_EQ,
        TYPES.TT_MINUS,
        TYPES.TT_INT,
        TYPES.TT_NEWLINE,
        TYPES.TT_KEYWORD,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_KEYWORD,
        TYPES.TT_STRING,
        TYPES.TT_NEWLINE,
        TYPES.TT_KEYWORD,
        TYPES.TT_KEYWORD,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_EQ,
        TYPES.TT_STRING,
        TYPES.TT_NEWLINE,
        TYPES.TT_KEYWORD,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_KEYWORD,
        TYPES.TT_STRING,
        TYPES.TT_NEWLINE,
        TYPES.TT_KEYWORD,
        TYPES.TT_KEYWORD,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_GTE,
        TYPES.TT_INT,
        TYPES.TT_KEYWORD,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_LT,
        TYPES.TT_INT,
        TYPES.TT_KEYWORD,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_EQ,
        TYPES.TT_INT,
        TYPES.TT_NEWLINE,
        TYPES.TT_KEYWORD,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_KEYWORD,
        TYPES.TT_STRING,
        TYPES.TT_NEWLINE,
        TYPES.TT_KEYWORD,
        TYPES.TT_NEWLINE,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_IDENTIFIER,
        TYPES.TT_NEWLINE,
        TYPES.TT_EOF,
      ];
			const expectedValues = [
				"with",
				"Form",
				"MyForm1",
				null,
				"with",
				"properties",
				null,
				"width",
				3,
				"columns",
				null,
				"label",
				"Test form",
				null,
				null,
				"with",
				"Select",
				"Country",
				null,
				"with",
				"rules",
				null,
				"when",
				"clicks",
				null,
				"if",
				"value",
				"is",
				null,
				1,
				null,
				"set",
				"CoffeeSelection",
				"validation",
				"to",
				"^(1[3-4][0-9]{2}){1}|([4-7][0-9]{3})$",
				null,
				"else",
				"if",
				"value",
				"is",
				"GB",
				null,
				"set",
				"CoffeeSelection",
				"validation",
				"to",
				"^(1[3-4][0-9]{3}){1}|([4-7][0-9]{3})$",
				null,
				"else",
				"if",
				"value",
				null,
				2,
				"and",
				"value",
				null,
				5,
				"and",
				"value",
				"is",
				3,
				null,
				"set",
				"CoffeeSelection",
				"validation",
				"to",
				"^(1[3-4][0-9]{3}){1}|([4-7][0-9]{3})$",
				null,
				"else",
				null,
				"enable",
				"SubmitButton",
				null,
				null,
			];
			assert.deepEqual(
				tokens.map((t) => t.type),
				expectedTypes
			);
			assert.deepEqual(
				tokens.map((t) => t.value),
				expectedValues
			);
		});
	});
});

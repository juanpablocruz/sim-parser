const assert = require("chai").assert;
const fs = require("fs");
const { Lexer } = require("../../src/Lexer");
const { Parser } = require("../../src/Parser");
const { TYPES } = require("../../src/TokenTypes");

describe("Parser", () => {
	const getTokens = (filename) => {
		const sample = fs.readFileSync(filename).toString();
		const lexer = new Lexer(filename, sample);
		const { tokens } = lexer.makeTokens();
		return tokens;
	};

	const getComparableToken = (token) => {
		return {
			type: token.type,
			value: token.value,
			posStart: {
				index: token.posStart.index,
				line: token.posStart.line,
				col: token.posStart.col,
			},
		};
	};
    const getAstRepresentation = (node) => {
        const res = {
            type: node.type,
        };
        if (node.hasOwnProperty("node")) {
            if (Array.isArray(node.node)) {
                res.node = node.node.map(getAstRepresentation);
            } else {
                res.node = getAstRepresentation(node.node);
            }
        }

        if (node.hasOwnProperty("value")) {
            res.value = node.value;
        }

        if (node.hasOwnProperty("token")) {
            if (Array.isArray(node.token)) {
                res.token = node.token.map(getAstRepresentation);
            } else {
                res.token = getAstRepresentation(node.token);
            }
        }

        if (node.hasOwnProperty("tokenType")) {
            if (Array.isArray(node.tokenType)) {
                res.tokenType = node.tokenType.map(getAstRepresentation);
            } else {
                res.tokenType = getAstRepresentation(node.tokenType);
            }
        }
        return res;
    };

	describe("Check instantiation and token movement", () => {
		it("should instantiate the parser with a correct token array", () => {
			const expectedToken = {
				type: TYPES.TT_KEYWORD,
				value: "with",
				posStart: {
					index: 0,
					line: 0,
					col: 0,
				},
			};
			const tokens = getTokens("./test/samples/parser.advance.sim");
			assert.exists(tokens);
			const parser = new Parser(tokens);

			const currentToken = getComparableToken(parser.current_token);
			assert.exists(parser);
			assert.deepEqual(currentToken, expectedToken);
		});

		it("should instantiate the parser with empty tokens", () => {
			const parser = new Parser([]);
			assert.exists(parser);
		});

		it("should increment the token index and the current_token on advance", () => {
			const tokens = getTokens("./test/samples/parser.advance.sim");
			assert.exists(tokens);
			const parser = new Parser(tokens);

			const initialObj = {
				current_token: getComparableToken(parser.current_token),
				tokenIndex: parser.tokenIndex,
			};

			parser.advance();
			const postAdvanceObj = {
				current_token: getComparableToken(parser.current_token),
				tokenIndex: parser.tokenIndex,
			};

			assert.notDeepEqual(postAdvanceObj, initialObj);
			assert.equal(postAdvanceObj.tokenIndex, initialObj.tokenIndex + 1);
		});

		it("should be able to check boundaries", () => {
			const tokens = getTokens("./test/samples/parser.boundary.sim");
			assert.exists(tokens);
			const parser = new Parser(tokens);

			parser.advance();
			parser.advance();
			parser.advance();
			const initialObj = getComparableToken(parser.current_token);
			parser.advance();
			parser.advance();
			parser.advance();
			parser.advance();
			parser.advance();
			const sameObj = getComparableToken(parser.current_token);
			assert.deepEqual(initialObj, sameObj);
			assert.equal(initialObj.type, TYPES.TT_EOF);
		});

		it("should be able to reverse advance with reverse", () => {
			const tokens = getTokens("./test/samples/parser.advance.sim");
			assert.exists(tokens);
			const parser = new Parser(tokens);

			const initialObj = {
				current_token: getComparableToken(parser.current_token),
				tokenIndex: parser.tokenIndex,
			};

			parser.advance();
			const postAdvanceObj = {
				current_token: getComparableToken(parser.current_token),
				tokenIndex: parser.tokenIndex,
			};

			parser.reverse();
			const reverseAdvanceObj = {
				current_token: getComparableToken(parser.current_token),
				tokenIndex: parser.tokenIndex,
			};

			assert.notDeepEqual(postAdvanceObj, initialObj);
			assert.notDeepEqual(postAdvanceObj, reverseAdvanceObj);
			assert.deepEqual(reverseAdvanceObj, initialObj);
		});
	});
	describe("Check node creation", () => {
		it("should return the correct node list", () => {
			const tokens = getTokens("./test/samples/parser.advance.sim");
			assert.exists(tokens);
			const parser = new Parser(tokens);

			const ast = parser.parse();

			const expectedAst = {
				type: "ListNode",
				token: [
					{
						type: "VarAssignNode",
						token: {
							type: "IDENTIFIER",
							value: "MyForm1",
						},
						tokenType: {
							type: "IDENTIFIER",
							value: "Form",
						},
						node: {
							type: "ListNode",
							token: [
								{
									type: "ElementPropertyNode",
									token: {
										type: "IDENTIFIER",
										value: "properties",
									},
									node: [
										{
											type: "PropertyNode",
											token: {
												type: "IDENTIFIER",
												value: "width",
											},
											node: {
												type: "NumberNode",
												token: {
													type: "INT",
													value: 3,
												},
											},
										},
										{
											type: "PropertyNode",
											token: {
												type: "IDENTIFIER",
												value: "label",
											},
											node: {
												type: "StringNode",
												token: {
													type: "STRING",
													value: "Test form",
												},
											},
										},
									],
								},
							],
						},
					},
				],
			};

			const actualAst = getAstRepresentation(ast.value);
			assert.deepEqual(actualAst, expectedAst);
		});

		it("should handle if, else, else if with complex conditions", () => {
			const tokens = getTokens("./test/samples/parser.test.sim");
			assert.exists(tokens);
			const parser = new Parser(tokens);

			const ast = parser.parse();
			assert.exists(ast);
		});
	});
});

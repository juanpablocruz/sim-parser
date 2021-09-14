/* eslint-disable no-constant-condition */
const { InvalidSyntaxError } = require("./Error");
const { TYPES } = require("./TokenTypes");

const {
	NumberNode,
	VarAssignNode,
	VarAccessNode,
	BinOpNode,
	UnaryOpNode,
	StringNode,
	ListNode,
	ElementPropertyNode,
	EventExpresionNode,
	AssignExpressionNode,
	PropertyNode,
	MatchValidationNode,
	IfNode,
	TogglePropertyNode,
	Node
} = require("./Node");
const Result = require("./Result");


/**
 * @class
 * @classdesc Parser is the responsible for building an Abstract Syntax Tree from the list of {@link Token}.
 * @see [Grammar](tutorial-Grammar.html)
 * 
 */
class Parser {
	/**
	 * @param {Token[]} tokens - The list of parsed Tokens to generate the AST from
	 */
	constructor(tokens) {
		this.tokens = tokens;
		this.tokenIndex = -1;
		this.advance();
	}

	/**
	 * Get the next token from the list if there are any more
	 * @private
	 * @returns {Token}
	 */
	advance() {
		this.tokenIndex += 1;
		this.updateCurrentToken();
		return this.current_token;
	}

	/**
	 * Go back _amount_ tokens in the list unless we overflow
	 * @private
	 * @param {number} [amount=1] 
	 * @returns {Token}
	 */
	reverse(amount = 1) {
		this.tokenIndex -= amount;
		this.updateCurrentToken();
		return this.current_token;
	}

	/**
	 * @private
	 */
	updateCurrentToken() {
		if (this.tokenIndex >= 0 && this.tokenIndex < this.tokens.length) {
			this.current_token = this.tokens[this.tokenIndex];
		}
	}

	/**
	 * Parse the list of tokens returning the AST 
	 * @public
	 * @returns {Result} - A result containing either the AST or an error.
	 */
	parse() {
		let res = this.statements();
		res.registerAdvancement();
		this.advance();
		if (!res.error && this.current_token.type !== TYPES.TT_EOF) {
			return res.failure(
				InvalidSyntaxError(
					this.current_token.posStart,
					this.current_token.posEnd,
					`Unexpected token "${this.current_token.value}" (${this.current_token.type})`
				)
			);
		}
		return res;
	}

	/**
	 * Parse each statement 
	 * @private
	 * @param {number} [indent=0] - The current statement indent level to know when we are leaving a block
	 * @returns {Result}
	 */
	statements(indent = 0) {
		let res = Result();
		let statements = [];
		let posStart = this.current_token.posStart.copy();

		while (this.current_token.type === TYPES.TT_NEWLINE) {
			res.registerAdvancement();
			this.advance();
		}

		if (this.current_token.indent !== indent) {
			return res.success(null);
		}

		let expr = res.from(this.expr());
		if (res.error) return res;
		statements.push(expr);

		let moreStatements = true;
		while (true) {
			let newLineCount = 0;
			while (this.current_token.type === TYPES.TT_NEWLINE) {
				res.registerAdvancement();
				this.advance();
				newLineCount++;
			}
			if (this.current_token.indent !== indent) {
				break;
			}
			if (newLineCount === 0) {
				moreStatements = false;
			}
			if (!moreStatements) {
				break;
			}
			expr = res.tryFrom(this.expr());
			if (!expr) {
				this.reverse(res.toReverseCount);
				moreStatements = false;
			} else {
				statements.push(expr);
			}
		}
		return res.success(
			ListNode(statements, posStart, this.current_token.posEnd.copy())
		);
	}

	/**
	 * @private
	 * @param {number} indent 
	 * @returns {Result}
	 */
	exprProps(indent) {
		let res = Result();
		let propExprs = [];
		while (this.current_token.indent === indent + 1) {
			const propExpr = res.from(this.propExpr());
			res.registerAdvancement();
			this.advance();
			if (res.error) return res;
			propExprs.push(propExpr);
		}
		return res.success(propExprs);
	}

	/**
	 * ```
	 * : KEYWORD:with IDENTIFIER (IDENTIFIER) NEWLINE
	 *   (NEWLINE+ prop-expr)*
	 * : prop-expr
	 * ```
	 * @returns {Result}
	 */
	expr() {
		let res = Result();
		let indent;
		if (this.current_token.matches(TYPES.TT_KEYWORD, "with")) {
			res.registerAdvancement();
			this.advance();

			if (this.current_token.type !== TYPES.TT_IDENTIFIER) {
				return res.failure(
					InvalidSyntaxError(
						this.current_token.posStart,
						this.current_token.posEnd,
						"Expected identifier"
					)
				);
			}

			let type = this.current_token;
			res.registerAdvancement();
			this.advance();

			if (this.current_token.type === TYPES.TT_IDENTIFIER) {
				const varName = this.current_token;
				indent = this.current_token.indent;
				res.registerAdvancement();
				this.advance();

				const valueNode = res.from(this.statements(indent + 1));
				if (res.error) return res;
				this.reverse();

				return res.success(VarAssignNode(varName, type, valueNode));
			}

			if (this.current_token.type !== TYPES.TT_NEWLINE) {
				return res.failure(
					InvalidSyntaxError(
						this.current_token.posStart,
						this.current_token.posEnd,
						"Expected new line"
					)
				);
			}

			indent = type.indent;
			res.registerAdvancement();
			this.advance();

			const propExprs = res.from(this.exprProps(indent));
			if (res.error) return res;

			if (this.current_token.type !== TYPES.TT_EOF) this.reverse();
			return res.success(ElementPropertyNode(type, propExprs));
		}

		let node = res.from(this.propExpr());
		if (res.error) {
			return res.failure(
				InvalidSyntaxError(
					this.current_token.posStart,
					this.current_token.posEnd,
					"Expected 'var', 'if', 'for', 'while', 'fun', int, float, identifier, '+', '-', '(', '[' or 'not'"
				)
			);
		}
		return res.success(node);
	}

	/**
	 * ```
	 * : IDENTIFIER NEWLINE
	 * : IDENTIFIER atom NEWLINE
	 * : IDENTIFIER atom IDENTIFIER
	 * : event-expr
	 * ```
	 * @returns {Result}
	 */
	propExpr() {
		let res = Result();
		let atomExpr;

		if (this.current_token.type === TYPES.TT_IDENTIFIER) {
			let token = this.current_token;
			res.registerAdvancement();
			this.advance();

			if (this.current_token.type === TYPES.TT_NEWLINE) {
				atomExpr = NumberNode({ ...token, type: TYPES.TT_INT, value: 1 });
				return res.success(PropertyNode(token, atomExpr));
			}

			atomExpr = res.from(this.atom());
			if (res.error) return res;

			if ([TYPES.TT_NEWLINE, TYPES.TT_EOF].includes(this.current_token.type)) {
				return res.success(PropertyNode(token, atomExpr));
			}
			if (this.current_token.type === TYPES.TT_IDENTIFIER) {
				let propertyIdentifier = this.current_token;
				res.registerAdvancement();
				this.advance();
				return res.success(PropertyNode(token, atomExpr, propertyIdentifier));
			}
		}

		let node = res.from(this.eventExpr());
		if (res.error) return res;

		return res.success(node);
	}

	/**
	 * ```
	 * : KEYWORD:when IDENTIFIER 
	 *   (assign-expr NEWLINE*)*	
	 * ```
	 * @returns {Result}
	 */
	eventExpr() {
		let res = Result();
		if (!this.current_token.matches(TYPES.TT_KEYWORD, "when")) {
			return res.failure(
				InvalidSyntaxError(
					this.current_token.posStart,
					this.current_token.posEnd,
					"Expected 'when'"
				)
			);
		}

		let indent = this.current_token.indent;
		res.registerAdvancement();
		this.advance();

		if (this.current_token.type !== TYPES.TT_IDENTIFIER) {
			return res.failure(
				InvalidSyntaxError(
					this.current_token.posStart,
					this.current_token.posEnd,
					"Expected identifier"
				)
			);
		}
		const eventName = this.current_token;

		res.registerAdvancement();
		this.advance();

		let assignNodes = [];
		let indentOk = true;
		while (indentOk) {
			const assignNode = res.from(this.assignExpr());
			if (res.error) return res;
			assignNodes.push(assignNode);

			while (this.current_token.type === TYPES.TT_NEWLINE) {
				res.registerAdvancement();
				this.advance();
			}

			if (this.current_token.type === TYPES.TT_EOF) {
				break;
			}
			if (indent + 1 !== this.current_token.indent) {
				indentOk = false;
			}
		}

		this.reverse(1);

		return res.success(EventExpresionNode(eventName, assignNodes));
	}

	/**
	 * @private
	 * @returns {Result}
	 */
	assignSetExpr() {
		let res = Result();
		res.registerAdvancement();
		this.advance();

		if (this.current_token.type !== TYPES.TT_IDENTIFIER) {
			return res.failure(
				InvalidSyntaxError(
					this.current_token.posStart,
					this.current_token.posEnd,
					"Expected identifier"
				)
			);
		}

		const propertyName = this.current_token;
		res.registerAdvancement();
		this.advance();

		if (this.current_token.type === TYPES.TT_IDENTIFIER) {
			const fromNode = this.current_token;
			res.registerAdvancement();
			this.advance();
			if (this.current_token.matches(TYPES.TT_KEYWORD, "to")) {
				res.registerAdvancement();
				this.advance();
				const value = res.from(this.atom());
				if (res.error) return res;

				return res.success(
					AssignExpressionNode({ propertyName, fromNode, value })
				);
			}
			return res.success(
				AssignExpressionNode({ propertyName, value: fromNode })
			);
		} else if (this.current_token.matches(TYPES.TT_KEYWORD, "as")) {
			res.registerAdvancement();
			this.advance();

			let negated = false;
			let negatedToken = null;
			if (this.current_token.matches(TYPES.TT_KEYWORD, "not")) {
				negated = true;
				negatedToken = this.current_token;
				res.registerAdvancement();
				this.advance();
			}
			if (this.current_token.type !== TYPES.TT_IDENTIFIER) {
				return res.failure(
					InvalidSyntaxError(
						this.current_token.posStart,
						this.current_token.posEnd,
						"Expected identifier"
					)
				);
			}
			if (negated) {
				return res.success(
					UnaryOpNode(
						negatedToken,
						AssignExpressionNode({ propertyName, value: this.current_token })
					)
				);
			}
			return res.success(
				AssignExpressionNode({ propertyName, value: this.current_token })
			);
		} else if (this.current_token.matches(TYPES.TT_KEYWORD, "to")) {
			res.registerAdvancement();
			this.advance();
			const value = res.from(this.atom());
			return res.success(AssignExpressionNode({ propertyName, value }));
		}
		return res.failure(
			InvalidSyntaxError(
				this.current_token.posStart,
				this.current_token.posEnd,
				"Expected identifier, 'as' or 'to'"
			)
		);
	}

	/**
	 * @private
	 * @returns {Result}
	 */
	assignFunExpr() {
		let res = Result();
		const operation = this.current_token;
		res.registerAdvancement();
		this.advance();

		const propertyName = res.from(this.atom());
		if (res.error) return res;

		return res.success(TogglePropertyNode(propertyName, operation));
	}
	/**
	 * ```
	 * : NEWLINE* KEYWORD:set IDENTIFIER IDENTIFIER KEYWORD:to atom
	 * : NEWLINE* KEYWORD:set IDENTIFIER KEYWORD:as (KEYWORD:not) IDENTIFIER
	 * : NEWLINE* KEYWORD:set IDENTIFIER KEYWORD:to atom
	 * : NEWLINE* (KEYWORD:show|KEYWORD:hide|KEYWORD:disable|KEYWORD:enable|KEYWORD:alert|KEYWORD:update) atom
	 * : comp-expr ((KEYWORD:and|KEYWORD:or) comp-expr)*
	 * ```
	 * @returns {Result}
	 */
	assignExpr() {
		let res = Result();

		while (this.current_token.type === TYPES.TT_NEWLINE) {
			res.registerAdvancement();
			this.advance();
		}

		if (this.current_token.matches(TYPES.TT_KEYWORD, "set")) {
			return this.assignSetExpr();
		} else if (
			this.current_token.type === TYPES.TT_IDENTIFIER &&
			["show", "hide", "disable", "enable", "alert", "update"].includes(
				this.current_token.value
			)
		) {
			return this.assignFunExpr();
		}

		let node = res.from(
			this.binOp(this.compExpr.bind(this), [
				{ type: TYPES.TT_KEYWORD, value: "and" },
				{ type: TYPES.TT_KEYWORD, value: "or" },
			])
		);

		if (res.error) {
			return res.failure(
				InvalidSyntaxError(
					this.current_token.posStart,
					this.current_token.posEnd,
					"Expected 'set','show', 'hide', disable', 'enable', 'alert', 'if'"
				)
			);
		}
		return res.success(node);
	}

	/**
	 * ```
	 * : (KEYWORD:not) comp-expr
	 * : factor
	 * ```
	 * @returns {Result}
	 */
	compExpr() {
		let res = Result();
		let node;
		if (this.current_token.matches(TYPES.TT_KEYWORD, "not")) {
			let token = this.current_token;
			res.registerAdvancement();
			this.advance();

			node = res.from(this.compExpr());
			if (res.error) return res;
			return res.success(UnaryOpNode(token, node));
		}

		node = res.from(
			this.binOp(this.factor.bind(this), [
				{ type: TYPES.TT_EQ, value: "is" },
				{ type: TYPES.TT_MATCH, value: TYPES.TT_MATCH },
				{ type: TYPES.TT_LT, value: null },
				{ type: TYPES.TT_GT, value: null },
				{ type: TYPES.TT_LTE, value: null },
				{ type: TYPES.TT_GTE, value: null },
				{ type: TYPES.TT_KEYWORD, value: "not" },
			])
		);

		if (res.error) {
			return res.failure(
				InvalidSyntaxError(
					this.current_token.posStart,
					this.current_token.posEnd,
					"Expected identifier, int, float, '>', '<', '>=', '<=', 'is' or 'not'"
				)
			);
		}

		return res.success(node);
	}

	/**
	 * ```
	 * : ('-') factor
	 * : atom
	 * ```
	 * @returns {Result}
	 */
	factor() {
		let res = Result();
		let token = this.current_token;

		if (token.type === TYPES.TT_MINUS) {
			res.registerAdvancement();
			this.advance();
			let factor = res.from(this.factor());
			if (res.error) return res;
			return res.success(UnaryOpNode(token, factor));
		}

		return this.atom();
	}

	/**
	 * ```
	 * : INT | FLOAT | STRING | IDENTIFIER
	 * : if-expr
	 * ```
	 * @returns {Result}
	 */
	atom() {
		let res = Result();
		let token = this.current_token;

		if ([TYPES.TT_INT, TYPES.TT_FLOAT].includes(token.type)) {
			res.registerAdvancement();
			this.advance();
			return res.success(NumberNode(token));
		} else if (token.type === TYPES.TT_STRING) {
			res.registerAdvancement();
			this.advance();
			return res.success(StringNode(token));
		} else if (token.type === TYPES.TT_IDENTIFIER) {
			res.registerAdvancement();
			this.advance();
			return res.success(VarAccessNode(token));
		} else if (this.current_token.matches(TYPES.TT_KEYWORD, "if")) {
			const ifExpr = res.from(this.ifExpr());
			if (res.error) return res;
			return res.success(ifExpr);
		}

		return res.failure(
			InvalidSyntaxError(
				token.posStart,
				token.posEnd,
				"Expected int, float, identifier, 'if'"
			)
		);
	}

	/**
	 * ```
	 * : KEYWORD:if assign-expr NEWLINE
	 * (assign-expr)*|if-expr-b|if-expr-c
	 * ```
	 * @returns {Result}
	 */
	ifExpr() {
		let res = Result();
		let allCases = res.from(this.ifExprCases("if"));
		if (res.error) return res;
		const [cases, elseCase] = allCases;
		return res.success(IfNode(cases, elseCase));
	}

	/**
	 * @private
	 * @returns {Result}
	 */
	ifExprBOrC() {
		let res = Result();
		let cases = [];
		let elseCase = [];

		if (this.current_token.matches(TYPES.TT_KEYWORD, "if")) {
			const allCases = res.from(this.ifExprCases("if"));
			if (res.error) return res;
			const [newCases, elseCaseTm] = allCases;
			elseCase = elseCaseTm;
			cases = cases.concat(newCases);
		} else if (this.current_token.type === TYPES.TT_NEWLINE) {
			this.reverse();
			let elseIndent = this.current_token.indent;
			res.registerAdvancement();
			this.advance();
			res.registerAdvancement();
			this.advance();
			while (this.current_token.indent === elseIndent + 1) {
				let assign = res.from(this.assignExpr());
				if (res.error) return res;
				elseCase.push([assign, true]);
				res.registerAdvancement();
				this.advance();
			}
		}
		return res.success([cases, elseCase]);
	}

	/**
	 * @private
	 * @returns {Result}
	 */
	ifExprCases(caseKeyword) {
		let res = Result();
		let cases = [];
		let elseCase = null;
		let caseToken = this.current_token;
		if (!this.current_token.matches(TYPES.TT_KEYWORD, caseKeyword)) {
			return res.failure(
				InvalidSyntaxError(
					this.current_token.posStart,
					this.current_token.posEnd,
					`Expected '${caseKeyword}'`
				)
			);
		}

		res.registerAdvancement();
		this.advance();

		const condition = res.from(this.assignExpr());
		if (res.error) return res;

		if (this.current_token.type !== TYPES.TT_NEWLINE) {
			return res.failure(
				InvalidSyntaxError(
					this.current_token.posStart,
					this.current_token.posEnd,
					`Expected new line`
				)
			);
		}

		const ifIndent = caseToken.indent;
		res.registerAdvancement();
		this.advance();

		if (ifIndent + 1 !== this.current_token.indent) {
			return res.failure(
				InvalidSyntaxError(
					this.current_token.posStart,
					this.current_token.posEnd,
					`Expected ${ifIndent + 1} tabs, ${this.current_token.indent} found`
				)
			);
		}

		let subCases = [];
		while (this.current_token.indent === ifIndent + 1) {
			let assign = res.from(this.assignExpr());
			if (res.error) return res;
			subCases.push(assign);
			res.registerAdvancement();
			this.advance();
		}
		if (subCases.length) {
			cases.push([condition, ...subCases, true]);
		}
		if (this.current_token.matches(TYPES.TT_KEYWORD, "else")) {
			res.registerAdvancement();
			this.advance();
			const allCases = res.from(this.ifExprBOrC());
			if (res.error) return res;
			const [newCases, elseCaseTm] = allCases;
			elseCase = elseCaseTm;
			cases = cases.concat(newCases);
		}
		return res.success([cases, elseCase]);
	}

	/**
	 * @private
	 * @returns {Result}
	 */
	binOp(func, operations, funcB = null) {
		if (!funcB) {
			funcB = func;
		}

		let res = Result();
		let left = res.from(func());

		if (res.error) return res;

		while (
			operations.includes(this.current_token.type) ||
			operations.reduce((acc, item) => {
				return acc
					? acc
					: item.type === this.current_token.type &&
							item.value === this.current_token.value;
			}, false)
		) {
			let opToken = this.current_token;
			res.registerAdvancement();
			this.advance();
			let right = res.from(funcB());
			if (res.error) return res;
			left = BinOpNode(left, opToken, right);
		}
		return res.success(left);
	}
}

module.exports = { Parser };

const { IllegalCharError } = require("./Error");
const { TYPES, KEYWORDS } = require("./TokenTypes")

/**
 * @constructor
 * @param {TokenType} type - The token type
 * @param {*} value - The inner value of the token
 * @param {Position} posStart - The position where the token starts in the source text
 * @param {Position} posEnd - The position where the token ends in the source text
 */
function Token(type, value, posStart, posEnd) {
	let posEndVal = null
	if (posEnd) {
		posEndVal = posEnd
	} else if (posStart) {
		posEndVal = posStart.copy().advance()
	} 

	return {
		type,
		value,
		posStart: posStart ? posStart.copy() : null,
		posEnd: posEndVal,
		indent: posStart.indentation,
		
		/**
		 * A method for converting the token to a string 
		 * @memberof Token
		 * @returns {string}
		 */
		toString: function () {
			if (this.value) return `${this.type}:${this.value}`;
			return this.type;
		},

		/**
		 * Checks if the token matches the provided type and value
		 * @memberof Token
		 * 
		 * @example
		 * 
		 * const andToken = Token(TYPES.TT_KEYWORD, value: "and", posStart, posEnd);
		 * 
		 * andToken.matches(TYPES.TT_KEYWORD, "and") // true
		 * andToken.matches(TYPES.TT_KEYWORD, "or") // false
		 * andToken.matches(TYPES.TT_INT, 1) // false
		 * 
		 * 
		 * @param {TokenType} type - The token type to check
		 * @param {*} val - The value to check
		 * @returns {boolean}
		 */
		matches: function (type, val) {
			return this.type === type && this.value === val;
		},
	};
};

/**
 * @constructor
 * @param {number} index - The index of the current character inside the source text
 * @param {number} line - The current line number in the source text
 * @param {number} col - The current column number in the source text
 * @param {string} fileName - The name of the source text file
 * @param {string} fileText - The source text
 * @param {number} [indentation=0] - The current indentation level
 */
function Position(index, line, col, fileName, fileText, indentation = 0) {
	return {
		index: index,
		line: line,
		col: col,
		indentation,
		fileName: fileName,
		fileText: fileText,
		pushBuffer: [], 
		/**
		 * Advances forward the current character pointer in the source text.
		 * If a break line is encountered then moves to the next line and to the first column
		 * 
		 * @memberof Position
		 * @instance
		 * @param {string} [currentChar] - Used to determine the kind of token we are moving to.
		 * @returns {Position}
		 */
		advance: function (currentChar = null) {
			this.index += 1;
			this.col += 1;

			if (currentChar && currentChar === "\n") {
				this.line += 1;
				this.col = 0;
			}
			return this;
		},
		/**
		 * Moves backward the current character in the source text _amount_ positions.
		 * If a break line is encountered then moves to the previous line and to the last column
		 * 
		 * @memberof Position
		 * @instance
		 * @param {string} [currentChar] - Used to determine the kind of token we are moving to.
		 * @param {number} [amount=1] - The number of characters to move backwards
		 * @returns {Position}
		 */
		reverse: function(currentChar = null, amount = 1) {
			let prevCol = this.col
			this.index -= amount;
			this.col -= amount;

			if (currentChar && currentChar === "\n") {
				this.line -= amount;
				this.col = prevCol;
			}
			return this;
		},
		/**
		 * Method used to cache the movements of caret for future fallback
		 * 
		 * @memberof Position
		 * @instance
		 */
		push: function() {
			this.pushBuffer.push([this.index, this.col])
		},
		/**
		 * Go backwards to the previous position in the history buffer.
		 * @memberof Position
		 * @instance
		 */
		pop: function() {
			if (this.pushBuffer.length > 0) {
				const [index, col] = this.pushBuffer.pop();
				this.index = index
				this.col = col
			}
		},
		/**
		 * Increment the indentation level
		 * @memberof Position
		 * @instance
		 */
		indent: function () {
			this.indentation = this.indentation + 1;
		},
		/**
		 * Reset the indentation level.
		 * @memberof Position
		 * @instance
		 * @returns {Position}
		 */
		resetIndent: function () {
			this.indentation = 0;
			return this;
		},
		/**
		 * Create a new position equal to this instance
		 * @memberof Position
		 * @instance
		 * @returns {Position}
		 */
		copy: function () {
			return Position(
				this.index,
				this.line,
				this.col,
				this.fileName,
				this.fileText,
				this.indentation
			);
		},
	};
};

/**
 * ## Summary.
 * 
 * Class for parsing a text extracting every token.
 * 
 * @class
 */
class Lexer {
	/**
	 * Initializes the __Lexer__
	 * @param {string} fileName - A name identifying the source text
	 * @param {string} [text=""] - Text to parse 
	 */
	constructor(fileName, text = '') {
		this.fileName = fileName;
		this.text = text;
		this.pos = Position(-1, 0, -1, fileName, text);
		this.currentChar = null;
		this.advance();
	}

	/**
	 * Move forward the pointer in the text getting a new character from it.
	 */
	advance() {
		this.pos.advance(this.currentChar);
		this.currentChar =
			this.pos.index < this.text.length ? this.text[this.pos.index] : null;
	}

	/**
	 * Move back the pointer to _amount_ characters back.
	 * @param {number} [amount=1] - How many characters we want to go back 
	 */
	reverse(amount = 1) {
		this.pos.reverse(this.currentChar, amount);
		this.currentChar =
			this.pos.index < this.text.length ? this.text[this.pos.index] : null;
	}

	/**
	 * Generate a Number Token, Int or Float depending on the existence of a '.' in the string.
	 * @example 
	 * 
	 * const text = "120"
	 * 
	 * makeNumber() 
	 * {
	 * 	type: TYPES.TT_INT,
	 * 	value: 120
	 * }
	 * 
	 * @example
	 * 
	 * const text = "120.5"
	 * makeNumber()
	 * {
	 * 	type: TYPES.TT_FLOAT,
	 * 	value: 120.5
	 * }
	 * 
	 * 
	 * @returns {Token}
	 */
	makeNumber() {
		let num_str = "";
		let dotCount = 0;
		let posStart = this.pos.copy();
		while (
			(this.currentChar !== null && /^\d+$/.test(this.currentChar)) ||
			this.currentChar === "."
		) {
			if (this.currentChar === ".") {
				if (dotCount === 1) {
					break;
				}
				dotCount++;
				num_str += ".";
			} else {
				num_str += this.currentChar;
			}
			this.advance();
		}
		if (dotCount === 0) {
			return Token(TYPES.TT_INT, parseInt(num_str), posStart, this.pos);
		}
		return Token(TYPES.TT_FLOAT, parseFloat(num_str), posStart, this.pos);
	}

	/**
	 * Parse the text until a white space is found and make an identifier or {@link Keywords} {@link Token} 
	 * @returns {Token}
	 */
	makeIdentifier() {
		let idString = "";
		let posStart = this.pos.copy();

		while (this.currentChar && /^[a-zA-Z0-9_]+$/.test(this.currentChar)) {
			idString += this.currentChar;
			this.advance();
		}

		let tokenType = Object.keys(KEYWORDS).includes(idString)
			? TYPES.TT_KEYWORD
			: TYPES.TT_IDENTIFIER;

		if (tokenType === TYPES.TT_KEYWORD) {
			if (idString === 'is') {
				let isPos = this.pos.copy();

				this.advance();
				const compare = this.makeComparation();
				if (compare) {
					return compare
				}
				this.reverse();

				return Token(TYPES.TT_EQ, idString, posStart, isPos)
			} else if(idString === 'match') {
				return Token(TYPES.TT_MATCH, idString, posStart, this.pos)
			} 
		}  
		return Token(tokenType, idString, posStart, this.pos);
	}

	/**
	 * If the text begins with `` " `` create a string {@link Token} from there until a closing `` " `` is found
	 * @returns {Token}
	 */
	makeString() {
		let string = "";
		let posStart = this.pos.copy();
		let escapeCharacter = false;
		this.advance();

		let escapeCharacters = {
			n: "\n",
			t: "\t",
		};
		while (this.currentChar && (this.currentChar !== '"' || escapeCharacter)) {
			if (escapeCharacter) {
				string += escapeCharacters[this.currentChar] || this.currentChar;
			} else {
				if (this.currentChar === "\\") {
					escapeCharacter = true;
				} else {
					string += this.currentChar;
				}
			}

			this.advance();
			escapeCharacter = false;
		}
		this.advance();
		return Token(TYPES.TT_STRING, string, posStart, this.pos);
	}

	/**
	 * Keep moving forward the pointer until a new line is encountered.
	 */
	skipComment() {
		this.advance();

		while (this.currentChar && this.currentChar !== "\n") {
			this.advance();
		}

		this.advance();
	}

	/**
	 * Create a _Less than_ or _Less than equal_ when a `` < `` token is found and if a `` = `` character also follows
	 * @returns {Token}
	 */
	makeLessThan() {
		let tokenType = TYPES.TT_LT;
		let posStart = this.pos.copy();
		this.advance();
		if (this.currentChar === "=") {
			this.advance();
			tokenType = TYPES.TT_LTE;
		}
		return Token(tokenType, null, posStart, this.pos);
	}
	/**
	 * Create a _Greater than_ or _Greater than equal_ when a `` > `` token is found and if a `` = `` character also follows
	 * @returns {Token}
	 */
	makeGreaterThan() {
		let tokenType = TYPES.TT_GT;
		let posStart = this.pos.copy();
		this.advance();
		if (this.currentChar === "=") {
			this.advance();
			tokenType = TYPES.TT_GTE;
		}
		return Token(tokenType, null, posStart, this.pos);
	}

	/**
	 * After we encounter the keyword _is_ check if we are making a comparison of greater than or lesser than
	 * @returns {Token}
	 */
	makeComparation() {
		this.pos.push()
		while(this.currentChar !== null) {
			if (/\t/.test(this.currentChar)) {
				this.pos.indent();
				this.advance()
			} else if (this.currentChar === " " || this.currentChar === '\r') {
				this.advance();
			} else if (this.currentChar === "<") {
				return this.makeLessThan();
			} else if (this.currentChar === ">") {
				return this.makeGreaterThan();
			} else {
				break
			}
		}
		this.pos.pop()
		this.currentChar = this.pos.index < this.text.length ? this.text[this.pos.index] : null;
		return null
	}

	/**
	 * ### Summary
	 * Begin the parsing of the source text. 
	 * 
	 * ### Description
	 * We are searching for every language defined element:
	 * 	- Numbers (Int or float)
	 * 	- Strings
	 * 	- {@link Keywords}
	 * 	- Identifiers
	 * 	- Binary operations (Greater than, lesser than, etc...)
	 * 	- Unary operations (- for creating negative numbers, not for negating expresions)
	 * 	- Comments begining with _#_
	 * 
	 * @see {@link TokenType} for a complete list of types
	 * 
	 * @returns {Token[]}
	 */
	makeTokens() {
		let tokens = [];

		while (this.currentChar !== null) {
			if (/\t/.test(this.currentChar)) {
				this.pos.indent();
				this.advance()
			} else if (this.currentChar === "\n") {
				this.pos.resetIndent();
				tokens.push(Token(TYPES.TT_NEWLINE, null, this.pos));
				this.advance();
			} else if (this.currentChar === " " || this.currentChar === '\r') {
				this.advance();
			} else if (this.currentChar === "#") {
				this.skipComment();
				this.pos.resetIndent()
			} else if (/^\d+$/.test(this.currentChar)) {
				tokens.push(this.makeNumber());
			} else if (/^[a-zA-Z0-9_]+$/.test(this.currentChar)) {
				tokens.push(this.makeIdentifier());
			} else if (this.currentChar === '"') {
				tokens.push(this.makeString());
			} else if (this.currentChar === "-") {
				tokens.push(Token(TYPES.TT_MINUS, null, this.pos));
				this.advance();
			} else if (this.currentChar === "<") {
				tokens.push(this.makeLessThan());
			} else if (this.currentChar === ">") {
				tokens.push(this.makeGreaterThan());
			} else {
				let posStart = this.pos.copy();
				let char = this.currentChar;
				this.advance();
				return {
					tokens: [],
					error: IllegalCharError(posStart, this.pos, `'${char}'`),
				};
			}
		}
		const eofPos = this.pos.copy()
		eofPos.indentation = 0
		tokens.push(Token(TYPES.TT_EOF, null, eofPos));

		return { tokens, error: null };
	}
}

module.exports = { Lexer };

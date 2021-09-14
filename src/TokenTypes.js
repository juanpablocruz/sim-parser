/**
 * @enum {string}
 */
const TokenType ={
	/** An integer number token */
	TT_INT: "INT",
	/** A float number token */
	TT_FLOAT: "FLOAT",
	/** A string token */
	TT_STRING: "STRING",
	/** Symbol - */
	TT_MINUS: "MINUS",
	/** An identifier such as a var name or var type */
	TT_IDENTIFIER: "IDENTIFIER",
	/**
	 * A type for language {@link Keywords}
	 */
	TT_KEYWORD: "KEYWORD",
	/** Symbol _is_  */
	TT_EQ: "EQ",
	/** Symbol _<_  */
	TT_LT: "LT",
	/** Symbol _>_  */
	TT_GT: "GT",
	/** Symbol _<=_  */
	TT_LTE: "LTE",
	/** Symbol _>=_  */
	TT_GTE: "GTE",
	/** Symbol _match_  */
	TT_MATCH: "match",
	/** Token type for new lines  */
	TT_NEWLINE: "NEWLINE",
	/** Token type for identifying the end of the file  */
	TT_EOF: "EOF",
};

/**
 * @enum {string}
 */
const Keywords ={
	is: "is",
	match: "match",
	with: "with",
	when: "when",
	to: "to",
	if: "if",
	else: "else",
	or: "or",
	and: "and",
	not: "not",
	as: "as",
	set: "set",
};

module.exports = {
	TYPES: TokenType,
	KEYWORDS: Keywords,
};

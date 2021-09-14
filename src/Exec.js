const { Lexer } = require('./Lexer')
const { Parser } = require('./Parser')

const exec = (fileName, text) => {
	// Create the lexer and parse the tokens
	const lexer = new Lexer(fileName, text)
	const { tokens, error } = lexer.makeTokens()

	// If there was an error parsing return here
	if (error) {
		return {value: null, error}
	}

	// Create the parser from the tokens and generate the AST
	const parser = new Parser(tokens)  
	const ast = parser.parse()

	// if there was an error generating the AST return here
	if (ast.error) {
		return {value: null, error: ast.error}
	} 
	
  
	return {value: ast.value, error: null}    
}

module.exports = {exec}
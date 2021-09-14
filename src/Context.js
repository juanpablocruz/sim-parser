/**
 * ## Summary.
 * 
 * ## Description.
 * 
 * @class
 */
class Context {
	constructor(displayName, parent = null, parentEntryPos = null) {
		this.displayName = displayName
		this.parent = parent
		this.parentEntryPos = parentEntryPos
		this.symbolTable = null
	}
}

/**
 * ## Summary.
 * 
 * ## Description.
 * 
 * @class
 */
class SymbolTable {
	/**
	 * Create a new SymbolTable instance.
	 * @param {*} parent 
	 */
	constructor(parent = null) {
		this.symbols = {}
		this.parent = parent
	}

	/**
	 * 
	 * @param {string} name The symbol name. 
	 * @returns {*} The value asigned to the symbol in this table or its parent's.
	 */
	get(name) {
		let value = this.symbols.hasOwnProperty(name) ? this.symbols[name] : null
		if (!value && this.parent) {
			return this.parent.get(name)
		}
		return value
	}

	/**
	 * Stores a new symbol on the table with the provided value.
	 * @param {string} name The symbol name 
	 * @param {*} value The value to assign to the symbol
	 */
	set(name, value) {
		this.symbols[name] = value
	}

	/**
	 * Removes the symbol from this symbol table.
	 * @param {string} name The symbol name 
	 */
	remove(name) {
		delete this.symbols[name]
	}
} 

module.exports = {Context, SymbolTable}
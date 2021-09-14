const hasNext = (node) =>
	(node.hasOwnProperty("node") && node.node) ||
	(node.hasOwnProperty("token") && node.token);

const getNextNode = (node) => {
	if (hasNext(node)) {
		return  node.node || node.token; 
	}
	return null;
};

const isPropertyNode = (node) => {
	return [
		"NumberNode",
		"StringNode",
		"INT",
		"FLOAT",
		"STRING",
		"IDENTIFIER",
	].includes(node.type);
};

const increaseDepth = (node, depth) => {
	if (isPropertyNode(node)) {
		return depth;
	}

	return depth + 1;
};

function* iterateNode(node, depth = 0) {
	let current = node;
	let currentDepth = depth;
	while (hasNext(current)) {
		let result = current;
		current = getNextNode(current);
		yield { value: result, depth: currentDepth };
		currentDepth = increaseDepth(current, depth);
		if (Array.isArray(current)) {
			for (let elem of current) {
				for (let next of iterateNode(elem, currentDepth)) {
					yield next;
				}
			}
		}
	}
	if (node.hasOwnProperty('type') && node.type === 'IfNode') {
		yield {value: node, depth}
	}
}

function mapNode(node, method, i, ast, allowNulls = true) {
	let newNode = method(node, i, ast);
	if (newNode && newNode.hasOwnProperty("node") && newNode.node) {
		if (Array.isArray(newNode.node)) {
			let arr = [];
			let j = 1;
			for (let elem of newNode.node) {
				const mappedNode = mapNode(elem, method, i + j, ast, allowNulls);
				if (mappedNode || (!mappedNode && allowNulls)) {
					arr.push(mappedNode);
				}
				j++;
			}
			newNode.node = arr;
		} else {
			const mappedNode = mapNode(newNode.node, method, i + 1, ast, allowNulls);
			if (mappedNode || (!mappedNode && allowNulls)) {
				newNode.node = mappedNode;
			}
		}
	} else if (newNode && newNode.hasOwnProperty("token") && newNode.token) {
		if (Array.isArray(newNode.token)) {
			let arr = [];
			let j = 1;
			for (let elem of newNode.token) {
				const mappedNode = mapNode(elem, method, i + j, ast, allowNulls);
				if (mappedNode || (!mappedNode && allowNulls)) {
					arr.push(mappedNode);
				}
				j++;
			}
			newNode.token = arr;
		} else {
			const mappedNode = mapNode(newNode.token, method, i + 1, ast, allowNulls);
			if (mappedNode || (!mappedNode && allowNulls)) {
				newNode.node = mappedNode;
			}
		}
	}
	return newNode;
}

const getBinOpValue = (token) => {
	if (token.value) {
		return token.value
	}
	switch(token.type) {
		case 'GTE':
			return '>='
		case 'LTE':
			return '<='
		case 'GT':
			return '>'
		case 'LT':
			return '<'
		default: 
			return ""
	}
}


const getNodeAsSIM = (node, depth, fromIf = false) => {
	switch (node.type) {
		case "VarAssignNode": {
			if (node.tokenType) {
				return `with ${node.tokenType.value} ${node.token.value}`;
			}
			return `with ${node.token.value}`;
		}
		case "ElementPropertyNode":
			return `with ${node.token.value}`;
		case "PropertyNode":
			return `${node.token.value} `;
		case "NumberNode":
			return node.token.value;
		case "StringNode":
			return `\"${node.token.value}\"`;
		case "IDENTIFIER":
			return node.value;
		case "VarAccessNode": 
			return node.token.value
		case "EventExpresionNode":
			return `when ${node.token.value}`;
		case "TogglePropertyNode":
			return `${fromIf ? "\t".repeat(depth) : ""}${node.node.value} ${getNodeAsSIM(node.token, depth)}`
		case "AssignExpressionNode":
			if (node.hasOwnProperty("node") && node.node) {
				return `${fromIf ? "\t".repeat(depth) : ""}set ${node.token.value} ${getNodeAsSIM(node.node, depth)} to ${getNodeAsSIM(node.value, depth)}`
			}
			return `${fromIf ? "\t".repeat(depth) : ""}set ${node.token.value} ${getNodeAsSIM(node.value, depth)}`
		case "BinOpNode":
			return getNodeAsSIM(node.leftNode, depth) + ` ${getBinOpValue(node.token,)} ` + getNodeAsSIM(node.rightNode, depth);
		case "UnaryOpNode":
			let unary = node.token.value
			if (unary) {
				unary += ' '
			} else {
				unary = '-'
			}
			return `${unary}${getNodeAsSIM(node.node, depth)}`
		case "IfNode": {
				let tmp = ''
				if (node.cases) {
					let first = true
					for (let ifCase of node.cases) {
						const [condition, ...rest] = ifCase
						if (first) {
							first = false
						} else {
							tmp += "else "
						}
						tmp += `if ${getNodeAsSIM(condition, depth)}\n`
						for (let caseNode of rest) {
							if (typeof caseNode === 'object' && caseNode !== null) {
								tmp += getNodeAsSIM(caseNode, depth, true) + '\n';
							}
						}
						tmp += "\t".repeat(depth-1)
					}
				}
				if (node.elseCase) {
					const elseCase = node.elseCase[0][0]
					 
					tmp += "else\n"
					tmp += `${"\t".repeat(depth)}${getNodeAsSIM(elseCase, depth)}`
				}
				return tmp
			}
	}
	return "";
};

const isNewLine = (node) => {
	return [
		"VarAssignNode",
		"VarAccessNode",
		"PropertyNode",
		"ElementPropertyNode",
		"EventExpresionNode",
		"AssignExpressionNode",
		"TogglePropertyNode",
		"IfNode",
	].includes(node.type);
};

/**
 *
 * ## Summary.
 * 
 * Abstract syntax tree containing the nodes tree and providing some methods for traversing it, mapping and reducing.
 *
 * ## Description.
 * 
 * The AST uses a depth-first approach when traversing tree considering first the property 'node', and in case of absence, 'token'.
 *
 * @class
 * @since 1.0.2
 *
 */
class Ast {
	/**
	 * Create an AST from the parsed tree.
	 * @param {node} _ast Abstract tree inner data
	 */
	constructor(_ast) {
		this.ast = _ast;
	}

	/**
	 * Converts back the AST to the SIM code that compiles to it.
	 * @returns {string} The SIM text
	 */
	toSIM() {
		const SIM = this.reduce((simText, node, index, depth) => {
			let tmp = simText;
			
			if (depth > 1 && isNewLine(node)) {
				tmp += "\n";
				tmp += "\t".repeat(depth - 1);
			}
			tmp += `${getNodeAsSIM(node, depth)}`;
			return tmp;
		}, "");
		return SIM + "\n";
	}

	*getIterator() {
		for (let next of iterateNode(this.ast)) {
			yield next;
		}

		return null;
	}

	/**
	 * ### Summary.
	 * Returns a new Ast with the results of the call of the provided callback
	 *
	 * ### Description.
	 * > const newAst = ast.map(callback(currentValue, index, ast)[, thisArg])
	 *
	 * ### Parameters.
	 * - __callback__ Function that is called for every node of ast. Each time callback executes, the returned value is added to newAst. It accepts the following arguments:
	 * 	- __currentValue__ The current node being processed in the tree.
	 * 	- __index (optional)__ The index of the current element being processed in the tree.
	 * 	- __ast (optional)__ The tree map was called upon.
	 *  - __allowNulls (optional)__ (Defaults true) In order to filter out elements that are null set this to false.
	 * @template T, S
	 * @param {function(T, number, Ast): S} callback
	 * @returns {S}
	 */
	map(callback, allowNulls = true) {
		let newTree = mapNode(this.ast, callback, 0, this.ast, allowNulls);
		return new Ast(newTree);
	}

	/**
	 * ### Summary.
	 * Takes a callback and an initial value and folds the Ast structure into an object based on the callback logic
	 *
	 * ### Description.
	 * > arguments: (callback(accumulator, currentValue[, index[, depth[, tree]]])[, initialValue])
	 *
	 * ### Parameters.
	 * - __callback__: Method to execute over each node of the tree that takes 4 arguments:
	 * 	- __accumulator__: The accumulator takes the returned value of the callback function. Is the accumulated value from the last call of the callback or the initial value (if provided)
	 * 	- __currentValue__: The current node of the tree that is being processed
	 * 	- __index (optional)__: The index of the current node inside the traversed tree order. Starts at 0 if the initialValue is provided, else it will start at 1.
	 * 	- __depth (optional)__: The level on which the currentValue is on the tree.
	 * 	- __ast (optional)__: The original ast over which the method reduce is being iterating.
	 * - __initialValue (optional)__: Uses a value as first argument of the call to the method callback. If not provided it will take the value of the first element of the tree
	 *
	 * @template T,S
	 * @param {function(T, S, number, number, Ast): number} callback Method to execute over each node of the tree
	 * @param {T} [initialValue=null] - Uses a value as first argument of the call to the method callback. If not provided it will take the value of the first element of the tree
	 *
	 * @returns {T}
	 */
	reduce(callback, initialValue = null) {
		const it = this.getIterator();

		let index = 0;
		let acc = initialValue;
		for (let { value, depth } of it) {
			if (acc === null) {
				acc = value;
				index++;
			} else {
				acc = callback(acc, value, index++, depth, this.ast);
			}
		}

		return acc;
	}

	/**
	 * ### Summary. 
	 * ___forEach___ calls a provided callback function once for each node in the ast in ascending index order.
	 *
	 * ### Description. 
	 * > arguments: (callback(currentValue[, index[, depth[, ast]]]))
	 *
	 * ### Parameters. 
	 * - __callback__: Function to execute on each element. It accepts between one and three arguments:
	 * 	- __currentValue__: The current element being processed in the tree.
	 * 	- __index (optional)__: The index of the currentValue in the tree ordered.
	 * 	- __depth (optional)__: The level on which the currentValue is on the tree.
	 * 	- __ast (optional)__:  The ast forEach() was called upon.
	 * @template T
	 * @param {function(T, number, Ast) : void} callback
	 */
	forEach(callback) {
		let index = 0;
		for (let { value, depth } of this.getIterator()) {
			callback(value, index++, depth, this.ast);
		}
	}

	/**
	 *
	 * @returns { Number } Number of nodes inside the AST
	 */
	length() {
		return this.reduce((acc, item, index) => index, 0);
	}

	/**
	 * ### Summary.
	 * The ___find()___ method returns the value of the first element in the provided Ast that satisfies the provided predicate.
	 *
	 * ### Description.
	 * > arguments: (callback(element[, index[, depth[,ast]]])) => value | undefined
	 *
	 * ### Parameters.
	 * - __callback__  Function to execute on each value in the ast, taking 3 arguments:
	 *		- __element__ The current element in the ast.
	 *		- __index (optional)__ The index (position) of the current element in the ast ordered.
	 *		- __depth (optional)__ The level on which the currentValue is on the tree.
	 *		- __ast (optional)__ The ast that find was called upon.
	 * @template T
	 * @param {function(T, number, number, Ast) : T|undefined} callback
	 * @returns {T|undefined}
	 */
	find(callback) {
		let index = 0;
		for (let { value, depth } of this.getIterator()) {
			if (callback(value, index++, depth, this.ast)) {
				return value;
			}
		}
		return undefined;
	}

	/**
	 * ### Summary.
	 * The ___filter()___ method creates a new Ast with all elements that pass the test implemented by the provided function.
	 *
	 * ### Description.
	 * arguments: (callback(element[, index[, ast]])) => boolean
	 *
	 * ### Parameters.
	 * - __callback__: Function is a predicate, to test each element of the Ast. Return a value that coerces to true to keep the element, or to false otherwise.
	 * 	- __element__: The current element in the ast.
	 * 	- __index (optional)__: The index (position) of the current element in the ast ordered.
	 * 	- __ast (optional)__: The ast that filter was called upon.
	 * @template T
	 * @param {function(T, number, Ast) : boolean} callback
	 * @returns {T}
	 */
	filter(callback) {
		return this.map(
			(item, index, ast) => (callback(item, index, ast) ? null : item),
			false
		);
	}
}

module.exports = Ast;

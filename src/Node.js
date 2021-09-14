const generateId = () => {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		var r = (Math.random() * 16) | 0,
			v = c == "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

const Node = (token, type) => {
	return {
		type: type,
		token,
		id: generateId(),
		posStart: token.posStart,
		posEnd: token.posEnd,
	};
};

const NumberNode = (token) => {
	return {
		...Node(token, "NumberNode"),
		toString: function () {
			return this.token.toString();
		},
	};
};

const StringNode = (token) => {
	return {
		...Node(token, "StringNode"),
		toString: function () {
			return this.token.toString();
		},
	};
};

const ListNode = (elementNodes, posStart, posEnd) => {
	return {
		...Node(elementNodes, "ListNode"),
		posStart,
		posEnd,
		toString: function () {
			return this.token.toString();
		},
	};
};

const BinOpNode = (leftNode, token, rightNode) => {
	return {
		...Node(token, "BinOpNode"),
		leftNode: leftNode,
		rightNode: rightNode,
		posStart: leftNode.posStart,
		posEnd: rightNode.posEnd,
		toString: function () {
			return `(${this.leftNode}, ${this.token}, ${this.rightNode})`;
		},
	};
};
const UnaryOpNode = (token, node) => {
	return {
		...Node(token, "UnaryOpNode"),
		node: node,
		posEnd: node.posEnd,
		toString: function () {
			return `(${this.token}, ${this.node})`;
		},
	};
};

const VarAccessNode = (token, node) => {
	return {
		...Node(token, "VarAccessNode"),
		node: node,
	};
};

const VarAssignNode = (token, tokenType, node) => {
	return {
		...Node(token, "VarAssignNode"),
		node: node,
		tokenType,
		posEnd: node.posEnd,
	};
};

const IfNode = (cases, elseCase) => {
	return {
		type: "IfNode",
		cases,
		elseCase,
		id: generateId(),
		posStart: cases[0][0].posStart,
		posEnd: (elseCase || cases[cases.length - 1])[0].posEnd,
	};
};

const ElementPropertyNode = (token, node) => {
		return {
				...Node(token, "ElementPropertyNode"),
				node,
				posEnd: node.length ? node[node.length - 1].posEnd : token.posEnd
		}
}

const EventExpresionNode = (token, node) => {
		return {
				...Node(token, "EventExpresionNode"),
				node,
				posEnd: node.posEnd
		}
}

const AssignExpressionNode = ({propertyName, fromNode, value}) => {
		return {
				...Node(propertyName, "AssignExpressionNode"),
				node: fromNode,
				value,
				posEnd: fromNode ? fromNode.posEnd : value.posEnd
		}
}
const PropertyNode = (token, node, identifier) => {
		return {
				...Node(token, "PropertyNode"),
				node,
				identifier,
				posEnd: identifier ? identifier.posEnd : node.posEnd
		}
}
const MatchValidationNode = (token, node) => {
		return {
				...Node(token, "MatchValidationNode"),
				node,
				posEnd: node.posEnd
		}
}
const TogglePropertyNode = (token, node) => {
		return {
				...Node(token, "TogglePropertyNode"),
				node,
				posEnd: node.posEnd
		}
}

module.exports = {
	Node,
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
	TogglePropertyNode,
	IfNode,
};

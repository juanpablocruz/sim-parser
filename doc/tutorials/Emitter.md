# Creating emitters
An emitter is a program responsible for given a SIM file output a program, may it be a React, Vue, AngularJs or HTML interface, a C# API, a node-js application, the oportunities are almost limitless.

## Frontend
The current standard API for emitters just states that if the emitter is going to generate an interface it should expose generateFront with the following signature:
```js
function generateFront(
	ast,
	templates,
	outputFolder,
	generateAndSave,
	readFile,
	config = { withBack: false, isFirst: true, verbose: false },
	log = defaultLog
) { }
```
- ast: The SIM file parsed into an AST class.
- templates: an object containing the frontend template files for the technology used.
- outputFolder: a string containing the output path.
- generateAndSave: a helper function that saves the files into disk, its signature is `(dest:String) => Maybe<[String]>`
- readFile: a helper function that can read system files with the signature: `(templatePath: String) => Maybe<String>`
- config: an object with configuration about the process:
  - withBack: a flag to indicate that we are also generating a backend, its usefull por example to generate redux code to call the backend for fetching and updating/saving data.
  - isFirst: a flag to indicate whether we are on our first file or not, this is needed as if this is the first file we will need to fetch the template from the templates folder, but if not we will need to use the already generated file in order to concat both files insted of overwriting.
  - verbose: a flag for showing additional logs in the process.
- log: a helper function to handle logging.

## Backend
If we are going to generate an API project we should expose generateBack with the following signature:
```js
function generateBack(
	ast,
	templates,
	projectName,
	outputFolder,
	generateAndSave,
	readFile,
	config = { isFirst: true, verbose: false },
	log
) { }
```
- ast: The SIM file parsed into an AST class.
- templates: an object containing the frontend template files for the technology used.
- projectName: the name of the project.
- outputFolder: a string containing the output path.
- generateAndSave: a helper function that saves the files into disk, its signature is `(dest:String) => Maybe<[String]>`
- readFile: a helper function that can read system files with the signature: `(templatePath: String) => Maybe<String>`
- config: an object with configuration about the process:
  - isFirst: a flag to indicate whether we are on our first file or not, this is needed as if this is the first file we will need to fetch the template from the templates folder, but if not we will need to use the already generated file in order to concat both files insted of overwriting.
  - verbose: a flag for showing additional logs in the process.
- log: a helper function to handle logging.


## Interpreter
Not every emitter we create will need to interprete the Ast, for example, most backend projects will only need to extract from the AST the controlled elements in order to create a Model. This can be done by parsing the Ast along.

If on the other hand, we are creating a frontend project, chances are that we will need to interprete the Ast.





## Parsing the Ast

First we will need some helper functions:
```js
/**
 * Searches for the node properties inside the provided ast
 * @param {any} node
 * @returns {any|undefined}
 */
const getProperties = (node) => {
	return new Ast(node).find((value, index, depth) => {
		if (
			depth <= 2 &&
			value.type === "ElementPropertyNode" &&
			value.token.value === "properties"
		) {
			return true;
		}
		return false;
	});
};

/**
 * Searches for a node of type propertyName that matches the predicate function inside the ast tree provided.
 * @param {Ast} ast
 * @returns {(propertyName:string, predicate: (value) => boolean) => any|undefined}
 */
const findByProperty = (ast) => (propertyName, predicate) =>
	ast.find((value) => value.type === propertyName && predicate(value));

/**
 * Searches for a node of type PropertyNode inside the ast tree with value name
 * @param {Ast} ast
 * @param {string} name
 * @returns {any|undefined}
 */
const getPropertyByName = (ast, name) => {
	const properties = getProperties(ast);
	if (properties) {
		return findByProperty(new Ast(properties))(
			"PropertyNode",
			({ token: { value } }) => value === name
		);
	}
	return undefined;
};
```
With these functions we have the ability to filter and search our Ast for some properties. This allows us to find configuration options for our controlled elements, like a default value.
```js
const uncontrolledElements = ["Form", "Row", "Paragraph", "Image", "Button", "Label"]

const getControlledElements = (ast) =>
	ast.reduce((acc, item) => {
		if (item.type === "VarAssignNode" && !uncontrolledElements.includes(item.tokenType.value)) {
			const defaultValue = getPropertyByName(item, "value");

			let result = {
				node: item,
				name: item.token.value,
				type: item.tokenType.value,
			};

			if (defaultValue) {
				result.defaultValue = defaultValue.node.token.value;
			}

			return [...acc, result];
		}
		return acc;
	}, []);

const getEntityName = (ast) => {
	const entityNode = findByProperty(ast)(
		"VarAssignNode",
		({ tokenType: { value } }) => value === "Form"
	);
	let entityName = "";

	if (entityNode) {
		entityName = entityNode.token.value;
	}
	return entityName;
};
```

And now all we have to do is get the controlled elements and the entity name for generating models.
```js
const controlledTypes = getControlledElements(ast);
const entityName = getEntityName(ast);
```
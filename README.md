# sim-parser

This project contains the lexer and the parser for the sim file format designed to describe applications.
The input is expected to be a sim file i.e.:

```SIM
with Form MyForm1
	# This is a comment	
	with properties
		width 3 columns
		label "Test form"

	with Select Country
		with rules
			when clicks
				if value is -1
					set CoffeeSelection validation to "^(1[3-4][0-9]{2}){1}|([4-7][0-9]{3})$" 
				else if value is "GB"
					set CoffeeSelection validation to "^(1[3-4][0-9]{3}){1}|([4-7][0-9]{3})$"
				else if value is >= 2 and value is < 5 and value is 3
					set CoffeeSelection validation to "^(1[3-4][0-9]{3}){1}|([4-7][0-9]{3})$"
                else 
					enable SubmitButton 
```

And will produce an AST containing all the parsed nodes hierarchically.
That AST is then ment to be used as input for the different emmitters (React, Vue, Angular, C#) that will then generate the specified frontend backend or either one of them alone.

Each emmitter is supposed to be a plugin on its own and will be hosted on its own repository:

- [react emitter](https://github.com/juanpablocruz/sim-emitter-react)
- [csharp emitter](https://github.com/juanpablocruz/sim-emitter-csharp)

## Grammar

Please refer to the [grammar description file](/doc/tutorials/Grammar.md) for a formal description of the grammar

## Documentation
You can check out the documentation in [here](https://dev.azure.com/sgs-swacoe-projects/SGS%20Pickles%20Jar/_wiki/wikis/SGS-Pickles-Jar.wiki/1222/SIM)
## Built with
- Javascript


## Installation

First get your own copy of the project

```bash
git clone https://dev.azure.com/sgs-swacoe-projects/SGS%20Pickles%20Jar/_git/SIM-parser
```
Then install it
```bash
cd SIM-parser
yarn
```

## Usage

### Run from CLI 

You can run the parser directly from the command line, this will execute the CmdExec.js file
```bash
yarn parse <source_code_file_path>
```

### Run from node environment
You can also include the parser in your project by importing it

```js
const { readAndParse } = require('sim-parser')


const {ast, error} = readAndParse(filepath)

// use the ast as input for the emmitter
```
or from a source

```js
const { parse } = require('sim-parser')


const {ast, error} = parse(sourceCode)

// use the ast as input for the emmitter
```


## Running Tests
There are several tests that ensure both the Lexer and the Parser works as expected.
In order to manually run them execute the following command in the terminal:

```bash
yarn test
```

## Contributing
Please see our [Contribution Guide](CONTRIBUTING.md) to learn how to contribute.

## License
> You can check out the full LICENSE file [here](LICENSE)

This project is licensed under the terms of the MIT license.

## Authors

[Juan Pablo Cruz](https://github.com/juanpablocruz)

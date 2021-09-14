const { exec } = require("./Exec");
const Ast = require('./Ast')
const fs = require("fs");

const fileName = "<stdin>";

function run(file) {
	while (true) {
		const text = fs.readFileSync(file).toString();
		const { value, error } = exec(fileName, text);
		if (error) {
			return {ast: null, error: error.toString()};
		} else if (value) {
			return {ast: new Ast(value), error: null};
		}
	}
}

module.exports = {
	run,
};

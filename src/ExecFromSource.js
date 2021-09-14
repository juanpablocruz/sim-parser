const { exec } = require("./Exec");
const Ast = require('./Ast')

const fileName = "<stdin>";

function run(text) {
	while (true) {
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

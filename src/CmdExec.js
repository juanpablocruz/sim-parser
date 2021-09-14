const {run} = require('./ExecFromFile')

if (process.argv.length !== 3) {
	console.error("error: expecting 1 argumment with the file to parse.")
}

const [cmd, src, targetFile] = process.argv

const {ast, error} = run(targetFile)

if (error) {
	console.error(error)
} else {
	console.log(ast.toString())
}
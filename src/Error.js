const stringWithArrows = (text, posStart, posEnd) => {
		let result = ''
		// Calculate indices
		let idxStart = Math.max(text.lastIndexOf("\n"), 0)
		let idxEnd = text.indexOf('\n', idxStart + 1)
		if (idxEnd < 0) {
				idxEnd = text.length
		}

		// Generate each line
		let lineCount = posEnd.line - posStart.line + 1
		for (let i of [...Array(lineCount).keys()]) {
				// calculate line columns
				let line = text.substring(idxStart, idxEnd)
				let colStart = i === 0 ? posStart.col : 0
				let colEnd = i === (lineCount - 1) ? posEnd.col : line.length - 1
				
				// Append to result
				result += line + '\n'
				if(colEnd >= colStart)
					result += ' '.repeat(colStart) + '^'.repeat(colEnd - colStart)

				// Re-calculate indices
				idxStart = idxEnd
				idxEnd = text.indexOf('\n', idxStart + 1)
				if (idxEnd < 0) {
						idxEnd = text.length
				}
		}
		return result.replace('\t', '')
}

const Error = (posStart, posEnd, error_name, details) => {

	return {
		posStart: posStart,
		posEnd: posEnd,
		error_name: error_name,
		details: details,
		toString: function() {
			return `${error_name}: ${details}
		File ${this.posStart.fileName}, line ${this.posStart.line + 1}

${stringWithArrows(this.posStart.fileText, this.posStart, this.posEnd)}`;
		},
	};
};

const IllegalCharError = (posStart, posEnd, details) => {
	return {
		...Error(posStart, posEnd, "Illegal Character", details),
	};
};

const InvalidSyntaxError = (posStart, posEnd, details) => {
	return {
		...Error(posStart, posEnd, "Invalid Syntax", details),
	};
};

const ExpectedCharError = (posStart, posEnd, details) => {
	return {
		...Error(posStart, posEnd, "Expected Character", details),
	};
};


const RTError = (posStart, posEnd, details, context) => {
	return {
		context: context,
		posStart: posStart,
		posEnd: posEnd,
		error_name: "Runtime Error",
		details: details,

		toString: function () {
			return `${this.generateTraceback()}
${this.error_name}: ${this.details}
${stringWithArrows(this.posStart.fileText, this.posStart, this.posEnd)}`;
		},
		generateTraceback: function () {
			let result = "";
			let pos = this.posStart;
			let ctx = this.context;
			while (ctx) {
				result = `File ${pos.fileName}, line ${pos.line + 1}, in ${
					ctx.displayName
				}`;
				pos = ctx.parentEntryPos;
				ctx = ctx.parent;
			}
			return `Traceback (most recent call last):
					${result}`;
		},
	};
};

module.exports = {
	Error,
	IllegalCharError,
	InvalidSyntaxError,
	ExpectedCharError,
	RTError,
};

# Creating a generator
A generator is a program that outputs a SIM file from any source: an image, gherkin, psd, you name it.

A generator must expose two methods from its index:

- process: a function that is responsible for generating the SIM, it must return an object with a key with the fileName and the SIM text as value:
  ```js
	const processGherkin = (file) => {
		// load file and process
		return {[file]: simText}
	}
  ```
- register: a function called in TemplateGenerator for registering the generator, its signature is:
  ```js
  (event, additionalData) => {
	  event.on("event-name", (event, files) => {
		  // this should iterate through files and call _process_
	  })
  }
  ```
  ___additionalData___ is an object that may contain any extra objects or functions, by default it carries ProgressBar which allows the plugin to show information about the progress. In SketchToCode generator, it uses IAConfig which is passed through additionalData as a way of configuring the Azure Custom Vision model and OCR. This object is configured in the [main process](https://dev.azure.com/sgs-swacoe-projects/SGS%20Pickles%20Jar/_git/CoE-TemplateGenerator?path=%2Fsrc%2Fmain.dev.js&version=GBmain&line=99&lineEnd=100&lineStartColumn=1&lineEndColumn=1&lineStyle=plain&_a=contents) of the electron thread.

The way your generator converts the input file to a SIM is up to its implementation, as each input requires different strategies to convert.
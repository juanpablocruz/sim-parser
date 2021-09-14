/**
 * @classdesc
 * An operation result object that represents the outcome of a failure prone operation.
 * It holds a value in case of success or an error in case of failure.
 * 
 * 
 * @constructor
 * @returns {Result}
 */
const Result = () => {
		value = null;
		error = null;
	
		return {
			value,
			error,
			lasRegisteredAdvanceCount: 0,
			advanceCount: 0,
			toReverseCount: 0,
			funcReturnValue: null,
			loopShouldContinue: false,
			loopShouldBreak: false,
	
			reset: function () {
				this.value = null;
				this.error = null;
				this.lasRegisteredAdvanceCount = 0;
				this.advanceCount = 0;
				this.toReverseCount = 0;
				this.funcReturnValue = null;
				this.loopShouldContinue = false;
				this.loopShouldBreak = false;
			},
	
			registerAdvancement: function () {
				this.lasRegisteredAdvanceCount = 1;
				this.advanceCount += 1;
			},
			/**
			 * Applies a target result to this instance, changing its
			 * inner error to the targets and returning the target's value
			 * 
			 * @memberof Result
			 * @instance
			 * 
			 * @example
			 * 
			 * const isInt = (value) => {
			 * 	return Number.isInteger(parseInt(value))
			 * 		? Result().failure("Not an int") 
			 * 		: Result().success(value)
			 * }
			 * 
			 * let result = Result()
			 * 
			 * const num = isInt("23")
			 * if (num.error) {
			 * 	console.error(num.error)
			 * } else {
			 * 	console.log(num)
			 * }
			 * 
			 * @param {Result} res - The result to flat map with
			 * @returns {*} The target result's value
			 */
			from: function (res) {
				this.lasRegisteredAdvanceCount = this.advanceCount;
				this.advanceCount += res.advanceCount;
				if (res.error) this.error = res.error;
				this.funcReturnValue = res.funcReturnValue;
				this.loopShouldBreak = res.loopShouldBreak;
				this.loopShouldContinue = res.loopShouldContinue;
	
				return res.value;
			},
			tryFrom: function (res) {
				if (res.error) {
					this.toReverseCount = res.advanceCount;
					return null;
				}
				return this.from(res);
			},
			/**
			 * @memberof Result
			 * @instance
			 * @method
			 * @example
			 * 
			 * const isInt = (value) => {
			 * 	return Number.isInteger(parseInt(value))
			 * 		? Result().failure("Not an int") 
			 * 		: Result().success(value)
			 * }
			 * 
			 * @param {*} value - Create a {@link Result} from the provided value
			 * @returns {Result}
			 */
			success: function (value) {
				this.reset();
				this.value = value;
				return this;
			},
			successReturn: function (value) {
				this.reset();
				this.funcReturnValue = value;
				return this;
			},
			successContinue: function () {
				this.reset();
				this.loopShouldContinue = true;
				return this;
			},
			successBreak: function () {
				this.reset();
				this.loopShouldBreak = true;
				return this;
			},
			/**
			 * @memberof Result
			 * @instance
			 * @method
			 * 
			 * @example
			 * 
			 * const isInt = (value) => {
			 * 	return Number.isInteger(parseInt(value))
			 * 		? Result().failure("Not an int") 
			 * 		: Result().success(value)
			 * }
			 * 
			 * @param {*} error - Creates a {@link Result} in the state of error.
			 * @returns {Result}
			 */
			failure: function (error) {
				if (!this.error || this.advanceCount === 0) {
					this.reset();
					this.error = error;
				}
	
				return this;
			},
			shouldReturn: function () {
				return (
					this.error ||
					this.funcReturnValue ||
					this.loopShouldContinue ||
					this.loopShouldBreak
				);
			},
		};
	};
	
	module.exports = Result;
	
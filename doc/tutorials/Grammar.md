## BNF definition
This is the [bnf](https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_form) definition of the SIM syntax.

```bnf
statements	: NEWLINE* expr (NEWLINE+ expr)* NEWLINE

expr		: KEYWORD:with IDENTIFIER (IDENTIFIER) NEWLINE
			  (NEWLINE+ prop-expr)*
			: prop-expr

prop-expr	: IDENTIFIER NEWLINE
			: IDENTIFIER atom NEWLINE
			: IDENTIFIER atom IDENTIFIER
			: event-expr

event-expr 	: KEYWORD:when IDENTIFIER 
			  (assign-expr NEWLINE*)*			

assign-expr	: NEWLINE* KEYWORD:set IDENTIFIER IDENTIFIER KEYWORD:to atom
			: NEWLINE* KEYWORD:set IDENTIFIER KEYWORD:as (KEYWORD:not) IDENTIFIER
			: NEWLINE* KEYWORD:set IDENTIFIER KEYWORD:to atom
			: NEWLINE* (KEYWORD:show|KEYWORD:hide|KEYWORD:disable|KEYWORD:enable|KEYWORD:alert|KEYWORD:update) atom
			: comp-expr ((KEYWORD:and|KEYWORD:or) comp-expr)*

comp-expr 	: (KEYWORD:not) comp-expr
			: factor

factor 		: ('-') factor
			: atom

atom		: INT | FLOAT | STRING | IDENTIFIER
			: if-expr

if-expr 	: KEYWORD:if assign-expr NEWLINE
			 (assign-expr)*|if-expr-b|if-expr-c

if-expr-b 	: KEYWORD:else if-expr
			  (assign-expr)*

if-expr-c 	: KEYWORD:else
			  (assign-expr)*
```

## Structure properties

### Flow control syntax

SIM has the ability to define flow control expressions as well as comparisons and unary operations.

You can write flow control statements like this:

```
if expr
	statement
	statement
else if expr
	statement
	statement
else
	statement
	statement
```
Inside each if, else if or else block may contain 1 or more statements.
Every expresion may be as complex as desired while using the following syntax:

### Comparisons syntax
- Equality comparison:
```
if property is number|identifier|string
```
- Greater than, greater than equal, less than, less than equal:
```
if property is < 0
if property is > 0
if property is <= 0
if property is >= 0
```
### Unary operations syntax
```
if property is not "red"
if property is not > -7
```
### Logic operations:
```
if property is > 3 and property is not < 2
if property is > 3 or property is < 1
```


## Keywords
The language has the following reserved keywords:

| Keyword | description |
| --------| ------------|
| is | Used for comparisons |
| match | Used for pattern matching |
| with | Describes a new element or property of element |
| when | Describes a new event block |
| to | Used with _set_ keyword to mark the target value |
| if | Flow controll keyword |
| else | Flow controll keyword, may be followed by _if_ for multi-option structure |
| or | Binary operator |
| and | Binary operator |
| not | Unary operator |
| as | Used with _set_ keyword to mark the soure entity |
| set | Keyword for assigning new values |
| show, hide, disable, enable, alert, update | Toggle properties |



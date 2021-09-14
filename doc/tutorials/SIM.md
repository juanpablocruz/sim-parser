
SIM (Standard Input Model) is an application modeling language.

## What is SIM?


## Designing a layout

For designing layouts we need to:
- Create a __Row__ item
- Add to the __Row__ element a property _width_ with the number of columns that element will have.
- Add the children properly indented, that may include any number of __Row__ children with further subdivisions.


##### Example of complex layout
```
with Form MyForm
	with Row row5
		with properties
			width 2
		with Row row4
			with properties
				width 2
		
			with TextBox Whoareyou
				with properties
					label "Who are you?"
				with interactions
					when changes
						update value
		
			with TextBox Name
				with properties
					label "Name"
				with interactions
					when changes
						update value
		with Image Image
			with properties
				source "placeholder"

	with Label Somethingelse
		with properties
			label "something else"

	with Paragraph Paragraph
		with properties
			label ""
	with Row row7
		with properties
			width 2
		with Row row6
			with properties
				width 2
		
			with Label DateofBirth
				with properties
					label "Date of Birth"
		
			with Button Button
				with properties
					label ""
	
		with Button TOK
			with properties
				label "TOK"

```

## Example SIM

```
with Form MyForm1
	# This is a comment
	# STANDARD INPUT MODEL
	with properties
		width 3 columns
		label "Test form"

	with Select Country
		with rules
			when clicks
				if value is "SP"
					set CoffeeSelection validation to "^(1[3-4][0-9]{2}){1}|([4-7][0-9]{3})$" 
				else if value is "GB"
					set CoffeeSelection validation to "^(1[3-4][0-9]{3}){1}|([4-7][0-9]{3})$"
				
	with TextBox CoffeeSelection
		with properties 
			hidden
			disabled
			width full
			validation "^(1[3-4][0-9]{2}){1}|([4-7][0-9]{3})$"
			length 30
			label "coffe"
			value "arabic"
			placeholder "Type something"
		with rules
			when clicks			
				if IVAValue is empty or not number
					alert "IVA is empty"
					
		with interactions 
			when changes
				set value to "red" 
			when clicks
				if value is -1 
					disable SubmitButton
					enable otraCosa 				
				else if value is >= 2 and value is < 5 and value is 3
					disable otherButton
				else 
					enable SubmitButton 

				set MyOtherTextbox2 value to "N/A"
				set value to "N/A"
				set MyOtherTextbox2 value to MyRichTexbox
				set value to MyRichTexbox
				
				show MyOtherTextbox
				hide MyOtherTextbox2
				
				disable MyOtherTextbox3
				enable MyOtherTextbox3

			when loads
				set ATTACHMENT mandatory 

```
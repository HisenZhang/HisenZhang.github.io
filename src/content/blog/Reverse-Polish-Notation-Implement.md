---
title: "Reverse-Polish-Notation-Implement"
description: "例程 | 逆波兰表达式Python实现"
pubDate: 2026-01-09T04:46:21.575Z
---

[逆波兰表达式练习](/post/rpn-challenge/)涉及到条件判断/循环/变量类型以及初级的数据结构, 逻辑简洁, 是理想的初学者编程练习项目. 这里提供一个简单的Python版本实现.



```python
import sys
def rpn(expression):
	expression = expression.strip()	
	# remove all spaces on the left and right
	stack,digit=[],''	
	# 'stack' is used for interpreting the expression. 
	# 'digit' is used for storing numbers. If the number has more than one digits, 
	# the current character would be joined after the previous character until there 
	# comes a space or comma.
	for i in expression:
		if i in '0123456789.':	
		# if the current digit is an number/digital point
			digit += i 			
			# then it would be joined after the previous one
		elif i in '+-*/, ':		
		# or it is an operator
			if i == ' ' or ',':	
			# if it is a seperator, i.e. space and commma
				if digit == '':	
				# since 'digit' would be wiped after a seperator 
				# comes, when it is empty it means the previous 
				# charater is also a seperator. This is set to 
				# prevent more than one seperator carelessly used,
				# especially space.
					pass		
					# then do nothing.
				else:			
				# Now it is a true seperator. 
					stack.append(float(digit))	
					# We need to send the 'digit'
					# into 'stack'
					digit = ''					
					# and wipe 'digit'
			# In other cases, not a seperator, it should take computation and send
			# the result back to the end of 'stack'.
			if i == '+':								
			# If it is a plus sign
				stack.append(stack.pop()+stack.pop()) 	
				# pop two numbers out and plus
			if i == '-':								
			# if minus
				stack.append(-stack.pop()+stack.pop())	
				# WARNING! there is a order when
				# the number is poped. Rememer
				# when doing subtraction, we need
				# to swap the two number poped. 
				# But we may also achieve this by 
				# swaping the sign of each number.
			if i == '*':								
			# Similar to addition
				stack.append(stack.pop()*stack.pop())
			if i == '/':								
			# similar to substraction. But this
			# time we can't swap two signs. 
			# defining two varibles to store s 
			# and d is a good idea.
				d,s = stack.pop(),stack.pop()			
				# defining 
				stack.append(s/d)						
				# the result is s over d.
		else: 
			raise SyntaxError('Invalid characters included.')	
			# check invalid characters
	if (len(stack) == 1) and (digit==''):				
	# if there is only one element (result)
	# in the stack and there is nothing in
	# 'digit', then everything goes well.
	# the result is the final answer
		return stack.pop()								
		# return the result
	else: 
		raise SyntaxError('Invalid expression.')		
		# Or raise the exception.

try:
	print(rpn(sys.argv[1]))
except SyntaxError:
	print('Invalid expression.')
except IndexError:
	print('SyntaxError')
```
&nbsp;
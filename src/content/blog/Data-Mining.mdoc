---
title: Data-Mining
description: Data Mining
pubDate: 2026-01-09T04:46:21.574Z
---

Analyzing trend gives you a direction when making decisions. For instance, investigate the housing market before purchasing properties may tell you what is the most suitable place for you.

Data speak the words of truth, as long as they are treated with specific patterns. But in general, a larger dataset ensures the quality of analysis.

Fortunately, the nowadays low cost to data access makes it possible for everyone to be a data scientist. With the help of Python, database, and plotting packages, you are allowed to explore a space the once only belongs to statisticians.

In this post, we are going to have a look at:

1.  How to obtain your data;
2.  How to store them;
3.  How to visualize them.



## Obtain Your Data & Store them

Python is a good tool to obtain data from the Internet.
```python
# -*- coding: UTF-8 -*-
from __future__ import division
import sys,requests,re,json,sqlite3
from prettytable import PrettyTable as pt

#initialze database
def init_db():
	conn = sqlite3.connect('housing.db')
	#initialze database connection
	db_cursor = conn.cursor()
	db_cursor.execute('''CREATE TABLE IF NOT EXISTS housing
			(id           INT     PRIMARY KEY    NOT NULL,
			name          TEXT    NOT NULL,
			area          REAL   ,
			ve            REAL   ,
			price         REAL);''')
	# create a table housing if not exists
	conn.commit()
	return conn,db_cursor

def ve_convert(GREEN_COVERAGE):
	if isinstance(GREEN_COVERAGE, float):
		return GREEN_COVERAGE / 100
	if isinstance(GREEN_COVERAGE, unicode):
		no_sign = GREEN_COVERAGE.replace(u'%','')
		no_sign = no_sign.replace(u'以上','').encode('utf-8')
		return float(no_sign)/100

# The main process of community-db.py
def com(): 

	list_page_url = 'http://hangzhou.fangtoo.com/building/cp'
	sector_page_url = 'http://hangzhou.fangtoo.com/building/'

	name_id_filter = ur'&lt;a href=["]http://hangzhou.fangtoo.com/building/(.*)/["] target=["]_blank["] title=["](.*)["] target=["]_blank["]&gt;'
	price_filter = ur'&lt;span class=["]fontS30 Cred["]&gt;(.*)&lt;/span&gt;'
	area_filter = ur'&lt;li&gt;占地面积：(\d.*)平方米&lt;/li&gt;'
	ve_filter = ur'&lt;li&gt;绿化率：(.*)&lt;/li&gt;'

	table_title = ["NO.","id","Name","Area","Green Coverage","Price"]

	x = pt(table_title) 
	# Check Info

	conn,db_cursor = init_db()

	print('\033[2J\033[HConnected to database. Requesting data from the Internet...')
	# Page loop
	# 318 as upper boundry, 10~ for DEMO
	for sector_count in range(1,318):	
		# Progression bar
		print '\nSector',sector_count,'of 317\n'
		# Get URL
		list_page = requests.get(url = list_page_url + str(sector_count))
		# Get the name_id list from page loop
		name_id = re.findall(name_id_filter,list_page.text)
		price = re.findall(price_filter,list_page.text)
		# Leave blank 1
		x.padding_width = 1
		# Item loop
		for i in range(len(name_id)):
			# Get info from URL
			sector_page = requests.get(url = sector_page_url + str(name_id[i-1][0]))
			sector_length = len(name_id)
			# Pick info from sector_page
			area = re.findall(area_filter,sector_page.text) 
			ve = re.findall(ve_filter,sector_page.text)
			# Have '--' if area is missing
			if area == []:
				area = [('--')]
			# Set varibles
			CODE = str(i+1+(sector_count-1)*sector_length)
			ID = name_id[i][0].encode('utf-8')
			NAME = name_id[i][1].encode('utf-8')
			AREA = area[0].replace(u'万','0000').encode('utf-8')
			GREEN_COVERAGE = ve[0].replace(u'。','').encode('utf-8')
			PRICE = price[i].replace(u'万','0000').encode('utf-8')
			# Generate strings based on these varibles
			table_data = ([CODE.zfill(4),ID,NAME,AREA,GREEN_COVERAGE,PRICE])
			# Print strings to screen in a human-friendly manner
			print CODE.zfill(4),ID,NAME,AREA,GREEN_COVERAGE,PRICE
			x.add_row(table_data)

			GREEN_COVERAGE = ve_convert(GREEN_COVERAGE)

			if '--' not in (CODE,NAME,AREA,GREEN_COVERAGE,PRICE):
				db_interface = (int(CODE),NAME,float(AREA),GREEN_COVERAGE,float(PRICE))
				db_cursor.execute("INSERT INTO housing VALUES \
					(%d, '%s', %f, '%s', %f);"%(db_interface))
		conn.commit()
	print x

	conn.close()
	print('All requests successfully recorded.')

def main(args):
	com()

if __name__ == '__main__':
	sys.exit(main(sys.argv))`</pre>
```
The program grabs information presented on a website and store all complete record into SQLite database.


## Visualize Data: Let it speaks

In this case, we list three plots in order to:

1.  Price distribution
2.  The correlation of unit price, community area, and green coverage rate.


```python
# -*- coding:utf-8 -*-
import __future__
import numpy as np
import matplotlib.pyplot as plt
import sqlite3

conn = sqlite3.connect('housing.db')
db_cursor = conn.cursor()

data = []
for i in db_cursor.execute('''SELECT price FROM housing;'''):
	data += i

std = np.std(data)
mean = np.mean(data)

def normfun(x,mu,sigma):
	pdf = np.exp(-((x - mu)**2)/(2*sigma**2)) / (sigma * np.sqrt(2*np.pi))
	return pdf

p1 = plt.subplot2grid((2,2), (0, 0), rowspan=2)
p2 = plt.subplot2grid((2,2), (0, 1))
p3 = plt.subplot2grid((2,2), (1, 1))

x = np.arange(mean-5*std,mean+5*std,1)
y = normfun(x, mean, std)
p1.plot(x,y)
p1.hist(data, bins=100, rwidth=1, normed=True)
p1.title.set_text('Price Distribution')
p1.set_xlabel('Price')
p1.set_ylabel('Probability')
p1.legend()

x,y = [],[]
for i in db_cursor.execute('''SELECT ve,price FROM housing;'''):
	y.append(i[0])
	x.append(i[1])
p2.scatter(x,y)
p2.title.set_text('Green Coverage - Price')
p2.set_xlabel('Price')
p2.set_ylabel('Percentage')
fit = np.polyfit(x, y, deg=1)
fit = (fit).tolist()
y=[]
for i in x:
	y.append(i*fit[0]+fit[1])

p2.plot(x, y, 'r-',label='linear regression [%f,%f]'%(fit[0],fit[1]))
p2.set_ylim([0,1])
p2.set_xlim([0,127000])
p2.legend()

x,y = [],[]
for i in db_cursor.execute('''SELECT area,price FROM housing;'''):
	y.append(i[1])
	x.append(i[0])
p3.scatter(x,y)
p3.title.set_text('Price - Community Area')
p3.set_xlabel('Community Area')
p3.set_ylabel('Unit Price')
fit = np.polyfit(x, y, deg=1)
fit = (fit).tolist()
y=[]
for i in x:
	y.append(i*fit[0]+fit[1])

p3.plot(x, y, 'r-',label='linear regression [%f,%f]'%(fit[0],fit[1]))
p3.set_xlim([0,1000000])
p3.legend()

plt.show()
conn.close()
```


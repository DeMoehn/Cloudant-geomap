#!/usr/bin/python

import requests
import csv
import json

# configuration values
config = dict(
    username="demoehn3",
    password="a11HQSM54!!",
    database="telematics")

# authenticate with cloudant via cookie
auth = "name={username}&password={password}".format(**config)
auth_url = "https://{username}.cloudant.com/_session".format(**config)
auth_headers = {"Content-Type": "application/x-www-form-urlencoded"}
r = requests.post(auth_url,
                 data=auth,
                 headers=auth_headers)
# save auth cookie
cookies = r.cookies

# Read all data
read_url = "https://{username}.cloudant.com/{database}/_all_docs?limit=2&include_docs=true".format(**config)
r = requests.get(read_url, cookies=cookies)
# if it worked, print the results so we can seeeeee
if r.status_code in [200, 201, 202]: # on OK, Created or Accepted
    data = r.json()
    for x in data["rows"]:
        doc = x["doc"]
        x.update({"geometry": {"type": "Point", "coordinates": [doc["LONGITUDE"], doc["LATITUDE"], doc["ALTITUDE"]]}})
        x.update({"acceleration": [doc["ACC_X"], doc["ACC_Y"], doc["ACC_Z"]]})
        del doc["LONGITUDE"], doc["LATITUDE"], doc["ALTITUDE"], doc["ACC_X"], doc["ACC_Y"], doc["ACC_Z"]
    print "data: ",data
else:
    print r.status_code
    print r.text

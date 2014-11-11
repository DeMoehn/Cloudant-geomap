import requests
import json
import sys
from pprint import pprint

# configuration values
config = dict(
    username="demoehn3",
    password="a11HQSM54!!",
    database="regions")

# dict of request data, which we'll upload to Cloudant

json_data = open('regions.json')

data = json.load(json_data)

json_data.close()

# authenticate with cloudant via cookie
auth = "name={username}&password={password}".format(**config)
auth_url = "https://{username}.cloudant.com/_session".format(**config)
auth_headers = {"Content-Type": "application/x-www-form-urlencoded"}
r = requests.post(auth_url,
                 data=auth,
                 headers=auth_headers)
# save auth cookie
cookies = r.cookies

# upload!
upload_url = "https://{username}.cloudant.com/{database}".format(**config)
upload_headers = {"Content-Type":"application/json"}
for geodata in data["features"]:
    r = requests.post(upload_url,
                     data=json.dumps(geodata),
                     cookies=cookies,
                     headers=upload_headers)
    # if it worked, print the results so we can seeeeee
    if r.status_code in [200, 201, 202]: # on OK, Created or Accepted
        print "Upload success:",geodata["properties"]["NAME_1"]
    # problems?! D:
    else:
        print r.status_code
        print r.text
        break

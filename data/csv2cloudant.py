import requests
import csv
import json
import sys

# configuration values
config = dict(
    username="demoehn3",
    password="a11HQSM54!!",
    database="telematics")

# dict of table names and their csv representations
csv_lookup = {
    # "table_name": "path/to/file.csv"
    "test": "data_big.csv",
}

# dict of request data, which we'll upload to Cloudant
requests_data = {}

for table, filepath in csv_lookup.iteritems():
    request_data = dict(docs=[])
    # get our data
    with open(filepath, 'rU') as f:
        reader = csv.DictReader(f, skipinitialspace=True, quotechar='"', delimiter=',')
        # put into request body
        for row in csv.DictReader(f):
            row.update({"geometry": {  "type": "Point", "coordinates": [float(row["LATITUDE"]), float(row["LONGITUDE"]), float(row["ALTITUDE"])]}})
            row.update({"acceleration": [float(row["ACC_X"]), float(row["ACC_Y"]), float(row["ACC_Z"])]})
            del row["LONGITUDE"], row["LATITUDE"], row["ALTITUDE"], row["ACC_X"], row["ACC_Y"], row["ACC_Z"]
            request_data['docs'].append(row)
            requests_data[table] = request_data

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
upload_url = "https://{username}.cloudant.com/{database}/_bulk_docs".format(**config)
upload_headers = {"Content-Type":"application/json"}
for table, request_data in requests_data.iteritems():
    r = requests.post(upload_url,
                     data=json.dumps(request_data),
                     cookies=cookies,
                     headers=upload_headers)
    # if it worked, print the results so we can seeeeee
    if r.status_code in [200, 201, 202]: # on OK, Created or Accepted
        print "Upload success:", table
    # problems?! D:
    else:
        print r.status_code
        print r.text
        break

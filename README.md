Fork by: DeMoehn
Changes: Going to add some GUI Interface to the example

How to run
==========

1. Clone the repository and cd to this directory
```
      $ cd /YourDirectory/...
```
2. Edit the config-example with your credentials (Press `Ctrl+X` to finish, Accept with `Y` and `Enter`)
```
      $ sudo nano config
```
3. Change the name from config-example to config
```
      $ mv config-example config
```
4. Edit your local hosts file to point `local.dev` at `localhost`:
```
      $ sudo nano /etc/hosts
```
5. Add a line like '127.0.0.1 local.dev' to the very end of the file. Press `Ctrl+X` to finish, Accept with `Y` and `Enter`)
6. Configure CORS support on Cloudant.  Swap `USERNAME` for your account name:
```
      $ curl -i -u USERNAME -X PUT https://USERNAME.cloudant.com/_api/v2/user/config/cors -H "Content-Type: application/json" -d '{"enable_cors":true,"allow_credentials":true,"allow_methods":["GET","PUT","POST","DELETE","OPTIONS"],"origins":["http://local.dev:8000"]}'
```
7. Start a simple python web server hosting this directory
```
      $ python -m SimpleHTTPServer 8000
```
8. OR: use the Server-Script to only run the server on localhost
```
      $ python server.py
```
9. Run the deployment Script (Creates views and sample data)
```
      $ ./deploy
```
10. Visit http://local.dev:8000/crud.html

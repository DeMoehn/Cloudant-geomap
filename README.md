Fork by: DeMoehn

##Changes:
- Added a DropDown for Playlists
- Added a Cloudant Response and Response Text
- Added Status Messages
- Added JSON Formatting
- Added Songs View
- Added Sortable Songs
- Added Deletable Songs
- Added Playlist Autocompletion

##How to run:

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
5. Add `127.0.0.1 local.dev` to the end of the file. (Press `Ctrl+X` to finish, Accept with `Y` and `Enter`)
6. Configure CORS support on Cloudant.  Swap `USERNAME` for your account name:
```
      $ curl -i -u USERNAME -X PUT https://USERNAME.cloudant.com/_api/v2/user/config/cors -H "Content-Type: application/json" -d '{"enable_cors":true,"allow_credentials":true,"allow_methods":["GET","PUT","POST","DELETE","OPTIONS"],"origins":["http://local.dev:8000"]}'
```
7. Use the `server.py` script to run a simple python server on your localhost
```
      $ python server.py
```
9. Run the deployment Script to create views and sample data
```
      $ ./deploy
```
10. Visit http://local.dev:8000/crud.html

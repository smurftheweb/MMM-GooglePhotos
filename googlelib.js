var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var GoogleLib = function(credentialsFile, tokenFile) {

    var self = this;
    // If modifying these scopes, delete your previously saved credentials
    // at ~/.credentials/admin-directory_v1-nodejs-quickstart.json
    var SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     *
     * @param {Object} credentials The authorization client credentials.
     */
    this.authorize = function() {

        fs.readFile(credentialsFile, function processClientSecrets(err, content) {
            if (err) {
                console.log('Error loading client secret file: ' + err);
                return;
            }

            //console.log(content);

            // Authorize a client with the loaded credentials, then store it
            var credentials = JSON.parse(content);

            var clientSecret = credentials.installed.client_secret;
            var clientId = credentials.installed.client_id;
            var redirectUrl = credentials.installed.redirect_uris[0];
            var auth = new googleAuth();
            var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

            // Check if we have previously stored a token.
            fs.readFile(tokenFile, function(err, token) {
                if (err) {
                    return getNewToken(oauth2Client);
                } else {
                    oauth2Client.credentials = JSON.parse(token);
                    return oauth2Client;
                }
            });
        });
    };

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     *
     * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
     *     client.
     */
    var getNewToken = function(oauth2Client) {
        var authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        });
        console.log('Authorize this app by visiting this url: ', authUrl);
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question('Enter the code from that page here: ', function(code) {
            rl.close();
            oauth2Client.getToken(code, function(err, token) {
                if (err) {
                    console.log('Error while trying to retrieve access token', err);
                    return;
                }
                oauth2Client.credentials = token;
                storeToken(token);
                return oauth2Client;
            });
        });
    };

    /**
     * Store token to disk be used in later program executions.
     *
     * @param {Object} token The token to store to disk.
     */
    var storeToken = function(token) {
        // The token is in the module folder; we know it exists
        // try {
        //     fs.mkdirSync(TOKEN_DIR);
        // } catch (err) {
        //     if (err.code != 'EEXIST') {
        //         throw err;
        //     }
        // }
        fs.writeFile(tokenFile, JSON.stringify(token));
        console.log('Token stored to ' + tokenFile);
    };
};

module.exports = GoogleLib;
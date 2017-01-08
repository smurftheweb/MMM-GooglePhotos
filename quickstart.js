var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/admin-directory_v1-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'drive-nodejs-quickstart.json';

var googlePhotosId = "";
var lastPhotoId = "";
var lastPhotoLink = "";
var lastPhotoName = "";

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
    if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Directory API.
    authorize(JSON.parse(content), listFiles);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
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
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
    var service = google.drive('v3');

    // find the google photos drive
    if (googlePhotosId == null) {
        service.files.list({
            auth: auth,
            pageSize: 100,
            fields: "nextPageToken, files(id, name)",
            q: "name = 'Google Photos' and mimeType = 'application/vnd.google-apps.folder'"
        }, function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            var files = response.files;
            if (files.length == 0) {
                console.log('Photo folder not found.');
                return;
            } else {
                googlePhotosId = files[0].id;
                console.log('Photo folder found: ' + googlePhotosId);
            }
        });
    }

    // Get the list of pictures
    service.files.list({
        auth: auth,
        fields: "nextPageToken, files(id, webContentLink, name)",
        q: "mimeType contains 'image/' and '1IervyVhnBY3PZAklEA2XDZkHcqshUBFFWUNoWqtJCIA' in parents"
    }, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var images = response.files;
        if (images.length == 0) {
            console.log("No images found");
            return;
        } else {

            // Pick one at random (except last one)
            var imgNum = -1;
            do {
                imgNum = Math.floor(Math.random() * (images.length - 1));
            } while (lastPhotoId == images[imgNum].id);

            // Update the last one
            lastPhotoId = images[imgNum].id;
            lastPhotoName = images[imgNum].name;
            lastPhotoLink = images[imgNum].webContentLink;
            console.log("Found random image: " + lastPhotoName);
            console.log(lastPhotoLink);
        }
    });

    console.log('Debug=Folder: ', googlePhotosId, ' Image: ', lastPhotoName, ' (', lastPhotoId, ')');
    return;
    // download the image TODO: Make sure these get deleted!
    var dest = fs.createWriteStream(lastPhotoName);
    drive.files.get({
            fileId: lastPhotoId,
            alt: 'media'
        })
        .on('end', function() {
            console.log('Image downloaded');
        })
        .on('error', function(err) {
            console.log('Failed to download image: ', err)
        })
        .pipe(dest);
    dest.close();
}
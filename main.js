const {google} = require('googleapis');
const readline = require('readline');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = 'token.json';

function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
  
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getNewToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
}

fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize(JSON.parse(content), getMessages);
});

function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
}

function getMessages(auth) {
    const gmail = google.gmail({version: 'v1', auth});
    gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
        q: 'newer_than:10d {subject:Deloitte subject:deloitte "Deloitte" "deloitte"}'
      }, function(err, response) {
          if(err) {
              console.log(err)
          } else {
            //   console.log(response.data.messages[0]);
              console.log("++++++++++++++++++++++++++++")
              response.data.messages.forEach(val => {
                  printMessage(val.id, auth)
              })

            // printMessage(response.data.messages[1].id, auth)
              //parseMessage(response.data.messages,auth);
          }
    });
}

function printMessage(messageID,auth) {
    var gmail = google.gmail('v1');
    gmail.users.messages.get({
    auth: auth,
    userId: 'me',
    id:messageID,
    // format: 'RAW'
  }, function(err, response) {
    //   console.log(response)
    var count  = 0;
    for(var header of response.data.payload.headers) {
        if(header.name === 'From' && header.value.toLowerCase().includes('deloitte')) {
            count ++;
            continue;
        }
    }
    if(count > 0) {
        notify(count)
    }
  });
}

function notify(count) {
    const {id, token} = require('./secret')
    const client = require('twilio')(id, token);

    var body = `You got ${count} new email from Deloitte`
    client.messages
      .create({from: '+12563049231', body: body, to: '+919968966663'})
      .then(message => {
          console.log('sms sent')
      }).catch(err => {
          console.log(err)
      })
}
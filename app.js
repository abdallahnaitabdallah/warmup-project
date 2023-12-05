const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Reply with random text to each email that is labeled.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function changeLabelAndReply(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  const userId = 'me';

  // Get a list of all messages in the user's account with the 'SPAM' label
  const listResponse = await gmail.users.messages.list({
    userId,
    labelIds: ['SPAM'],
  });
  const messages = listResponse.data.messages;

  if (!messages || messages.length === 0) {
    console.log('No messages found with the specified label.');
    return;
  }

  // Function to generate random text for the reply
  const generateRandomText = () => {
    const randomTexts = [
      'Hello!',
      'How are you?',
      'Nice to hear from you!',
      'Hope you have a great day!',
    ];
    const randomIndex = Math.floor(Math.random() * randomTexts.length);
    return randomTexts[randomIndex];
  };

  // Iterate through each email with the 'SPAM' label
  for (const message of messages) {
    // Change labels and move the email to the inbox
    await gmail.users.messages.modify({
      userId,
      id: message.id,
      resource: {
        removeLabelIds: ['SPAM'],
        addLabelIds: ['INBOX'],
      },
    });
    console.log(`Changed labels and moved email with ID ${message.id} to the inbox.`);

    
  }

  console.log(`${messages.length} emails changed labels, moved to the inbox, and replied with random text.`);
}

authorize().then(changeLabelAndReply).catch(console.error);

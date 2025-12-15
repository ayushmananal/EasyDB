// Script to get Gmail OAuth refresh token

import { google } from 'googleapis';
import http from 'http';
import url from 'url';
import open from 'open';
import readline from 'readline';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const OAuth2 = google.auth.OAuth2;

// Replace these with your actual values from Google Cloud Console
const CLIENT_ID = process.env.GMAIL_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE';
const REDIRECT_URI = 'http://localhost:8080/oauth2callback';

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

async function getToken() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  console.log('\n=== Gmail OAuth Setup ===\n');
  console.log('1. Opening browser for authorization...');
  console.log('2. Authorize the application');
  console.log('3. You will be redirected to localhost\n');

  // Create a local server to capture the OAuth callback
  const server = http.createServer(async (req, res) => {
    if (req.url.indexOf('/oauth2callback') > -1) {
      const qs = new url.URL(req.url, 'http://localhost:8080').searchParams;
      const code = qs.get('code');
      
      res.end('Authentication successful! Please return to the terminal.');

      if (code) {
        try {
          const { tokens } = await oauth2Client.getToken(code);
          
          console.log('\n=== SUCCESS! ===\n');
          console.log('Add these to your Cloud Run environment variables:\n');
          console.log(`GMAIL_CLIENT_ID=${CLIENT_ID}`);
          console.log(`GMAIL_CLIENT_SECRET=${CLIENT_SECRET}`);
          console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
          console.log(`GMAIL_USER_EMAIL=your-email@gmail.com`);
          console.log('\nRun this command to update Cloud Run:');
          console.log(`\ngcloud run services update database-querying-backend \\`);
          console.log(`  --region asia-south1 \\`);
          console.log(`  --set-env-vars "GMAIL_CLIENT_ID=${CLIENT_ID},GMAIL_CLIENT_SECRET=${CLIENT_SECRET},GMAIL_REFRESH_TOKEN=${tokens.refresh_token},GMAIL_USER_EMAIL=your-email@gmail.com"\n`);
          
          server.close(() => {
            process.exit(0);
          });
        } catch (error) {
          console.error('Error getting tokens:', error);
          server.close(() => {
            process.exit(1);
          });
        }
      }
    }
  }).listen(8080, () => {
    console.log('Local server started on http://localhost:8080');
    open(authUrl, { wait: false }).then(cp => cp.unref());
  });
}

getToken().catch(console.error);

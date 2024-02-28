//serves as the backend
const { GoogleGenerativeAI } = require("@google/generative-ai");
const  cors = require('cors')
const express = require('express');
const bodyParser = require('body-parser');
//const { GoogleGenerativeAI } = require('your-google-generative-ai-library'); // Replace with the actual library and correct import statement

const app = express();
app.use(cors());
const port = 3000;

app.use(bodyParser.json());
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./greenbiz-11173-firebase-adminsdk-xajsm-b03e2157d9.json'); // Replace with your service account key
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
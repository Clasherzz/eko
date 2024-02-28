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
const serviceAccount = require('./firebase.json'); // Replace with your service account key
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.post('/generate-text', async (req, res) => {
    console.log("hi");
    const inputString = req.body.input;

    try {
        const genAI = new GoogleGenerativeAI("AIzaSyCweoRMLwzDJo1VlAgZOFoavZy4jIB9bb4");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = "Write a poem about a starry night";
        const camera =  await model.generateContent(""+inputString+"");
        const screen =  await model.generateContent(""+inputString+"");
        const battery =  await model.generateContent(""+inputString+"");
        const sensor = await model.generateContent(""+inputString+"");
        const triggermotor = await model.generateContent(""+inputString+"");
        const speaker = await model.generateContent(""+inputString+"");
        
        
        
        const result = await model.generateContent(""+inputString+"");
        const response = await result.response;
        const text = response.text();
        const collectionName = inputString.toLowerCase(); 
        const collectionRef = admin.firestore().collection(collectionName);

        // Add the generated text to the Firestore collection under the 'description' field
        await collectionRef.add({
            camera: camera,
            screen: screen,
            battery: battery,
            sensor: sensor,
            triggermotor: triggermotor,
            speaker: speaker,
        });
        console.log(text);

        // Send the generated text as a response to the front end
        res.json({ text });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
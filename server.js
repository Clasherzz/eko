const express = require('express');
const admin =require('firebase-admin')
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 3000;
app.use(bodyParser.json());


app.use(cors());
const serviceAccount = require('./firebase.json'); // Replace with your service account key
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const apiKey = 'AIzaSyCweoRMLwzDJo1VlAgZOFoavZy4jIB9bb4';
const genAI = new GoogleGenerativeAI(apiKey);


app.post('/database-text', async (req, res) => {
    console.log("hi");
    const inputString = req.body.inputString;
    const userid = req.body.userid;
    const phone = req.body.phone;
    // const {userid} = req.body.userid;
    // console.log(userid);

    try {
        const genAI = new GoogleGenerativeAI("AIzaSyCweoRMLwzDJo1VlAgZOFoavZy4jIB9bb4");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        //const battery =  await model.generateContent("Provide precise details regarding the battery of"+inputString);
        const camera =  await model.generateContent("Give aperture and pixel in camera of "+inputString+"directly without any description just give the numbers");
        console.log(camera.response.text());
        const screen =  await model.generateContent("Give dimensions and type of the display in the phone"+inputString+"without any furthure description just give the numbers");
        console.log(screen.response.text());
        const battery =  await model.generateContent("Give the storage of battery in the phone "+inputString+"give the numeric value without any description");
        console.log(battery.response.text());
        const sensor = await model.generateContent("Give the types of sensors in phone"+inputString+"without any description");
        console.log(sensor.response.text());
        const triggermotor = await model.generateContent("Give  trigger motor if it have one in the phone"+inputString+"without any description");
        console.log(triggermotor.response.text());
        const speaker = await model.generateContent("provide precise details of dolby atmos regarding the speaker in the phone"+inputString+"without any description just the numerical value");
        console.log(speaker.response.text());
        

        const collectionName = inputString.toLowerCase(); 
        const collectionRef = admin.firestore().collection(inputString);

        // Add the generated text to the Firestore collection under the 'description' field
        await collectionRef.add({
            camera: camera.response.text(),
            screen: screen.response.text(),
            battery: battery.response.text(),
            sensor: sensor.response.text(),
            triggermotor: triggermotor.response.text(),
            speaker: speaker.response.text(),
            userid:userid,
            phone:phone,
            bidding:null,
        });
        console.log("stopped");

        // Send the generated text as a response to the front end
        //res.json({ "stopped" });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/search-collection', async (req, res) => {
    const searchValue = req.body; // Assuming 'search' is the key in your request body

    try {
        // Initialize Firebase Admin SDK
        const serviceAccount = require('./firebase.json');
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        // Create a reference to the Firestore collection based on the searchValue
        const collectionRef = admin.firestore().collection(searchValue.toLowerCase()); // Normalize the searchValue

        // Get all documents from the collection
        const snapshot = await collectionRef.get();

        // Prepare the result array
        const results = [];

        snapshot.forEach(doc => {
            // For each document, push its data to the results array
            results.push(doc.data());
        });
        
        // Send the results as a response to the front end
        res.json({ results });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.post('/gfc', async (req, res) => {
    console.log("hi");
    const { collectionName, fieldName, specName } = req.body;

    try {
        const collectionRef = admin.firestore().collection(collectionName);

        // Get all documents from the collection
        const snapshot = await collectionRef.get();
        console.log(snapshot);
        // Prepare the result array
        const results = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.hasOwnProperty(fieldName)) {
                // Check if specName is a substring of the fieldName value
                if (data[fieldName].includes(specName)) {
                    // If the condition is met, push data to results
                    results.push(data);
                }
            }
        });
        console.log(results);
        // Send the results as a response to the front end
        res.json({ results });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    finally {
        console.log("end");
    }
});


app.get('/allDocuments', async (req, res) => {
    try {
      const collections = await admin.firestore().listCollections();
      const result = [];
  
      for (const collection of collections) {
        const collectionRef = collection;
        const snapshot = await collectionRef.get();
  
        snapshot.forEach((doc) => {
          const data = doc.data();
          result.push({
            collection: collection.id,
            id: doc.id,
            ...data,
          });
        });
      }
  
      res.json(result);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.delete('/deleteDocument', async (req, res) => {
    const collection = req.params.collection;
    const userId = req.params.userId;
    console.log("deleting ...");
  
    try {
        const db = admin.firestore();
        const batch = db.batch();
    
        // Query to find documents where userId field matches the provided value
        const querySnapshot = await db.collection(collection).where('userid', '==', userId).get();
        console.log(querySnapshot);
        // Delete each document found
        querySnapshot.forEach(async (doc) => {
          await batch.delete(doc.ref);//await ittu
        });
    
        // Commit the batch
        await batch.commit();
    
        res.json({ message: 'Documents deleted successfully' });
    } catch (error) {
        console.error('Error deleting documents:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/delete', async (req, res) => {
    console.log("hi");
    const { collection, searchFieldValue } = req.body;
    console.log("hello");
    const searchFieldName = 'userid';
    
    try {
        console.log(collection);
        console.log(searchFieldValue);
        
        if (!collection || !searchFieldValue) {
            return res.status(400).json({ message: 'Bad request. Missing required parameters.' });
        }

        const db = admin.firestore();

        // Query to find documents where the constant search field matches the search value
        const querySnapshot = await db.collection(collection).where(searchFieldName, '==', searchFieldValue).get();

        // Delete each document found
        const batch = db.batch();
        querySnapshot.forEach(async (doc) => {
            await batch.delete(doc.ref);
        });

        // Commit the batch
        await batch.commit();

        res.json({ message: 'Documents deleted successfully' });
    } catch (error) {
        console.error('Error deleting documents:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.put('/updateDocument', async (req, res) => {
    console.log("updating ...");
    const { collection, searchFieldValue, updateFieldName, updateFieldValue } = req.body;
    const searchFieldName = 'userid';
    console.log(collection+searchFieldValue+updateFieldName+updateFieldValue);

    try {
        console.log("trying");
        const db = admin.firestore();

        // Query to find documents where the constant search field matches the search value
        const querySnapshot = await db.collection(collection).where(searchFieldName, '==', searchFieldValue).get();
        console.log(querySnapshot);
        // Update each document found
        const batch = db.batch();
        querySnapshot.forEach(async (doc) => {
            const docId = doc.id;
            console.log(docId);
            
            await batch.update(doc.ref, { [updateFieldName]: updateFieldValue });//await ittu
        });

        // Commit the batch
        await batch.commit();

        res.json({ message: 'Documents updated successfully' });
    } catch (error) {
        console.error('Error updating documents:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/highest', async (req, res) => {
    console.log("getting highest value");

    try {
        const { collectionName,userid } = req.body;
        
        const collectionRef = admin.firestore().collection(collectionName);

        // Get all documents from the collection
        //const snapshot = await collectionRef.get();
        const snapshot = await db.collection(collection).where("userid", '==', userid).get();
        // Initialize variable to store the highest value
        let highestValue = null;

        snapshot.forEach(doc => {
                
                const data = doc.data();
            
                const fieldValue = data[bidding];
                console.log(fieldValue);
                
                // Check if fieldValue is a number and greater than the current highestValue
                // if (typeof fieldValue === 'number' && (highestValue === null || fieldValue > highestValue)) {
                //     highestValue = fieldValue;
                // }
            
        });

        // Send the highest value as a response to the front end
        res.json({ fieldValue });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        console.log("end");
    }
});


app.put('/bidding', async (req, res) => {
    console.log("updating ...");
    const {  phoneNumber, amount } = req.body;
    //const { collection, phoneNumber, amount, searchFieldName, searchFieldValue } = req.body;
    // const searchFieldName = 'bidding';
    console.log(collection + phoneNumber + amount);

    try {
        console.log("trying");
        const db = admin.firestore();

        // Query to find documents where the constant search field matches the search value
        const querySnapshot = await db.collection(collection).where(searchFieldName, '==', searchFieldValue).get();
        console.log(querySnapshot);
        
        let highest = null; // Move the highest variable outside the loop

        // Update each document found
        const batch = db.batch();
        querySnapshot.forEach(async (doc) => {
            const data = doc.data();
            const currentBidding = data["bidding"];
            console.log(currentBidding);

            // Check if currentBidding is greater than the current highest
            if (highest === null || currentBidding < amount) {
                highest = amount;
            }
        });

        // Update all documents to the highest value
        querySnapshot.forEach(async (doc) => {
            await batch.update(doc.ref, { bidding: "amount:"+highest+" "+"contact"+phoneNumber });
        });

        // Commit the batch
        await batch.commit();

        res.json({ highest });
    } catch (error) {
        console.error('Error updating documents:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.put('/biddinguser', async (req, res) => {
    console.log("updating bidding-user ...");
   0 //const {  phoneNumber, amount } = req.body;
    //const { collection, phoneNumber, amount, searchFieldName, searchFieldValue, userid } = req.body;
    const { collection, phoneNumber, amount, userid } = req.body;
    // const searchFieldName = 'bidding';
    console.log(collection + phoneNumber + amount);

    try {
        console.log("trying");
        const db = admin.firestore();

        // Query to find documents where the constant search field matches the search value
        const querySnapshot = await db.collection(collection).where("userid", '==', userid).get();
        console.log(querySnapshot);
        
        let highest = null; // Move the highest variable outside the loop

        // Update each document found
        const batch = db.batch();
        querySnapshot.forEach(async (doc) => {
            const data = doc.data();
            const currentBidding = data["bidding"];
            console.log(currentBidding);

            // Check if currentBidding is greater than the current highest
            if (highest === null || currentBidding < amount) {
                highest = amount;
            }
        });

        // Update all documents to the highest value
        querySnapshot.forEach(async (doc) => {
            
            await batch.update(doc.ref, { bidding:highest});
    
            //await batch.update(doc.ref, { bidding: "amount:"+highest+" "+"contact"+phoneNumber });
        });

        // Commit the batch
        await batch.commit();

        res.json({ highest });
    } catch (error) {
        console.error('Error updating documents:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
app.put('/component-add',async (req,res)=>{
    const {componentName , size , userid,phoneNumber} = req.body;
    try{
         const collectionName = componentName.toLowerCase(); 
        const collectionRef = admin.firestore().collection(collectionName);

        // Add the generated text to the Firestore collection under the 'description' field
        await collectionRef.add({
            componentName: componentName,
            size: size,
            userid: userid,
            phoneNumber:phoneNumber,

        });
        console.log("stopped");
        res.json({message:"finished"});

    }catch{
        console.log(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }

})
app.post('/gfc1', async (req, res) => {
    console.log("gfc1");
    const { collection, userid} = req.body;

    try {
        const collectionRef = admin.firestore().collection(collection);

        // Get all documents from the collection
        const snapshot = await collectionRef.get();
        console.log(snapshot);
        // Prepare the result array
        const results = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            if (userid==data["userid"]) {
                // Check if specName is a substring of the fieldName value
                
                    // If the condition is met, push data to results
                    results.push(data);
                
            }
        });
        console.log(results);
        // Send the results as a response to the front end
        res.json({ results });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Internal Server Error' });
    }
    finally {
        console.log("end");
    }
});
app.listen(port, () => {
    console.log("Server is running on http://localhost:3000:");
});
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();

app.use(express.json());
app.set('port', 3000);

// CORS middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, Accept, X-Requested-With, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin-syed:admin-syed@cluster0.l8jmqz5.mongodb.net/';
const client = new MongoClient(uri);

let db;

async function startServer() {
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');
        db = client.db('webstore');

        // Parameter middleware to automatically set req.collection
        app.param('collectionName', (req, res, next, collectionName) => {
            req.collection = db.collection(collectionName);
            return next();
        });

        app.get('/', (req, res) => {
            res.send('Select a collection, e.g., /collection/messages');
        });

        // Get all items in a collection
        app.get('/collection/:collectionName', async (req, res, next) => {
            try {
                const results = await req.collection.find({}).toArray();
                res.send(results);
            } catch (e) {
                next(e);
            }
        });

        // Insert an item into a collection
        app.post('/collection/:collectionName', async (req, res, next) => {
            try {
                const result = await req.collection.insertOne(req.body);
                res.status(201).send({
                    msg: 'success',
                    insertedId: result.insertedId
                });
            } catch (e) {
                next(e);
            }
        });

        // Get a specific document by ID
        app.get('/collection/:collectionName/:id', async (req, res, next) => {
            try {
                if (!ObjectId.isValid(req.params.id)) {
                    return res.status(400).send('Invalid ID');
                }
                const result = await req.collection.updateOne({
                    _id: new ObjectId(req.params.id)
                });

                if (!result) {
                    return res.status(404).send('Document not found');
                }

                res.send(result);
            } catch (e) {
                next(e);
            }
        });

        app.get('/collection/:collectionName/:id', async (req, res, next) => {
            try {
                if (!ObjectId.isValid(req.params.id)) {
                    return res.status(400).send('Invalid ID');
                }
                const result = await req.collection.updateOne(
                    { _id: new ObjectId(req.params.id) },
                    { $set: req.body },
                );
                res.send(result,matchedCount ===1 ? { msg: 'success'} : { msg: 'error' });
                if (!result) {
                    return res.status(404).send('Document not found');
                }
            } catch (e) {
                next(e);
            }
        });

        app.delete('/collection/:collectionName/:id', async (req, res, next) => {
            try {
                if (!ObjectId.isValid(req.params.id)) {
                    return res.status(400).send('Invalid ID');
                }
                const result = await req.collection.deleteOne({
                    _id: new ObjectId(req.params.id)
                });
                res.send(result);
            } catch (e) {
                next(e);
            }
        });


        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).send('Error: Server Error');
        });

        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log('Express server is running on port ' + port);
        });
    } catch (e) {
        console.error('Failed to start server:', e);
    }
}

startServer();
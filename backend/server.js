import express from 'express';
import mongoose from 'mongoose';
import Pusher from "pusher";
import Messages from './Messages.js';
import cors from 'cors';

// Config
const app = express();
const port = process.env.PORT || 8000;

// Pusher message channel
var pusher = new Pusher({
    appId: '1083531',
    key: '952297ec76be6bbfc245',
    secret: '5c8795a65bf80b596aaf',
    cluster: 'us3',
    encrypted: true
});

// Middleware
app.use(express.json());
app.use(cors());

// DB Config
const connection_url = 'mongodb+srv://admin:RWvHGmxEbWywii3F@cluster0.ueg2j.mongodb.net/whatsappdb?retryWrites=true&w=majority';
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.once('open', () => {
    console.log('Database connected...');

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
            {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            });
        }
        else {
            console.log('Error within Pusher trigger');
        }
    });
});

// Routes
app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send(data);
        }
    });
});


app.post('/messages/new', (req, res) => {
    const message = req.body;

    Messages.create(message, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } 
        else {
            res.status(201).send(data);
        }
    });
});

// Listen
app.listen(port, ()=>console.log(`Listening on localhost:${port}`));
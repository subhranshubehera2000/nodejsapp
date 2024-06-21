const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const path = require('path');

dotenv.config(); // Load environment variables from .env file

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Job application schema
const applicationSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    phoneNumber: String,
    resume: String,
    coverLetter: String
});

const Application = mongoose.model('Application', applicationSchema);

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Job application route
app.post('/apply', upload.single('resume'), async (req, res) => {
    try {
        console.log('Received application:', req.body);

        const newApplication = new Application({
            fullName: req.body.fullName,
            email: req.body.email,
            phoneNumber: req.body.phoneNumber,
            resume: req.file.path,
            coverLetter: req.body.coverLetter
        });

        await newApplication.save();

        res.status(200).send('Application submitted successfully');
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).send('Failed to submit application');
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

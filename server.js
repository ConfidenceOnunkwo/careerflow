const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const bcrypt = require("bcrypt");
require("dotenv").config();

const Job = require("./models/Job");
const User = require("./models/User");

const app = express();

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Atlas connected"))
    .catch(err => console.log("Connection error:", err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessions stored in MongoDB Atlas
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

app.use((req, res, next) => {
    console.log("REQUEST:", req.method, req.url);
    next();
});

// Serve frontend files from public folder
app.use(express.static(path.join(__dirname, "public")));

// Register
app.post("/register", async (req, res) => {
    try {
        console.log("REGISTER ROUTE HIT");
        console.log("REGISTER BODY:", req.body);

        const { fullname, email, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullname,
            email,
            password: hashedPassword
        });

        await newUser.save();
        console.log("USER SAVED:", newUser);

        res.redirect("/login.html");

    } catch (err) {
        console.log("REGISTER ERROR:", err);
        res.send("Registration failed");
    }
});

// Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.redirect("/login.html?error=1");
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.redirect("/login.html?error=1");
        }

        req.session.userId = user._id;
        req.session.fullname = user.fullname;

        res.redirect("/dashboard.html");

    } catch (err) {
        console.log("LOGIN ERROR:", err);
        res.send("Login failed");
    }
});

// Add job
app.post("/add-job", async (req, res) => {
    try {
        console.log("ADD JOB BODY:", req.body);
        console.log("SESSION USER ID:", req.session.userId);

        if (!req.session.userId) {
            console.log("NO USER IN SESSION - JOB NOT SAVED");
            return res.redirect("/login.html");
        }

        const newJob = new Job({
            company: req.body.compName,
            role: req.body.jobRole,
            status: req.body.statusSelect,
            userId: req.session.userId
        });

        console.log("JOB BEFORE SAVE:", newJob);
        await newJob.save();
        console.log("JOB SAVED:", newJob);

        res.redirect("/dashboard.html");

    } catch (err) {
        console.log("ADD JOB ERROR:", err);
        res.send("Error saving job");
    }
});

// Get all jobs
app.get("/jobs", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Not logged in" });
    }

    const jobs = await Job.find({ userId: req.session.userId });
    res.json(jobs);
});

// Delete job
app.delete("/jobs/:id", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: "Not logged in" });
        }

        await Job.findOneAndDelete({
            _id: req.params.id,
            userId: req.session.userId
        });

        res.json({ message: "Deleted successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update job
app.put("/jobs/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "Not logged in" });
    }

    await Job.findOneAndUpdate(
        { _id: req.params.id, userId: req.session.userId },
        {
            company: req.body.compName,
            role: req.body.jobRole,
            status: req.body.statusSelect
        }
    );

    res.json({ message: "Updated" });
});

// Logout
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login.html");
    });
});

// Get user name for dashboard
app.get("/user", (req, res) => {
    if (!req.session.userId) {
        return res.json({ fullname: "" });
    }
    res.json({ fullname: req.session.fullname });
});

// Start server
app.listen(process.env.PORT || 3000, () => {
    console.log("Server running on http://localhost:3000");
});
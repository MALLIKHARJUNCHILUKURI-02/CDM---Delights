import express, { response } from "express";
import axios from "axios";
import pg from "pg";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import env from "dotenv";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import session from "express-session";
import bcrypt from "bcrypt";


const app = express();
const port = 3000;
const saltRounds = 10;
env.config();

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
    user: process.env.DATABASE_USERNAME,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD, // Replace with your PostgreSQL password
    port: process.env.DATABASE_PORT,
});
db.connect()
    .then(() => console.log("Connected to the database."))
    .catch((err) => console.error("Database connection error:", err));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.NODEMAILER_USER, // Replace with your email
        pass: process.env.NODEMAILER_PASSWORD// Replace with your email password or app password
    }
});

//Get Main Page
app.get("/", async (req, res) => {
    res.render("index.ejs");
});


//Get Menu Page
app.get("/menu", async (req, res) => {
   

    try {
        if(req.isAuthenticated()){
            const result = await db.query(`SELECT * FROM menu ORDER BY id`);
            const adminResult = await db.query(`SELECT * FROM admins WHERE email = $1`, [req.user.email]);
            if(adminResult.rows.length>0){
                res.render("menu.ejs", {menuItems: result.rows, admin: true});
            }else{
                res.render("menu.ejs", {menuItems: result.rows, admin: false});
            }
        }else{
            res.render("login.ejs")
        }
    } catch (error) {
        console.log(error);
    }
});

app.get("/profile", async (req, res) => {
    if(req.isAuthenticated()){
        console.log(req.user)
        res.render("profile.ejs", {username: req.user.name, emailid:req.user.email, userid:req.user.id, useridtitie: "CDM"});
    }else{
        res.redirect("login");
    }
});


app.get("/login", async (req, res) => {
    res.render("login.ejs");
});

app.get("/signup", async (req, res) => {
    res.render("signup.ejs");
});

app.get("/order/:id", async (req, res) =>{
    if(req.isAuthenticated()){
        const result = await db.query(`SELECT * FROM menu WHERE id = $1`, [req.params.id]);
        res.render("orders.ejs", {item: result.rows[0], userName: req.user.name, userEmail: req.user.email});
    }else{
        res.redirect("/login");
    }
});

app.get('/myorders', async (req,res) =>{
    if(req.isAuthenticated()){
        const result = await db.query(`SELECT * FROM orders WHERE email = $1`, [req.user.email]);
        res.render("myorders.ejs", {ordersItem: result.rows});
    }else{
        res.redirect("/login");
    }
});

app.post("/place-order/:id", async (req, res) => {
    const itemId = req.params.id; // Get the item ID from the route parameter
    console.log(`ItemId : ${itemId}`);
    const itemName = req.body.name; // Item name from the form input
    const userEmail = req.body.useremail; // User email from the form input
    const userName = req.body.username; // User name from the form input
    const itemPrice = req.body.price; // Item price from the form input

    try {
        // Get the user ID from the database using the email (assuming users table exists)
        const userResult = await db.query(`SELECT id FROM users WHERE email = $1`, [userEmail]);
        console.log(`userEmail = ${userEmail}`);
        if (userResult.rows.length === 0) {
            return res.status(400).send("User not found");
        }

        const userId = userResult.rows[0].id;

        // Insert the order into the orders table
        await db.query(
            `INSERT INTO orders (user_id, email, item_name, price, order_date) 
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [userId, userEmail, itemName, itemPrice]
        );

        res.send("Order placed successfully!");
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).send("Server Error");
    }
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
}));

app.post("/signup", async (req, res) => {
    const { username, email, password, address, mobile, reEnterPassword } = req.body;

    try {
        // Check if the email already exists in the database
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        const userdetails = result.rows; // Directly access the first row

        // Validate passwords match
        if (password !== reEnterPassword) {
            res.render("signup", { repassword: 'Passwords do not match' });
            return;
        }

        if (userdetails.length > 0) {
            res.render("signup", {emailresponse: 'User Email Already Exist'});
        } else {
            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if (err) {
                    console.error("Error hashing password:", err);
                } else {
                    const result = await db.query(`INSERT INTO users (name, email, password, address, mobile) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [username, email, hash, address, mobile,]);
                    const user = result.rows[0];
                    req.login(user, (err) => {
                        console.log("Success");
                        res.redirect("/login");
                    });
                }
            })
        }
    } catch (error) {
        console.error("Error during Signup process:", error);
        res.status(500).send("Internal Server Error");
    }
});


passport.use("local", new Strategy(async function verify(username, password, cb){
    try {
        const result = await db.query(`SELECT * FROM users WHERE email = $1`,[username]);
        console.log(username);
        if(result.rows.length > 0){
            const user = result.rows[0];
            const storedHash = user.password;
            bcrypt.compare(password, storedHash, (err, valid) =>{
                if(err){
                    return cb(err);
                }else{
                    if(valid){
                        return cb(null, user);
                    }else{
                        return cb(null, false);
                    }
                }
            });
        }else{
            return cb("User Not Found")
        }
    } catch (error) {
        console.log(error);
    }
}));

//Get Add Page
app.get("/add", (req, res) => {
    res.render("add.ejs");
});


//Add Menu Item
app.post("/add", async (req, res) => {
    const { name, category, price, description } = req.body;
    await db.query(
        "INSERT INTO menu (name, category, price, description) VALUES ($1, $2, $3, $4);",
        [name, category, price, description]
    );
    res.redirect("/");
});

// ✏️ Update - Edit Menu Item
app.get("/edit/:id", async (req, res) => {
    const result = await db.query("SELECT * FROM menu WHERE id = $1;", [
        req.params.id,
    ]);
    res.render("edit.ejs", { item: result.rows[0] });
});

// POST Edited Menu Item
app.post("/edit/:id", async (req, res) => {
    const { name, category, price, description } = req.body;
    await db.query(
        "UPDATE menu SET name=$1, category=$2, price=$3, description=$4 WHERE id=$5;",
        [name, category, price, description, req.params.id]
    );
    res.redirect("/");
});


// ❌ Delete - Remove Menu Item
app.post("/delete/:id", async (req, res) => {
    await db.query("DELETE FROM menu WHERE id = $1;", [req.params.id]);
    res.redirect("/");
});


app.post("/submit", (req, res) => {
    const { name, email, message } = req.body;

    const mailOptions = {
        from: email,
        to: process.env.NODEMAILER_USER, // Replace with your email where you want to receive messages
        subject: `New Message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email:", error);
            res.send("Failed to send email. Please try again.");
        } else {
            console.log("Email sent: " + info.response);
            res.send("Email sent successfully! Thank you for your feedback.");
        }
    });
});


passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((user, cb) => {
    cb(null, user);
});


app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log('Error destroying session:', err);
            return res.redirect('/');
        }
        // res.clearCookie('connect.sid'); // Optional: Clear the session cookie
        res.redirect('/'); // Redirect to the login page (or home)
    });
});

app.listen(port, () => {
    console.log(`App Listening on http://localhost:${port}`);
});
import express, { response }  from "express";
import axios from "axios";
import pg from "pg";
import bodyParser  from "body-parser";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "CDM_DATABASE",
    password: "Cmkreddy@1432", // Replace with your PostgreSQL password
    port: 5432,
});

db.connect()
    .then(() => console.log("Connected to the database."))
    .catch((err) => console.error("Database connection error:", err));

    
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");


//Get Main Page
app.get("/", async (req,res) =>{
    res.render("index.ejs");
});


//Get Menu Page
app.get("/menu", async (req, res) =>{
    const result = await db.query(`SELECT * FROM menu ORDER BY id`) ;
    res.render("menu.ejs", {menuItems : result.rows});
});

app.get("/profile", async (req, res) =>{
    res.render("login.ejs")
})


app.get("/login", async (req,res) =>{
    res.render("login.ejs");
});
 
app.get("/signup", async (req, res) =>{
    res.render("signup.ejs");
});

app.post("/login", async (req, res) => {
    const { user_name, email, password } = req.body;

    try {
        // Fetch user details from the database
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        const userdetails = result.rows[0]; // Directly access the first row

        // Check if user details exist
        if (userdetails && userdetails.email === email) {
            console.log(`User Details From Database : ${userdetails.email}`);
            // Redirecting properly or rendering the homepage with data
            res.render("index", {emailtitle: 'Email Id : ',usernametitle: 'User Name : ',useridtitie: 'User Id : CDM' ,emailid: email, username: user_name, userid:userdetails.id});
        } else {
            res.render("login", { response: 'User details not found, try again' });
        }

    } catch (error) {
        console.error("Error during login process:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/signup", async (req, res) => {
    const { user_name, email, password, address, mobile, reEnterPassword } = req.body;

    try {
        // Check if the email already exists in the database
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        const userdetails = result.rows[0]; // Directly access the first row

        // Validate passwords match
        if (password !== reEnterPassword) {
            res.render("signup", { repassword: 'Passwords do not match' });
            return;
        }

        // Check if the email is already registered
        if (userdetails && userdetails.email === email) {
            res.render("signup", { emailresponse: 'Email is already registered' });
            return;
        }

        // Insert new user into the database
        await db.query(
            "INSERT INTO users (name, email, password, address, mobile) VALUES ($1, $2, $3, $4, $5)",
            [user_name, email, password, address, mobile]
        );

        // Redirect to the login page or show success message
        res.redirect("/login");

    } catch (error) {
        console.error("Error during Signup process:", error);
        res.status(500).send("Internal Server Error");
    }
});


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



app.listen(port, () =>{
    console.log(`App Listening on http://localhost:${port}`);
});
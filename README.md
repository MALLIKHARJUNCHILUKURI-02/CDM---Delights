# CDM Management

## Description
CDM Management is a full-stack restaurant management web application that provides a seamless experience for both users and admins. Users can browse the menu, place orders, and view order history, while admins can manage menu items and view customer data. The project includes user authentication, image uploads, email notifications using Nodemailer, and 24-hour session management.

## Features
- **User:** Menu browsing, order placement, view order history
- **Admin:** Add, edit, delete menu items, manage customer data
- **Authentication:** Login, signup, and logout functionality
- **Email Service:** Send contact responses via Nodemailer
- **Session Management:** 24-hour session persistence

## Tech Stack
**Frontend:** HTML, CSS, JavaScript, EJS, Bootstrap
**Backend:** Node.js, Express.js
**Database:** PostgreSQL
**Other:** Nodemailer (email service)

## Folder Structure
```
CDM-MANAGEMENT
├─ node_modules
├─ public
│   ├─ images
│   ├─ scripts
│   ├─ styles
│   └─ uploads
├─ views
│   ├─ partials
│   ├─ add.ejs
│   ├─ edit.ejs
│   ├─ index.ejs
│   ├─ login-signup.ejs
│   ├─ login.ejs
│   ├─ menu.ejs
│   ├─ myorders.ejs
│   ├─ orders.ejs
│   ├─ profile.ejs
│   ├─ signup.ejs
│   └─ upload.ejs
├─ .env
├─ .gitignore
├─ index.js
├─ package-lock.json
└─ package.json
```

## How to Run
1. Clone the repository
```bash
git clone <repository_url>
cd CDM-MANAGEMENT
```
2. Install dependencies
```bash
npm install
```
3. Set up the `.env` file with the required configurations.
4. Run the server
```bash
npm start
```
5. Open `http://localhost:3000` in your browser.

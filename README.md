# inventory-app
express app template from the thing i've used so far and will add new things to things

the flow of (req,res):
Request → app.js → router → middleware → controller → db
                                           ↓
            Response ← views ← controller (res.render)

the template structure so far:
my-app-template/
├── app.js                 # Main Express app
├── package.json
├── .env.example          # Template for environment variables
├── .gitignore
├── vercel.json           # For deployment
├── db/
│   ├── pool.js           # Database connection
│   ├── queries.js        # Database queries
│   └── populatedb.js     # Database setup script
├── routes/
│   └── itemRoutes.js     # Replace 'item' with your resource
├── controllers/
│   └── itemController.js # Business logic
├── middleware/
│   └── validation.js     # Input validation
├── views/
│   ├── index.ejs         # List items
│   ├── new.ejs          # Create form
│   └── error.ejs        # Error page
└── public/
    └── stylesheets/
        └── style.css

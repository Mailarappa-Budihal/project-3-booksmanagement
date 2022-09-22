const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser')
const route = require('./routes/route')
const app = express();

app.use(bodyparser.json());


mongoose.connect("mongodb+srv://Mailarappa:XiyjAWCBrRkxLCoM@cluster0.gf6sdcb.mongodb.net/group69Database")
    .then(() => console.log("DB connected successfully"))
    .catch((err) => console.log(err))


app.use('/', route)

app.listen(process.env.PORT || 3000, () => {
    console.log("Backend server is running on port " + (process.env.PORT || 3000))
});
require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')

const app = express()
app.use(express.json())
app.use(cors())
app.use(cookieParser())
app.use(fileUpload({
    useTempFiles: true
}))

//Routes
app.use('/user', require('./routes/userRoutes'))
app.use('/api', require('./routes/apiRoutes'))

app.get("/", (req, res) => { res.status(200).json({msg: "Working Good"}) })

mongoose.connect(process.env.MONGODB_URL).then(() => { console.log('Mongo DB Connected') }).catch(() => { console.log('Unable To Connect') })

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log('Server is running on port ', PORT)
})


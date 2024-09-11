require('dotenv').config()
const express = require('express')
const app = express()
// const port = 4000

app.get('/', (req, res) => {          // '/' is called as home route
  res.send('Hello World!')
})

app.get('/github', (req,res) => {
    res.send("IamNanak")
})

app.get('/login', (req,res) => {
    res.send('<h1>Please Login Here</h1>')
})


app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${process.env.PORT}`)
})
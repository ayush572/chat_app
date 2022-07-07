const express = require('express');
const { chatarea } = require('./data');
const dotenv = require('dotenv');
dotenv.config();
const app = express();

//http requests
app.get('/',(req,res)=>{
    res.send("API is running")
})
app.get('/api/chats',(req,res)=>{
    res.send(chatarea);
})
app.get('/api/chats/:id',(req,res)=>{
    const singleChat = chatarea.find((c)=>c.id == req.params.id)
    res.send(singleChat);
    
})
const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`sever started at port ${PORT}`)
})
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
app.use(bodyParser.json());

const path = require('path');
const fs = require('fs');

// debug & logs ' middleware '
const morgan = require('morgan');
app.use(morgan('dev'))
//

// db connection !
mongoose.set('strictQuery', true);
mongoose.connect('mongodb://127.0.0.1:27017/budget-tracker', {
  useNewUrlParser: true
},(err)=>{
  if (err) {
    console.error(`db not connected !.`)
  } else {
    console.log(`db connected Successfully ! ...`)
  }
});

// register and login schema !
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

// db schema model !
const User = mongoose.model('User', userSchema);

// UserData schema !
const UserDataSchema = new mongoose.Schema({
  expense: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// UserData schema model !
const Userdata = mongoose.model('UserData', UserDataSchema);

// auth token middleware !
const authenticate = async (req, res, next) => {
  try{
    const token = req.header('Authorization').replace('Bearer ', '');
    const data = jwt.verify(token, 's3cr3t');
    const user = await User.findById(data._id);
    if (!user || !token){
      res.status(403).send(`${res.statusCode} Forbidden`)
    }
    req.user = user;
    next();
    }
    catch(error){
      try{
        res.status(403).send(`${res.statusCode} Forbidden`)
      }
      catch(error){
        console.error(`Error on authenticate !.`)
      }
    }
};

// register
app.post('/api/register', async (req, res) => {
  const user = new User(req.body);
  try{
    await user.save();
    res.status(201).json({message:`successfully registered !.`})
  }
  catch(error){
    try{
      res.status(200).send(`user alredy taken !`)
    }
    catch(error){
      console.log(error)
    }
  }
});

// login ..
app.post('/api/login', async (req, res,next) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user) {
    return res.status(400).send({ error: 'Invalid login' });
  }
  if (user.password !== req.body.password) {
    return res.status(400).send({ error: 'Invalid login' });
  }
  const token = jwt.sign({ _id: user._id }, 's3cr3t');
  const tokenS = ({token})
  res.status(201).send(tokenS);
});

// //// need to fix some bugs...
// app.post('/api/login', async (req, res, next) => {
//   const user = await User.findOne({ username: req.body.username });
//   if (!user) {
//     return res.status(400).send({ error: 'Invalid login' });
//   }
//   if (user.password !== req.body.password) {
//     return res.status(400).send({ error: 'Invalid login' });
//   }
//   const token = jwt.sign({ _id: user._id }, 's3cr3t');
//   fs.writeFileSync('tokens.txt', JSON.stringify(token), (err) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send({ error: 'Failed to write token to file' });
//     }
//     res.sendFile(__dirname + '/tokens.txt');
//     console.log('Token data returned in file');
//   });
// });

// 
app.get('/api/home', authenticate, async (req, res) => {
  try{
    const userData = await Userdata.find({ user: req.user._id });
    res.status(200).json(userData);
  }
  catch(error){
    res.status(500).send(`${res.statusCode} Internal server error`);
    console.error(`${res.statusCode} Internal server error
${error}`)
  }
});

app.post('/api/home', authenticate, async (req, res) => {
  try{
    const userData = new Userdata({ ...req.body, user: req.user._id });
    await userData.save();
    res.json(userData);
  }
  catch(error){
    res.status(500).send(`${res.statusCode} Internal server error`);
    console.error(`${res.statusCode} Internal server error
${error}`)
  }
});

//update budgets..
app.put('/api/home/:id', authenticate, async (req, res) => {
  try {
    const userData = await Userdata.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(userData);
  } catch (error) {
    res.status(500).send(`${res.statusCode} Internal server error`);
    console.error(`${res.statusCode} Internal server error
${error}`)
  }
});

//Delete budgets
app.delete('/api/home/:id', authenticate, async (req, res) => {
  try {
    const userData = await Userata.findByIdAndRemove(req.params.id);
    res.json({ message: `userData with id ${userData._id} was deleted.` });
  } catch (error) {
    res.status(500).send(`${res.statusCode} Internal server error
${error}`);
    console.error(`${res.statusCode} Internal server error
${error}`)
  }
});

// 404 file not found
app.use((req,res)=>{
  res.status(404).json({
    method : `${req.method}`,
    status : `${res.statusCode} not found`,
    path : `${req.url}`,
  });
})

const port = process.env.PORT || 5566;
app.listen(port, () => {
  console.log(`Server listening on port ${port} 
http://localhost:${port}/api/budgets
http://localhost:${port}/api/register
http://localhost:${port}/api/login`);
});



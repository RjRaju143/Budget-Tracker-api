const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
app.use(bodyParser.json());

// debug & logs ' middleware '
const morgan = require('morgan');
app.use(morgan('dev'))
//

// db connection !
mongoose.set('strictQuery', true);
mongoose.connect('mongodb://localhost/budget-tracker', {
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

// budgets schema !
const budgetSchema = new mongoose.Schema({
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

// budgets schema model !
const Budget = mongoose.model('Budget', budgetSchema);

// auth token middleware !
const authenticate = async (req, res, next) => {
  try{
    const token = req.header('Authorization').replace('Bearer ', '');
    const data = jwt.verify(token, 'secret');
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
        console.error(`error on line 74`)
      }
    }
};

app.post('/api/register', async (req, res) => {
  const user = new User(req.body);
  try{
    await user.save();
    res.json({message:`successfully registered !.`})
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

app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (!user) {
    return res.status(400).send({ error: 'Invalid login' });
  }
  if (user.password !== req.body.password) {
    return res.status(400).send({ error: 'Invalid login' });
  }
  const token = jwt.sign({ _id: user._id }, 'secret');
  res.send({ token });
});

app.get('/api/budgets', authenticate, async (req, res) => {
  try{
    const budgets = await Budget.find({ user: req.user._id });
    res.status(200).json(budgets);
  }
  catch(error){
    console.error(`{error : you'r not loged in !..}`)
  }
});

app.post('/api/budgets', authenticate, async (req, res) => {
  try{
    const budget = new Budget({ ...req.body, user: req.user._id });
    await budget.save();
    res.json(budget);
  }
  catch(error){
    console.error(`{error : you'r not loged in !..}`)
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

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port} 
http://localhost:${port}/api/budgets
http://localhost:${port}/api/register
http://localhost:${port}/api/login`);
});



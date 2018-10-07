const express = require('express');
const router = express.Router();
const passport = require('passport');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const config = require('../config/database');
const cloudinary = require('cloudinary');
const multiparty = require('multiparty');
const User = require('../models/user');
// const stripe = require('stripe')(config.stripe_secret);
// const to = require('./err_handler/to');
const nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'wawood@gmail.com',
    pass: 'latias437'
  }
});

cloudinary.config({
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret
});

function createToken(user){
  let randString = config.token;
  const token = jwt.sign({_id: user._id}, randString);
  user.password = undefined;
  return {user: user, token: token}
}

// function getAllTasksByUser(id){
//   let tasks = Task.getTasksByUserId(id);
//   return tasks;
// }
//
// function getAllGoalsByUser(id){
//   let goals = Goal.getGoalsByUserId(id);
//   return goals;
// }

// function calculateCompletion(tasks){
//   let completionArray = tasks.filter(t => t.completed);
//   return Math.floor((completionArray.length / tasks.length) * 100);
// }


router.post('/delete/user', passport.authenticate('jwt', {session:false}) ,(req, res, next) =>{
  console.log(req.body);
  User.removeAccount(req.body, (err, val) => {
    if(err){
      return res.json({success: false, msg: 'Failed to delete account. Try again.'});
    }
    else {
      return res.json({success: true, msg: 'Account removed!'});
    }
  });
});
router.post('/check_pass', passport.authenticate('jwt', {session:false}) ,(req, res, next) =>{
  // console.log(req.body);
  User.getUserById(req.body.id, (err, user) => {
    if(err){
      return res.json({success: false});
    }
    if(!user) {
      return res.json({success: false});
    }
    else {
      User.comparePassword(req.body.password, user.password, (err, isMatch) =>{
        if(isMatch){
          return res.json(
            {
              success: true
            });
        }
        else {
          return res.json({success: false});
        }
      });
    }
  });
});

router.post('/register/user', (req, res, next) => {

  console.log(req.body);

  let newUser = new User({
    email: req.body.email,
    password: req.body.password
  });
  User.getUserByEmail(newUser.email, (err, user) => {
    if(err){
      console.log(err);
      return res.json({success: false, msg:'Error registering, try again'});
    }
    if(!user) {
      let promise = User.addUser(newUser);
      promise.then((user) => {
        let returnObj = createToken(user);
        console.log(returnObj);
        return res.json(
          {
            success: true,
            msg:'Register successful!',
            token: 'JWT '+returnObj.token,
            user: returnObj.user
          });
      })
      .catch((err) => {
        //TODO store err to DB
        console.log(err);
        return res.json({success: false, msg: "Error registering, try again"});
      });
    }
    else {
      return res.json({success: false, msg:'That email address is in use.'});
    }
  });
});

router.put('/update/user', passport.authenticate('jwt', {session:false}), (req, res, next) => {

  console.log(req.body);
  if(req.body.type == "user"){
    User.update(req.body, (err, user) => {
      if(err){
        console.log(err);
        return res.json({success: false, msg: "Error editing user information"});
      }
      else {
        user.password = undefined;
        return res.json({success: true, msg: "Edited your information!", user: user});
      }
    });
  }
  if(req.body.type == "task"){
    let ids = req.body.ids; //the taskIds to update
    let changes = req.body.changes; //the changes to make
    let promise = Task.updateTasks(ids, changes);
    promise.then((newTasks) => {
      return res.json({success: true, updatedTasks: newTasks});
    })
    .catch((err) => {
      console.log(err) //TODO save all errors to the database
      return res.json({success: false, msg: "Error updating task!"});
    });
  }

  if(req.body.type == 'password'){
    User.update(req.body, (err, x) => {
      if(err){
        console.log(err);
        return res.json({success: false, msg: "Error editing password!"});
      }
      else {
        return res.json({success: true, msg: "Edited password!"});
      }
    });
  }

});

router.post('/authenticate', (req, res, next) => {

  User.getUserByEmail(req.body.email, (err, user) => {
    if(err){
      return res.json({success: false, msg:'Error registering, try again'});
    }
    if(!user) {
      return res.json({success: false, msg:'Enter the correct credentials'});
    }
    else {
      User.comparePassword(req.body.password, user.password, (err, isMatch) =>{
        if(isMatch){
          let returnObj = createToken(user);
          let tasksObj = getAllTasksByUser(returnObj._id);
          user['tasksArray'] = tasksObj;
          return res.json(
            {
              success: true,
              msg:'Login Successful!',
              token: 'JWT '+returnObj.token,
              user: returnObj.user
            });
        }
        else {
          return res.json({success: false, msg:'Enter the correct credentials'});
        }
      });
    }
  });
});


router.post('/create/user', passport.authenticate('jwt', {session: false}), (req,res,next) => {
  /*
  create should receive a json object
  {
    type: -> Model
    value: -> Obj values required to create
    userId: -> user that's creating
  }
  */

  let type = req.body.type;
  let value = req.body.value;
  let userId = req.body.userId;

  switch(type){
    default:
      return res.json({success: false, msg: "Error processing!"});
  }

});


router.post('/avatar', passport.authenticate('jwt', {session:false}), (req, res, next) => {

  (new multiparty.Form()).parse(req, function(err, fields, files) {
      // console.log(files);
      //call the cloudinary api to upload photo
      cloudinary.uploader.upload(files.image[0].path, function (resp) {
        //return the resp from cloudinary
        return res.json({success: true, fileUrl: resp});
      });
    });


});

router.get('/user', passport.authenticate('jwt', {session:false}) ,(req, res, next) => {

  let obj = JSON.parse(req.query.obj);
  let id = obj.id;
  let action = obj.action;

  if(!action || action === ""){
    let promise = User.getUserById(id);
    promise.then((user) => {
      // user.password = undefined;
      let retUser = {
        _id: user._id,
        updated_at: user.updated_at,
        created_at: user.created_at,
        email: user.email
      };
      return res.json({success: true, user: retUser});
    })
    .catch((err) => {
      //TODO store error to db
      console.log(err);
      return res.json({success: false, msg: 'Error loading information'});
    });
  }
});

router.get('/protected', passport.authenticate('jwt', {session:false}) ,(req, res, next) =>{
    return res.json({success: true});
});
module.exports = router;

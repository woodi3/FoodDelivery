const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Task = require('./task');
// User Schema
const UserSchema = mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
},
{
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const User = module.exports = mongoose.model('User', UserSchema);

module.exports.getUserById = function(id){
  return User.findById(id)
             .exec();
}
module.exports.getUserByEmail = function(email, callback){
  User.findOne({email: email}, callback);
}
module.exports.addUser = function(newUser){
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if(err) reject(err);
      else {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if(err) reject(err);
          else {
            newUser.password = hash;
            newUser.save().then((user) => {
              resolve(user);
            })
            .catch((err) => {
              reject(err);
            })
            // return resolve(newUser.save());
          }

        });
      }

    });
  });

}
module.exports.hash = function(str){
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if(err){
        reject(err);
      }
      else {
        bcrypt.hash(str, salt, (err, hash) => {
          if(err){
            reject(err);
          }
          else {
            resolve({result: hash});
          }
        });
      }
    });
  });
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
  bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
    if(err) throw err;
    callback(null, isMatch);
  });
}
module.exports.removeAccount = function(userObj, callback){
  User.findOneAndRemove({'_id': userObj.id}, (x)=>{
      Task.deleteMany({'userId': userObj.id}, callback);
    });
// Character.deleteMany({ name: /Stark/, age: { $gte: 18 } }, function (err) {});
//     {$or:[{region: "NA"},{sector:"Some Sector"}]}
}
module.exports.removeTask = function(taskObj, callback){
    return User.findByIdAndUpdate(taskObj.userId,
      { $pull: {'tasks': {id: taskObj._id}}
  })
  .exec()
  .then(function(){
    return "";
  })
  .catch(function(err) {
    return err;
  })
}
module.exports.updateUsers = function(ids, changes){
  return User.update(
    {//what ids to update
      _id: {$in: ids}
    },
    changes, //object containing the keys to change and the new values
    { multi: true } //allow multiple document updates
  );
}
module.exports.update = function(edits, callback){
  if(edits.type =="user"){
    User.findByIdAndUpdate(edits.user._id, edits.user, callback);
  }
  else if(edits.type == "password"){
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(edits.password, salt, (err, hash) => {
        if(err) throw err;
        User.findByIdAndUpdate(edits.id,
          { $set: {password: hash}},
          callback
        );
      });
    });
  }

}

const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
// const task = require('../models/task-model')
const Userschema = new mongoose.Schema({
    name : {
        type : String,
        trim : true,
        required : true
    },
    email : 
    {
        type : String,
        unique: true,
        required : true,
        validate(value)
        {
            if(!validator.isEmail(value))
            throw new Error('Invalid Email address')
        }
    },
    age : {
        type : Number,
        default : 0,
        validate(value)
        {
      if(value<0)
      throw new Error('Age can not be negative')
        }
    },
    password : {
      type : String,
   required : true,
      validate(value)
      {
          if(value=='password'||value.length<6)
          throw new Error('Invalid Password')
      }
  },
  tokens : [{
    token : {
        type : String,
        required: true}
    
    }        
  ] ,
  avatar : {
      type : Buffer
  }
},{
      timestamps : true
  } )
// Userschema.virtual('tasks',{
//     ref: 'tasks',
//     localField : '_id',
//     foreignField : 'owner'
// })  
//To Show only allowed data 
Userschema.methods.toJSON = function(){ 
    const user =  this.toObject()
    delete user.password
    delete user.tokens
    delete user.avatar
    return user
}   
//To login to a user using existing unique email and password
Userschema.methods.generatejwt = async function(){
    const user = this
    const token = jwt.sign({_id : user._id.toString()},process.env.JWT_SECRET)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}
Userschema.statics.findbyCredentials=async (email,password)=>{
try{
    const user = await users.findOne({email})
if(!user)
{
throw new Error('Unable to login')
}
const ismatch = await bcrypt.compare(password,user.password)
if(!ismatch){
    throw new Error('Unable to Login')
}return user}
catch(e){
console.log(e)
}
}
//To delete tasks for a deleted user
// Userschema.pre('remove',async function(next){
//     const user = this 
//     await task.deleteMany({owner: user._id})
//     next()
// })
//To convert the password string into a hashed password 
Userschema.pre('save',async function(next) {
    const user = this
    if(user.isModified('password')){   
      
      user.password =  await bcrypt.hash(user.password,8)    } 

      next()    
    
})
const users = mongoose.model('users', Userschema )
module.exports = users

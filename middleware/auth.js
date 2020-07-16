const jwt = require('jsonwebtoken')
const User = require('../models/user-model')
const auth = async (req,res,next)=>{
    try{
    const token = req.header('Authorization').replace('Bearer ','')
    const isvalid = jwt.verify(token,process.env.JWT_SECRET)
    const user = await User.findOne({_id : isvalid._id,'tokens.token' : token})
    if(!user){
        throw new Error()
    }
    req.token = token
    req.user = user
    next()
}catch(e){
res.status(400).send('Please Authenticate')
}
}
module.exports= auth
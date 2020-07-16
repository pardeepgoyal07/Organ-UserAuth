const express = require('express')
const User = require('../models/user-model')
const router = new express.Router()
const { deletemsg } = require('../../email/deletemsg')
const {welcomeEmail} = require('../../email/account')
const sharp = require('sharp')
const auth = require('../middleware/auth')
const multer = require('multer')
router.post('/users',async (req,res)=>{
    const user =  new User(req.body)
    try{
        await user.save()
        welcomeEmail(user.email,user.name)
        const token = await user.generatejwt()
        res.status(201).send({user,token})
    }catch(e){
        res.status(404).send()
    }
})
router.post('/users/login',async (req,res)=>
{
    const user = await User.findbyCredentials(req.body.email,req.body.password)
    const token = await user.generatejwt()
    if(!user)
    {
       return res.status(400).send('Unable to login')
    }
    res.status(200).send({user,token})
})
router.post('/users/logout',auth,async (req,res)=>
{
    try{
    req.user.tokens = req.user.tokens.filter((token)=>
    {
        return token.token !== req.token
    })
    await req.user.save()
    res.status(200).send()
}catch(e){
    res.status(400).send('bad request')
}
})
router.post('/users/logoutall',auth,async (req,res)=>{
    try{
       req.user.tokens = []
       await req.user.save()
       res.status(200).send()
    }catch(e){
       res.status(400).send()
    }
})
router.get('/users/me',auth,async (req,res)=>
{
try{  res.status(200).send(req.user)
}
catch(e){
    res.send('Unable to Authenticate')
}
})

router.patch('/users/me',auth,async (req,res)=>{
    const keyUpdated = Object.keys(req.body)
    const updates = ["name","age","password","email"]
    const isValid = keyUpdated.every((update)=>
    {
        return updates.includes(update)
    })
    if(!isValid)
    {
        return res.status(400).send('Invalid Updates')
    }
    try{
        const updatedUser = await User.findById(req.user._id)
        keyUpdated.forEach((update)=>
        {
            updatedUser[update]=req.body[update]
        })
        updatedUser.save()
       // const updatedUser = await User.findByIdAndUpdate(_id,req.body,{new: true,runValidators: true})
        if(!updatedUser)
        return res.status(404).send('Not found')
        res.status(201).send(updatedUser)
    }catch(e){
        res.status(500).send("Unable to Update")
    }
})
router.delete('/users/me',auth,async (req,res)=>
{try{
    await req.user.remove()
    deletemsg(req.user.email,req.user.name)
    res.status(200).send(req.user)
    }catch(e){
        res.status(500).send(e)
    }
})
const upload = multer({
    limits: {
        fileSize : 1000000
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(jpg|png|jpeg)$/)){
         cb(new Error('Please choose a correct file.File must be an image'))
        }
        cb(undefined,true)
    }
})
router.post('/users/me/avatar',auth,upload.single('avatar'),async(req,res)=>{
    const buffer = await sharp(req.file.buffer).resize({width: 250,height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
},(error,req,res,next)=>{
    res.status(400).send({error: error.message})
})
router.delete('/users/me/avatar',auth,async(req,res)=>{
     req.user.avatar = undefined
     await req.user.save()
     res.send('Deleted Successfully')
})
router.get('/users/:id/avatar',async(req,res)=>
{
    try{   
        const user = await User.findById(req.params.id)
        res.set('Content-Type','image/png')
        res.send(user.avatar)
    }catch(e){
        res.status(404).send()
    }
})
module.exports = router
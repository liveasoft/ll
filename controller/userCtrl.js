const Users = require('../models/userModel')
const jwt = require('jsonwebtoken')
const md5 = require('md5')

const userCtrl = {
    register: async (req, res) => {
        try{

            const {name, email, password} = req.body

            if(!name || !email || !password)
                return res.status(400).json({ error : "All feilds are required"})

            const check = await Users.findOne({email})
            if(check)
                return res.status(400).json({ error : "Email Already Exist"})

            const passwordHash = md5(password)
            const newUser = new Users({
                name, email, password : passwordHash
            })

            await newUser.save()

            res.status(200).json({success : 1})
        }catch (err){
            res.status(500).json({msg: err.message})
        }
    },
    login : async (req, res) =>{
        try {
            const {email, password} = req.body

            if(!email || !password)
                return res.status(400).json({ error : "All feilds are required"})

            const encrypted = md5(password)
            const user = await Users.findOne({"email": email, "password": encrypted})
            if(!user)
                return res.status(400).json({ error : "Combination Does Not Exist"})
            
            if(!user.status)
                return res.status(400).json({ error : "Account Status Is Blocked"})

            // ACCESS TOKEN ISSUE
            const access_token = createAccessToken({id: user.id})
            // res.cookie('access_token', access_token, {
            //     httpOnly : true,
            //     path : '/',
            //     maxAge : 7*24*60*60*1000 // 7 DAY
            // })

            res.status(200).json({success : 1, access_token: access_token})

        } catch (err) {
            res.status(500).json({msg: err.message})
        }
    },
    get_user_info: async (req, res) =>{
        try {
            const user = await Users.findById(req.user.id).select('-password')
            res.status(200).json({success : 1, data : user})
        } catch (err) {
            res.status(500).json({msg: err.message})
        }
    },
    all_users : async (req, res) =>{
        try {
            
            console.log(req.user)

            res.status(200).json({success : 1})

        } catch (err) {
            res.status(500).json({msg: err.message})
        }
    }
}

const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {expiresIn : '1h'})
}

module.exports = userCtrl
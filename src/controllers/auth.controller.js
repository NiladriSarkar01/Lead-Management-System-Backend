import { generateToken } from "../lib/JWTUtils.js";
import User from "../models/user.model.js";
import bcrypt from 'bcryptjs'

export const signup= async (req, res)=>{
    
    try {
        const {email, fullName, password} =req.body;
        if(!email || !fullName || !password) return res.status(400).json({success:false, message:"Fill all the fields."})
        if(password.length<8) return res.status(400).json({success:false, message:"Password must be atleast 8 character."});
        if(await User.findOne({email:email})) return res.status(400).json({success:false, message:"Invalid Data!"});

        const salt=await bcrypt.genSalt(10);
        const hashedPass=await bcrypt.hash(password, salt);


        const user=new User({
            email:email,
            fullName:fullName,
            password:hashedPass
        })
        if(user){
            await user.save();
            const token=generateToken(user._id, res);
            return res.status(201).json({success:true, message:"User added successfully.", Bearer: token});
            
        }else{
            return res.status(400).json({success:false, message:"Invalid Data!"});
        }
        

    } catch (error) {
        res.status(500).json({success:false, message:"Internel server Error."+error});
    }

    
}

export const login= async (req, res)=>{
    const {email, password}=req.body;
    try {
        const user = await User.findOne({email})
        if(!user) return res.status(400).json({message:"Bad Credentials!"});
        const isPasswordCorrect= await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect) return res.status(400).json({message:"Bad Credentials!"});

        generateToken(user._id, res);
        res.status(200).json({
            _id:user._id,
            fullName:user.fullName,
            email:user.email,
            profilePic:user.profile_pic
        })

    } catch (error) {
        console.log(`error: ${error.message}`);
        
        res.status(500).json({success:false, message:"Internal server error."})
    }
}

export const logout=(req, res)=>{
    try {
        res.cookie("jwt", "", {maxAge:0});
        res.status(200).json({message:"Logged out successfully."})
        
    } catch (error) {
        console.log("Error Logging Out: "+error.message);
        res.status(500).json("Internel Server Error.")
    }
}

export const checkAuth=(req, res)=>{
    try {
        console.log(req.user);
        
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error checking auth: "+error.message);
        res.status(500).json({message:"Internel Server Error."})
        
    }
}
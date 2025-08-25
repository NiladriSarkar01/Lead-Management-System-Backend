import mongoose from "mongoose";

const UserSchema =new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    fullName:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
        minlength:8
    }

},
{
    timestamps:true
}

);

const User=new mongoose.model("User", UserSchema);

export default User;
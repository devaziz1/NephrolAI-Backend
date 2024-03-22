const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const SessionModel=new Schema({
    name:{
        type:String,
    },
    password:{
        type:String,
    },
});
module.exports=mongoose.model("session",SessionModel);















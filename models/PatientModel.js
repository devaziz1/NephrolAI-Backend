const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const gmailRegex = /^([\w+]+)(.[\w]{1,})?@gmail\.com$/;
const patientSchema=new Schema({
    name:{
        type:String,
        required:true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [gmailRegex, 'Please enter a valid Gmail address']
      },
      password: { type: String, required: true, minLength: 4 },
    medical_history:{
        type:String,
    },
    gender:{
        type:String,
        required:true,
    },
    phoneNumber:{
        type:String,
        required:true,
    },
    doctorID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
    },
    adminID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
      },
    verified:{
        type:Boolean,
        required:true,
        default:false,
    }
  
});
module.exports=mongoose.model("Patient",patientSchema);















// const mongoose = require("mongoose");

// const Schema = mongoose.Schema;

// const patientSchema = new Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true },
//   password: { type: String, required: true, minLength: 4, maxLength: 11 },
// phone_Number:Number,
// medical_history:String,
// blood_Type:String,
//   verified: {
//     type: Boolean,
//     require: true,
//     default: false,
//   },
// });

// module.exports = mongoose.model("Patient",patientSchema);





const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const gmailRegex = /^([\w+]+)(.[\w]{1,})?@gmail\.com$/;
const doctorSchema=new Schema({
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
    medicalLicenseNo:{
      type:String,
    },
    gender:{
      type:String,
    },
    specialization:{
      type:String,
    },
    phoneNumber:{
      type:String,
    },
    password: { type: String, required: true, minLength: 4 },
    adminID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    rating:{
      type: Number,
      default: 0
    },
    numberOfRating:{
      type: Number,
      default: 0
    },
    patients:
      [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Patient",
        },
      ],
    verified:{
        type:Boolean,
        required:true,
        default:false,
    },
    slots: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
        timings: [
          {
            type: String,
          },
        ],
      },
    ],
    aslots: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
        timings: [
          {
            type: String,
          },
        ],
      },
    ]
    
});
module.exports=mongoose.model("Doctor",doctorSchema);





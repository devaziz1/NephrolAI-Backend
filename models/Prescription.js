const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const PrescriptionSchema=new Schema({
    doctorEmail:{
        type:String,
        required:true
    },
    patientEmail:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    medicineName:{
        type:String,
        required:true,
    },
    dosage:{
        type:String,
        required:true,
    },
    startDate:{
        type:String,
        required:true,
    },
    endDate:{
        type:String,
        required:true,
    },
    createdAt: {
        type:Date,
        default : () => Date.now()
    },
     
});
module.exports=mongoose.model("Prescription",PrescriptionSchema);















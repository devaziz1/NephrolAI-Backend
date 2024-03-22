const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const MedicineReminderSchema=new Schema({
    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    dosage:{
        type:Number,
        required:true,
    },
    createdAt: {
        type:Date,
        default : () => Date.now()
    },
    UpdatedAt:{
        type:Date,
        default : () => Date.now()
    },
    doctorID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
      },
    patientID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
      }  
});
module.exports=mongoose.model("MedicineReminder",MedicineReminderSchema);















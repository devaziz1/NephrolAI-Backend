const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const gmailRegex = /^([\w+]+)(.[\w]{1,})?@gmail\.com$/;

function getOneWeekFromNow() {
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
  return oneWeekFromNow;
}

const DoctorScheduleSchema=new Schema({
    email: {
        type: String,
        required: true,
        match: [gmailRegex, 'Please enter a valid Gmail address']
      },
      slots:[String],
      
    });
    module.exports=mongoose.model("DoctorSchedule", DoctorScheduleSchema);
    
    











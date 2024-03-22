const mongoose = require("mongoose");
const gmailRegex = /^([\w+]+)(.[\w]{1,})?@gmail\.com$/;


const Schema = mongoose.Schema;
const ComplaintSchema = new Schema({
  description: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    match: [gmailRegex, "Please enter a valid Gmail address"],
  },
  date: {
    type: Date,
    default: () => Date.now(),
  },
  complainer:{
    type:String,
  }
});
module.exports = mongoose.model("Complaint", ComplaintSchema);

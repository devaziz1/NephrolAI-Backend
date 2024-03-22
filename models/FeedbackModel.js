const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const gmailRegex = /^([\w+]+)(.[\w]{1,})?@gmail\.com$/;

const FeedbackSchema = new Schema({
  description: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
  reportID: {
    type: String,
  },
  doctorEmail: {
    type: String,
    match: [gmailRegex, "Please enter a valid Gmail address"],
  },

  patientEmail:{
    type: String,
    match: [gmailRegex, "Please enter a valid Gmail address"],
  },
});
module.exports = mongoose.model("Feedback", FeedbackSchema);

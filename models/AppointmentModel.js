const mongoose = require("mongoose");
const gmailRegex = /^([\w+]+)(.[\w]{1,})?@gmail\.com$/;
const Schema = mongoose.Schema;
const AppointmentSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  DoctorName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: [gmailRegex, "Please enter a valid Gmail address"],
  },
  doctorEmail: {
    type: String,
    required: true,
    match: [gmailRegex, "Please enter a valid Gmail address"],
  },
  slot: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["Physical", "Online"],
    default: "Physical",
  },
  status: {
    type: String,
    enum: ["Pending", "completed"],
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: () => Date.now(),
  },
});

module.exports = mongoose.model("Appointment", AppointmentSchema);

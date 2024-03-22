const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const gmailRegex = /^([\w+]+)(.[\w]{1,})?@gmail\.com$/;
const adminSchema = new Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [gmailRegex, 'Please enter a valid Gmail address']
  },
  password: { type: String, required: true, minLength: 4},
  verified: {
    type: Boolean,
    require: true,
    default: false,
  },
  patients: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
  ],
  doctors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
  ]
});

module.exports = mongoose.model("Admin", adminSchema);

const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const gmailRegex = /^([\w+]+)(.[\w]{1,})?@gmail\.com$/;


// Define the Monthly Reports schema
const monthlyRSchema = new Schema({

  reportDate: {
    type: Date,
    required: true,
    default: Date.now,
  }

});

module.exports = mongoose.model("MReports", monthlyRSchema);
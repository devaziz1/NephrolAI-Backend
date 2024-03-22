const bcrypt = require("bcryptjs");
let jwt = require("jsonwebtoken");

// const Admin = require("../models/AdminModel");
const Doctor = require("../models/DoctorModel");
// const Patient = require("../models/PatientModel");

exports.getAllPatients = async (req, res, next) => {
    try {
      const { doctorId } = req.params;
  
      const doctor = await Doctor.findById(doctorId).populate("patients");
      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }
  
      const patient = doctor.patients;
  
      res.status(200).json(patient);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error" });
    }
  };
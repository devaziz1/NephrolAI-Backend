const bcrypt = require("bcryptjs");
let jwt = require("jsonwebtoken");

const Admin = require("../models/AdminModel");
const Doctor = require("../models/DoctorModel");
const Patient = require("../models/PatientModel");
const Appointment = require("../models/AppointmentModel"); 
const Complaint = require("../models/Complaints");


exports.makeAppointment = async (req, res, next) => {
    console.log(req.body);
    try {
      const {
        type,
        status,
        createdAt,
        time,
        doctorID,
      } = req.body;

    
  
      const doctor = await Doctor.findById(doctorID);
  
      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }

        const appointment = new Appointment({
            type,
            status,
            createdAt,
            time,
            doctorID: doctor._id,
        });
  
        const result = await appointment.save();
  
        const token = jwt.sign(
          {
            userId: result._id,
          },
          "somth",
          {
            expiresIn: "1h",
          }
        );
        res.status(201).json({ mesg: "Appointment created", });
      
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }
}


exports.getPendingApp = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const pending = await Appointment.find({ doctor: doctorId, status: 'pending' });
    if (!pending) {
      return res.status(404).json({ error: "No pending Appointments" });
    }
    else{
      res.status(200).json(pending);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};


exports.compaint = async (req, res, next) => {
    console.log(req.body);
    try {
      const {
        name,
        email,
        role,
        description,
      } = req.body; 

        const complaint = new Complaint({
            name,
            email,
            role,
            description
        });
  
        const result = await complaint.save();
  
        res.status(201).json({ mesg: "Complaint Sent", });
      
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }
}
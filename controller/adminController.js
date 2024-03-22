const bcrypt = require("bcryptjs");
let jwt = require("jsonwebtoken");
const {validationResult} = require("express-validator");


const Admin = require("../models/AdminModel");
const Doctor = require("../models/DoctorModel");
const Patient = require("../models/PatientModel");
const Complaint = require("../models/Complaints");
const seesion = require("../models/sessionModel");
const adminID = '6463e56b2621ab5034d067d8';


exports.adminSignup = async (req, res, next) => {
  console.log(req.body);
  const { name, email, password } = req.body;
  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      res.status(401).json({ mesg: "This Email Already Exist" });
    } else {
      const hashpasword = await bcrypt.hash(password, 12);
      const admin = new Admin({
        name,
        password: hashpasword,
        email,
      });

      const result = await admin.save();

      const token = jwt.sign(
        {
          userId: result._id,
        },
        "auth user",
        {
          expiresIn: "1h",
        }
      );
      res.status(200).json({ mesg: "Admin created", AdminId: result._id, accessToken: token });
    }
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.adminlogin = async (req,res, next) => {

  try {
    console.log(req.body);
    const err = validationResult(req);
    if(!err.isEmpty()){
      const error = new Error("Validation Failed");
      error.statusCode = 422;
      error.data = err.array();
      throw error;
    }

    const { email ,password} = req.body;
    const admin = await Admin.findOne({ email });
      
      
    if (!admin) {
      const error = new Error("Invalid Email!");
      error.statuscode = 401;
      throw error;
    }
    else{
      const isPasswordMatch = await bcrypt.compare(password, admin.password);
      if (!isPasswordMatch) {
        const error = new Error("Invalid Password!");
      error.statuscode = 401;
      throw error;
      }
      res.status(200).json({
        message: "Admin Login sucessful ",
      });
    }
   

  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.DoctorSignup = async (req, res, next) => {
  console.log(req.body);
  try {
    const {
      name,
      email,
      password,
      specialization,
      medicalLicenseNo,
      gender,
      phoneNumber      
    } = req.body;


    const admin = await Admin.findById(adminID);

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    const existingDoctor = await Doctor.findOne({ email });

    if (existingDoctor) {
      return res.status(404).json({ error: " This Email Already Exist" });
    } else {
      const hashpasword = await bcrypt.hash(password, 12);
      const doctor = new Doctor({
        name,
        password:hashpasword, 
        email,
        specialization,
        medicalLicenseNo,
        gender,
        phoneNumber,
        adminID: admin._id,
      });

      const result = await doctor.save();
      admin.doctors.push(doctor._id);
      await doctor.save();
      await admin.save();

      const token = jwt.sign(
        {
          userId: result._id,
        },
        "user",
        {
          expiresIn: "1h",
        }
      );
      res.status(201).json({ mesg: "Doctor created", doctorId: result._id });
    }
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.Doctorlogin = async (req, res, next) => {
  console.log(req.body);
  const { email } = req.body;
  try {
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      const error = new Error("Doctor could not be found.");
      error.statuscode = 401;
      throw error;
    }
    res.status(200).json({
      message: "Doctor Login sucessful ",
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getAllDoctor = async (req, res, next) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findById(adminId).populate("doctors");
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const doctors = admin.doctors;

    res.status(200).json(doctors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateDoctor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      specialization,
      medicalLicenseNo,
      gender,
      phoneNumber,
    } = req.body;
    const doctor = await Doctor.findOne({ email });
  console.log(doctor);
    doctor.name = name;
    doctor.password = password;
    doctor.specialization = specialization;
    doctor.medicalLicenseNo = medicalLicenseNo;
    doctor.gender = gender;
    doctor.phoneNumber = phoneNumber;
  
    const result = await doctor.save();
  
    res.status(200).json({ message: "Doctor updated ", doctors: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
  
};

exports.getAllPatient = async (req, res, next) => {
  try {
    const { adminId } = req.params;

    const admin = await Admin.findById(adminId).populate("patients");
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const patients = admin.patients;

    res.status(200).json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteDoctor = async (req, res, next) => {
  const { email } = req.params;
    
  try {
    const user = await Doctor.findOneAndDelete({ email });
    if (!user) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    console.log("Doctor Deleted");
    res.json(user);
  } catch (error) {
    next(error);
  }
  
};


exports.createSession = async (req, res, next) => {
  console.log(req.body);
  try {
    const {
      name,
      password
    } = req.body;

    const sesion = new seesion({
      name,
      password
    });

    const result = await sesion.save();

    res.status(200).json({ message: "Session Created ", session: result });


  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};


exports.PatientSignup = async (req, res, next) => {
  console.log(req.body);
  try {
    const {
      name,
      email,
      password,
      medical_history,
      gender,
      phoneNumber,
      doctorID,
      adminID,
    } = req.body;

    const admin = await Admin.findById(adminID);
    const doctor = await Doctor.findById(doctorID);

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    const existingPatient = await Patient.findOne({ email });

    if (existingPatient) {
      return res.status(404).json({ error: " This Email Already Exist" });
    } else {
      const hashpasword = await bcrypt.hash(password, 12);
      const patient = new Patient({
        name,
        password:hashpasword,
        email,
        medical_history,
        gender,
        phoneNumber,
        adminID: admin._id,
        doctorID: doctor._id
      });

      const result = await patient.save();
      admin.patients.push(patient._id);
      doctor.patients.push(patient._id);
      await patient.save();
      await admin.save();
      await doctor.save();

      const token = jwt.sign(
        {
          userId: result._id,
        },
        "somth",
        {
          expiresIn: "1h",
        }
      );
      res.status(201).json({ mesg: "Patient created", adminId: result._id ,});
    }
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.Patientlogin = async (req, res, next) => {
  console.log(req.body);
  const { email } = req.body;
  try {
    const patient = await Patient.findOne({ email });
    if (!patient) {
      const error = new Error("Patient could not be found.");
      error.statuscode = 401;
      throw error;
    }
    res.status(200).json({
      message: "Patient Login sucessful ",
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.deletePatient = async (req, res, next) => {
  const { email } = req.params;
    
  try {
    const user = await Patient.findOneAndDelete({ email });
    if (!user) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    console.log("Patient Deleted");
    res.json(user);
  } catch (error) {
    next(error);
  }
  
};

exports.getAllComaplints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find();
    res.status(200).json(complaints);
  } catch (err) {
    next(err);
  }
};
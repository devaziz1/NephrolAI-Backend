const express = require("express");
require("dotenv").config();
const app = express();
const argon2 = require("argon2");
const Admin = require("../../models/AdminModel");
const bcrypt = require("bcryptjs");
let jwt = require("jsonwebtoken");
const stripe = require('stripe')('pk_test_51OFeIXAjIv746725reMuQwc4e7qWqq9RB5mW8jTwrPuUwLaPhxdCYbta9oMiSOBYHh7g8YfbKGcIm6XngqAOj7tI00OPF71SID');
const path = require("path");
const fs = require("fs");
const {v4: uuid4} = require('uuid');
const multer = require("multer");

const Doctor = require("../../models/DoctorModel");
const Patient = require("../../models/PatientModel");
const Complaint = require("../../models/Complaints");
const Appointment = require("../../models/AppointmentModel");
const Prescription = require("../../models/Prescription");
const Feedback = require("../../models/FeedbackModel");

const adminController = require("../../controller/adminController");
const { body, validationResult } = require("express-validator");
const PatientReport = require("../../models/PatientReport");
const router = express.Router();

app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post(
  "/signup",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Enter a valid email"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ],
  async (req, res, next) => {
    console.log(req.body);
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) {
        const error = new Error("Validation Failed");
        error.statusCode = 422;
        error.data = err.array();
        throw error;
      }

      const { name, email, password, medical_history, gender, phoneNumber } =
        req.body;

      const adminID = "655e5dcba812c44f8a7f2a3f"; 

      const admin = await Admin.findById(adminID);

      console.log(admin);

      const hashedPassword = await argon2.hash(password);

      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }
      const existingPatient = await Patient.findOne({ email });

      if (existingPatient) {
        const error = new Error("This Email Already Exist...");
        error.statuscode = 401;
        throw error;
      } else {
        const patient = new Patient({
          name,
          password: hashedPassword,
          email,
          medical_history,
          gender,
          phoneNumber,
          adminID: admin._id,
        });

        const result = await patient.save();
        admin.patients.push(patient._id);
        await patient.save();
        await admin.save();

        const token = jwt.sign(
          {
            userId: result._id,
          },
          "somth",
          {
            expiresIn: "1h",
          }
        );
        res
          .status(201)
          .json({ mesg: "Patient created sucess", adminId: result._id, email, name });
      }
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }
  }
);

router.post(
  "/login",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Enter a valid email"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ],
  async (req, res, next) => {
    try {
      console.log(req.body);
      const err = validationResult(req);
      if (!err.isEmpty()) {
        const error = new Error("Validation Failed");
        error.statusCode = 422;
        error.data = err.array();
        throw error;
      }

      const { email, password } = req.body;
      const patient = await Patient.findOne({ email });
      console.log(patient);
      const token = jwt.sign({ patient }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "300s",
      });

      if (!patient) {
        const error = new Error("Invalid Email!");
        error.statuscode = 401;
        throw error;
      } else {
        const passwordMatches = await argon2.verify(patient.password, password);

        if (!passwordMatches) {
          const error = new Error("Invalid Password!");
          error.statuscode = 401;
          throw error;
        }
        const name = patient.name;
        res.status(200).json({
          email,
          name,
          message: "Patient Login sucessfull ",
          token,
        });
      }
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }
  }
);

router.post("/createAppointment", async (req, res, next) => {
  try {
    const { email, doctorEmail, slot, type, createdAt, day } = req.body;
   

    // Check the number of existing pending appointments for the patient
    const existingAppointmentsCount = await Appointment.countDocuments({
      email: email,
      status: "Pending", // You may adjust this condition based on your specific logic
    });

    // Limit the patient to five appointments
    if (existingAppointmentsCount >= 5) {
      return res.status(400).json({ error: "You can only book up to five appointments at a time." });
    }

    const patient = await Patient.findOne({ email });

    if (!patient) {
      const error = new Error("Patient Does not exist");
      error.statuscode = 401;
      throw error;
    }

    const doctor = await Doctor.findOne({ email: doctorEmail });
    if (!doctor) {
      const error = new Error("Doctor Does not exist");
      error.statuscode = 401;
      throw error;
    }

    // Find the day in the aslots array
    const selectedDayIndex = doctor.aslots.findIndex((slotDay) => slotDay.day === day);

    if (selectedDayIndex !== -1) {
      // Update the timings array for the selected day
      doctor.aslots[selectedDayIndex].timings = doctor.aslots[selectedDayIndex].timings.filter(
        (time) => time !== slot
      );
    }

    // Save the updated doctor information
    await doctor.save();

    const DoctorName = doctor.name;
    const name = patient.name;

    const app = new Appointment({
      email,
      name,
      createdAt,
      DoctorName,
      type,
      doctorEmail,
      DoctorName,
      slot,
    });

    await app.save();
    console.log("Appointment Done Successfully");

    res.status(200).json({
      message: "Appointment Booked Successfully",
    });
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error (email already exists)
      res.status(400).json({
        error: "Email already exists in the appointments collection.",
      });
    }
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});


router.get("/getAllDoctor/:adminId", async (req, res, next) => {
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
});

router.post("/submitComplaint", async (req, res, next) => {
  try {
    const { email, description, complainer } = req.body;

    const complaint = new Complaint({
      email,
      complainer,
      description,
    });

    await complaint.save();
    res.status(200).json({
      message: "Complaint submitted successfully",
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});

router.post("/submitFeedback", async (req, res, next) => {
  try {
    const { doctorEmail, rating, feedback } = req.body;
    const doctor = await Doctor.findOne({ email: doctorEmail });

    if (!doctor) {
      const error = new Error("Please Provide Valid Doctor's Email");
      error.statuscode = 401;
      throw error;
    }
    const currentRating = parseFloat(doctor.rating);
    const currentNumOfRating = parseInt(doctor.numberOfRating);

    const newRating =
      (currentRating * currentNumOfRating + rating) / (currentNumOfRating + 1);

    doctor.rating = Number(newRating.toFixed(1));
    doctor.numberOfRating++;

    await doctor.save();

    res.status(200).json(doctor);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});

router.get("/getPrescriptions/:email", async (req, res, next) => {
  try {
    const { email } = req.params;

    const prescriptions = await Prescription.find({ patientEmail: email });

    if (prescriptions.length === 0) {
      const error = new Error("No prescriptions found for the provided email.");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json(prescriptions);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});

router.get("/getPrescriptionsById/:_id", async (req, res, next) => {
  try {
    const { _id } = req.params;
    const prescription = await Prescription.findById(_id);

    if (!prescription) {
      res.status(404).json({ message: "Prescription Not Found" });
    }

    res.status(200).json(prescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/deletePrescription/:_id", async (req, res, next) => {
  try {
    const { _id } = req.params;
    const prescription = await Prescription.findByIdAndDelete(_id);

    if (prescription) {
      res.status(200).json({ message: "Prescription deleted sucessful" });
      console.log("prescription Deleted");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/deleteApp/:_id", async (req, res, next) => {
  try {
    const { _id } = req.params;
    const appointment = await Appointment.findByIdAndDelete(_id);

    if (appointment) {
      res.status(200).json({ message: "Appointment deleted sucessful" });
      console.log("appointment Deleted");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Function to get the day from a given date
function getDayFromDate(date) {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const appointmentDate = new Date(date);
  return daysOfWeek[appointmentDate.getDay()];
}

router.post("/cancelApp/:_id", async (req, res, next) => {
  try {
    console.log("Inside cancel app");
    const { _id } = req.params;
    const appointment = await Appointment.findById(_id);

    if (appointment) {
      // Extract information from the canceled appointment
      const { slot, createdAt, doctorEmail } = appointment;

      // Find the day corresponding to the appointment creation date
      const day = getDayFromDate(createdAt);

      // Update the doctor's aslots with the canceled slot
      await Doctor.findOneAndUpdate(
        { email: doctorEmail, "aslots.day": day },
        { $push: { "aslots.$.timings": slot } }
      );

      // Remove the canceled appointment
      await Appointment.findByIdAndRemove(_id);

      res.status(200).json({ message: "Appointment canceled successfully" });
    } else {
      res.status(404).json({ error: "Appointment not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/getreports/:email", async (req, res, next) => {
  try {
    const email = req.params.email;
    const reports = await PatientReport.find({ patientEmail: email });

    if (!reports || reports.length === 0) {
      return res.status(404).json({ message: "Reports not found" });
    }

    const reportData = reports.map((report) => {
      return {
        _id: report._id,
        CreatedAt: report.CreatedAt,
      };
    });

    res.status(200).json(reportData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/downloadreport/:reportId", async (req, res, next) => {
  try {
    const reportId = req.params.reportId;

    // Fetch the report by its ID from the database
    const report = await PatientReport.findById(reportId);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Set response headers for downloading the PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Report_${reportId}.pdf`
    );

    // Send the PDF file to the client
    res.send(report.pdfReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/getProfile/:email", async (req, res, next) => {
  try {
    const email = req.params.email;

    console.log("Email " + email);

    console.log("Hello");

    // Fetch the report by its ID from the database
    const profile = await Patient.findOne({ email });

    console.log(profile);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/updateProfile", async (req, res, next) => {
  try {
    const {
      name,
      oldpassword,
      newPass,
      email,
      medical_history,
      gender,
      phoneNumber,
    } = req.body;

    const patient = await Patient.findOne({ email });

    console.log("Old Password " + oldpassword);
    console.log("New " + newPass);

    if (!Patient) {
      const error = new Error("Patient Does not exist!!!");
      error.statuscode = 401;
      throw error;
    }

    const passwordMatches = await argon2.verify(patient.password, oldpassword);

    const newPassword = await argon2.hash(newPass);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Provide Correct Password" });
      
    }
    patient.name = name;
    patient.password = newPassword;
    patient.gender = gender;
    patient.phoneNumber = phoneNumber;
    patient.medical_history = medical_history;

    const result = await patient.save();
    res.status(200).json({ message: "Patient updated ", patient: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/appiontments/:email", async (req, res, next) => {
  try {
    const { email } = req.params;
    const patient = await Appointment.find({ email });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json(patient);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});

router.post(
  "/UploadReport",
  upload.single("pdfFile"),
  async (req, res, next) => {
    try {
      const { patientEmail, doctorEmail } = req.body;
      const pdfReport = req.file.buffer;

      const report = new PatientReport({
        patientEmail,
        pdfReport,
        doctorEmail,
      });
      await report.save();
      res
        .status(201)
        .json({ message: "Patient information and PDF uploaded successfully" });
    } catch (error) {
      console.error(error);
      res
        .status(error.statuscode || 500)
        .json({ error: error.message || "Server error" });
    }
  }
);

router.get("/getfeedback/:email", async (req, res, next) => {
  try {
    const email = req.params.email;
    console.log(email);
    const feedback = await Feedback.find({ patientEmail: email });
    console.log(feedback);
    if (!feedback || feedback.length === 0) {
      return res.status(404).json({ message: "Reports not found" });
    }

    const feedbackData = feedback.map((f) => {
      return {
        _id: f._id,
        CreatedAt: f.createdAt,
        DoctorEmail: f.doctorEmail,
        description: f.description,
        reportID: f.reportID,
      };
    });

    res.status(200).json(feedbackData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/getFeedbackbyID/:feedbacId", async (req, res, next) => {
  try {
    const feedbackId = req.params.feedbacId;

    console.log(feedbackId);
    // Fetch the report by its ID from the database
    const feedbackk = await Feedback.findById(feedbackId);

    console.log(feedbackk);

    // Send the PDF file to the client
    res.send(feedbackk.description);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});


router.post('/payment', async (req, res) => {
    
      console.log(req.body.token);
      const {token, amount} = req.body;
      const key = uuid4();

      return stripe.customers.create({
        email: token.email,
        source: token
      }).then(customer =>{
        stripe.charges.create({
          amount: amount * 100,
          currency: 'usd',
          customer: customer.id,
          receipt_email: token.email
        },{key})
      }).then(result =>{
        res.status(200).json(result)
      }).catch(err => {
        console.log(err);
      })
});


module.exports = router;

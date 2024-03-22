const express = require("express");
require("dotenv").config();
const app = express();
const argon2 = require("argon2");
const Admin = require("../../models/AdminModel");
const bcrypt = require("bcryptjs");
let jwt = require("jsonwebtoken");

const Doctor = require("../../models/DoctorModel");
const DoctorAppointments = require("../../models/AppointmentModel");
const DoctorSchedule = require("../../models/DoctorSchedule");
const Patient = require("../../models/PatientModel");
const Complaint = require("../../models/Complaints");
const PatientReport = require("../../models/PatientReport");
const feedback = require("../../models/FeedbackModel");

const adminController = require("../../controller/adminController");
const { body, validationResult } = require("express-validator");
const router = express.Router();

app.use(express.json());

const doctorController = require("../../controller/doctorController");
const Prescription = require("../../models/Prescription");
const AppointmentModel = require("../../models/AppointmentModel");

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
      const doctor = await Doctor.findOne({ email });
      console.log(doctor);
      const token = jwt.sign({ doctor }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "300s",
      });

      if (!doctor) {
        const error = new Error("Invalid Email!::");
        error.statuscode = 401;
        throw error;
      } else {
        const passwordMatches = await argon2.verify(doctor.password, password);

        if (!passwordMatches) {
          const error = new Error("Invalid Password!");
          error.statuscode = 401;
          throw error;
        }
        const name = doctor.name;
        res.status(200).json({
          email,
          name,
          message: "Doctor Login sucessfull ",
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

router.put("/updateSchedule", async (req, res, next) => {
  try {
    const { email, day, timings } = req.body;

    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Find the day in the slots array
    const selectedDayIndex = doctor.slots.findIndex((slot) => slot.day === day);
    const selectedDayIndex1 = doctor.aslots.findIndex((slot) => slot.day === day);


    if (selectedDayIndex !== -1) {
      // Clear existing timings for the selected day
      doctor.slots[selectedDayIndex].timings = [];
      // Push the new timings
      doctor.slots[selectedDayIndex].timings.push(...timings);
    } else {
      // Add a new entry if the day is not found
      doctor.slots.push({ day, timings });
    }

    
    if (selectedDayIndex1 !== -1) {
      // Clear existing timings for the selected day
      doctor.aslots[selectedDayIndex1].timings = [];
      // Push the new timings
      doctor.aslots[selectedDayIndex1].timings.push(...timings);
    } else {
      // Add a new entry if the day is not found
      doctor.aslots.push({ day, timings });
    }

    await doctor.save();

    return res
      .status(200)
      .json({ message: "Schedule updated successfully" });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});



router.get("/profile/:email", async (req, res, next) => {
  try {
    const { email } = req.params;
    const doctor = await Doctor.findOne({ email });

    res.json(doctor);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});

// Example route to get doctor slots for a specific day
router.get('/myslots', async (req, res, next) => {
  try {
    const { email, day } = req.query;

    console.log(email);
    console.log(day);
    
    if (!email || !day) {
      return res.status(400).json({ error: 'Doctor email and day are required.' });
    }

    // Find the doctor by email
    const doctor = await Doctor.findOne({ email});

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    // Find the slots for the specified day
    const slotsForDay = doctor.aslots.find((slot) => slot.day === day);

    if (!slotsForDay) {
      return res.status(404).json({ error: `No slots found for ${day}.` });
    }

    return res.status(200).json({ slots: slotsForDay.timings });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


router.get("/appiontments/:email", async (req, res, next) => {
  try {
    const { email } = req.params;

    
    const doctor = await AppointmentModel.find({ doctorEmail: email });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

   
    res.json(doctor);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});

router.post("/createPrescription", async (req, res, next) => {
  try {
    const {
      doctorEmail,
      patientEmail,
      description,
      dosage,
      medicineName,
      startDate,
      endDate,
    } = req.body;

    const doctor = await Doctor.findOne({ email: doctorEmail });
    const patient = await Patient.findOne({ email: patientEmail });
    if (!doctor) {
      const error = new Error("Provide Valid Doctor's Email");
      error.statuscode = 401;
      throw error;
    }
    if (!patient) {
      const error = new Error("Provide Valid Patient's Email");
      error.statuscode = 401;
      throw error;
    }

    const prescription = new Prescription({
      doctorEmail,
      patientEmail,
      description,
      dosage,
      startDate,
      medicineName,
      endDate,
    });

    await prescription.save();
    return res.status(200).json(prescription);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});

router.get("/getreports/:email", async (req, res, next) => {
  try {
    const email = req.params.email;
    const reports = await PatientReport.find({ doctorEmail: email });

    if (!reports || reports.length === 0) {
      return res.status(404).json({ message: "Reports not found" });
    }

    const reportData = reports.map((report) => {
      return {
        _id: report._id,
        CreatedAt: report.CreatedAt,
        patientEmail: report.patientEmail,
      };
    });

    res.status(200).json(reportData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/provideFeedback", async (req, res, next) => {
  try {
    const {
      doctorEmail,
      patientEmail,
      description,
      reportID,
      
    } = req.body;

    const doctor = await Doctor.findOne({ email: doctorEmail });
    const patient =await Patient.findOne({ email: patientEmail });
    if (!doctor) {
      const error =  new Error("Provide Valid Doctor's Email");
      error.statuscode = 401;
      throw error;
    }
    if (!patient) {
      const error = new Error("Provide Valid Patient's Email");
      error.statuscode = 401;
      throw error;
    }

    const Feedback = new feedback({
      doctorEmail,
      patientEmail,
      description,
      reportID
    });

    await Feedback.save();
    return res.status(200).json(Feedback);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});

router.get("/getProfile/:email", async (req, res, next) => {
  try {
    const email = req.params.email;

    console.log("Email " + email);

    // Fetch the report by its ID from the database
    const profile = await Doctor.findOne({ email });

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


router.patch("/updatePorfile", async (req,res , next) =>{
  try {
    const {
      name,
      oldpassword,
      newPass,
      email,
      LN,
      gender,
      phoneNumber,
    } = req.body;

    const doctor = await Doctor.findOne({ email });

    console.log("Old Password " + oldpassword);
    console.log("New " + newPass);

    if (!doctor) {
      const error = new Error("doctor Does not exist!!!");
      error.statuscode = 401;
      throw error;
    }

    const passwordMatches = await argon2.verify(doctor.password, oldpassword);

    const newPassword = await argon2.hash(newPass);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Provide Correct Password" });
      
    }
    doctor.name = name;
    doctor.password = newPassword;
    doctor.gender = gender;
    doctor.phoneNumber = phoneNumber;
    doctor.medicalLicenseNo = LN;

    const result = await doctor.save();
    res.status(200).json({ message: "doctor updated ", doctor: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
})

router.get("/getAllPatients/:doctorId", doctorController.getAllPatients);

module.exports = router;

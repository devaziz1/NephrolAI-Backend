const express = require("express");
require("dotenv").config();
const app = express();
const argon2 = require("argon2");
const Admin = require("../../models/AdminModel");
const bcrypt = require("bcryptjs");
let jwt = require("jsonwebtoken");
const multer = require("multer");

const Doctor = require("../../models/DoctorModel");
const Patient = require("../../models/PatientModel");
const Complaint = require("../../models/Complaints");
const PatientReport = require("../../models/PatientReport");
const MReports = require("../../models/MonthlyReports");

const adminController = require("../../controller/adminController");
const { body, validationResult } = require("express-validator");
const router = express.Router();

app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/signup", async (req, res, next) => {
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
      res.status(200).json({
        mesg: "Admin created",
        AdminId: result._id,
        accessToken: token,
      });
    }
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});

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
      const admin = await Admin.findOne({ email });
      const token = jwt.sign({ admin }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "300s",
      });

      if (!admin) {
        const error = new Error("Invalid Email!");
        error.statuscode = 401;
        throw error;
      } else {
        const isPasswordMatch = await bcrypt.compare(password, admin.password);
        if (!isPasswordMatch) {
          const error = new Error("Invalid Password!");
          error.statuscode = 401;
          throw error;
        }
        res.status(200).json({
          message: "Admin Login sucessful ",
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

// authorization
router.post("/profile", verifyToken, (req, res) => {
  jwt.verify(req.token, process.env.ACCESS_TOKEN_SECRET, (err, authData) => {
    if (err) {
      res.send({ result: "Invalid Token" });
    } else {
      res.json({
        message: "Profile access",
        authData,
      });
    }
  });
});

// Token Authorization

function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];
    req.token = token;
    next();
  } else {
    res.send({
      result: "Token is not Valid",
    });
  }
}

router.get("/profile/:email", async (req, res, next) => {
  try {
    const email = req.params.email;

    const admin = await Admin.findOne({ email });
    res.status(200).json(admin);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});

router.post(
  "/doctor/signup",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Enter a valid email")
      .normalizeEmail(),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ],
  async (req, res, next) => {
    console.log(req.body);
    try {
      const {
        name,
        email,
        password,
        medicalLicenseNo,
        specialization,
        gender,
        phoneNumber,
      } = req.body;

      const adminID = "655e5dcba812c44f8a7f2a3f";
      const hashedPassword = await argon2.hash(password);

      const admin = await Admin.findById(adminID);

      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }
      const existingDoctor = await Doctor.findOne({ email });

      if (existingDoctor) {
        const error = new Error("This Email Already Exist!!!");
        error.statuscode = 401;
        throw error;
      } else {
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        const slots = days.map((day) => {
          const daySlots = [
            "9:00 - 9:30 AM",
            "9:30 - 10:00 AM",
            "10:00 - 10:30 AM",
            "10:30 - 11:00 AM",
            "11:00 - 11:30 AM",
            "11:30 - 12:00 AM",
            "12:00 - 12:30 PM",
            "12:30 - 1:00 PM",
            "1:00 - 1:30 PM",
            "1:30 - 2:00 PM",
            "2:00 - 2:30 PM",
            "2:30 - 3:00 PM",
            "3:00 - 3:30 PM",
            "3:30 - 4:00 PM",
          ];

          return {
            day,
            timings: daySlots,
          };
        });

        const doctor = new Doctor({
          name,
          password: hashedPassword,
          email,
          medicalLicenseNo,
          specialization,
          gender,
          phoneNumber,
          slots,
          aslots: slots,
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
  }
);

router.post("/doctor/login", async (req, res, next) => {
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
});

router.patch("/doctor/update", async (req, res, next) => {
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
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/doctor/search/:email", async (req, res, next) => {
  try {
    const { email } = req.params;
    const doctor = await Doctor.findOne({ email });

    if (!doctor) {
      const error = new Error("Doctor Not Found");
      error.statuscode = 401;
      throw error;
    }

    res.status(200).json(doctor);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});

router.get("/patient/search/:email", async (req, res, next) => {
  try {
    const { email } = req.params;
    const patient = await Patient.findOne({ email });

    if (!patient) {
      const error = new Error("Patient Not Found");
      error.statuscode = 401;
      throw error;
    }

    res.status(200).json(patient);
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});

router.get("/getAllDoctor/:adminId", verifyToken, async (req, res, next) => {
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
router.get("/getComplaintBody/:_id", async (req, res, next) => {
  try {
    const { _id } = req.params;
    const complaint = await Complaint.findById(_id);

    if (!complaint) {
      return res.status(404).json({ error: "Complaint Does Not Found" });
    }
    return res.status(200).json({
      complaint,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/doctor/delete/:email", async (req, res, next) => {
  const { email } = req.params;

  try {
    const user = await Doctor.findOneAndDelete({ email });
    if (!user) {
      const error = new Error("Doctor could not be found.");
      error.statuscode = 401;
      throw error;
    }
    console.log("Doctor Deleted");
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.post("/createSession", adminController.createSession);

router.post("/patient/signup", async (req, res, next) => {
  console.log(req.body);
  try {
    const { name, email, password, medical_history, gender, phoneNumber } =
      req.body;

    const adminID = "655e5dcba812c44f8a7f2a3f";

    const admin = await Admin.findById(adminID);
    // const doctor = await Doctor.findById(doctorID);

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    const existingPatient = await Patient.findOne({ email });

    if (existingPatient) {
      const error = new Error("This Email Already Exist!!!");
      error.statuscode = 401;
      throw error;
    } else {
      const hashpassword = await argon2.hash(password);

      const patient = new Patient({
        name,
        password: hashpassword,
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
      res.status(201).json({ mesg: "Patient created", adminId: result._id });
    }
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
});

router.post("/patient/login", async (req, res, next) => {
  const { email } = req.body;
  try {
    const patient = await Patient.findOne({ email });
    if (!patient) {
      const error = new Error("Patient NOT FOUND.");
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
});

router.patch("/patient/Aupdate", async (req, res, next) => {
  try {
    const { name, password, email, medical_history, gender, phoneNumber } =
      req.body;

    const patient = await Patient.findOne({ email });

    if (!Patient) {
      const error = new Error("Patient Does not exist!!!");
      error.statuscode = 401;
      throw error;
    } else {
      patient.name = name;
      patient.password = password;
      patient.gender = gender;
      patient.phoneNumber = phoneNumber;
      patient.medical_history = medical_history;
    }
    const result = await patient.save();
    res.status(200).json({ message: "Patient updated ", patient: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/getAllCompaint", async (req, res, next) => {
  try {
    const complaints = await Complaint.find();
    res.status(200).json(complaints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/deleteComplaint/:_id", async (req, res, next) => {
  try {
    const { _id } = req.params;
    const complaint = await Complaint.findByIdAndDelete(_id);

    if (complaint) {
      res.status(200).json({ message: "Compaint deleted sucessful" });
      console.log("Complaint Deleted");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/searchCom/:email", async (req, res, next) => {
  try {
    const { email } = req.params;

    const complaint = await Complaint.find({ email });

    if (complaint.length === 0) {
      const error = new Error("Please Provide Valid Email");
      error.statuscode = 401;
      throw error;
    }
    res.status(200).json(complaint);
  } catch (error) {
    console.error(error);
    res
      .status(error.statuscode || 500)
      .json({ error: error.message || "Server error" });
  }
});

router.post(
  "/UploadReport",
  upload.single("pdfFile"),
  async (req, res, next) => {
    try {
      const { patientEmail } = req.body;
      const pdfReport = req.file.buffer;

      const report = new PatientReport({ patientEmail, pdfReport });
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

router.patch("/updateProfile", async (req, res) => {
  try {
    const { name, oldpassword, newPass } = req.body;

    const email = "NephrolAI@gmail.com";

    const admin = await Admin.findOne({ email });

    if (!admin) {
      const error = new Error("admin Does not exist!!!");
      error.statuscode = 401;
      throw error;
    }

    console.log(admin);

    console.log("Old Password " + oldpassword);
    console.log("New " + newPass);

    const passwordMatches = await argon2.verify(admin.password, oldpassword);

    const newPassword = await argon2.hash(newPass);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Provide Correct Password" });
    }
    admin.name = name;
    admin.password = newPassword;

    const result = await admin.save();
    res.status(200).json({ message: "doctor updated ", admin: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/dashboardDetails", async (req, res, next) => {
  try {
    console.log("Inside dashbord details");
    // Find the admin by email
    const admin = await Admin.findOne({ email: "NephrolAI@gmail.com" });

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Count the number of patients and doctors associated with the admin
    const totalPatients = admin.patients.length;
    const totalDoctors = admin.doctors.length;
    const monthlyReports = await MReports.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$reportDate" },
            year: { $year: "$reportDate" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": -1, "_id.month": -1 },
      },
    ]);

    const resultArray = Array.from({ length: 12 }, (_, index) => {
      const matchedMonth = monthlyReports.find(
        (item) =>
          item._id.month === (index + 1) && item._id.year === new Date().getFullYear()
      );

      return matchedMonth ? matchedMonth.count : 0;
    });

    res.status(200).json({ totalPatients, totalDoctors, resultArray });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/updateMonthlyReport", async (req, res) => {
  try {
    // Create a new monthly report with the current date
    const newMonthlyReport = new MReports({
      reportDate: new Date()
    });

    // Save the new monthly report to the database
    await newMonthlyReport.save();

    res.status(200).json({ message: "Current date stored successfully." });
  } catch (error) {
    console.error("Error storing current date:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/getMonthlyReportCounts", async (req, res) => {
  try {
    const monthlyReports = await MReports.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$reportDate" },
            year: { $year: "$reportDate" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": -1, "_id.month": -1 },
      },
    ]);

    const resultArray = Array.from({ length: 12 }, (_, index) => {
      const matchedMonth = monthlyReports.find(
        (item) =>
          item._id.month === (index + 1) && item._id.year === new Date().getFullYear()
      );

      return matchedMonth ? matchedMonth.count : 0;
    });

    res.status(200).json(resultArray);
  } catch (error) {
    console.error("Error getting monthly report counts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/getAllPatient/:adminId", adminController.getAllPatient);
router.delete("/patient/delete/:email", adminController.deletePatient);

router.get("/getAllComplaints", adminController.getAllComaplints);

module.exports = router;

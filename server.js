require("dotenv").config();
const path = require("path");
const express = require("express");
var bodyParser = require("body-parser");
const { default: mongoose } = require("mongoose");
const cors = require("cors");
var session = require("express-session");
// var FileStore = require("session-file-store")(session);
const adminRoute = require("./routes/Admin/AdminRouters");
const doctorRoute = require("./routes/Doctor/DoctorRouters");
const patientRouter = require("./routes/Patient/PatientRouters");
// const sessions = require("./models/sessionModel");

const port = 8080;
const app = express();

app.use(cors());
app.use(bodyParser.json());


const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:5000"];

app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
}));


// app.use((req, res, next) => {
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "OPTIONS, GET, POST, PUT, PATCH, DELETE"
//   );
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   next();
// });

// // Use the cors middleware and allow requests from http://127.0.0.1:5000
// app.use(cors({
//   origin: "http://127.0.0.1:5000",
//   methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
//   credentials: true,
// }));

mongoose
  .connect("mongodb://127.0.0.1:27017/NephrolAI")
  .then(() => {
    app.listen(port, () => {
      console.log("App is runing");
    });
  })
  .catch((err) => {
    console.log(err);
  });



app.use("/admin", adminRoute);
app.use("/doctor", doctorRoute);
app.use("/patient", patientRouter);



app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const mesg = err.message;
  const data = err.data;
  res.status(statusCode).json({ mesg,  data });
});

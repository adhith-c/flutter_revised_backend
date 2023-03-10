require("dotenv").config();
const User = require("../models/user");
const Otp = require("../models/otp");
const jwt = require("jsonwebtoken");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const twilio = require("twilio");
const client = require("twilio")(accountSid, authToken);

const {
  hashPassword,
  comparePassword,
  
} = require("../utils/helper");

const { sendOtpVerification } = require("../utils/otpMailer");
const { response } = require("../routes/userRoutes");

exports.homePage = async (req, res) => {
  try {
    res.send("homepage");
  } catch (err) {
    console.log(err);
  }
};

// exports.register = async (req, res) => {
//   try {
//     res.send("SIGNUP");
//   } catch (err) {
//     console.log(err);
//   }
// };

exports.register = async (req, res) => {
  try {
    console.log(req.body);
    const { name, email, mobileNumber, password } = req.body;
    const existingUser = await User.findOne({ mobileNumber });
    if (existingUser) {
      if (existingUser.isVerified == false) {
        await User.findOneAndDelete({ mobileNumber });
      }
    }
    const userName = await User.findOne({ mobileNumber });
    if (!userName) {
      const hashedpassword = hashPassword(password);
      const user = await User.create({
        name,
        email,
        mobileNumber,
        password: hashedpassword,
      });
      user.save().then((data) => {
        console.log("data", data);
        sendOtpVerification(data, req, res);
        res.status(200).json(user);
      });
    } else {
      res.send("Email already Taken");
      res.status(401);
    }
  } catch (err) {
    console.log(err);
  }
};

exports.otpVerify = async (req, res) => {
  try {
    let mobileNumber = req.body.mobileNumber;
    if(!mobileNumber && !req.body.otp){
      res.status(400).json({meg:"MOBILE_NUMBER IS NOT GIVEN"})
    }else{
      console.log("mobile num",mobileNumber);
      mobileNumber = mobileNumber.toString();
      mobileNumber = mobileNumber.slice(2);
      mobileNumber = Number(mobileNumber);
      console.log(req.body.mobileNumber);
      console.log(req.body.otp);
      const verification_check = await client.verify.v2
        .services(process.env.TWILIO_AUTH_SERVICE_SID)
        .verificationChecks.create({
          to: `+91${req.body.mobileNumber}`,
          code: `${req.body.otp}`,
        });
      console.log(verification_check.status);
  
      if (verification_check.status == "approved") {
        console.log("otp is approved");
        await User.updateOne(
          { mobileNumber: req.body.mobileNumber },
          { $set: { isVerified: true } }
        );
        res.status(200).json({ msg: "otp verified successfully" });
      } else {
        res.status(400).json({ msg: "otp verified failed" });
        // return { status: false };
      }
    }
   
  } catch (err) {
    console.log(err);
    res.status(406).json({ msg: "twlioo error contact backend dev" });

  }
};

exports.resendOtp = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById({ _id: userId });
    await Otp.findOneAndDelete({ userId });
    const email = user.email;
    sendOtpVerification({ _id: userId, email }, req, res);
  } catch (err) {
    console.log(err);
  }
};

exports.userLogin = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;
    const user = await User.findOne({ mobileNumber });
    // let user;
    if (user) {
      const isValidPass = comparePassword(password, user.password);
      if (isValidPass) {
        const token = jwt.sign(
          {
            id: user._id,
            name: user.name,
            type: "user",
          },
          process.env.JWT_SECRET_KEY
        );
        res.status(200).send(`successfully logged in ...${token}`);
      } else {
        res.status(403).send("invalid password");
      }
    } else {
      res.status(401).send("invalid Phone Number");
    }
  } catch (err) {
    console.log(err);
  }
};

exports.addProfilePic = async (req, res) => {
  try {
    const { id, url } = req.body;
    const user = await User.findByIdAndUpdate(id, { url: url });
    res.send(user);
  } catch (err) {
    console.log(err);
  }
};

exports.editProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { ...req.body });
    res.send(user);
  } catch (err) {
    console.log(err);
  }
};

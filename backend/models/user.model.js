import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const User =  mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['student', 'club-coordinator', 'admin'],
        default: 'student',
        required: true
    },
    clubAffiliation: {
        type: String,
        default: 'none',
    },
    registeredEvents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }],
    clubMemberships: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club'
    }],
    savedNotices: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notice'
    }],
    bookmarks: {
        events: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event'
        }],
        notices: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Notice'
        }]
    },
    refreshToken: {
        type: String,
        default: null,
    },
    accessToken: {
        type: String,
        default: null,
    }
}, { timestamps: true });

// Hash password before saving
User.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// view registered events, club membership, saved notices, 
// option to bookmarks events, notices

  User.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
  };
  
  User.methods.generateAccessToken = function () {
    return jwt.sign(
      {
        _id: this._id,
        email: this.email,
        name: this.name,
        role: this.role
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    );
  };
  
  User.methods.generateRefreshToken = function () {
    return jwt.sign(
      {
        _id: this._id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );
  };
  
const UserModel = mongoose.model('User', User);
export default UserModel;
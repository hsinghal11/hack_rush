import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import ClubModel from "../models/club.model.js";

export const verifyJWT = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Unauthorized request" });
    }
    
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await UserModel.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    
    if (!user) {
      return res.status(401).json({ message: "Invalid access token" });
    }

    req.user = user;
    next();
  }
  catch (error) {
    return res.status(401).json({ message: error?.message || "Invalid access token" });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied: Admin role required" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Something went wrong" });
  }
};

export const isClubCoordinator = async (req, res, next) => {
  try {
    if (req.user.role !== 'club-coordinator' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied: Club Coordinator role required" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Something went wrong" });
  }
};

// Middleware to check if user is coordinator of a specific club
export const isClubOwner = async (req, res, next) => {
  try {
    const clubId = req.params.clubId || req.body.clubId || req.body.club;
    
    if (!clubId) {
      return res.status(400).json({ message: "Club ID is required" });
    }

    const club = await ClubModel.findById(clubId);
    
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (club.coordinator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied: You are not the coordinator of this club" });
    }

    req.club = club;
    next();
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Something went wrong" });
  }
}; 
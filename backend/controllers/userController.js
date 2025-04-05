import UserModel from "../models/user.model.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error("Something went wrong while generating refresh and access token");
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User with email already exists" });
    }

    // Create user (password will be hashed in the model's pre-save hook)
    const user = await UserModel.create({ 
      name, 
      email, 
      password, 
    });

    // Remove password from response
    const createdUser = await UserModel.findById(user._id).select("-password -refreshToken");
    
    if (!createdUser) {
      return res.status(500).json({ message: "Something went wrong while registering the user" });
    }

    res.status(201).json({
      success: true,
      user: createdUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user with email (don't include password in query)
    const user = await UserModel.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check password (assuming you have a method in your model)
    const isPasswordValid = await user.isPasswordCorrect(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // Get user data without sensitive fields
    const loggedInUser = await UserModel.findById(user._id).select("-password -refreshToken");

    // Set cookies for better security
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        user: loggedInUser,
        accessToken,
        refreshToken
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const { email } = req.params;

    const user = await UserModel.findOne({ email }).select("-password -refreshToken");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    }

    const { email } = req.params;
    const { clubAffiliation } = req.body;

    const user = await UserModel.findOneAndUpdate(
      { email }, 
      { clubAffiliation }, 
      { new: true }
    ).select("-password -refreshToken");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { email } = req.user;

    const user = await UserModel.findOneAndDelete({ email });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Clear cookies on logout/delete
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    };
    
    res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({
        success: true,
        message: "User deleted successfully"
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { registerUser, loginUser, getUser, updateUser, deleteUser };

import {asyncHandler} from "../utils/asyncHandler.js";
import {APIError} from "../utils/APIError.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/APIResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });  // saving refreshToken in database

        return {accessToken, refreshToken}

    } catch (error) {
        throw new APIError(500, "Something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     message: "Hello, Nanak from user Controller"
    // })

    // steps or features must have
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // create user object - create entry in db
    // remove password and refresh token field from response (res)
    // check for user creation
    // return res or error

// any data come from either form or json can get from req.body, for url will handle later
   const {fullname, email, username, password} = req.body
//    console.log("email: ", email)

//    if(fullname === ""){           // using if condition to check every fields 
//     throw new APIError(400, "Full name is required")
//    }

    if(
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new APIError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new APIError(409, "User with username or email already exists")
    }

    console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new APIError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new APIError(400, "Avatar is required")
    }

   const user = await User.create({
        fullname, 
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new APIError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new APIResponse(200, createdUser, "User registered Successfully!!")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // check with username or email
    // find the user
    // if user exists, check for password
    // generate access and refresh token
    // send cookie

    const {email, username, password} = req.body

    if(!(username || email)){
        throw new APIError(400, "username or email is required")
    }

    // Alternative of above code 
    // if(!username && !email){
    //     throw new APIError(400, "username or email is required")
    // }
    

    const user = await User.findOne({
        $or: [{username}, {email}]
    });
    if(!user){
        throw new APIError(404, "User Does't Exists")
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new APIError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   const options = {
    httpOnly:true,
    secure: true 
   }

   return res
   .status(200)
   .cookie("accessToken", accessToken, options)
   .cookie("refreshToken", refreshToken, options)
   .json(
    new APIResponse(
        200,
        {
            user: loggedInUser, accessToken, 
            refreshToken
        },
        "User Logged In Successfully"
    )
    
   )
});

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1  // this removes the field from document
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new APIResponse(
            200, 
            {},
            "User logged out"
        )
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

   try {
     if(!incomingRefreshToken){
         throw new APIError(401, "Unauthorized request")
     }
     const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
     )
 
     const user = await User.findById(decodedToken?._id)
 
     if(!user){
         throw new APIError(401, "Invalid refresh token ")
     }
 
     if(incomingRefreshToken !== user?.refreshToken){
         throw new APIError(401, "Refreshed Token is expired or used")
     }
 
     const options = {
         httpOnly: true,
         secure: true
     }
 
     const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
         new APIResponse(
             200,
             {
                 accessToken,
                 refreshToken: newRefreshToken
             },
             "Access Token Refreshed"
         )
     )
   } catch (error) {
        throw new APIError(401, error?.message || "Invalid refreesh Token")
   }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword, confPassword} = req.body

    // if(!(newPassword === confPassword)){
    //     throw new APIError
    // }
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect =  user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new APIError(400, "Invalid old Password")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new APIResponse(200, {}, "Password reset successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullname, email} = req.body

    if(!fullname || !email){
        throw new APIError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email,

            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new APIResponse(200, user, "Account Details Updated Successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
     const avatarLocalPath = req.file?.path

     if(!avatarLocalPath){
        throw new APIError(400, "Avatar file is missing")
     }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new APIError(400, "Error while uploading on Avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new APIResponse(200, user, "Avatar Updated"))
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new APIError(400, "Cover Image File is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new APIError(400, "Error while uploading on Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        },
    ).select("-password")

    return res
    .status(200)
    .json(APIResponse(200, user, "Cover Image Updated"))
})


export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage}
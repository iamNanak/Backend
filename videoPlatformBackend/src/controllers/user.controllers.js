import {asyncHandler} from "../utils/asyncHandler.js";
import APIError from "../utils/APIError.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIResponse } from "../utils/APIResponse.js";

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
    // remove password and refresh token field from response
    // check for user creation
    // return res or error

// any data come from either form or json can get from req.body, for url will handle later
   const {fullname, email, username, password} = req.body
   console.log("email: ", email)

//    if(fullname === ""){           // using if condition to check every fields 
//     throw new APIError(400, "Full name is required")
//    }

    if(
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ){
        throw new APIError(400, "All fields are required")
    }

    const existedUser = User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser){
        throw new APIError(409, "User with username or email already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

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

export {registerUser}
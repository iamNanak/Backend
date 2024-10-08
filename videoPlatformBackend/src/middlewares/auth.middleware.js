import { User } from "../models/user.models.js";
import { APIError } from "../utils/APIError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, res, next) => {   // here 'res' is not in use so it can be replace by '_'
   try {
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
 
     if(!token){
         throw new APIError(401, "Unauthorized request")
     }
 
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
 
     if(!user){
         // TODO: Discuss about Frontend
         throw new APIError(401, "Invalid Access Token")
     }
 
     req.user = user;
     next()
   } catch (error) {
        throw new APIError(401, error?.message || "Invalid access Token")
   }
})
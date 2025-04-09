import mongoose from 'mongoose';
import Jwt from 'jsonwebtoken';
import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.models.js';
import {uploadOnCloudinary,deleteOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';

const generateAccessAndRefreshTokens = async (userId)=>{
    try {
        const user = await User.findById(userId);
        if(!user) throw new ApiError("user not found",404);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false});
        return {accessToken,refreshToken};
    } catch (error) {
        throw new ApiError("something went wrong while generating access and refresh tokens",500);
    }
}
const registerUser = asyncHandler(async (req, res) => {
    const {fullname,email,username,password} = req.body
    if([fullname,email,username,password].some((field)=>field?.trim()==="")){
        throw new ApiError("fullname is required",400);
    }

    const userExists = await User.findOne({username});
    if(userExists){
        throw new ApiError("user already exists",400);
    }
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path
    if(!avatarLocalPath){
        throw new ApiError("avatar file is missing",400);
    }
    // const avatar =await uploadOnCloudinary(avatarLocalPath)
    let avatar;
    try{
        avatar =await uploadOnCloudinary(avatarLocalPath)
        console.log("uploaded avatar",avatar);
    }
    catch(error){
        console.log("error uploading avatar",error);
        throw new ApiError("something went wrong while uploading avatar",500);
    }
    let coverImage;
    try{
        coverImage =await uploadOnCloudinary(coverImageLocalPath)
        console.log("uploaded coverImage",coverImage);
    }
    catch(error){
        console.log("error uploading avatar",error);
        throw new ApiError("something went wrong while uploading cloudImage",500);
    }

    try {
        const user = await User.create(
            {
                fullname,
                email,
                username:username.toLowerCase(),
                password,
                avatar: avatar.url,
                coverImage: coverImage?.url || ""
            }
        );
        const createdUser = await User.findById(user._id).select('-password -refreshToken'); 
        if(!createdUser){
            throw new ApiError("Something went wrong while registering the user!!",404);
        }
        return res.status(201).json(new ApiResponse(200,"user registered successfully",createdUser));
    } catch (error) {
        console.log("user creation failed",error);
        if(avatar){
            await deleteOnCloudinary(avatar.public_id);
        }
        if(coverImage){
            await deleteOnCloudinary(coverImage.public_id);
        }
        throw new ApiError("Something went wrong while registering the user and images were deleted!!",500);
    }
});
const loginUser = asyncHandler(async (req, res) => {
    //get data from body
    const {email, username, password} = req.body

    //validation
    if(!email){
        throw new ApiError("email is required",400);
    }

    //check if user exists
    const user = await User.findOne({
        $or: [{email}]
    });
    if(!user){
        throw new ApiError("user not found",404);
    }
    //validate password
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if(!isPasswordCorrect){
        throw new ApiError("Invalid User Credentials!!",400);
    }
    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');
    if(!loggedInUser){
        throw new ApiError("Something went wrong while logging in the user!!",404);
    }
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    }
    return res
    .status(200)
    .cookie('accessToken',accessToken,options)
    .cookie('refreshToken',refreshToken,options)
    .json(new ApiResponse(200,{user: loggedInUser,accessToken,refreshToken},"user logged in successfully"));
})
const logoutUser = asyncHandler(async (req, res, next) => {  
    try {  
        await User.findByIdAndUpdate(  
            req.user._id,  
            {  
                $set: {  
                    refreshToken: undefined,  
                }  
            },  
            { new: true }  
        );  

        const options = {  
            httpOnly: true,  
            secure: process.env.NODE_ENV === "production",  
        };  

        return res  
            .status(200)  
            .clearCookie("accessToken", options)  
            .clearCookie("refreshToken", options)  
            .json(new ApiResponse(200, {}, "User logged out successfully"));  
    } catch (error) {  
        // Ensure we're handling the error properly  
        return next(error);  
    }  
});
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || 
    req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError("refresh token is required",400);
    }
    try{
        const decodedToken = Jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id);
        if(!user){
            throw new ApiError("Invalid Refresh Token",401);
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError("Invalid Refresh Token",401);
        }

        const options = {
            httpOnly:true,
            secure: process.env.NODE_ENV === "production"
        }
        const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: newRefreshToken
                },
                "Access token refreshed successfully"
            )
        )
    }
    catch(error){
        throw new ApiError(500,"Something went wrong while refreshing access token")
    }
})
const changeCurrentPassword = asyncHandler (async (req,res)=>{
    const {oldPassword,newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordValid){
        throw new ApiError(401,`OLd password is incorrect`)
    }
    user.password = newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200).json(new ApiResponse(200,{},"password changed successfully"))
})
const getCurrentUser = asyncHandler (async (req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"Current user details"))
})
const updateAccountDetails = asyncHandler (async (req,res)=>{  
    const {fullname,email} = req.body

    if(!fullname || !email){
        throw new ApiError(400,"fullname and email are required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullname:fullname,
                email:email
            },
        },
        {new: true}
    ).select("-password -refreshToken")
    return res.status(200).json(new ApiResponse(200,user,"Account details updated successfully"))
})
const updateUserAvatar = asyncHandler (async (req,res)=>{  
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"File is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(500,"Something went wrong while uploading avatar on cloudinary")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar: avatar.url
            },
        },
        {new: true}
    ).select("-password -refreshToken")
     return res.status(200).json(new ApiResponse(200,user,"Avatar updated successfully"))
})
const updateUserCoverImage = asyncHandler (async (req,res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"File is required")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(500,"Something went wrong while uploading cover image on cloudinary")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            },
        },
        {new: true}
    ).select("-password -refreshToken")
     return res.status(200).json(new ApiResponse(200,user,"Cover image updated successfully"))
})
const getUserChannelProfile = asyncHandler(async (req, res) => {  
    const { username } = req.params;  

    if (!username?.trim()) {  
        throw new ApiError(400, "Username is required");  
    }  

    const channel = await User.aggregate([  
        {  
            $match: { username: username?.toLowerCase() }  
        },  
        {  
            $lookup: {  
                from: "subscriptions",  
                localField: "_id",  
                foreignField: "channel",  
                as: "subscribers"  
            }  
        },  
        {  
            $lookup: {  
                from: "subscriptions",  
                localField: "_id",  
                foreignField: "subscriber",  
                as: "subscriberedTo"  
            }  
        },  
        {  
            $addFields: {  
                subscribersCount: { $size: "$subscribers" },  
                channelsSubscribedTo: { $size: "$subscriberedTo" },  
                isSubscribed: {  
                    $in: [req.user?._id, "$subscribers.subscriber"]  
                },  
            }  
        },  
        {  
            $project: {  
                username: 1,  
                fullname: 1,  
                avatar: 1,  
                coverImage: 1,  
                subscribersCount: 1,  
                channelsSubscribedTo: 1,  
                isSubscribed: 1,  
                email: 1  
            }  
        }  
    ]);  

    if (!channel?.length) {  
        // This should throw an ApiError with a valid status code  
        throw new ApiError(404, "Channel not found");  
    }  

    return res.status(200).json({  
        status: 200,  
        data: channel[0],  
        message: "Channel profile details"  
    });  
});
const getWatchHistory = asyncHandler (async (req,res)=>{
    const user = await User.aggregate([
        {
            $match:{_id: new mongoose.Types.ObjectId(req.user?._id)}
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username:1,
                                        fullname:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    if(!user?.length){
        throw new ApiError(404,"User not found")
    }
    return res.status(200).json(new ApiResponse(200,user[0]?.watchHistory,"Watch history fetch successfully"))
})
const deleteUser = asyncHandler (async (req,res)=>{
    const user = await User.findByIdAndDelete(req.user?._id)
    return res.status(200).json(new ApiResponse(200,user,"User deleted successfully"))
})
export{
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    deleteUser
}
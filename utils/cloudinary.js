import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: 'auto',
        });
        console.log('file is uploaded on cloudinary',response.url);
        // once the file is uploaded on cloudinary, we can delete it from local system or from our server.
        fs.unlinkSync(localFilePath);
        return response;
    }
    catch(error){
        fs.unlinkSync(localFilePath);
        return null;
    }
}

const deleteOnCloudinary = async (publicId) => {
    try{
        if(!publicId) return null;
        const response = await cloudinary.uploader.destroy(publicId);
        console.log('file is deleted on cloudinary',response);
        return response;
    }
    catch(error){
        console.log('file is not deleted on cloudinary',error);
        return null;
    }
}

export {uploadOnCloudinary,deleteOnCloudinary};

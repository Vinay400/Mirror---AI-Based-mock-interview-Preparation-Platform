import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";

export const uploadAudioToCloudinary = (buffer)=> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            resource_type: "video",
            folder: "mock-interview/audio",
        },
    (error, result) => {
        if(error) return reject(error);
        resolve(result);
    }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};
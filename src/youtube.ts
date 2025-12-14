import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';



const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/channels";


export async function fetchMyChannelDetails(access_token : string) {
  if (!access_token || access_token === "") {
    console.error("Error: Access Token is missing or placeholder. Please insert a valid token.");
    return;
  }

  try {
    const response = await axios.get(YOUTUBE_API_URL, {
      params: {
        
        'part': 'snippet,contentDetails,statistics',
        'mine': true
      },
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json'
      }
    });

    const channelData = response.data.items[0];

    if (channelData) {
      return channelData;
      
      
    } else {
      console.log("No channel found for the authenticated user.");
    }
    
  } catch (error : any) {
    console.error("❌ Error fetching YouTube Channel details:", error.response?.data || error.message);
  }
}

const ACCESS_TOKEN = "";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VIDEO_FILE_PATH = "src/videos/Screen Recording 2025-11-27 at 6.42.47 PM.mp4"


const VIDEO_METADATA = {
  snippet: {
    title: "My First YouTube API Upload",
    description: "This video was uploaded programmatically using the YouTube Data API and Node.js.",
    tags: ["api upload", "nodejs", "youtube"],
    categoryId: "22"
  },
  status: {
    privacyStatus: "public",   
  }
};
// -------------------------------



export async function uploadVideo() {
  if (!fs.existsSync(VIDEO_FILE_PATH)) {
    console.error(`❌ Error: Video file not found at path: ${VIDEO_FILE_PATH}`);
    console.error("Please ensure 'test.mp4' exists or the path is correct.");
    return;
  }
  
  const fileSize = fs.statSync(VIDEO_FILE_PATH).size;
  const videoStream = fs.createReadStream(VIDEO_FILE_PATH);

  try {

    console.log("1️⃣ Initiating resumable upload and sending metadata...");
    
    const initiationResponse = await axios.post(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      VIDEO_METADATA,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json; charset=UTF-8',
         
          'X-Upload-Content-Length': fileSize, 
          'X-Upload-Content-Type': 'video/mp4' 
        }
      }
    );

    const uploadUrl = initiationResponse.headers.location;
    console.log(`✅ Upload initiated. Resumable URL received: ${uploadUrl}`);
    console.log(`Payload size: ${fileSize} bytes`);


    console.log("2️⃣ Uploading video data...");

    const uploadResponse = await axios.put(
      uploadUrl,
      videoStream,
      {
        headers: {
          'Content-Type': 'video/mp4', 
        },
     
        onUploadProgress: (progressEvent : any) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          process.stdout.write(`\rUpload progress: ${percentCompleted}%`);
        }
      }
    );

    console.log("\n✅ Video Upload Complete!");
    console.log("------------------------------------------");
    console.log(`Video Title: ${uploadResponse.data.snippet.title}`);
    console.log(`Video ID: ${uploadResponse.data.id}`);
    console.log(`Status: ${uploadResponse.data.status.uploadStatus}`);
    console.log(`Video URL: https://youtu.be/${uploadResponse.data.id}`);
    
  } catch (error : any) {
    console.error("\n❌ An error occurred during the video upload process.");
  
    console.error("Error Status:", error.response?.status);
    console.error("Error Data:", error.response?.data);
  }
}


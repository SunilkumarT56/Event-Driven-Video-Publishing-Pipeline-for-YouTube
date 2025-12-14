import express from "express";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();
import {pool} from "./config/postgresql.js" 
import { fetchMyChannelDetails ,uploadVideo } from "./youtube.js";

const app = express();

const PORT = process.env.PORT || 8000;

app.get("/auth/google", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    scope: [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/youtube.force-ssl"
      ].join(" "),
    access_type: "offline",
    prompt: "consent"
  });

  const oauthUrl = `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
  res.redirect(oauthUrl);
});

app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Authorization code missing");
  }

  try {

    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    console.log(access_token)
    const channelData  = await fetchMyChannelDetails(access_token);

    const responsePayload = {
      success: true,
      message: "YouTube account connected successfully",
      channel: {
        id: channelData.id,
        title: channelData.snippet.title,
        description: channelData.snippet.description,
        thumbnails: channelData.snippet.thumbnails,
        stats: {
          subscribers: channelData.statistics.subscriberCount,
          totalViews: channelData.statistics.viewCount,
          videoCount: channelData.statistics.videoCount
        },
        uploadsPlaylistId:
          channelData.contentDetails.relatedPlaylists.uploads
      }
    };

    await uploadVideo();
    
    return res.status(200).json(responsePayload);
  } catch (err: any) {
    console.error("OAuth error:", err.response?.data || err.message);
    res.status(500).send("OAuth failed");
  }
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})



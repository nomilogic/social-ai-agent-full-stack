import express, { Request, Response } from "express";
import axios from "axios";
import { db } from '../db';
import { oauth_tokens } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

// GET /api/linkedin/me - Get LinkedIn profile information
router.get("/me", async (req: Request, res: Response) => {
  const accessToken = req.query.access_token as string;
  console.log(
    "Received request to fetch LinkedIn profile with access token:",
    accessToken,
  );
  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required" });
  }

  try {
    const response = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log("LinkedIn profile data:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching LinkedIn profile:", error);
    if (axios.isAxiosError(error)) {
      res.status(500).json({ error: error.response?.data || error.message });
    } else {
      res.status(500).json({ error: "Failed to fetch LinkedIn profile" });
    }
  }
});

// POST /api/linkedin/post - Create LinkedIn post with proper image upload
router.post("/post", async (req: Request, res: Response) => {
  const { accessToken, post } = req.body;

  if (!accessToken || !post) {
    return res.status(400).json({ error: "Missing accessToken or post data" });
  }

  try {
    console.log("Creating LinkedIn post with data:", {
      caption: post.caption,
      hasImage: !!post.imageUrl,
    });

    // Step 1: Get personId from LinkedIn
    const meResponse = await axios.get(`https://api.linkedin.com/v2/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const personId = meResponse.data.sub;
    console.log("LinkedIn person ID:", personId);

    let mediaAsset = null;

    // Step 2: Upload image if provided
    if (post.imageUrl) {
      console.log("Uploading image to LinkedIn:", post.imageUrl);

      // Step 2a: Register upload with LinkedIn
      const uploadResponse = await axios.post(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        {
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: `urn:li:person:${personId}`,
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent",
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      );

      const uploadUrl =
        uploadResponse.data.value.uploadMechanism[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ].uploadUrl;
      const asset = uploadResponse.data.value.asset;
      console.log("LinkedIn upload URL obtained:", uploadUrl);
      console.log("LinkedIn asset ID:", asset);

      // Step 2b: Download the image from the provided URL
      console.log("Downloading image from URL:", post.imageUrl);
      
      // Convert relative URL to full URL if needed
      let imageUrl = post.imageUrl;
      if (imageUrl.startsWith('/uploads/')) {
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? process.env.BASE_URL || 'http://localhost:5000'
          : 'http://localhost:5000';
        imageUrl = `${baseUrl}${imageUrl}`;
      }
      
      console.log("Full image URL:", imageUrl);
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      console.log("Image downloaded, size:", imageResponse.data.length);

      // Step 2c: Upload the image binary data to LinkedIn
      await axios.put(uploadUrl, imageResponse.data, {
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      console.log("Image uploaded successfully to LinkedIn");
      mediaAsset = asset;
    }

    // Step 3: Create the post
    const postData = {
      author: `urn:li:person:${personId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: post.caption },
          shareMediaCategory: mediaAsset ? "IMAGE" : "NONE",
          media: mediaAsset
            ? [
                {
                  status: "READY",
                  description: {
                    text: "Shared image",
                  },
                  media: mediaAsset,
                  title: {
                    text: "Social Media Post",
                  },
                },
              ]
            : [],
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    console.log(
      "Posting to LinkedIn with data:",
      JSON.stringify(postData, null, 2),
    );

    const postResponse = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      postData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "Content-Type": "application/json",
        },
      },
    );

    console.log("LinkedIn post created successfully:", postResponse.data);
    res.json({ success: true, data: postResponse.data });
  } catch (error: any) {
    console.error(
      "LinkedIn post error:",
      error.response?.data || error.message,
    );
    res.status(500).json({
      error: error.response?.data || error.message,
      details: error.response?.data,
    });
  }
});

// GET /api/v2/organizationalEntityAcls (backwards compatibility)
// This will be accessible via /api/v2/organizationalEntityAcls due to app.use('/api/v2', linkedinRouter)
router.get("/organizationalEntityAcls", async (req: Request, res: Response) => {
  console.log(
    "Received request for organizationalEntityAcls with query:",
    req.query,
  );
  if (!req.query.access_token) {
    return res.status(400).json({ error: "Access token is required" });
  }
  const accessToken = req.query.access_token;
  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required" });
  }

  const apiUrl = "https://api.linkedin.com/v2/organizationalEntityAcls";
  const params = new URLSearchParams({
    q: "roleAssignee",
    role: "ADMIN",
  });
  try {
    const response = await axios.get(`${apiUrl}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });
    res.json(response.data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      res.status(500).json({ error: err.response?.data || err.message });
    } else if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
});

// POST /share (legacy route for backwards compatibility)
// This will be accessible via /share due to app.use('/share', linkedinRouter)
router.post(
  "/",
  express.urlencoded({ extended: true }),
  async (req: Request, res: Response) => {
    const text = req.body.text || "Hello from LinkedIn API!";
    const accessToken = req.query.access_token as string;
    try {
      const me = await axios.get("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const personId = me.data.sub;
      const postText = req.body.text || "Hello from LinkedIn API!";

      const postRes = await axios.post(
        "https://api.linkedin.com/v2/ugcPosts",
        {
          author: `urn:li:person:${personId}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: postText },
              shareMediaCategory: "NONE",
            },
          },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
            "Content-Type": "application/json",
          },
        },
      );

      res.send(
        `<p>✅ Post created successfully!</p><pre>${JSON.stringify(postRes.data, null, 2)}</pre>`,
      );
    } catch (error: any) {
      console.error(error.response?.data || error.message);
      res.status(500).send("Post creation failed");
    }
  },
);
router.post("/access-token", async (req: Request, res: Response) => {
  console.log("Received LinkedIn OAuth callback with body:", req.body);
  //res.json({ message: 'This endpoint is deprecated. Please use /api/oauth/linkedin/callback with POST request.' });
  let body = req.body;
  if (typeof body === "string") {
    body = JSON.parse(body);
  }
  let getParams: { grant_type: string; code: string; redirect_uri: string } =
    JSON.parse(JSON.stringify(body));

  // Ensure the request body contains the necessary parameters
  console.log("Parsed parameters from request body:", getParams);
  if (!req.body) {
    return res.status(400).json({ error: "Request body is missing" });
  }
  const { code, redirect_uri } = getParams;

  if (!code || !redirect_uri) {
    return res.status(400).json({ error: "Missing required parameters" });
  }
  let newParams = {
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirect_uri,
    client_id: process.env.VITE_LINKEDIN_CLIENT_ID || '',
    client_secret: process.env.VITE_LINKEDIN_CLIENT_SECRET || '',
  };
  console.log("New parameters for LinkedIn token request:", newParams);
  const params = new URLSearchParams(newParams as Record<string, string>);

  try {
    const response = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    console.log("LinkedIn access token response:", response.data);
    // Save token to database if user_id is provided
    const { user_id } = body;
    if (user_id && response.data.access_token) {
      try {
        // Calculate expiry date if expires_in is provided
        let expires_at: Date | null = null;
        if (response.data.expires_in) {
          expires_at = new Date(Date.now() + (response.data.expires_in * 1000));
        }

        // Check if token already exists
        const existingToken = await db
          .select()
          .from(oauth_tokens)
          .where(and(
            eq(oauth_tokens.user_id, user_id),
            eq(oauth_tokens.platform, 'linkedin')
          ))
          .limit(1);

        if (existingToken.length > 0) {
          // Update existing token
          await db
            .update(oauth_tokens)
            .set({
              access_token: response.data.access_token,
              refresh_token: response.data.refresh_token || null,
              expires_at: expires_at,
              updated_at: new Date()
            })
            .where(and(
              eq(oauth_tokens.user_id, user_id),
              eq(oauth_tokens.platform, 'linkedin')
            ));
        } else {
          // Insert new token
          await db.insert(oauth_tokens).values({
            user_id: user_id,
            platform: 'linkedin',
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token || null,
            expires_at: expires_at
          });
        }

        console.log(`LinkedIn token stored successfully for user ${user_id}`);
      } catch (storeError) {
        console.error('Failed to store LinkedIn token:', storeError);
        // Don't fail the request, but log the error
      }
    }

    res.json(response.data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      res.status(500).json({ error: err.response?.data || err.message });
    } else if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
  }
});

// GET /api/linkedin/oauth_tokens - Get LinkedIn OAuth tokens for a user
router.get("/oauth_tokens", async (req: Request, res: Response) => {
  const { user_id } = req.query;

  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: "user_id parameter is required" });
  }

  try {
    console.log(`Fetching LinkedIn tokens for user: ${user_id}`);
    
    const tokens = await db
      .select()
      .from(oauth_tokens)
      .where(and(
        eq(oauth_tokens.user_id, user_id),
        eq(oauth_tokens.platform, 'linkedin')
      ))
      .limit(1);

    if (tokens.length === 0) {
      return res.json({ connected: false, token: null });
    }

    const token = tokens[0];
    
    // Check if token is expired
    const isExpired = token.expires_at ? new Date(token.expires_at) < new Date() : false;
    
    return res.json({
      connected: true,
      expired: isExpired,
      token: {
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: token.expires_at,
        token_type: token.token_type
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch LinkedIn tokens:', error);
    res.status(500).json({ error: "Failed to fetch LinkedIn tokens" });
  }
});

export default router;

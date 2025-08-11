import express, { Request, Response } from 'express'
import axios from 'axios'

const router = express.Router()

// GET /api/linkedin/me - Get LinkedIn profile information
router.get('/me', async (req: Request, res: Response) => {
  const accessToken = req.query.access_token as string
  console.log("Received request to fetch LinkedIn profile with access token:", accessToken)
  if (!accessToken) {
    return res.status(400).json({ error: "Access token is required" })
  }

  try {
    const response = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    console.log("LinkedIn profile data:", response.data)
    res.json(response.data)
  } catch (error) {
    console.error("Error fetching LinkedIn profile:", error)
    if (axios.isAxiosError(error)) {
      res.status(500).json({ error: error.response?.data || error.message })
    } else {
      res.status(500).json({ error: "Failed to fetch LinkedIn profile" })
    }
  }
})

// POST /api/linkedin/post - Create LinkedIn post
router.post('/post', async (req: Request, res: Response) => {
  const { accessToken, post } = req.body

  if (!accessToken || !post) {
    return res.status(400).json({ error: 'Missing accessToken or post data' })
  }

  try {
    // Step 1: Get personId from LinkedIn
    const meResponse = await axios.get(`https://api.linkedin.com/v2/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    const personId = meResponse.data.sub

    // Step 2: Prepare post data
    const url = 'https://api.linkedin.com/v2/ugcPosts'
    const data = {
      author: `urn:li:person:${personId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: post.caption },
          shareMediaCategory: post.imageUrl ? 'IMAGE' : 'NONE',
          media: post.imageUrl
            ? [{ status: 'READY', originalUrl: post.imageUrl }]
            : []
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    }

    // Step 3: Send post request
    const postResponse = await axios.post(url, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json'
      }
    })

    res.json({ success: true, data: postResponse.data })

  } catch (error: any) {
    console.error(error.response?.data || error.message)
    res.status(500).json({ error: error.response?.data || error.message })
  }
})

// GET /api/v2/organizationalEntityAcls (backwards compatibility)
// This will be accessible via /api/v2/organizationalEntityAcls due to app.use('/api/v2', linkedinRouter)
router.get('/organizationalEntityAcls', async (req: Request, res: Response) => {
  console.log("Received request for organizationalEntityAcls with query:", req.query)
  if (!req.query.access_token) {
    return res.status(400).json({ error: 'Access token is required' })
  }
  const accessToken = req.query.access_token
  if (!accessToken) {
    return res.status(400).json({ error: 'Access token is required' })
  }

  const apiUrl = 'https://api.linkedin.com/v2/organizationalEntityAcls'
  const params = new URLSearchParams({
    q: 'roleAssignee',
    role: 'ADMIN'
  })
  try {
    const response = await axios.get(`${apiUrl}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": '2.0.0'
      }
    })
    res.json(response.data)
  } catch (err) {
    if (axios.isAxiosError(err)) {
      res.status(500).json({ error: err.response?.data || err.message })
    } else if (err instanceof Error) {
      res.status(500).json({ error: err.message })
    } else {
      res.status(500).json({ error: 'Unknown error' })
    }
  }
})

// POST /share (legacy route for backwards compatibility)
// This will be accessible via /share due to app.use('/share', linkedinRouter)
router.post('/', express.urlencoded({ extended: true }), async (req: Request, res: Response) => {
  const text = req.body.text || "Hello from LinkedIn API!"
  const accessToken = req.query.access_token as string
  try {
    const me = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const personId = me.data.sub
    const postText = req.body.text || "Hello from LinkedIn API!"

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
      }
    )

    res.send(`<p>✅ Post created successfully!</p><pre>${JSON.stringify(postRes.data, null, 2)}</pre>`)
  } catch (error: any) {
    console.error(error.response?.data || error.message)
    res.status(500).send("Post creation failed")
  }
})

export default router

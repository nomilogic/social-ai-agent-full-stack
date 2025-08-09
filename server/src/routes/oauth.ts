import express, { Request, Response } from 'express'
import axios from 'axios'

const router = express.Router()

const CLIENT_ID = process.env.VITE_LINKEDIN_CLIENT_ID as string
const CLIENT_SECRET = process.env.VITE_LINKEDIN_CLIENT_SECRET as string
const REDIRECT_URI = process.env.NODE_ENV === 'production' 
  ? `${process.env.FRONTEND_URL}/oauth/linkedin/callback`
  : "http://localhost:5173/oauth/linkedin/callback"

// GET /api/oauth/linkedin - Initiate LinkedIn OAuth flow
router.get('/linkedin', (req: Request, res: Response) => {
  console.log("Received request for LinkedIn OAuth")
  const state = Math.random().toString(36).substring(2, 15)
  const scope = "r_liteprofile%20r_emailaddress%20w_member_social"
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&state=${state}&scope=${scope}`
  console.log("Redirecting to LinkedIn OAuth URL:", authUrl)
  res.redirect(authUrl)
})

// POST /api/oauth/linkedin/callback - Handle OAuth callback
router.post('/linkedin/callback', async (req: Request, res: Response) => {
  console.log("Received LinkedIn OAuth callback with body:", req.body)
  let body = req.body
  if (typeof body === 'string') {
    body = JSON.parse(body)
  }
  let getParams: { grant_type: string, code: string, redirect_uri: string } = JSON.parse(JSON.stringify(body))

  console.log("Parsed parameters from request body:", getParams)
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' })
  }
  const { code, redirect_uri } = getParams

  if (!code || !redirect_uri) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }
  let newParams = {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirect_uri,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  }
  console.log("New parameters for LinkedIn token request:", newParams)
  const params = new URLSearchParams(newParams)

  try {
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
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

export default router

import express, { Request, Response } from 'express'
import { serverSupabaseAnon as serverSupabase } from '../supabaseClient'
import { validateRequestBody } from '../middleware/auth'

const router = express.Router()

// GET /api/companies - Get all companies for a user
router.get('/', async (req: Request, res: Response) => {
  const userId = req.query.userId as string

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    const { data, error } = await serverSupabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching companies:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({ success: true, data })
  } catch (err: any) {
    console.error('Server error fetching companies:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/companies - Create a new company
router.post('/', validateRequestBody(['name', 'userId']), async (req: Request, res: Response) => {
  const {
    name,
    website,
    industry,
    targetAudience,
    brandTone,
    goals,
    platforms,
    userId
  } = req.body

  try {
    const { data, error } = await serverSupabase
      .from('companies')
      .insert({
        name,
        website: website || null,
        industry: industry || null,
        target_audience: targetAudience || null,
        brand_tone: brandTone || 'Professional',
        goals: goals || [],
        platforms: platforms || [],
        user_id: userId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating company:', error)
      return res.status(500).json({ error: error.message })
    }

    res.status(201).json({ success: true, data })
  } catch (err: any) {
    console.error('Server error creating company:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/companies/:id - Update a company
router.put('/:id', validateRequestBody(['userId']), async (req: Request, res: Response) => {
  const companyId = req.params.id
  const {
    name,
    website,
    industry,
    targetAudience,
    brandTone,
    goals,
    platforms,
    userId
  } = req.body

  try {
    const { data, error } = await serverSupabase
      .from('companies')
      .update({
        name,
        website,
        industry,
        target_audience: targetAudience,
        brand_tone: brandTone,
        goals,
        platforms,
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId)
      .eq('user_id', userId) // Ensure user owns this company
      .select()
      .single()

    if (error) {
      console.error('Error updating company:', error)
      return res.status(500).json({ error: error.message })
    }

    if (!data) {
      return res.status(404).json({ error: 'Company not found or unauthorized' })
    }

    res.json({ success: true, data })
  } catch (err: any) {
    console.error('Server error updating company:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/companies/:id - Delete a company
router.delete('/:id', async (req: Request, res: Response) => {
  const companyId = req.params.id
  const userId = req.query.userId as string

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    const { error } = await serverSupabase
      .from('companies')
      .delete()
      .eq('id', companyId)
      .eq('user_id', userId) // Ensure user owns this company

    if (error) {
      console.error('Error deleting company:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({ success: true, message: 'Company deleted successfully' })
  } catch (err: any) {
    console.error('Server error deleting company:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

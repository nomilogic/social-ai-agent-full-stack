import express, { Request, Response } from 'express'
import { db } from '../db'
import { companies } from '../../shared/schema'
import { eq, and, desc } from 'drizzle-orm'
import { validateRequestBody } from '../middleware/auth'

const router = express.Router()

// GET /api/companies - Get all companies for a user
router.get('/', async (req: Request, res: Response) => {
  const userId = req.query.userId as string

  if (!userId) {
    console.log('No userId provided in companies request')
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    console.log('Fetching companies for userId:', userId)
    const data = await db
      .select()
      .from(companies)
      .where(eq(companies.user_id, userId))
      .orderBy(desc(companies.created_at))

    console.log('Found companies:', data.length)
    res.json({ success: true, data: data || [] })
  } catch (err: any) {
    console.error('Server error fetching companies:', err)
    console.error('Error details:', err.message, err.stack)
    res.status(500).json({ error: 'Internal server error', details: err.message })
  }
})

// POST /api/companies - Create a new company
router.post('/', validateRequestBody(['name', 'userId']), async (req: Request, res: Response) => {
  const {
    name,
    website,
    industry,
    description,
    targetAudience,
    brandTone,
    goals,
    platforms,
    userId
  } = req.body

  try {
    console.log('Creating company with data:', {
      name,
      website,
      industry,
      description,
      targetAudience,
      brandTone,
      goals,
      platforms,
      userId
    });

    const insertResults = await db
      .insert(companies)
      .values({
        name,
        website: website || null,
        industry: industry || null,
        description: description || null,
        target_audience: targetAudience || null,
        brand_tone: brandTone || 'professional',
        goals: goals || [],
        platforms: platforms || [],
        user_id: userId
      })
      .returning()

    const data = insertResults[0];
    console.log('Company created successfully:', data.id);

    res.status(201).json({ success: true, data })
  } catch (err: any) {
    console.error('Server error creating company:', err)
    console.error('Error details:', err.message, err.stack)
    res.status(500).json({ error: 'Internal server error', details: err.message })
  }
})

// PUT /api/companies/:id - Update a company
router.put('/:id', validateRequestBody(['userId']), async (req: Request, res: Response) => {
  const companyId = req.params.id
  const {
    name,
    website,
    industry,
    description,
    targetAudience,
    brandTone,
    goals,
    platforms,
    userId
  } = req.body

  try {
    console.log('Updating company:', companyId, 'for user:', userId);

    const updateResults = await db
      .update(companies)
      .set({
        name,
        website,
        industry,
        description,
        target_audience: targetAudience,
        brand_tone: brandTone,
        goals,
        platforms,
        updated_at: new Date()
      })
      .where(and(eq(companies.id, companyId), eq(companies.user_id, userId)))
      .returning()

    if (updateResults.length === 0) {
      return res.status(404).json({ error: 'Company not found or unauthorized' })
    }

    const data = updateResults[0];
    console.log('Company updated successfully:', data.id);

    res.json({ success: true, data })
  } catch (err: any) {
    console.error('Server error updating company:', err)
    console.error('Error details:', err.message, err.stack)
    res.status(500).json({ error: 'Internal server error', details: err.message })
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
    const result = await db
      .delete(companies)
      .where(and(eq(companies.id, companyId), eq(companies.user_id, userId)))
      .returning({ id: companies.id })

    if (result.length === 0) {
      return res.status(404).json({ error: 'Company not found or unauthorized' })
    }

    res.json({ success: true, message: 'Company deleted successfully' })
  } catch (err: any) {
    console.error('Server error deleting company:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

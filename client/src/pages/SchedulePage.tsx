import React, { useState, useEffect } from 'react'
import { Calendar, Clock, BarChart3, Plus, Eye, Trash2, Edit } from 'lucide-react'
import { PostScheduleDashboard } from '../components/PostScheduleDashboard'
import { PostCalendar } from '../components/PostCalendar'
import { AIScheduleGenerator } from '../components/AIScheduleGenerator'
import { useAppContext } from '../context/AppContext'
import { FeatureRestriction } from '../components/FeatureRestriction'
import { usePlanFeatures } from '../hooks/usePlanFeatures'

interface ScheduledPost {
  id: string
  content: string
  platforms: string[]
  scheduledDate: Date
  status: 'scheduled' | 'published' | 'failed'
  imageUrl?: string
}

export const SchedulePage: React.FC = () => {
  const { currentCompany } = useAppContext()
  const { canUseFeature } = usePlanFeatures()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'ai-generator'>('dashboard')
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const canSchedulePosts = canUseFeature('scheduleUnlimited')

  useEffect(() => {
    const fetchScheduledPosts = async () => {
      if (!currentCompany?.id) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/schedule/posts?companyId=${currentCompany.id}`)

        if (!response.ok) {
          throw new Error('Failed to fetch scheduled posts')
        }

        const data = await response.json()
        console.log('Scheduled posts data:', data)

        if (data.success && Array.isArray(data.data)) {
          const posts = data.data.map((post: any) => ({
            id: post.id,
            content: post.content,
            platforms: post.platforms || [],
            scheduledDate: new Date(post.scheduled_date),
            status: post.status,
            imageUrl: post.image_url
          }))
          setScheduledPosts(posts)
        }
      } catch (error) {
        console.error('Error fetching scheduled posts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchScheduledPosts()
  }, [currentCompany?.id])

  if (!canSchedulePosts) {
    return (
      <FeatureRestriction
        feature="Schedule Posts"
        description="Schedule your content across multiple platforms with AI-powered optimal timing"
        requiredPlan="AI Pro"
      />
    )
  }

  return (
    <div className="min-h-screen theme-gradient">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold theme-text-primary mb-2">
            Schedule Posts
          </h1>
          <p className="theme-text-secondary">
            Plan and schedule your content across multiple platforms
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 theme-bg-primary rounded-lg p-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${
                activeTab === 'dashboard'
                  ? 'theme-button-primary font-medium'
                  : 'theme-text-secondary hover:theme-text-primary'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${
                activeTab === 'calendar'
                  ? 'theme-button-primary font-medium'
                  : 'theme-text-secondary hover:theme-text-primary'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('ai-generator')}
              className={`flex items-center px-4 py-2 rounded-md transition-all ${
                activeTab === 'ai-generator'
                  ? 'theme-button-primary font-medium'
                  : 'theme-text-secondary hover:theme-text-primary'
              }`}
            >
              <Clock className="w-4 h-4 mr-2" />
              AI Generator
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'dashboard' && (
            <PostScheduleDashboard 
              scheduledPosts={scheduledPosts}
              isLoading={isLoading}
              onPostUpdate={() => {
                // Refresh posts when updated
                if (currentCompany?.id) {
                  // Re-fetch logic here if needed
                }
              }}
            />
          )}

          {activeTab === 'calendar' && (
            <PostCalendar scheduledPosts={scheduledPosts} />
          )}

          {activeTab === 'ai-generator' && (
            <AIScheduleGenerator 
              companyId={currentCompany?.id || ''}
              onScheduleGenerated={() => {
                // Refresh posts when new schedule is generated
                if (currentCompany?.id) {
                  // Re-fetch logic here if needed
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
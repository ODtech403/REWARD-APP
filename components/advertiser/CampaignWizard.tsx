'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, AlertCircle, Upload, Image as ImageIcon, X } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import type { CampaignDraft } from '@/lib/types'

const MIN_BUDGET = 10

export interface CampaignWizardProps {
  onComplete: (campaign: CampaignDraft) => void
  onCancel: () => void
  advertiserBalance: number
  categories?: { id: string; name: string }[]
}

type CampaignType = 'survey' | 'video' | 'task' | 'app_download' | 'website_visit'

interface FormData {
  title: string
  description: string
  categoryId: string
  campaignType: CampaignType
  totalBudget: number
  costPerAction: number
  cooldownSeconds: number
  estimatedDurationMinutes: number
  maxCompletionsPerUser: number
  thumbnailUrl: string
  thumbnailPreview: string | null
}

const CAMPAIGN_TYPES: { value: CampaignType; label: string; description: string }[] = [
  { value: 'survey', label: 'Survey', description: 'Users complete a survey' },
  { value: 'video', label: 'Video', description: 'Users watch a video' },
  { value: 'task', label: 'Task', description: 'Users complete a specific task' },
  { value: 'app_download', label: 'App Download', description: 'Users download an app' },
  { value: 'website_visit', label: 'Website Visit', description: 'Users visit a website' },
]

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Name and type' },
  { id: 2, title: 'Budget', description: 'Set your budget' },
  { id: 3, title: 'Creative', description: 'Upload thumbnail' },
  { id: 4, title: 'Review', description: 'Confirm details' },
]

export function CampaignWizard({ onComplete, onCancel, advertiserBalance, categories = [] }: CampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    categoryId: '',
    campaignType: 'survey',
    totalBudget: 50,
    costPerAction: 1,
    cooldownSeconds: 120, // 2 minutes default cooldown
    estimatedDurationMinutes: 5,
    maxCompletionsPerUser: 1, // Default: user can complete once
    thumbnailUrl: '',
    thumbnailPreview: null,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})


  const estimatedCompletions = formData.costPerAction > 0 
    ? Math.floor(formData.totalBudget / formData.costPerAction) 
    : 0

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (step === 1) {
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required'
      }
      if (!formData.campaignType) {
        newErrors.campaignType = 'Campaign type is required'
      }
    }

    if (step === 2) {
      if (formData.totalBudget < MIN_BUDGET) {
        newErrors.totalBudget = `Minimum budget is $${MIN_BUDGET}`
      }
      if (formData.totalBudget > advertiserBalance) {
        newErrors.totalBudget = 'Insufficient wallet balance'
      }
      if (formData.costPerAction <= 0) {
        newErrors.costPerAction = 'CPA must be greater than 0'
      }
      if (formData.costPerAction > formData.totalBudget) {
        newErrors.costPerAction = 'CPA cannot exceed total budget'
      }
    }

    // Step 3 (Creative) has no required fields - thumbnail is optional

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1)
      } else {
        handleSubmit()
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    const draft: CampaignDraft = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      categoryId: formData.categoryId,
      campaignType: formData.campaignType,
      totalBudget: formData.totalBudget,
      costPerAction: formData.costPerAction,
      cooldownSeconds: formData.cooldownSeconds,
      estimatedDurationMinutes: formData.estimatedDurationMinutes,
      maxCompletionsPerUser: formData.maxCompletionsPerUser,
      thumbnailUrl: formData.thumbnailUrl || undefined,
    }
    onComplete(draft)
  }

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Card variant="glass" className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors',
                    currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-gray-400'
                  )}
                >
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <span className="text-xs text-gray-400 mt-2 hidden sm:block">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={clsx(
                    'w-8 sm:w-16 h-0.5 mx-1 sm:mx-2',
                    currentStep > step.id ? 'bg-green-500' : 'bg-white/10'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 1 && (
              <Step1BasicInfo
                formData={formData}
                errors={errors}
                categories={categories}
                updateField={updateField}
              />
            )}
            {currentStep === 2 && (
              <Step2Budget
                formData={formData}
                errors={errors}
                advertiserBalance={advertiserBalance}
                estimatedCompletions={estimatedCompletions}
                updateField={updateField}
              />
            )}
            {currentStep === 3 && (
              <Step3Creative
                formData={formData}
                updateField={updateField}
              />
            )}
            {currentStep === 4 && (
              <Step4Review
                formData={formData}
                estimatedCompletions={estimatedCompletions}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={currentStep === 1 ? onCancel : handleBack}
          >
            <ChevronLeft className="w-4 h-4" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button onClick={handleNext}>
            {currentStep === 4 ? 'Create Campaign' : 'Next'}
            {currentStep < 4 && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}


// Step 1: Basic Info
interface Step1Props {
  formData: FormData
  errors: Partial<Record<keyof FormData, string>>
  categories: { id: string; name: string }[]
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void
}

function Step1BasicInfo({ formData, errors, categories, updateField }: Step1Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Campaign Details</h2>
      
      <Input
        label="Campaign Title"
        placeholder="Enter campaign title"
        value={formData.title}
        onChange={(e) => updateField('title', e.target.value)}
        error={errors.title}
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description (optional)
        </label>
        <textarea
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
          rows={3}
          placeholder="Describe your campaign..."
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Campaign Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {CAMPAIGN_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => updateField('campaignType', type.value)}
              className={clsx(
                'p-4 rounded-xl border text-left transition-all',
                formData.campaignType === type.value
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              )}
            >
              <p className="font-medium text-white">{type.label}</p>
              <p className="text-xs text-gray-400 mt-1">{type.description}</p>
            </button>
          ))}
        </div>
        {errors.campaignType && (
          <p className="mt-2 text-sm text-red-400">{errors.campaignType}</p>
        )}
      </div>

      {categories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Category (optional)
          </label>
          <select
            className="w-full bg-[#1a1a2e] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 [&>option]:bg-[#1a1a2e] [&>option]:text-white"
            value={formData.categoryId}
            onChange={(e) => updateField('categoryId', e.target.value)}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}


// Step 2: Budget Configuration
interface Step2Props {
  formData: FormData
  errors: Partial<Record<keyof FormData, string>>
  advertiserBalance: number
  estimatedCompletions: number
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void
}

function Step2Budget({ formData, errors, advertiserBalance, estimatedCompletions, updateField }: Step2Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Budget & Pricing</h2>

      {/* Available Balance Info */}
      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
        <p className="text-sm text-gray-400">Available Balance</p>
        <p className="text-2xl font-bold text-white">${advertiserBalance.toFixed(2)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Total Budget ($)
          </label>
          <input
            type="number"
            min={MIN_BUDGET}
            step="1"
            className={clsx(
              'w-full bg-white/5 border rounded-xl py-3 px-4 text-white placeholder-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all',
              errors.totalBudget ? 'border-red-500/50' : 'border-white/10'
            )}
            value={formData.totalBudget}
            onChange={(e) => updateField('totalBudget', parseFloat(e.target.value) || 0)}
          />
          {errors.totalBudget && (
            <p className="mt-2 text-sm text-red-400">{errors.totalBudget}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cost Per Action ($)
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            className={clsx(
              'w-full bg-white/5 border rounded-xl py-3 px-4 text-white placeholder-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all',
              errors.costPerAction ? 'border-red-500/50' : 'border-white/10'
            )}
            value={formData.costPerAction}
            onChange={(e) => updateField('costPerAction', parseFloat(e.target.value) || 0)}
          />
          {errors.costPerAction && (
            <p className="mt-2 text-sm text-red-400">{errors.costPerAction}</p>
          )}
        </div>
      </div>

      {/* Estimated Completions */}
      <div className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-gray-300">Estimated Completions</span>
        </div>
        <p className="text-3xl font-bold text-white">{estimatedCompletions.toLocaleString()}</p>
        <p className="text-xs text-gray-400 mt-1">
          Based on ${formData.totalBudget} budget ÷ ${formData.costPerAction} CPA
        </p>
      </div>

      {/* Budget Priority Info */}
      <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-yellow-400">Higher Budget = Better Visibility</p>
            <p className="text-xs text-gray-400 mt-1">
              Campaigns with higher budgets are prioritized and shown at the top of user feeds, increasing your chances of getting more completions faster.
            </p>
          </div>
        </div>
      </div>

      {/* Max Completions Per User */}
      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-400">Max Completions Per User</p>
            <p className="text-xs text-gray-400 mt-1 mb-3">
              Limit how many times a single user can complete this campaign. Set to 1 for app downloads to ensure one download per device.
            </p>
            <input
              type="number"
              min="1"
              max="100"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              value={formData.maxCompletionsPerUser}
              onChange={(e) => updateField('maxCompletionsPerUser', Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cooldown (minutes)
          </label>
          <input
            type="number"
            min="1"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            value={Math.round(formData.cooldownSeconds / 60)}
            onChange={(e) => updateField('cooldownSeconds', Math.max(60, (parseInt(e.target.value) || 1) * 60))}
          />
          <p className="text-xs text-gray-500 mt-1">Time before user can redo task</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Est. Duration (minutes)
          </label>
          <input
            type="number"
            min="1"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            value={formData.estimatedDurationMinutes}
            onChange={(e) => updateField('estimatedDurationMinutes', parseInt(e.target.value) || 1)}
          />
          <p className="text-xs text-gray-500 mt-1">How long task takes to complete</p>
        </div>
      </div>
    </div>
  )
}


// Step 3: Creative Upload
interface Step3Props {
  formData: FormData
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void
}

function Step3Creative({ formData, updateField }: Step3Props) {
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('file')

  const handleUrlChange = (url: string) => {
    updateField('thumbnailUrl', url)
    // Clear preview if URL is empty
    if (!url.trim()) {
      updateField('thumbnailPreview', null)
    } else {
      // Set preview to the URL for validation
      updateField('thumbnailPreview', url)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPG, PNG, WebP, or GIF)')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      updateField('thumbnailPreview', previewUrl)
      // Store the data URL for submission
      const reader = new FileReader()
      reader.onloadend = () => {
        updateField('thumbnailUrl', reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClearThumbnail = () => {
    updateField('thumbnailUrl', '')
    updateField('thumbnailPreview', null)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Campaign Creative</h2>
      <p className="text-gray-400 text-sm">
        Add a thumbnail image to make your campaign stand out. This is optional but recommended.
      </p>

      {/* Upload Mode Toggle */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
        <button
          type="button"
          onClick={() => setUploadMode('file')}
          className={clsx(
            'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
            uploadMode === 'file'
              ? 'bg-purple-500 text-white'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <Upload className="w-4 h-4" />
          Upload from Device
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('url')}
          className={clsx(
            'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
            uploadMode === 'url'
              ? 'bg-purple-500 text-white'
              : 'text-gray-400 hover:text-white'
          )}
        >
          <ImageIcon className="w-4 h-4" />
          Enter URL
        </button>
      </div>

      {/* File Upload */}
      {uploadMode === 'file' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Image (optional)
          </label>
          <div className="relative">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
              id="thumbnail-upload"
            />
            <label
              htmlFor="thumbnail-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-purple-500/50 hover:bg-white/5 transition-all"
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-400">Click to select image</span>
              <span className="text-xs text-gray-500 mt-1">JPG, PNG, WebP, GIF (max 5MB)</span>
            </label>
          </div>
          {formData.thumbnailPreview && (
            <button
              type="button"
              onClick={handleClearThumbnail}
              className="mt-2 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              Remove image
            </button>
          )}
        </div>
      )}

      {/* URL Input */}
      {uploadMode === 'url' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Thumbnail URL (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              value={formData.thumbnailUrl.startsWith('data:') ? '' : formData.thumbnailUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
            />
            {formData.thumbnailUrl && !formData.thumbnailUrl.startsWith('data:') && (
              <button
                type="button"
                onClick={handleClearThumbnail}
                className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Thumbnail Preview */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Preview
        </label>
        <div className="relative aspect-[4/3] w-full max-w-sm mx-auto rounded-xl overflow-hidden border border-white/10 bg-white/5">
          {formData.thumbnailPreview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.thumbnailPreview}
                alt="Thumbnail preview"
                className="w-full h-full object-cover"
                onError={() => updateField('thumbnailPreview', null)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-semibold truncate">{formData.title || 'Campaign Title'}</p>
                <p className="text-white/80 text-sm">+${(formData.costPerAction * 0.75).toFixed(2)}</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ImageIcon className="w-12 h-12 mb-2" />
              <p className="text-sm">No thumbnail</p>
              <p className="text-xs mt-1">{uploadMode === 'file' ? 'Select an image above' : 'Enter a URL above to preview'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Tips */}
      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
        <div className="flex items-start gap-3">
          <Upload className="w-5 h-5 text-purple-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">Thumbnail Tips</p>
            <ul className="text-xs text-gray-400 mt-1 space-y-1">
              <li>• Use high-quality images (recommended: 800x600px)</li>
              <li>• Ensure the image is relevant to your campaign</li>
              <li>• Avoid text-heavy images for better mobile display</li>
              <li>• Supported formats: JPG, PNG, WebP, GIF</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}


// Step 4: Review
interface Step4Props {
  formData: FormData
  estimatedCompletions: number
}

function Step4Review({ formData, estimatedCompletions }: Step4Props) {
  const campaignTypeLabel = CAMPAIGN_TYPES.find(t => t.value === formData.campaignType)?.label || formData.campaignType

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Review Campaign</h2>
      
      <div className="space-y-4">
        <ReviewItem label="Title" value={formData.title} />
        {formData.description && (
          <ReviewItem label="Description" value={formData.description} />
        )}
        <ReviewItem label="Campaign Type" value={campaignTypeLabel} />
        <ReviewItem label="Total Budget" value={`$${formData.totalBudget.toFixed(2)}`} />
        <ReviewItem label="Cost Per Action" value={`$${formData.costPerAction.toFixed(2)}`} />
        <ReviewItem label="User Reward" value={`$${(formData.costPerAction * 0.75).toFixed(2)}`} />
        <ReviewItem label="Estimated Completions" value={estimatedCompletions.toLocaleString()} />
        <ReviewItem label="Max Per User" value={`${formData.maxCompletionsPerUser} time${formData.maxCompletionsPerUser > 1 ? 's' : ''}`} />
        <ReviewItem label="Cooldown Period" value={`${Math.round(formData.cooldownSeconds / 60)} minutes`} />
        <ReviewItem label="Est. Duration" value={`${formData.estimatedDurationMinutes} minutes`} />
        {formData.thumbnailUrl && (
          <ReviewItem label="Thumbnail" value="✓ Added" />
        )}
      </div>

      <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
        <p className="text-sm text-yellow-400">
          ⚠️ ${formData.totalBudget.toFixed(2)} will be deducted from your wallet when you create this campaign.
        </p>
      </div>
    </div>
  )
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/10">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}

// Export validation utilities for testing
export const validateBudget = (budget: number): { valid: boolean; error?: string } => {
  if (budget < MIN_BUDGET) {
    return { valid: false, error: `Minimum budget is $${MIN_BUDGET}` }
  }
  return { valid: true }
}

export const calculateEstimatedCompletions = (budget: number, cpa: number): number => {
  if (cpa <= 0) return 0
  return Math.floor(budget / cpa)
}

export { MIN_BUDGET }

import type { BusinessType } from '@/services/businessService'

export const BUSINESS_TYPE_OPTIONS: Array<{ value: BusinessType; label: string }> = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'resort', label: 'Resort' },
  { value: 'liquor', label: 'Liquor' },
  { value: 'yacht', label: 'Yacht' },
  { value: 'general', label: 'General' }
]

export function getBusinessTypeLabel(type: BusinessType): string {
  return BUSINESS_TYPE_OPTIONS.find(option => option.value === type)?.label || type
}

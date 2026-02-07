export const BUSINESS_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'resort', label: 'Resort' },
  { value: 'liquor', label: 'Liquor' },
  { value: 'yacht', label: 'Yacht' },
  { value: 'general', label: 'General' }
]

export function getBusinessTypeLabel(type: string): string {
  return BUSINESS_TYPE_OPTIONS.find(option => option.value === type)?.label || type
}

export function getBrandTypeLabel(type: string): string {
  return getBusinessTypeLabel(type)
}

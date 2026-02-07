export interface UploadedImage {
  id: string
  url: string
  storage_path: string
  category?: string
  width: number
  height: number
  format: string
  file_size: number
  uploaded_at: string
}

export interface MediaEntity {
  id: string
  name: string
  uploaded_images?: UploadedImage[] | null
  media_root_id?: string | null
}

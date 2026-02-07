import { ref, computed, watch, type ComputedRef } from 'vue'
import { businessService } from '@/services/businessService'
import type { UploadedImage, MediaEntity } from '@/types/media'

export type EntitySource = MediaEntity | (() => MediaEntity)

export interface FolderNode {
  name: string
  path: string
  fullPath: string
  children: FolderNode[]
  images: UploadedImage[]
  imageCount: number
  isExpanded: boolean
}

export type ViewMode = 'grid' | 'list' | 'timeline'
export type SortBy = 'name' | 'date' | 'size'
export type SortOrder = 'asc' | 'desc'

export function useBusinessImages(entitySource: EntitySource) {
  // Support both plain object and getter function for reactivity
  const entity: ComputedRef<MediaEntity> = computed(() =>
    typeof entitySource === 'function' ? entitySource() : entitySource
  )
  const businessId = computed(() => entity.value.id)
  const mediaRootId = computed(() => entity.value.media_root_id || entity.value.id)

  const images = ref<UploadedImage[]>([])
  const virtualFolders = ref<string[]>([])
  const folderStructure = ref<FolderNode | null>(null)
  const currentFolderPath = ref<string>('/')
  const selectedImageIds = ref<Set<string>>(new Set())
  const viewMode = ref<ViewMode>('grid')
  const searchQuery = ref<string>('')
  const sortBy = ref<SortBy>('date')
  const sortOrder = ref<SortOrder>('desc')
  const loading = ref<boolean>(false)
  const error = ref<string>('')

  watch(
    () => entity.value.uploaded_images,
    (newImages) => {
      if (newImages) {
        images.value = newImages
        folderStructure.value = buildFolderTree(newImages, virtualFolders.value)
      }
    },
    { immediate: true }
  )

  const currentFolder = computed<FolderNode | null>(() => {
    if (!folderStructure.value) return null
    if (currentFolderPath.value === '/') return folderStructure.value
    return findFolderByPath(folderStructure.value, currentFolderPath.value)
  })

  const filteredImages = computed<UploadedImage[]>(() => {
    let result: UploadedImage[] = []

    if (currentFolder.value) {
      result = currentFolder.value.images
    } else {
      result = images.value
    }

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter((img) => {
        const filename = extractFilenameFromPath(img.storage_path).toLowerCase()
        const folderPath = extractFolderPathFromStorage(
          img.storage_path,
          mediaRootId.value
        ).join('/').toLowerCase()
        return filename.includes(query) || folderPath.includes(query)
      })
    }

    result = [...result].sort((a, b) => {
      let comparison = 0

      switch (sortBy.value) {
        case 'name': {
          const nameA = extractFilenameFromPath(a.storage_path)
          const nameB = extractFilenameFromPath(b.storage_path)
          comparison = nameA.localeCompare(nameB)
          break
        }
        case 'date': {
          const dateA = new Date(a.uploaded_at).getTime()
          const dateB = new Date(b.uploaded_at).getTime()
          comparison = dateA - dateB
          break
        }
        case 'size': {
          comparison = a.file_size - b.file_size
          break
        }
      }

      return sortOrder.value === 'asc' ? comparison : -comparison
    })

    return result
  })

  const selectedImages = computed<UploadedImage[]>(() => {
    return filteredImages.value.filter((img) => selectedImageIds.value.has(img.id))
  })

  const hasSelection = computed<boolean>(() => selectedImageIds.value.size > 0)

  const allSelected = computed<boolean>(() => {
    if (!filteredImages.value.length) return false
    return filteredImages.value.every((img) => selectedImageIds.value.has(img.id))
  })

  const breadcrumbs = computed<Array<{ name: string; path: string }>>(() => {
    const rootName = entity.value.name || 'All Images'

    if (currentFolderPath.value === '/') {
      return [{ name: rootName, path: '/' }]
    }

    const parts = currentFolderPath.value.split('/').filter(Boolean)
    const crumbs: Array<{ name: string; path: string }> = [{ name: rootName, path: '/' }]

    let accumulatedPath = ''
    for (const part of parts) {
      accumulatedPath += accumulatedPath ? `/${part}` : part
      crumbs.push({ name: part, path: accumulatedPath })
    }

    return crumbs
  })

  /**
   * Extract folder path segments from a storage path.
   * Handles both legacy format ({id}/categories/{folder}/{file})
   * and new format ({userId}/{businessId}/{folder}/{file}).
   */
  function extractFolderPathFromStorage(
    storagePath: string,
    entityId: string
  ): string[] {
    // New format: {userId}/{businessId}/{folder}/{file}
    // Try to find entityId anywhere and extract folder after it
    const entityPrefix = `/${entityId}/`
    const entityIndex = storagePath.indexOf(entityPrefix)
    if (entityIndex >= 0) {
      const afterEntity = storagePath.substring(entityIndex + entityPrefix.length)
      // If it has /categories/ next, skip that
      const withoutCategories = afterEntity.startsWith('categories/')
        ? afterEntity.substring('categories/'.length)
        : afterEntity
      const parts = withoutCategories.split('/')
      parts.pop() // remove filename
      return parts.filter(Boolean)
    }

    // Legacy format: {entityId}/categories/{folder}/{file}
    const prefix = `${entityId}/categories/`
    if (storagePath.startsWith(prefix)) {
      const withoutPrefix = storagePath.substring(prefix.length)
      const parts = withoutPrefix.split('/')
      parts.pop()
      return parts.filter(Boolean)
    }

    // Fallback: search for /categories/ anywhere in the path
    const categoriesIndex = storagePath.indexOf('/categories/')
    if (categoriesIndex >= 0) {
      const withoutPrefix = storagePath.substring(categoriesIndex + '/categories/'.length)
      const parts = withoutPrefix.split('/')
      parts.pop()
      return parts.filter(Boolean)
    }

    return []
  }

  function getFolderPartsForImage(image: UploadedImage): string[] {
    const fromPath = extractFolderPathFromStorage(image.storage_path, mediaRootId.value)
    if (fromPath.length > 0) {
      if (fromPath.length === 1 && fromPath[0] === 'uncategorized') {
        return []
      }
      return fromPath
    }

    if (image.category && image.category !== 'uncategorized') {
      return image.category.split('/').filter(Boolean)
    }

    return []
  }

  function extractFilenameFromPath(storagePath: string): string {
    const parts = storagePath.split('/')
    return parts[parts.length - 1] || ''
  }

  function findFolderByPath(root: FolderNode, path: string): FolderNode | null {
    if (path === '/' || path === root.path) {
      return root
    }

    for (const child of root.children) {
      if (child.path === path) {
        return child
      }

      const found = findFolderByPath(child, path)
      if (found) {
        return found
      }
    }

    return null
  }

  function updateAllImageCounts(node: FolderNode): number {
    let count = node.images.length
    for (const child of node.children) {
      count += updateAllImageCounts(child)
    }
    node.imageCount = count
    return count
  }

  function sortFolderChildren(node: FolderNode): void {
    node.children.sort((a, b) => a.name.localeCompare(b.name))
    for (const child of node.children) {
      sortFolderChildren(child)
    }
  }

  function insertImageIntoTree(
    root: FolderNode,
    pathParts: string[],
    image: UploadedImage,
    depth: number
  ): void {
    if (depth >= pathParts.length) {
      root.images.push(image)
      return
    }

    const folderName = pathParts[depth]
    let child = root.children.find((c) => c.name === folderName)
    if (!child) {
      const childPath = pathParts.slice(0, depth + 1).join('/')
      child = {
        name: folderName,
        path: childPath,
        fullPath: childPath,
        children: [],
        images: [],
        imageCount: 0,
        isExpanded: false,
      }
      root.children.push(child)
    }

    insertImageIntoTree(child, pathParts, image, depth + 1)
  }

  function insertFolderIntoTree(
    node: FolderNode,
    pathParts: string[],
    depth: number
  ): void {
    if (depth >= pathParts.length) return

    const folderName = pathParts[depth]
    let child = node.children.find((c) => c.name === folderName)
    if (!child) {
      const childPath = pathParts.slice(0, depth + 1).join('/')
      child = {
        name: folderName,
        path: childPath,
        fullPath: childPath,
        children: [],
        images: [],
        imageCount: 0,
        isExpanded: false,
      }
      node.children.push(child)
    }

    insertFolderIntoTree(child, pathParts, depth + 1)
  }

  function buildFolderTree(imagesList: UploadedImage[], folders: string[] = []): FolderNode {
    // Deduplicate images by content fingerprint
    const uniqueImages = imagesList.filter((img, index, self) => {
      const folder = img.storage_path.split('/').slice(0, -1).join('/')
      const fingerprint = `${folder}|${img.file_size}|${img.width}x${img.height}`
      return self.findIndex(i => {
        const iFolder = i.storage_path.split('/').slice(0, -1).join('/')
        return `${iFolder}|${i.file_size}|${i.width}x${i.height}` === fingerprint
      }) === index
    })

    const root: FolderNode = {
      name: entity.value.name || 'All Images',
      path: '/',
      fullPath: '/',
      children: [],
      images: [],
      imageCount: 0,
      isExpanded: true,
    }

    for (const image of uniqueImages) {
      const pathParts = getFolderPartsForImage(image)
      const isUncategorized = pathParts.length === 1 && pathParts[0] === 'uncategorized'

      if (pathParts.length === 0 || isUncategorized) {
        root.images.push(image)
      } else {
        insertImageIntoTree(root, pathParts, image, 0)
      }
    }

    sortFolderChildren(root)

    // Insert virtual folders (empty)
    for (const folderPath of folders) {
      const pathParts = folderPath.split('/').filter(Boolean)
      if (pathParts.length > 0) {
        insertFolderIntoTree(root, pathParts, 0)
      }
    }

    sortFolderChildren(root)
    updateAllImageCounts(root)
    return root
  }

  function normalizeFolderPath(folderPath: string): string {
    return folderPath.replace(/^\/+|\/+$/g, '').trim()
  }

  function navigateToFolder(path: string): void {
    currentFolderPath.value = path
    selectedImageIds.value.clear()
  }

  function toggleFolderExpansion(folderPath: string): void {
    if (!folderStructure.value) return
    const folder = findFolderByPath(folderStructure.value, folderPath)
    if (folder) {
      folder.isExpanded = !folder.isExpanded
    }
  }

  function toggleImageSelection(imageId: string): void {
    if (selectedImageIds.value.has(imageId)) {
      selectedImageIds.value.delete(imageId)
    } else {
      selectedImageIds.value.add(imageId)
    }
  }

  function selectAll(): void {
    filteredImages.value.forEach((img) => selectedImageIds.value.add(img.id))
  }

  function deselectAll(): void {
    selectedImageIds.value.clear()
  }

  function toggleSelectAll(): void {
    if (allSelected.value) {
      deselectAll()
    } else {
      selectAll()
    }
  }

  function addVirtualFolder(folderPath: string) {
    const normalized = normalizeFolderPath(folderPath)
    if (!normalized) return
    if (!virtualFolders.value.includes(normalized)) {
      virtualFolders.value = [...virtualFolders.value, normalized]
    }
  }

  function removeVirtualFolder(folderPath: string) {
    const normalized = normalizeFolderPath(folderPath)
    if (!normalized) return
    virtualFolders.value = virtualFolders.value.filter(
      path => path !== normalized && !path.startsWith(`${normalized}/`)
    )
  }

  function renameVirtualFolder(oldPath: string, newPath: string) {
    const oldNorm = normalizeFolderPath(oldPath)
    const newNorm = normalizeFolderPath(newPath)
    if (!oldNorm || !newNorm) return

    virtualFolders.value = virtualFolders.value.map((path) => {
      if (path === oldNorm) return newNorm
      if (path.startsWith(`${oldNorm}/`)) {
        return `${newNorm}/${path.substring(oldNorm.length + 1)}`
      }
      return path
    })
  }

  async function refreshImages(): Promise<void> {
    try {
      loading.value = true
      const response = await businessService.getBusiness(businessId.value)
      if (response.success && response.data?.uploaded_images) {
        images.value = response.data.uploaded_images
        folderStructure.value = buildFolderTree(response.data.uploaded_images, virtualFolders.value)
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to refresh images'
    } finally {
      loading.value = false
    }
  }

  async function deleteImages(imageIds: string[]): Promise<boolean> {
    try {
      loading.value = true
      error.value = ''

      for (const imageId of imageIds) {
        await businessService.deleteBusinessImage(businessId.value, imageId)
      }

      images.value = images.value.filter((img) => !imageIds.includes(img.id))
      folderStructure.value = buildFolderTree(images.value, virtualFolders.value)
      selectedImageIds.value.clear()
      return true
    } catch (err: any) {
      error.value = err.message || 'Failed to delete images'
      return false
    } finally {
      loading.value = false
    }
  }

  async function createFolder(folderPath: string): Promise<boolean> {
    try {
      loading.value = true
      error.value = ''

      const success = await businessService.createFolder(businessId.value, folderPath)
      if (success) {
        addVirtualFolder(folderPath)
        folderStructure.value = buildFolderTree(images.value, virtualFolders.value)
      }
      return success
    } catch (err: any) {
      error.value = err.message || 'Failed to create folder'
      return false
    } finally {
      loading.value = false
    }
  }

  async function renameFolder(oldPath: string, newPath: string): Promise<boolean> {
    try {
      loading.value = true
      error.value = ''

      const updatedBusiness = await businessService.renameFolder(
        businessId.value,
        oldPath,
        newPath
      )

      if (updatedBusiness && updatedBusiness.uploaded_images) {
        images.value = updatedBusiness.uploaded_images
        renameVirtualFolder(oldPath, newPath)
        folderStructure.value = buildFolderTree(updatedBusiness.uploaded_images, virtualFolders.value)

        if (currentFolderPath.value.startsWith(oldPath)) {
          const relativePath = currentFolderPath.value.substring(oldPath.length)
          currentFolderPath.value = newPath + relativePath
        }

        return true
      }

      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to rename folder'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteFolder(folderPath: string): Promise<boolean> {
    try {
      loading.value = true
      error.value = ''

      const updatedBusiness = await businessService.deleteFolder(
        businessId.value,
        folderPath
      )

      if (updatedBusiness && updatedBusiness.uploaded_images !== undefined) {
        images.value = updatedBusiness.uploaded_images || []
        removeVirtualFolder(folderPath)
        folderStructure.value = buildFolderTree(updatedBusiness.uploaded_images || [], virtualFolders.value)

        if (currentFolderPath.value.startsWith(folderPath)) {
          currentFolderPath.value = '/'
        }

        selectedImageIds.value.clear()
        return true
      }

      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to delete folder'
      return false
    } finally {
      loading.value = false
    }
  }

  async function moveImagesToFolder(
    imageIds: string[],
    targetFolderPath: string
  ): Promise<boolean> {
    try {
      loading.value = true
      error.value = ''

      const updatedBusiness = await businessService.moveImages(
        businessId.value,
        imageIds,
        targetFolderPath
      )

      if (updatedBusiness && updatedBusiness.uploaded_images) {
        images.value = updatedBusiness.uploaded_images
        addVirtualFolder(targetFolderPath)
        folderStructure.value = buildFolderTree(updatedBusiness.uploaded_images, virtualFolders.value)

        selectedImageIds.value.clear()
        return true
      }

      return false
    } catch (err: any) {
      error.value = err.message || 'Failed to move images'
      return false
    } finally {
      loading.value = false
    }
  }

  function applyNewImages(newImages: UploadedImage[]) {
    images.value = [...images.value, ...newImages]
    folderStructure.value = buildFolderTree(images.value, virtualFolders.value)
  }

  return {
    images,
    folderStructure,
    currentFolderPath,
    currentFolder,
    selectedImageIds,
    viewMode,
    searchQuery,
    sortBy,
    sortOrder,
    loading,
    error,

    filteredImages,
    selectedImages,
    hasSelection,
    allSelected,
    breadcrumbs,

    navigateToFolder,
    toggleFolderExpansion,
    toggleImageSelection,
    selectAll,
    deselectAll,
    toggleSelectAll,
    refreshImages,
    deleteImages,
    createFolder,
    renameFolder,
    deleteFolder,
    moveImagesToFolder,
    applyNewImages
  }
}

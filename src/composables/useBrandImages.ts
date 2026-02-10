import { ref, computed } from 'vue'
import { brandService } from '@/services/brandService'
import type { BrandAsset, Brand } from '@/services/brandService'

export interface FolderNode {
  name: string
  path: string
  fullPath: string
  children: FolderNode[]
  images: BrandAsset[]
  imageCount: number
  isExpanded: boolean
}

export type ViewMode = 'grid' | 'list' | 'timeline'
export type SortBy = 'name' | 'date' | 'size'
export type SortOrder = 'asc' | 'desc'

export function useBrandImages(brand: Brand) {
  // Use place_id for API calls (fallback to id for manual brands)
  const brandId = computed(() => brand.place_id || brand.id)

  // State
  const images = ref<BrandAsset[]>([])
  const folderStructure = ref<FolderNode | null>(null)
  const currentFolderPath = ref<string>('/')
  const selectedImageIds = ref<Set<string>>(new Set())
  const viewMode = ref<ViewMode>('grid')
  const searchQuery = ref<string>('')
  const sortBy = ref<SortBy>('date')
  const sortOrder = ref<SortOrder>('desc')
  const loading = ref<boolean>(false)
  const error = ref<string>('')

  // Fetch assets from API
  async function fetchAssets(): Promise<void> {
    try {
      loading.value = true
      error.value = ''
      const assets = await brandService.getAssets(brandId.value)
      images.value = assets
      folderStructure.value = buildFolderTree(assets)
    } catch (err: any) {
      error.value = err.message || 'Failed to load images'
    } finally {
      loading.value = false
    }
  }

  // Fetch immediately on creation
  fetchAssets()

  // Computed: Current folder node
  const currentFolder = computed<FolderNode | null>(() => {
    if (!folderStructure.value) return null
    if (currentFolderPath.value === '/') return folderStructure.value
    return findFolderByPath(folderStructure.value, currentFolderPath.value)
  })

  // Computed: Filtered images based on current folder, search, and sort
  const filteredImages = computed<BrandAsset[]>(() => {
    let result: BrandAsset[] = []

    if (currentFolder.value) {
      // Get images in current folder (non-recursive)
      result = currentFolder.value.images
    } else {
      // Fallback to all images
      result = images.value
    }

    // Apply search filter
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter((img) => {
        const filename = extractFilenameFromPath(img.storage_path || '').toLowerCase()
        const folder = (img.folder || '').toLowerCase()
        return filename.includes(query) || folder.includes(query)
      })
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0

      switch (sortBy.value) {
        case 'name': {
          const nameA = extractFilenameFromPath(a.storage_path || '')
          const nameB = extractFilenameFromPath(b.storage_path || '')
          comparison = nameA.localeCompare(nameB)
          break
        }
        case 'date': {
          const dateA = new Date(a.created_at).getTime()
          const dateB = new Date(b.created_at).getTime()
          comparison = dateA - dateB
          break
        }
        case 'size': {
          comparison = (a.file_size ?? 0) - (b.file_size ?? 0)
          break
        }
      }

      return sortOrder.value === 'asc' ? comparison : -comparison
    })

    return result
  })

  // Computed: Selection state
  const selectedImages = computed<BrandAsset[]>(() => {
    return filteredImages.value.filter((img) => selectedImageIds.value.has(img.id))
  })

  const hasSelection = computed<boolean>(() => selectedImageIds.value.size > 0)

  const allSelected = computed<boolean>(() => {
    if (!filteredImages.value.length) return false
    return filteredImages.value.every((img) => selectedImageIds.value.has(img.id))
  })

  // Computed: Breadcrumb path
  const breadcrumbs = computed<Array<{ name: string; path: string }>>(() => {
    const rootName = brand.name || 'All Images'

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

  // Helper: Extract filename from storage_path
  function extractFilenameFromPath(storagePath: string): string {
    const parts = storagePath.split('/')
    return parts[parts.length - 1] || ''
  }

  // Helper: Find folder node by path
  function findFolderByPath(root: FolderNode, path: string): FolderNode | null {
    if (path === '/' || path === root.path) {
      return root
    }

    for (const child of root.children) {
      if (child.path === path) {
        return child
      }

      // Search recursively
      const found = findFolderByPath(child, path)
      if (found) {
        return found
      }
    }

    return null
  }

  // Helper: Count images recursively
  function countImagesRecursive(node: FolderNode): number {
    let count = node.images.length
    for (const child of node.children) {
      count += countImagesRecursive(child)
    }
    return count
  }

  // Helper: Insert image into tree at a given folder path
  function insertImageIntoTree(
    node: FolderNode,
    pathParts: string[],
    image: BrandAsset,
    depth: number
  ): void {
    if (depth >= pathParts.length) {
      // Reached leaf - add image to this folder
      node.images.push(image)
      return
    }

    const folderName = pathParts[depth]

    // Find or create child folder
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
        isExpanded: false
      }
      node.children.push(child)
    }

    // Recurse
    insertImageIntoTree(child, pathParts, image, depth + 1)

    // Update counts
    child.imageCount = countImagesRecursive(child)
  }

  // Build folder tree from flat image list using the `folder` DB column
  function buildFolderTree(imageList: BrandAsset[]): FolderNode {
    const root: FolderNode = {
      name: brand.name || 'All Images',
      path: '/',
      fullPath: '/',
      children: [],
      images: [],
      imageCount: imageList.length,
      isExpanded: true
    }

    for (const image of imageList) {
      const folder = image.folder?.trim()

      if (!folder) {
        // Image at root level (no folder assigned)
        root.images.push(image)
      } else {
        // Split folder path (supports nested folders like "menu/burgers")
        const pathParts = folder.split('/').filter(Boolean)
        insertImageIntoTree(root, pathParts, image, 0)
      }
    }

    // Sort children alphabetically
    sortFolderChildren(root)

    return root
  }

  // Helper: Sort folder children recursively
  function sortFolderChildren(node: FolderNode): void {
    node.children.sort((a, b) => a.name.localeCompare(b.name))
    for (const child of node.children) {
      sortFolderChildren(child)
    }
  }

  // Navigate to folder
  function navigateToFolder(path: string): void {
    currentFolderPath.value = path
    selectedImageIds.value.clear()
  }

  // Toggle folder expansion
  function toggleFolderExpansion(path: string): void {
    const folder = findFolderByPath(folderStructure.value!, path)
    if (folder) {
      folder.isExpanded = !folder.isExpanded
    }
  }

  // Selection methods
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

  // Delete images
  async function deleteImages(imageIds: string[]): Promise<void> {
    for (const imageId of imageIds) {
      await brandService.deleteBrandImage(brandId.value, imageId)
    }
    selectedImageIds.value.clear()
  }

  // Create folder
  async function createFolder(folderPath: string): Promise<boolean> {
    try {
      loading.value = true
      error.value = ''

      const result = await brandService.createFolder(brandId.value, folderPath)
      return result.success
    } catch (err: any) {
      error.value = err.message || 'Failed to create folder'
      return false
    } finally {
      loading.value = false
    }
  }

  // Rename folder
  async function renameFolder(oldPath: string, newPath: string): Promise<boolean> {
    try {
      loading.value = true
      error.value = ''

      const result = await brandService.renameFolder(
        brandId.value,
        oldPath,
        newPath
      )

      if (result.success) {
        // Update current folder path if we were in the renamed folder
        if (currentFolderPath.value.startsWith(oldPath)) {
          const relativePath = currentFolderPath.value.substring(oldPath.length)
          currentFolderPath.value = newPath + relativePath
        }
      }

      return result.success
    } catch (err: any) {
      error.value = err.message || 'Failed to rename folder'
      return false
    } finally {
      loading.value = false
    }
  }

  // Delete folder
  async function deleteFolder(folderPath: string): Promise<boolean> {
    try {
      loading.value = true
      error.value = ''

      const result = await brandService.deleteFolder(
        brandId.value,
        folderPath
      )

      if (result.success) {
        // Navigate to root if we were in the deleted folder
        if (currentFolderPath.value.startsWith(folderPath)) {
          currentFolderPath.value = '/'
        }
        selectedImageIds.value.clear()
      }

      return result.success
    } catch (err: any) {
      error.value = err.message || 'Failed to delete folder'
      return false
    } finally {
      loading.value = false
    }
  }

  // Move images to folder
  async function moveImagesToFolder(
    imageIds: string[],
    targetFolderPath: string
  ): Promise<boolean> {
    try {
      loading.value = true
      error.value = ''

      const result = await brandService.moveImages(
        brandId.value,
        imageIds,
        targetFolderPath
      )

      if (result.success) {
        selectedImageIds.value.clear()
      }

      return result.success
    } catch (err: any) {
      error.value = err.message || 'Failed to move images'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State
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

    // Computed
    filteredImages,
    selectedImages,
    hasSelection,
    allSelected,
    breadcrumbs,

    // Methods
    fetchAssets,
    navigateToFolder,
    toggleFolderExpansion,
    toggleImageSelection,
    selectAll,
    deselectAll,
    toggleSelectAll,
    deleteImages,
    createFolder,
    renameFolder,
    deleteFolder,
    moveImagesToFolder
  }
}

import { ref, computed, watch } from 'vue'
import { restaurantService } from '@/services/restaurantService'
import type { UploadedImage, SavedRestaurant } from '@/services/restaurantService'

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

export function useRestaurantImages(restaurant: SavedRestaurant) {
  // Use place_id for API calls (fallback to id for manual restaurants)
  const restaurantId = computed(() => restaurant.place_id || restaurant.id)

  // State
  const images = ref<UploadedImage[]>([])
  const folderStructure = ref<FolderNode | null>(null)
  const currentFolderPath = ref<string>('/')
  const selectedImageIds = ref<Set<string>>(new Set())
  const viewMode = ref<ViewMode>('grid')
  const searchQuery = ref<string>('')
  const sortBy = ref<SortBy>('date')
  const sortOrder = ref<SortOrder>('desc')
  const loading = ref<boolean>(false)
  const error = ref<string>('')

  // Watch for restaurant changes
  watch(
    () => restaurant.uploaded_images,
    (newImages) => {
      if (newImages) {
        images.value = newImages
        folderStructure.value = buildFolderTree(newImages)
      }
    },
    { immediate: true }
  )

  // Computed: Current folder node
  const currentFolder = computed<FolderNode | null>(() => {
    if (!folderStructure.value) return null
    if (currentFolderPath.value === '/') return folderStructure.value
    return findFolderByPath(folderStructure.value, currentFolderPath.value)
  })

  // Computed: Filtered images based on current folder, search, and sort
  const filteredImages = computed<UploadedImage[]>(() => {
    let result: UploadedImage[] = []

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
        const filename = extractFilenameFromPath(img.storage_path).toLowerCase()
        const folderPath = extractFolderPathFromStorage(
          img.storage_path,
          restaurantId.value
        ).join('/').toLowerCase()
        return filename.includes(query) || folderPath.includes(query)
      })
    }

    // Apply sorting
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

  // Computed: Selection state
  const selectedImages = computed<UploadedImage[]>(() => {
    return filteredImages.value.filter((img) => selectedImageIds.value.has(img.id))
  })

  const hasSelection = computed<boolean>(() => selectedImageIds.value.size > 0)

  const allSelected = computed<boolean>(() => {
    if (!filteredImages.value.length) return false
    return filteredImages.value.every((img) => selectedImageIds.value.has(img.id))
  })

  // Computed: Breadcrumb path
  const breadcrumbs = computed<Array<{ name: string; path: string }>>(() => {
    const rootName = restaurant.name || 'All Images'

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

  // Helper: Extract folder path array from storage_path
  function extractFolderPathFromStorage(
    storagePath: string,
    restId: string
  ): string[] {
    // Storage path format: "restaurantId/categories/menu/burgers/img.jpg"
    // We want: ["menu", "burgers"]
    const prefix = `${restId}/categories/`
    if (!storagePath.startsWith(prefix)) {
      // Handle legacy category field
      return []
    }

    const withoutPrefix = storagePath.substring(prefix.length)
    const parts = withoutPrefix.split('/')

    // Remove the filename (last part)
    parts.pop()

    return parts.filter(Boolean)
  }

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

  // Helper: Insert image into tree
  function insertImageIntoTree(
    node: FolderNode,
    pathParts: string[],
    image: UploadedImage,
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
        fullPath: `${restaurantId.value}/categories/${childPath}`,
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

  // Build folder tree from flat image list
  function buildFolderTree(imageList: UploadedImage[]): FolderNode {
    const root: FolderNode = {
      name: restaurant.name || 'All Images',
      path: '/',
      fullPath: `${restaurantId.value}/categories/`,
      children: [],
      images: [],
      imageCount: imageList.length,
      isExpanded: true
    }

    for (const image of imageList) {
      const pathParts = extractFolderPathFromStorage(image.storage_path, restaurantId.value)

      if (pathParts.length === 0) {
        // Image at root level
        root.images.push(image)
      } else {
        // Image in subfolder
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
      await restaurantService.deleteRestaurantImage(restaurantId.value, imageId)
    }
    selectedImageIds.value.clear()
  }

  // Create folder
  async function createFolder(folderPath: string): Promise<boolean> {
    try {
      loading.value = true
      error.value = ''

      const success = await restaurantService.createFolder(restaurantId.value, folderPath)

      if (success) {
        // Folder is virtual - no need to update anything
        // It will appear when images are uploaded to it
      }

      return success
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

      const updatedRestaurant = await restaurantService.renameFolder(
        restaurantId.value,
        oldPath,
        newPath
      )

      if (updatedRestaurant && updatedRestaurant.uploaded_images) {
        // Update local state with new paths
        images.value = updatedRestaurant.uploaded_images
        folderStructure.value = buildFolderTree(updatedRestaurant.uploaded_images)

        // Update current folder path if we were in the renamed folder
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

  // Delete folder
  async function deleteFolder(folderPath: string): Promise<boolean> {
    try {
      loading.value = true
      error.value = ''

      const updatedRestaurant = await restaurantService.deleteFolder(
        restaurantId.value,
        folderPath
      )

      if (updatedRestaurant && updatedRestaurant.uploaded_images !== undefined) {
        // Update local state
        images.value = updatedRestaurant.uploaded_images || []
        folderStructure.value = buildFolderTree(updatedRestaurant.uploaded_images || [])

        // Navigate to root if we were in the deleted folder
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

  // Move images to folder
  async function moveImagesToFolder(
    imageIds: string[],
    targetFolderPath: string
  ): Promise<boolean> {
    try {
      loading.value = true
      error.value = ''

      const updatedRestaurant = await restaurantService.moveImages(
        restaurantId.value,
        imageIds,
        targetFolderPath
      )

      if (updatedRestaurant && updatedRestaurant.uploaded_images) {
        // Update local state with new paths
        images.value = updatedRestaurant.uploaded_images
        folderStructure.value = buildFolderTree(updatedRestaurant.uploaded_images)

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

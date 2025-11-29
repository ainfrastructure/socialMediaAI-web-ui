// Stub Wolt service - TODO: implement full functionality

export const woltService = {
  async isConnected(): Promise<boolean> {
    // Check localStorage for now
    return localStorage.getItem('wolt_connected') === 'true'
  },

  async initiateOAuth(): Promise<void> {
    // TODO: Implement Wolt OAuth
    console.log('Wolt OAuth not yet implemented')
    throw new Error('Wolt integration coming soon')
  },

  async disconnect(): Promise<void> {
    localStorage.removeItem('wolt_connected')
  },

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Wolt integration not yet implemented' }
  }
}

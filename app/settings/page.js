'use client'

import { AuthProvider, AuthGuard } from '@/components/AuthComponents'
import { UserSettings } from '@/components/UserSettings'

const SettingsPage = () => {
  return (
    <AuthProvider>
      <AuthGuard>
        <UserSettings />
      </AuthGuard>
    </AuthProvider>
  )
}

export default SettingsPage
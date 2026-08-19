import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../Store/useAuthStore'

export default function useProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  const toggleOpen = () => setIsOpen((current) => !current)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  const handleLogout = () => {
    logout()
    close()
    navigate('/login', { replace: true })
  }

  return {
    isOpen,
    toggleOpen,
    open,
    close,
    handleLogout,
  }
}
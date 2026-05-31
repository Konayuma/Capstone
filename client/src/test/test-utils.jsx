import React from 'react'
import { MemoryRouter } from 'react-router-dom'

const MockAuthContext = React.createContext(null)

export const mockUser = {
  id: 1,
  name: 'Test Student',
  email: 'test@example.com',
  role: 'student',
}

export const MockAuthProvider = ({ children, user = mockUser, loading = false }) => {
  return (
    <MockAuthContext.Provider value={{ user, loading, logout: () => {} }}>
      {children}
    </MockAuthContext.Provider>
  )
}

export const useMockAuth = () => React.useContext(MockAuthContext)

export function renderWithProviders(ui, {
  user = mockUser,
  loading = false,
  initialEntries = ['/'],
} = {}) {
  const mockAuthValue = { user, loading, logout: () => {} }

  const Wrapper = ({ children }) => (
    <MockAuthContext.Provider value={mockAuthValue}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </MockAuthContext.Provider>
  )

  return {
    ...globalThis.__vitest_require__ ? {} : {},
    wrapper: Wrapper,
  }
}

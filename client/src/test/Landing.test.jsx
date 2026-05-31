import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
  AuthProvider: ({ children }) => <>{children}</>,
}))

import Landing from '../pages/Landing'

describe('Landing', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the landing page heading', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    )
    const els = screen.getAllByText(/Capstone Studio/i)
    expect(els.length).toBeGreaterThanOrEqual(1)
  })

  it('renders feature cards', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    )
    expect(screen.getByText(/Requirements that can survive review/i)).toBeInTheDocument()
    expect(screen.getByText(/Team evidence in one place/i)).toBeInTheDocument()
    expect(screen.getByText(/Viva practice before panic/i)).toBeInTheDocument()
  })

  it('renders Get Started button for unauthenticated users', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    )
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })
})

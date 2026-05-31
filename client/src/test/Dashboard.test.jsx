import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'

vi.mock('axios')

const mockUser = {
  id: 1,
  name: 'Test Student',
  email: 'test@example.com',
  role: 'student',
}

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, loading: false, logout: () => {} }),
  AuthProvider: ({ children }) => <>{children}</>,
}))

import Dashboard from '../pages/Dashboard'

const mockProjects = [
  {
    id: 1,
    title: 'Capstone Project Alpha',
    description: 'A test project for capstone',
    status: 'active',
    category: 'ML',
    department: 'CS',
    academicYear: '2025/2026',
    _count: { requirements: 3, tasks: 5 },
  },
  {
    id: 2,
    title: 'Finished Project',
    description: 'A completed project',
    status: 'completed',
    category: 'Web',
    department: 'CS',
    academicYear: '2025/2026',
    _count: { requirements: 5, tasks: 10 },
  },
]

describe('Dashboard', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockProjects })
  })

  it('renders the board header', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    expect(await screen.findByText('Studio Board')).toBeInTheDocument()
  })

  it('shows the user name in the profile button', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    const names = await screen.findAllByText(mockUser.name)
    expect(names.length).toBe(2)
  })

  it('shows project tiles after loading', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    expect(await screen.findByText('Capstone Project Alpha')).toBeInTheDocument()
    expect(await screen.findByText('Finished Project')).toBeInTheDocument()
  })

  it('shows the New Project button for students', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    expect(await screen.findByText('New Project')).toBeInTheDocument()
  })

  it('shows the invite code input', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )
    expect(await screen.findByPlaceholderText('CAP-1234-ABCD')).toBeInTheDocument()
  })
})

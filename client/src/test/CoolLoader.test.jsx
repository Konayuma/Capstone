import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import CoolLoader from '../components/CoolLoader'

describe('CoolLoader', () => {
  it('renders default title and subtitle', () => {
    render(<CoolLoader />)
    expect(screen.getByText('Loading your workspace')).toBeInTheDocument()
    expect(screen.getByText(/Pulling together project details/)).toBeInTheDocument()
  })

  it('renders custom title and subtitle', () => {
    render(<CoolLoader title="Custom Title" subtitle="Custom subtitle text" />)
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom subtitle text')).toBeInTheDocument()
  })

  it('applies compact class when compact prop is true', () => {
    const { container } = render(<CoolLoader compact />)
    expect(container.querySelector('.cool-loader-shell').classList.contains('compact')).toBe(true)
  })

  it('has aria-live polite and aria-busy true', () => {
    render(<CoolLoader />)
    const section = screen.getByRole('heading', { level: 2 }).closest('section')
    expect(section).toHaveAttribute('aria-live', 'polite')
    expect(section).toHaveAttribute('aria-busy', 'true')
  })
})

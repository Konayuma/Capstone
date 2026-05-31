import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Tooltip } from '../components/Tooltip'

describe('Tooltip', () => {
  it('renders children', () => {
    render(
      <Tooltip text="Help text">
        <button>Hover me</button>
      </Tooltip>
    )
    expect(screen.getByText('Hover me')).toBeInTheDocument()
  })

  it('shows tooltip text on hover', async () => {
    render(
      <Tooltip text="This is helpful">
        <button>Hover me</button>
      </Tooltip>
    )
    const trigger = screen.getByText('Hover me').closest('.tooltip-trigger')
    fireEvent.mouseEnter(trigger)
    expect(await screen.findByText('This is helpful')).toBeInTheDocument()
  })

  it('shows persistent tooltip without hover', () => {
    render(
      <Tooltip text="Persistent tip" persistent>
        <button>Persistent</button>
      </Tooltip>
    )
    expect(screen.getByText('Persistent tip')).toBeInTheDocument()
  })
})

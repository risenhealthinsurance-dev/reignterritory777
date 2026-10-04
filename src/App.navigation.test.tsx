import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { test, expect, vi } from 'vitest'
import { renderApp } from './test/renderApp'

vi.mock('./components/MapView', () => ({
  MapView: () => <div aria-label="Map preview" />,
}))

test('opens on kickoff and starts the route', async () => {
  const user = userEvent.setup()
  renderApp()

  expect(screen.getByText(/GOOD MORNING · FIELD AI READY/i)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /Resume Route|Start Today's Route/i }))

  expect(screen.getByText(/ROUTE ACTIVE · 34950 · A1/i)).toBeInTheDocument()
})

test('moves from territory through A1 to the route', async () => {
  const user = userEvent.setup()
  renderApp({ initialScreen: 'territory' })

  await user.click(screen.getByRole('button', { name: /^A1/i }))
  await user.click(screen.getByRole('button', { name: /Plan .* route/i }))
  await user.click(screen.getByRole('button', { name: /Start .* loop/i }))
  await user.click(screen.getByRole('button', { name: /Prioritize Solano/i }))
  await user.click(screen.getByRole('button', { name: /Start .* loop/i }))

  expect(screen.getByText(/ROUTE ACTIVE · 34950 · A1/i)).toBeInTheDocument()
})

test('recovers invalid account selections to the route', () => {
  renderApp({ initialScreen: 'stop', initialAccountId: 'missing-account' })

  expect(screen.getByText(/ROUTE ACTIVE · 34950 · A1/i)).toBeInTheDocument()
})

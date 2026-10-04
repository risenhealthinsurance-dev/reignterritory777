import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { accounts } from '../data/accounts'

const mapConstructor = vi.fn(() => ({
  on: vi.fn(),
  remove: vi.fn(),
  resize: vi.fn(),
  isStyleLoaded: vi.fn(() => false),
}))

vi.mock('mapbox-gl', () => ({
  default: {
    Map: mapConstructor,
    Marker: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      getElement: vi.fn(() => document.createElement('div')),
    })),
    accessToken: '',
  },
}))

beforeEach(() => {
  mapConstructor.mockClear()
  vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', '')
})

test('renders a usable fallback when no Mapbox token is configured', async () => {
  const onPinTap = vi.fn()
  const { MapView } = await import('./MapView')
  render(
    <MapView
      height={340}
      accounts={accounts}
      activeAccountId={null}
      doneAccountIds={['meridian']}
      onPinTap={onPinTap}
    />,
  )

  expect(screen.getByLabelText('Route map fallback')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /Apex Manufacturing/i }))
  expect(onPinTap).toHaveBeenCalledWith('apex')
  expect(mapConstructor).not.toHaveBeenCalled()
})

test('shows territory context in the fallback', async () => {
  const { MapView } = await import('./MapView')
  render(
    <MapView
      height={340}
      accounts={accounts}
      activeAccountId={null}
      doneAccountIds={[]}
      onPinTap={() => undefined}
      showTerritoryMode
    />,
  )

  expect(screen.getByLabelText('Territory map fallback')).toHaveTextContent('A1 ACTIVE')
})

test('constructs the interactive route map when a token is configured', async () => {
  vi.resetModules()
  vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', 'test-public-token')
  const { MapView } = await import('./MapView')

  render(
    <MapView
      height={340}
      accounts={accounts}
      activeAccountId="apex"
      doneAccountIds={[]}
      onPinTap={() => undefined}
    />,
  )

  await waitFor(() => expect(mapConstructor).toHaveBeenCalled())
  expect(mapConstructor.mock.calls[0]?.[0]).toMatchObject({
    center: [-118.4004, 34.0736],
    zoom: 13.8,
    pitch: 45,
    bearing: -10,
  })
})

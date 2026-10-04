import { render } from '@testing-library/react'
import type { AppScreen } from '../types'
import App from '../App'

export interface AppInitialState {
  initialScreen?: AppScreen
  initialAccountId?: string | null
}

export function renderApp(initialState: AppInitialState = {}) {
  return render(<App {...initialState} />)
}


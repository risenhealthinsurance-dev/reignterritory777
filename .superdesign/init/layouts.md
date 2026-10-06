# Layouts

## App shell

`src/App.tsx` composes the active screen and shared bottom navigation. The app is a centered mobile field surface on desktop and a full-width layout on mobile.

## Bottom navigation

`src/components/BottomNav.tsx` provides the primary Territory, Route, Field AI, and Summary navigation groups.

## Screen chrome

Individual screens own their headers and contextual back actions. There is no separate global sidebar.


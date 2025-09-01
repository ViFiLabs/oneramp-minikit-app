# Wallet Connect Modal Responsive Updates

## Summary
Updated the wallet connect modals to display as a centered modal on desktop devices while maintaining the pull-up bottom sheet behavior on mobile devices.

## Changes Made

### 1. ModalConnectButton Component (`components/modal-connect-button.tsx`)
- **Changed**: Updated modal layout to be responsive
- **Mobile**: Maintains bottom sheet behavior with pull indicator
- **Desktop**: Now displays as centered modal with backdrop blur
- **Added**: Desktop-specific close button (hidden on mobile)
- **Added**: Proper backdrop blur effect for desktop (`bg-black/60 backdrop-blur-lg`)
- **Added**: Accessibility improvements with `VisuallyHidden` title

### 2. ConnectButton Component (`components/connect-button.tsx`) 
- **Changed**: Updated modal layout to be responsive for consistency
- **Mobile**: Maintains full-screen behavior for backwards compatibility
- **Desktop**: Now displays as centered modal
- **Added**: Responsive classes for better desktop experience

## Technical Implementation
- Used `DialogPortal`, `DialogOverlay`, and `DialogPrimitive.Content` for better control
- Applied Tailwind responsive classes (`md:` prefix for desktop breakpoint)
- Utilized existing `desktop-modal-center` CSS class from `globals.css`
- Added proper backdrop blur and dark overlay for desktop

## Breakpoint
- Mobile: `< 768px` (default styles)
- Desktop: `>= 768px` (md: breakpoint and above)

## Features
- **Mobile**: Bottom sheet with pull indicator
- **Desktop**: Centered modal with backdrop blur and close button
- **Responsive**: Seamlessly adapts between mobile and desktop layouts
- **Accessibility**: Proper focus management and screen reader support
- **Consistent**: Matches existing modal patterns in the codebase

## Files Modified
1. `/components/modal-connect-button.tsx` - Primary mobile connect button
2. `/components/connect-button.tsx` - Header connect button for desktop

The changes ensure a consistent user experience across devices while following established design patterns in the application.

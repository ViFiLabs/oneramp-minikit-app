# Responsive Modal Updates Summary

## Summary

Updated multiple modals in the OneRamp application to display as centered modals on desktop devices while maintaining the pull-up bottom sheet behavior on mobile devices.

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

### 3. WithdrawalStatusCard Component (`app/components/cards/withdrawal-status-card.tsx`)

- **Changed**: Updated modal layout to be responsive
- **Mobile**: Maintains bottom sheet behavior with pull indicator and drag functionality
- **Desktop**: Now displays as centered modal with disabled drag functionality
- **Added**: Desktop-specific backdrop blur effect
- **Added**: Conditional drag handlers (only enabled on mobile devices < 768px)
- **Fixed**: Desktop animation uses scale/opacity instead of translate for proper centering

### 4. BuyStatusCard Component (`app/components/cards/buy-status-card.tsx`)

- **Changed**: Updated modal layout to be responsive
- **Mobile**: Maintains bottom sheet behavior with pull indicator and drag functionality  
- **Desktop**: Now displays as centered modal with disabled drag functionality
- **Added**: Desktop-specific backdrop blur effect
- **Added**: Conditional drag handlers (only enabled on mobile devices < 768px)
- **Fixed**: Desktop animation uses scale/opacity instead of translate for proper centering

## Technical Implementation

- Used `DialogPortal`, `DialogOverlay`, and `DialogPrimitive.Content` for better control
- Applied Tailwind responsive classes (`md:` prefix for desktop breakpoint)
- Utilized existing `desktop-modal-center` CSS class from `globals.css`
- Added proper backdrop blur and dark overlay for desktop
- Implemented conditional drag functionality based on screen width

## Breakpoint

- Mobile: `< 768px` (default styles)
- Desktop: `>= 768px` (md: breakpoint and above)

## Features

- **Mobile Experience**: Bottom sheet with pull indicator and drag-to-dismiss functionality
- **Desktop Experience**: Clean centered modal with backdrop blur and close button
- **Responsive Design**: Seamlessly adapts between mobile and desktop layouts
- **Accessibility**: Proper focus management and screen reader support
- **Consistent**: Follows established design patterns in the application
- **Smart Drag Handling**: Drag functionality automatically disabled on desktop to prevent conflicts

## Files Modified

1. `/components/modal-connect-button.tsx` - Primary mobile connect button
2. `/components/connect-button.tsx` - Header connect button for desktop
3. `/app/components/cards/withdrawal-status-card.tsx` - Transaction status modal for withdrawals
4. `/app/components/cards/buy-status-card.tsx` - Transaction status modal for purchases

The changes ensure a consistent user experience across devices while following established design patterns in the application. All transaction status modals and wallet connection modals now provide optimal UX for both mobile and desktop users.

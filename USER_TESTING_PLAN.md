# OneRamp User Testing Plan
## Comprehensive UX & Bug Testing Guide

### Application Overview
OneRamp is a crypto-to-fiat on-ramp application for Africa with the tagline "Spend Crypto in Africa - Anytime, Anywhere". The app operates as a MiniKit within Farcaster frames and supports three main functions:
- **Pay**: Pay bills using crypto
- **Withdraw**: Convert crypto to fiat for local payment methods  
- **Deposit**: Buy crypto with fiat currency

---

## 1. Pre-Testing Setup & Environment

### 1.1 Testing Environments
- [ ] **Desktop browsers**: Chrome, Safari, Firefox, Edge
- [ ] **Mobile devices**: iOS Safari, Android Chrome, various screen sizes
- [ ] **Network conditions**: Fast WiFi, slow 3G, offline scenarios
- [ ] **Different countries**: Test geo-location detection and country-specific features

### 1.2 Test Data Requirements
- [ ] Valid EVM wallet addresses and private keys (testnet)
- [ ] Test account numbers for different countries and institutions
- [ ] Mock KYC verification credentials
- [ ] Various cryptocurrency amounts (small, medium, large values)

---

## 2. Core User Flow Testing

### 2.1 Initial App Load & Onboarding
**Critical UX Elements to Test:**

- [ ] **Hero animation timing**: Verify smooth entrance of "Spend Crypto in Africa" text
- [ ] **Tab visibility**: Ensure Pay/Withdraw/Deposit tabs are clearly visible
- [ ] **Responsive layout**: Test on various screen sizes (mobile, tablet, desktop)
- [ ] **Loading states**: Check skeleton loading during app initialization
- [ ] **MiniKit integration**: Verify proper loading within Farcaster frame

**Bugs to Look For:**
- [ ] Hero text animation glitches or awkward timing
- [ ] Tab overlap or misalignment on different screen sizes
- [ ] White flash or layout shift during initial load
- [ ] Missing assets (logos, icons) causing broken UI

### 2.2 Tab Switching (Pay/Withdraw/Deposit)
**UX Testing Points:**

- [ ] **State persistence**: Switching tabs should clear form data appropriately
- [ ] **Visual feedback**: Active tab should be clearly highlighted
- [ ] **Animation smoothness**: Tab transitions should be fluid
- [ ] **Default selections**: Verify correct defaults for each tab

**Bugs to Look For:**
- [ ] Data bleeding between tabs (country selection carrying over incorrectly)
- [ ] Tab content not updating properly after switch
- [ ] Animation stuttering or incomplete transitions
- [ ] Tab states getting stuck or unresponsive

---

## 3. Wallet Connection Testing

### 3.1 Wallet Integration Flow
**Test Scenarios:**

- [ ] **No wallet installed**: Should show appropriate messaging
- [ ] **Multiple wallets available**: Should present clear selection options
- [ ] **Wallet rejection**: User declines connection request
- [ ] **Network switching**: App requests correct network (Base, Celo, etc.)
- [ ] **Account switching**: Changing accounts in wallet updates app state

**UX Points:**
- [ ] Clear wallet connection instructions
- [ ] Progress indication during connection process
- [ ] Proper error messaging for failed connections
- [ ] Visual confirmation of successful connection

**Critical Bugs:**
- [ ] App freezing during wallet connection
- [ ] Incorrect network detection
- [ ] Address not updating after account switch
- [ ] KYC data not clearing when address changes
- [ ] Connection state inconsistencies

### 3.2 Multi-Network Support
**Test Networks:**
- [ ] Base (primary network)
- [ ] Celo
- [ ] Ethereum Mainnet
- [ ] Polygon

**Validation Points:**
- [ ] Correct token balances displayed for each network
- [ ] Exchange rates accurate for selected network
- [ ] Transaction fees appropriate for network
- [ ] Block explorer links functional

---

## 4. Country & Currency Selection

### 4.1 Country Selection Modal
**Countries to Test:**
- [ ] **Kenya** (full feature set)
- [ ] **Uganda** (limited to "Send Money" payments)
- [ ] **Nigeria** (bank vs mobile money options)
- [ ] **Tanzania**
- [ ] **Ghana**
- [ ] **South Africa**
- [ ] **Zambia**

**UX Testing:**
- [ ] Country search functionality
- [ ] Flag and currency display accuracy
- [ ] Smooth modal animations
- [ ] Clear selection confirmation

**Bugs to Watch:**
- [ ] Country modal not opening/closing properly
- [ ] Search not working or showing incorrect results
- [ ] Currency symbols not displaying correctly
- [ ] Selection not persisting after modal close

### 4.2 Country-Specific Features
**Uganda-Specific Testing:**
- [ ] Only "Send Money" option available in Pay tab
- [ ] Other payment types properly disabled
- [ ] Clear messaging about limited options

**Nigeria-Specific Testing:**
- [ ] BVN and NIN handling in KYC flow
- [ ] Bank vs mobile money institution filtering
- [ ] Account number validation (10 digits for banks)

---

## 5. Amount Input & Validation

### 5.1 Amount Input Fields
**Input Validation:**
- [ ] **Decimal precision**: Maximum 2-4 decimal places
- [ ] **Minimum amounts**: Respect country-specific minimums
- [ ] **Maximum amounts**: Respect country-specific maximums
- [ ] **Balance validation**: Cannot exceed wallet balance
- [ ] **Real-time formatting**: Proper comma separation for large numbers

**UX Elements:**
- [ ] Clear error messages for invalid amounts
- [ ] Dynamic font sizing for long numbers
- [ ] Balance display accuracy
- [ ] Exchange rate updates in real-time

**Common Bugs:**
- [ ] Decimal input causing app crashes
- [ ] Copy-paste breaking number formatting
- [ ] Validation errors not clearing properly
- [ ] Exchange rate calculations incorrect
- [ ] Balance loading states showing incorrect values

### 5.2 Exchange Rate Display
**Testing Points:**
- [ ] **Rate accuracy**: Compare with external sources
- [ ] **Update frequency**: Rates should refresh appropriately
- [ ] **Loading states**: Show skeleton while fetching
- [ ] **Error handling**: Fallback rates when API fails
- [ ] **Currency formatting**: Proper symbols and decimal places

---

## 6. Institution & Account Details

### 6.1 Institution Selection
**Test Different Institution Types:**
- [ ] **Banks**: Account number validation
- [ ] **Mobile Money**: Phone number validation
- [ ] **Mixed institutions**: Proper categorization

**UX Testing:**
- [ ] Institution search functionality
- [ ] Clear institution logos and names
- [ ] Proper categorization (bank vs mobile money)
- [ ] Selection confirmation

**Validation Testing:**
- [ ] **Account number length**: Country-specific requirements
- [ ] **Format validation**: Numbers only where appropriate
- [ ] **Real-time validation**: Immediate feedback
- [ ] **Account name verification**: API integration working

### 6.2 Account Verification
**Flow Testing:**
- [ ] Account details lookup working
- [ ] Loading states during verification
- [ ] Error handling for invalid accounts
- [ ] Success confirmation display

**Error Scenarios:**
- [ ] Invalid account numbers
- [ ] Network timeouts during verification
- [ ] API errors
- [ ] Account not found

---

## 7. KYC Verification Flow

### 7.1 KYC Status Detection
**Status Testing:**
- [ ] **Not started**: Proper modal trigger
- [ ] **Pending**: Appropriate messaging
- [ ] **Verified**: Allow transaction to proceed
- [ ] **Failed**: Clear re-verification path

### 7.2 KYC Modal Experience
**UX Elements:**
- [ ] Clear instructions and requirements
- [ ] External link functionality
- [ ] Progress indication
- [ ] Mobile-friendly interface

**Integration Testing:**
- [ ] Proper URL construction with metadata
- [ ] Return from KYC provider
- [ ] Status updates after completion
- [ ] Data persistence across sessions

---

## 8. Transaction Review & Confirmation

### 8.1 Review Modal
**Information Display:**
- [ ] **Amount accuracy**: Crypto and fiat amounts correct
- [ ] **Exchange rate**: Current rate displayed
- [ ] **Fees**: All fees clearly itemized
- [ ] **Recipient details**: Institution and account info
- [ ] **Network information**: Correct blockchain shown

**UX Testing:**
- [ ] Clear fee breakdown
- [ ] Easy editing of details
- [ ] Proper confirmation flow
- [ ] Cancel option functionality

### 8.2 Payment Execution
**Wallet Integration:**
- [ ] **Transaction construction**: Proper token, amount, recipient
- [ ] **Gas estimation**: Accurate fee calculation
- [ ] **Network validation**: Ensure correct chain
- [ ] **User rejection**: Proper error handling
- [ ] **Success confirmation**: Transaction hash capture

---

## 9. Transaction Processing & Status

### 9.1 Processing States
**Visual Feedback:**
- [ ] **Immediate feedback**: Transaction submitted confirmation
- [ ] **Progress indication**: Clear status updates
- [ ] **Loading animations**: Smooth and informative
- [ ] **Time estimates**: If available, realistic timing

**Status Polling:**
- [ ] **Regular updates**: 5-second polling working
- [ ] **State transitions**: Proper progression through stages
- [ ] **Error detection**: Failed transactions caught
- [ ] **Timeout handling**: Long-running transactions

### 9.2 Success & Failure States
**Success Flow:**
- [ ] **Confetti animation**: Celebration effect working
- [ ] **Transaction details**: Hash, explorer links
- [ ] **Receipt generation**: If implemented
- [ ] **Next actions**: Clear options to continue

**Failure Handling:**
- [ ] **Clear error messages**: Specific failure reasons
- [ ] **Recovery options**: Retry or start new transaction
- [ ] **Support information**: Contact details if needed
- [ ] **Transaction history**: Failed transactions tracked

---

## 10. Mobile-Specific Testing

### 10.1 Touch Interface
**Touch Targets:**
- [ ] All buttons minimum 44px touch target
- [ ] Swipe gestures working properly
- [ ] Scroll behavior smooth
- [ ] Modal dismiss gestures

### 10.2 Mobile Performance
**Performance Testing:**
- [ ] App launch time under 3 seconds
- [ ] Smooth animations at 60fps
- [ ] Memory usage reasonable
- [ ] Battery impact minimal

### 10.3 Mobile-Specific Features
**Swipe-to-Pay/Withdraw:**
- [ ] **Swipe mechanics**: Smooth gesture recognition
- [ ] **Visual feedback**: Progress indication during swipe
- [ ] **Completion detection**: Proper threshold for activation
- [ ] **Error handling**: Reset if swipe incomplete

---

## 11. Edge Cases & Error Scenarios

### 11.1 Network Connectivity
**Offline Scenarios:**
- [ ] **Connection loss**: Graceful degradation
- [ ] **Reconnection**: Resume where left off
- [ ] **Partial loads**: Handle incomplete data
- [ ] **Timeout handling**: Appropriate retry mechanisms

### 11.2 Data Edge Cases
**Boundary Testing:**
- [ ] **Very small amounts**: Minimum transaction values
- [ ] **Very large amounts**: Maximum limits and display
- [ ] **Special characters**: In account numbers or names
- [ ] **Long account names**: UI layout handling
- [ ] **Multiple decimal points**: Input validation

### 11.3 Browser Compatibility
**Browser-Specific Issues:**
- [ ] **Safari**: Wallet connection differences
- [ ] **Mobile browsers**: Touch event handling
- [ ] **Older browsers**: Fallback behavior
- [ ] **Extensions**: Ad blockers, wallet extensions

---

## 12. Performance & Accessibility

### 12.1 Performance Metrics
**Core Web Vitals:**
- [ ] **LCP (Largest Contentful Paint)**: < 2.5 seconds
- [ ] **FID (First Input Delay)**: < 100ms
- [ ] **CLS (Cumulative Layout Shift)**: < 0.1

### 12.2 Accessibility Testing
**Screen Reader Compatibility:**
- [ ] All interactive elements properly labeled
- [ ] Logical tab order throughout application
- [ ] Proper heading hierarchy
- [ ] Alt text for all images

**Keyboard Navigation:**
- [ ] All functions accessible via keyboard
- [ ] Visible focus indicators
- [ ] Modal trap focus properly
- [ ] Skip links where appropriate

---

## 13. Cross-Platform Integration

### 13.1 Farcaster Frame Integration
**MiniKit Testing:**
- [ ] **Frame loading**: Proper initialization
- [ ] **Size constraints**: App fits within frame limits
- [ ] **Navigation**: Proper handling within frame context
- [ ] **External links**: Behavior when opening external URLs

### 13.2 Wallet Provider Compatibility
**Test with Multiple Wallets:**
- [ ] **MetaMask**: Connection and transaction flow
- [ ] **Coinbase Wallet**: Base network optimization
- [ ] **Trust Wallet**: Mobile compatibility
- [ ] **Rainbow**: User experience consistency

---

## 14. Specific Bug Categories to Monitor

### 14.1 UI/Visual Bugs
- [ ] **Layout shifts**: Content jumping during load
- [ ] **Overflow issues**: Content extending beyond containers
- [ ] **Z-index problems**: Modal layering issues
- [ ] **Font loading**: FOUT (Flash of Unstyled Text)
- [ ] **Image loading**: Broken or slow-loading assets

### 14.2 Data Consistency Bugs
- [ ] **State synchronization**: UI not reflecting actual state
- [ ] **Cache issues**: Stale data displayed
- [ ] **Form persistence**: Data loss on navigation
- [ ] **Session management**: Login state inconsistencies

### 14.3 Integration Bugs
- [ ] **API timeouts**: External service failures
- [ ] **Rate limiting**: Handling API limits gracefully
- [ ] **Data format mismatches**: API response parsing
- [ ] **Third-party service failures**: KYC, exchange rate providers

---

## 15. Testing Checklist by User Persona

### 15.1 First-Time User
**Journey Testing:**
- [ ] Onboarding clarity without prior crypto experience
- [ ] Wallet connection guidance
- [ ] KYC process completion
- [ ] First transaction success

### 15.2 Experienced Crypto User
**Efficiency Testing:**
- [ ] Quick transaction completion
- [ ] Advanced features accessibility
- [ ] Multiple transaction handling
- [ ] Portfolio management features

### 15.3 Mobile-First User
**Mobile Experience:**
- [ ] Touch-optimized interface
- [ ] Mobile wallet integration
- [ ] Swipe gestures intuitive
- [ ] Performance on mid-range devices

---

## 16. Post-Testing Documentation

### 16.1 Bug Report Template
For each bug found, document:
- **Severity**: Critical, High, Medium, Low
- **Device/Browser**: Specific environment details
- **Steps to reproduce**: Clear reproduction path
- **Expected vs Actual**: What should happen vs what happens
- **Screenshots/Videos**: Visual evidence
- **Workaround**: If available

### 16.2 UX Improvement Suggestions
- **User friction points**: Where users struggle or hesitate
- **Confusing UI elements**: Areas needing clarification
- **Missing features**: Functionality users expect
- **Performance concerns**: Areas feeling slow or unresponsive

### 16.3 Success Metrics
- **Transaction completion rate**: % of started transactions completed
- **Time to complete transaction**: Average duration
- **Error recovery rate**: % of users who recover from errors
- **User satisfaction**: Subjective feedback scores

---

## 17. Critical Success Criteria

### Must-Pass Requirements:
1. **Wallet connection works reliably** across all supported wallets
2. **Exchange rates display accurately** with real-time updates
3. **KYC verification completes successfully** for all countries
4. **Transactions execute properly** with correct amounts and recipients
5. **Status tracking works consistently** with timely updates
6. **Mobile experience is fully functional** on all device sizes
7. **Error states provide clear guidance** for recovery
8. **Performance meets standards** (load time, responsiveness)

### High-Priority Issues:
- Any crash or freeze during core flows
- Incorrect financial calculations or displays
- Security vulnerabilities or data exposure
- Accessibility blockers preventing usage
- Major mobile usability issues

---

*This testing plan should be executed systematically, with each section completed before moving to the next. Priority should be given to core transaction flows and mobile experience, as these represent the primary user journey.* 
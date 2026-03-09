# Bingo System PRD

## Original Problem Statement
Simplify the bingo system with rooms - make only a 10 ETB room so when user lands at /login it should land them on board selection page on room 10.

## Architecture
- **Framework**: Next.js 14.2.5
- **State Management**: React Context + Redux
- **Real-time**: WebSocket (wss://henb.teshie.dev)
- **Backend API**: External (https://henb.teshie.dev)

## User Flow (Updated)
1. User accesses `/login/[token]`
2. Token is extracted and stored in localStorage
3. Auto-connect to Room 10 WebSocket
4. Board selection page displayed immediately (no room selection)
5. User selects board(s) and clicks "Start Game"
6. Navigate to `/game` for gameplay

## What's Been Implemented
**Date: 2026-03-09**
- Modified `/app/app/login/[token]/page.tsx` - Auto-connects to Room 10 and shows board selection
- Modified `/app/app/login/page.tsx` - Shows board selection for users with existing token
- Removed room selection screen from login flow
- Users now go directly to board selection for Room 10 (10 ETB stake)

## Core Requirements
- [x] Skip room selection entirely
- [x] Auto-connect to Room 10 on login
- [x] Show board selection as first screen after login
- [x] Keep /game flow unchanged

## Backlog
- P0: None
- P1: None
- P2: Consider adding loading/error states for WebSocket connection issues

## Next Tasks
- Test with valid production tokens
- Monitor user experience with simplified flow

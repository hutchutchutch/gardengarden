# GardenSnap MVP

An AI-powered educational garden monitoring app built with React Native, Expo, and Supabase.

## Quick Start

### Download and Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hutchutchutch/gardengarden
   cd gardengarden
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start the development server:**
   ```bash
   npx expo start
   ```

4. **Run on iOS Simulator:**
   - Press `i` in the terminal to open iOS Simulator


5. **Run on Expo Go (physical device):**
   - Install Expo Go from the App Store
   - Scan the QR code displayed in terminal

## OR follow the link and scan with your phone
https://gardenguru-student-portal.rork.app/


### Prerequisites
- Node.js 16+
- Xcode (for iOS Simulator)
- Expo CLI (installed automatically with npm start)

## MVP Features

### For Students
- ✅ Daily photo capture with alignment guides
- ✅ AI plant health analysis (simulated for MVP)
- ✅ Weather-aware task management
- ✅ 24-hour ephemeral photo storage
- ✅ Class story feed
- ✅ Progress tracking

### For Teachers
- ✅ Class dashboard with health monitoring
- ✅ Student participation tracking
- ✅ Plants needing attention alerts
- ✅ Quick messaging capabilities


## Testing the MVP Workflow

### 1. Authentication Flow
- Launch the app
- Sign up as a student or teacher
- Use a test class code (e.g., "TEST123")

### 2. Student Workflow
1. **Add a Plant** (Profile tab)
   - Navigate to Profile tab
   - Add a new plant (Rapunzel Tomato)
   
2. **Daily Photo Capture** (Camera tab)
   - Select your plant
   - Use alignment guides to center the plant
   - Take photo
   - View AI analysis results

3. **Check Tasks** (Home tab)
   - View weather-based tasks
   - Complete daily photo task
   - Track streak

4. **View Progress** (Progress tab)
   - See growth timeline
   - Check health history

5. **Community** (Community tab)
   - View classmates' plant photos
   - See AI insights on stories

### 3. Teacher Workflow
1. **Dashboard** (Dashboard tab - teachers only)
   - Monitor class statistics
   - View plants needing attention
   - Track participation rates

2. **Student Support**
   - Identify struggling students
   - Send targeted messages
   - View detailed reports

## Architecture

### Frontend
- **React Native + Expo**: Cross-platform mobile app
- **Zustand**: State management
- **TypeScript**: Type safety

### Backend (Supabase)
- **Authentication**: Student/teacher roles
- **Supabase**: Real-time database
- **Storage**: Photo storage with TTL
- **Edge Functions**: (24hr) Auto-deletion, AI processing of image for plant health and tips, Vector Store creation, OpenAI chat with Vector Store

### AI Integration
- Currently uses mock data for MVP
- Production will integrate GPT-4V for plant analysis
- Backend API endpoint ready for implementation

## Known Limitations (MVP)

1. **AI Analysis**: Currently returns mock data
2. **Photo Deletion**: Manual (Cloud Function needed for auto-deletion)
3. **Offline Support**: Basic implementation
4. **Weather Data**: Using mock data
5. **Push Notifications**: Not implemented

## Next Steps

1. Implement real GPT-4V integration
2. Deploy Cloud Functions for photo deletion
3. Add real weather API integration
4. Implement push notifications
5. Add offline sync capabilities
6. Create teacher reporting features

## Environment Variables




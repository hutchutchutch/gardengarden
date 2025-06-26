Student Progress Screen Component Breakdown (student-progress.tsx)
Based on the GardenSnap project requirements and design system, here's the complete component structure for the Student Progress screen:
typescript// Main Screen Container
- GSafeScreen (scrollable: true)
  - GSModeToggle (sticky top)
  - GSHeader (variant: "back", title: "My Progress")
    - GSIconButton (icon: "share-2", onPress: shareProgress)
  
  // Hero Section - Overall Progress Summary
  - Section: "Progress Overview"
    - GSPlantCard (variant: "progress-hero")
      - AnimatedPlantGraphic (stage: currentStage, animated: true)
      - View (progressRing)
        - GSProgressIndicator (type: "circular", size: "large")
          - Center: "Day {currentDay}"
          - Subtitle: "of {totalDays}"
          - Progress: currentDay/totalDays
      - GSBadge (label: "Current Stage: {stage}", variant: "primary")
  
  // Key Metrics Grid
  - Section: "Your Garden Stats"
    - Grid (columns: 2, rows: 2, gap: 12)
      - GSStatCard (animated: true)
        - icon: "flame"
        - label: "Current Streak"
        - value: "{streakDays} days"
        - trend: "Personal best!" (conditional)
      - GSStatCard
        - icon: "camera"
        - label: "Photos Taken"
        - value: "{photoCount}"
        - subtitle: "{missedDays} missed"
      - GSStatCard
        - icon: "heart"
        - label: "Average Health"
        - value: "{avgHealth}%"
        - GSHealthBadge (mini: true, score: avgHealth)
      - GSStatCard
        - icon: "award"
        - label: "Badges Earned"
        - value: "{badgeCount}/{totalBadges}"
        - GSProgressIndicator (type: "linear", mini: true)
  
  // Health Trend Chart
  - Section: "Plant Health Journey"
    - GSChart (type: "line", interactive: true)
      - YAxis: Health Score (0-100)
      - XAxis: Days
      - Data: dailyHealthScores
      - Markers: 
        - Milestones (seedling, flowering, etc.)
        - Issues detected (dips in health)
      - TouchPoints: Show tooltip with date & score
      - Colors: Gradient from health color scale
    - ScrollView (horizontal: true)
      - HealthLegend
        - GSChip (color: "excellent", label: "80-100%")
        - GSChip (color: "good", label: "60-79%")
        - GSChip (color: "fair", label: "40-59%")
        - GSChip (color: "poor", label: "Below 40%")
  
  // Growth Milestones Timeline
  - Section: "Growth Milestones"
    - FlatList (horizontal: true)
      - GSMilestone (multiple)
        - Icon: stage-specific (seed, sprout, flower, fruit)
        - Date: achieved/predicted
        - Title: milestone name
        - Status: achieved/upcoming/missed
        - GSBadge (label: "Day {X}", variant: status-based)
    - GSEmptyState (conditional - if no milestones)
      - icon: "calendar"
      - text: "Milestones will appear as you progress"
  
  // Achievements Section
  - Section: "Achievements"
    - SectionHeader
      - Title: "Badges & Rewards"
      - GSButton (variant: "text", label: "View All")
    - Grid (columns: 3, gap: 16)
      - GSBadge (multiple, max: 6 shown)
        - Image: badge icon
        - Title: badge name
        - Status: locked/unlocked
        - Progress: percentage (if locked)
        - OnPress: show GSBottomSheet with details
        - Animation: shine effect (if recently earned)
    - GSButton (variant: "text", label: "See all {remaining} badges →")
  
  // Task Completion History
  - Section: "Task Completion"
    - GSSegmentedButtons (options: ["Week", "Month", "All Time"])
    - GSChart (type: "bar")
      - Data: daily task completion rates
      - YAxis: Completion % 
      - XAxis: Days
      - Color: gradient based on percentage
    - Summary Stats
      - Text: "Average: {avgCompletion}% completion"
      - GSChip (label: "Best day: {bestDay}", variant: "success")
  
  // Plant Photo Journey
  - Section: "Photo Timeline"
    - SectionHeader
      - Title: "Your Plant's Journey"
      - GSIconButton (icon: "grid-3x3", onPress: toggleView)
    - PhotoGallery (view: "timeline" | "grid")
      - TimelineView:
        - ScrollView (horizontal: true)
        - DailyPhotoCard (multiple)
          - Image: thumbnail
          - Day number overlay
          - GSHealthBadge (score: dailyScore, mini: true)
          - Date label below
          - OnPress: lightbox view
      - GridView:
        - Grid (columns: 3, gap: 4)
        - SquarePhoto (multiple)
          - Day number overlay
          - Pressable → lightbox
  
  // Predictions Section
  - Section: "What's Next"
    - GSGuidanceCard (variant: "prediction")
      - Icon: "trending-up"
      - Title: "Growth Predictions"
      - Content:
        - Next milestone: "{milestone} in ~{days} days"
        - Expected harvest: "{date}"
        - Current growth rate: "{rate} cm/day"
      - Accuracy note: "Based on similar plants"
  
  // Share/Export Section
  - Section: "Share Your Progress"
    - View (horizontal layout)
      - GSButton (variant: "outline", icon: "download")
        - label: "Download Report"
      - GSButton (variant: "outline", icon: "share-2")
        - label: "Share Journey"
    - GSButton (variant: "primary", fullWidth: true)
      - icon: "printer"
      - label: "Generate Progress Certificate"
  
  // Navigation
  - GSTabBar (active: "progress")
    - TabItem (icon: "home", label: "Home")
    - TabItem (icon: "book", label: "Lessons")
    - TabItem (icon: "camera", label: "Camera", accent: true)
    - TabItem (icon: "message-circle", label: "Messages")
    - TabItem (icon: "trending-up", label: "Progress", active: true)
Key Features & Interactions
Chart Interactions

Line Chart: Pinch to zoom, tap for details, swipe to pan
Bar Chart: Tap bars for exact values
Touch Points: Show tooltip overlays with precise data

Photo Gallery

Timeline View: Horizontal scroll through journey
Grid View: Quick overview of all photos
Lightbox: Full screen with swipe between photos

Achievements

Locked Badges: Show progress bar to unlock
Recent Badges: Celebration animation on first view
Badge Details: Bottom sheet with unlock criteria

Data Refresh

Pull-to-refresh: Updates all metrics
Real-time: Health score updates when new photo submitted
Animations: Smooth transitions for number changes

Sharing Options

Progress Report: PDF with charts and summary
Social Share: Image card with key stats
Certificate: Formal completion certificate (when applicable)

Loading States
Each section should show appropriate shimmer loading:

Stats: 4 card-shaped shimmers
Charts: Full-width rectangular shimmers
Photos: Grid of square shimmers
Achievements: 6 circular shimmers

Empty States

No photos yet: Encouraging message to take first photo
No achievements: Explanation of how to earn badges
No milestones: Timeline showing future predictions

This comprehensive progress screen gives students a complete view of their plant's journey with engaging visualizations and shareable achievements.
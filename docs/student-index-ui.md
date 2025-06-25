📱 student-index.tsx Components
typescript// Main Screen Container
- GSafeScreen (scrollable: true)
  - GSModeToggle (sticky top)
  - GSHeader (variant: "menu", title: "My Garden")
    - GSIconButton (icon: "settings")
  
  // Plant Stories Section
  - SectionHeader
    - Text (title: "Class Gardens")
    - GSIconButton (icon: "info", size: "small")
  - HorizontalScrollView
    - AddStoryCard (conditional)
      - GSIconButton (icon: "camera", variant: "primary")
      - Text (label: "Share Today")
    - GSStoryThumbnail (multiple)
      - Image (source: thumbnailUrl)
      - GSHealthBadge (size: "small", score: healthScore)
      - Text (studentName)
      - Text (timeAgo)
      - View (viewedRing - gradient border)
  
  // My Plant Progress Section
  - SectionHeader (title: "My Plant Progress")
  - GSPlantCard (variant: "expanded")
    - PlantVisualization
      - AnimatedPlantGraphic (stage: currentStage)
      - GSBadge (label: "Day X", variant: "primary")
      - GSHealthBadge (size: "large", score: healthScore)
    - ScrollView (horizontal: true)
      - GSStatCard (label: "Height", value: "X inches", icon: "ruler")
      - GSStatCard (label: "Stage", value: stage, icon: "sprout")
      - GSStatCard (label: "Health", value: "X%", icon: "heart")
      - GSStatCard (label: "Streak", value: "X days", icon: "fire")
    - GSButton (variant: "outline", icon: "camera", label: "Today's Photo")
  
  // Yesterday's Feedback Section
  - SectionHeader (title: "Yesterday's Feedback")
  - GSGuidanceCard
    - View (header)
      - GSIconButton (icon: priorityIcon, interactive: false)
      - Text (title: "Day X-1 Analysis")
      - GSHealthBadge (size: "small", score: yesterdayScore)
    - Text (guidanceText - formatted)
    - GSCollapsible (label: "View Sources")
      - SourceLink (multiple)
        - GSIconButton (icon: "link", size: "small")
        - Text (sourceTitle)
        - Text (sourceDomain)
    - View (issuesSection - conditional)
      - Text (label: "Issues Detected:")
      - GSChip (multiple, variant: "warning", label: issueName)
  
  // Today's Tasks Section
  - SectionHeader
    - Text (title: "Daily Care")
    - GSProgressIndicator (type: "circular", value: completedPercentage)
  - GSTaskChecklist
    - TaskItem (multiple)
      - GSCheckbox (checked: isCompleted, animated: true)
      - View (taskInfo)
        - Text (taskName)
        - Text (taskDescription - optional)
      - GSBadge (label: "+X pts", variant: "secondary")
      - AnimationView (completionAnimation - triggered on check)
  
  // Tips & Reminders Section
  - SectionHeader (title: "Tips & Reminders")
  - ScrollView (horizontal: true)
    - TipCard (multiple)
      - GSIconButton (icon: tipIcon, interactive: false)
      - Text (tipTitle)
      - Text (tipDescription)
  
  // Need Help Section
  - SectionHeader (title: "Need Help?")
  - GSButton (variant: "primary", fullWidth: true, icon: "message-circle", label: "Ask AI Assistant")
  
  // Navigation
  // Note: Tab navigation is handled by Expo Router's tab navigation
  // in app/(tabs)/_layout.tsx, not by a GSTabBar component
 teacher-lessons.tsx Components
typescript// Main Screen Container
- GSafeScreen
  - GSModeToggle (sticky top)
  - GSHeader (variant: "back", title: "Lesson Management")
    - GSIconButton (icon: "plus", onPress: navigateToCreateLesson)
  - GSSegmentedButtons (options: ["Current", "Completed", "Upcoming"])
  
  // Current Lesson Tab
  - ScrollView
    - GSLessonCard (variant: "teacher-detailed")
      - View (header)
        - Text (lessonName, variant: "h5")
        - GSBadge (label: "ACTIVE", color: "success")
        - GSIconButton (icon: "more-vertical")
          - GSBottomSheet (options)
            - MenuItem (label: "Edit Lesson", icon: "edit")
            - MenuItem (label: "View Analytics", icon: "bar-chart")
            - MenuItem (label: "End Lesson", icon: "stop-circle", variant: "danger")
      - View (lessonStats)
        - GSStatCard (label: "Duration", value: "Day X of Y", mini: true)
        - GSStatCard (label: "Students", value: "X active", mini: true)
        - GSStatCard (label: "Avg Health", value: "X%", mini: true)
      - View (documentStatus)
        - View (sectionHeader)
          - Text (title: "Lesson Resources")
          - View (statusSummary)
            - GSChip (label: "X Completed", variant: "success", icon: "check")
            - GSChip (label: "X Pending", variant: "warning", icon: "clock")
            - GSChip (label: "X Failed", variant: "error", icon: "x")
        - GSCollapsible (expanded: false)
          - FlatList (data: documents)
            - DocumentItem (multiple)
              - GSIconButton (icon: statusIcon, interactive: false)
                - "check-circle" (completed)
                - GSLoadingSpinner (processing)
                - "x-circle" (failed)
              - View (documentInfo)
                - Text (title - from URL)
                - Text (url - truncated)
                - Text (processingStatus)
                  - "Processing..." (with spinner)
                  - "Ready - X sections"
                  - "Failed - Retry"
              - View (retrievalStats)
                - GSIconButton (icon: "eye", size: "small", interactive: false)
                - Text (count: "X retrievals")
              - GSIconButton (icon: "refresh", conditional: failed)
      - GSButton (variant: "primary", fullWidth: true, label: "View Full Analytics")
  
  // Completed Lessons Tab
  - ScrollView
    - FlatList (data: completedLessons)
      - GSLessonCard (variant: "teacher-completed", multiple)
        - View (lessonInfo)
          - Text (lessonName, variant: "h6")
          - Text (dateRange)
          - GSChip (label: plantType, size: "small")
        - Grid (columns: 2, rows: 2)
          - GSStatCard (label: "Students", value: X, mini: true)
          - GSStatCard (label: "Avg Health", value: "X%", mini: true)
          - GSStatCard (label: "Completion", value: "X%", mini: true)
          - GSStatCard (label: "Top Resource", value: truncatedTitle, mini: true)
        - View (actions)
          - GSButton (variant: "outline", label: "View Report", size: "small")
          - GSButton (variant: "text", label: "Duplicate", size: "small")
  
  // Upcoming Lessons Tab
  - ScrollView
    - FlatList (data: upcomingLessons)
      - GSLessonCard (variant: "teacher-upcoming", multiple)
        - View (lessonInfo)
          - Text (lessonName, variant: "h6")
          - GSBadge (label: scheduledDate, variant: "info")
          - GSChip (label: plantType, size: "small")
          - Text (duration: "X days")
        - View (preparationStatus)
          - Text (label: "X resources")
          - GSBadge (label: "Ready", variant: "success", conditional)
          - GSProgressIndicator (type: "linear", value: processingProgress, conditional)
        - View (actions)
          - GSButton (variant: "outline", label: "Edit", size: "small")
          - GSButton (variant: "primary", label: "Activate", size: "small", disabled: hasActiveLesson)
          - GSIconButton (icon: "trash-2", variant: "danger")
    - GSEmptyState (conditional)
      - Image (illustration: "lesson-planning")
      - Text (title: "No upcoming lessons")
      - Text (description: "Create a new lesson to get started")
      - GSButton (variant: "primary", label: "Create Lesson")
  
  // Floating Action Button
  - GSFAB (icon: "plus", label: "New Lesson", position: "bottom-right")
  
  // Navigation
  // Note: Tab navigation is handled by Expo Router's tab navigation
  // in app/(tabs)/_layout.tsx, not by a GSTabBar component
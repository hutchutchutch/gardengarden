📱 teacher-index.tsx Components
typescript// Main Screen Container
- GSafeScreen (scrollable: true)
  - GSModeToggle (sticky top)
  - GSHeader (variant: "menu", title: "Dashboard")
    - Text (subtitle: "Good morning, {teacherName}")
    - GSIconButton (icon: "bell")
      - GSBadge (count: unreadMessages, position: "top-right")
  
  // Current Lesson Progress Section
  - SectionHeader (title: "Current Lesson Progress")
  - GSLessonCard (variant: "active")
    - View (header)
      - Text (lessonName)
      - GSChip (label: plantType, variant: "default")
      - GSBadge (label: "Day X of Y", variant: "info")
    - GSProgressIndicator (type: "linear", value: progressPercentage)
      - Text (label: "X days remaining")
    - View (aggregateHealthDisplay)
      - GSChart (type: "bar", height: 100, data: weeklyHealthScores)
      - View (averageHealth)
        - Text (label: "Average Health")
        - Text (value: "X%", variant: "h3")
        - Text (trend: "↑ +5% from yesterday")
      - View (healthDistribution)
        - HealthRow (label: "Excellent", count: X, color: "success")
        - HealthRow (label: "Good", count: X, color: "good")
        - HealthRow (label: "Fair", count: X, color: "warning")
        - HealthRow (label: "Poor", count: X, color: "error")
    - GSButton (variant: "text", label: "View Details →")
  
  // Yesterday's Completion Section
  - SectionHeader
    - Text (title: "Task Completion")
    - Text (subtitle: yesterdayDate)
  - View (completionStats)
    - GSStatCard (value: "X%", label: "Completed All Tasks", icon: "check-circle", trend: "+X%")
    - GSStatCard (value: X, label: "Students Pending", icon: "alert-circle", variant: "warning")
  - View (pendingStudentsList - conditional)
    - Text (header: "Students who need encouragement")
    - FlatList (data: pendingStudents, maxItems: 5)
      - GSStudentCard (multiple)
        - Avatar (initials: studentInitials)
        - View (studentInfo)
          - Text (studentName)
          - Text (subtitle: "Missed X tasks")
        - GSHealthBadge (size: "mini", score: healthScore)
        - GSIconButton (icon: "message-circle", onPress: openChat)
    - GSButton (variant: "text", label: "See all X students →")
  
  // Photo Submissions Section
  - SectionHeader
    - Text (title: "Today's Gardens")
    - GSIconButton (icon: "refresh", size: "small")
  - View (submissionStats)
    - GSProgressIndicator (type: "circular", value: submissionPercentage, size: "large")
      - Text (center: "X%")
    - Text (label: "X of Y submitted")
  - Grid (columns: 3, gap: 8)
    - GSPlantCard (multiple, max: 6)
      - Image (source: thumbnailUrl)
      - GSHealthBadge (overlay: true, score: healthScore)
      - Text (studentName)
      - Text (timeAgo)
  - GSButton (variant: "text", label: "View all photos →")
  
  // Quick Actions Section
  - SectionHeader (title: "Quick Actions")
  - Grid (columns: 2, rows: 2, gap: 12)
    - GSButton (variant: "outline", icon: "message-square", label: "Messages")
      - GSBadge (count: unreadCount, position: "top-right")
    - GSButton (variant: "outline", icon: "users", label: "Students")
    - GSButton (variant: "outline", icon: "bar-chart", label: "Analytics")
    - GSButton (variant: "outline", icon: "book-open", label: "Lessons")
  
  // Navigation
  // Note: Tab navigation is handled by Expo Router's tab navigation
  // in app/(tabs)/_layout.tsx, not by a GSTabBar component
# **Functional Requirements Document (FRD)**

## **Project: GardenSnap - AI-Powered Educational Garden Learning Platform**

**Version:** 1.0  
**Date:** December 2024  
**Author:** Systems Analysis Team

### **1. Introduction**

This Functional Requirements Document (FRD) translates the high-level business needs defined in the GardenSnap Business Requirements Document (BRD v3.0) into specific, testable system behaviors. This document serves as the primary technical specification for the development and quality assurance teams, detailing exactly how the system must function to meet business objectives.

Every functional requirement in this document traces directly to business requirements outlined in the BRD, ensuring complete coverage of business needs with no scope creep. Requirements are organized by user type (Teacher, Student, System) and feature area for clarity.

### **2. Functional Requirements**

#### **2.1 Teacher Features**

##### **2.1.1 Lesson Management**

**User Story:** As a teacher, I want to create lessons by providing educational URLs, so that my students can access curated knowledge about their plants.

| ID | Requirement Description |
| :---- | :---- |
| FR-001 | The system **shall** provide a "Create New Lesson" form with fields for lesson name (max 100 chars), description (max 500 chars), plant type (dropdown), and URL list. |
| FR-002 | The system **shall** validate that at least 3 URLs are provided before allowing lesson creation. |
| FR-003 | The system **shall** display an error message "Please add at least 3 educational URLs" when fewer than 3 URLs are submitted. |
| FR-004 | The system **shall** trigger Firecrawl API processing for each URL within 30 seconds of lesson creation. |
| FR-005 | The system **shall** display a progress indicator showing "Processing URL X of Y" during content extraction. |
| FR-006 | The system **shall** create a Pinecone vector index named with pattern "lesson_{lessonId}_{timestamp}". |
| FR-007 | The system **shall** display the chunk count for each processed URL in the lesson details view. |
| FR-008 | The system **shall** allow teachers to add new URLs to existing lessons with automatic reprocessing. |
| FR-009 | The system **shall** track and display retrieval frequency for each URL in analytics view. |
| FR-010 | The system **shall** restrict lesson deletion once any student has submitted work for that lesson. |

**User Story:** As a teacher, I want to activate one lesson at a time for my class, so that all students work on the same plant together.

| ID | Requirement Description |
| :---- | :---- |
| FR-011 | The system **shall** display a toggle button labeled "Set as Active" on each lesson card. |
| FR-012 | The system **shall** deactivate the previously active lesson when a new lesson is activated. |
| FR-013 | The system **shall** send a notification to all students "New lesson started: [Lesson Name]" upon activation. |
| FR-014 | The system **shall** reset all student plant data when switching active lessons. |
| FR-015 | The system **shall** require confirmation "This will reset all student progress. Continue?" before lesson switch. |

##### **2.1.2 Student Monitoring**

**User Story:** As a teacher, I want to see real-time class statistics on my dashboard, so that I can quickly identify students who need help.

| ID | Requirement Description |
| :---- | :---- |
| FR-016 | The system **shall** calculate and display submission percentage as (photos submitted today / total students * 100). |
| FR-017 | The system **shall** update dashboard statistics within 5 seconds of any student submission. |
| FR-018 | The system **shall** display a list of student names who haven't submitted photos in the past 24 hours. |
| FR-019 | The system **shall** highlight plants with health scores below 60% in red on the dashboard. |
| FR-020 | The system **shall** display unread message count as a badge on the messages icon. |
| FR-021 | The system **shall** allow teachers to click any student name to view their detailed profile. |
| FR-022 | The system **shall** display a grid view of all student plant photos from the current day. |
| FR-023 | The system **shall** allow filtering dashboard by "Not Submitted", "Low Health", "All Students". |

##### **2.1.3 Messaging System**

**User Story:** As a teacher, I want to message individual students or groups, so that I can provide targeted guidance.

| ID | Requirement Description |
| :---- | :---- |
| FR-024 | The system **shall** display all message threads sorted by most recent activity. |
| FR-025 | The system **shall** show unread indicator (blue dot) next to new messages. |
| FR-026 | The system **shall** allow teachers to filter students by health score when composing group messages. |
| FR-027 | The system **shall** limit message length to 500 characters. |
| FR-028 | The system **shall** display "Seen at [timestamp]" when students read messages. |
| FR-029 | The system **shall** allow photo attachments up to 5MB in messages. |
| FR-030 | The system **shall** send push notifications for new teacher messages with high priority. |

#### **2.2 Student Features**

##### **2.2.1 Daily Photo Capture**

**User Story:** As a student, I want to take daily photos of my plant with guidance, so that I can track its growth accurately.

| ID | Requirement Description |
| :---- | :---- |
| FR-031 | The system **shall** display camera interface with semi-transparent overlay of previous day's photo. |
| FR-032 | The system **shall** show alignment grid (rule of thirds) on camera view. |
| FR-033 | The system **shall** display "Align your plant with yesterday's photo" as helper text. |
| FR-034 | The system **shall** compress photos to max 2MB before upload while maintaining quality. |
| FR-035 | The system **shall** prevent multiple photo submissions on the same calendar day. |
| FR-036 | The system **shall** display "Photo already submitted today!" if user attempts second submission. |
| FR-037 | The system **shall** show upload progress percentage during photo submission. |
| FR-038 | The system **shall** trigger Vision AI analysis within 3 seconds of upload completion. |

##### **2.2.2 AI-Powered Guidance**

**User Story:** As a student, I want to receive personalized daily tips about my plant, so that I know exactly how to care for it.

| ID | Requirement Description |
| :---- | :---- |
| FR-039 | The system **shall** display personalized guidance within 5 seconds of photo analysis completion. |
| FR-040 | The system **shall** generate tips that include: current plant condition, growth day, and specific action. |
| FR-041 | The system **shall** use this format: "🌱 Day X: [Condition summary]. [Specific guidance]. [Encouragement]." |
| FR-042 | The system **shall** highlight critical issues (health < 40%) with red warning banner. |
| FR-043 | The system **shall** store guidance history for student progress tracking. |
| FR-044 | The system **shall** reference lesson vector store for all guidance content. |
| FR-045 | The system **shall** update guidance after each new photo submission. |

##### **2.2.3 Plant Stories Feed**

**User Story:** As a student, I want to see my classmates' daily plant photos, so that I can learn from their successes.

| ID | Requirement Description |
| :---- | :---- |
| FR-046 | The system **shall** display user's own story as first item with "Add Photo" CTA if not submitted. |
| FR-047 | The system **shall** auto-delete all photos exactly 24 hours after upload timestamp. |
| FR-048 | The system **shall** display stories in horizontal scrollable list sorted by most recent. |
| FR-049 | The system **shall** show plant health badge (green/yellow/red) on each story thumbnail. |
| FR-050 | The system **shall** auto-advance stories every 5 seconds with pause on tap. |
| FR-051 | The system **shall** display student name, plant day, and health score on each story. |
| FR-052 | The system **shall** allow emoji reactions: 👍, 🌱, 💪, 🎉, 💡 with counts. |
| FR-053 | The system **shall** prevent viewing stories older than 24 hours. |

##### **2.2.4 Dual-Mode Chat**

**User Story:** As a student, I want to toggle between AI assistant and teacher when messaging, so that I can get appropriate help.

| ID | Requirement Description |
| :---- | :---- |
| FR-054 | The system **shall** display toggle switch labeled "AI Assistant | Teacher" at top of chat. |
| FR-055 | The system **shall** show AI messages in blue bubbles and teacher messages in green bubbles. |
| FR-056 | The system **shall** process AI queries through RAG pipeline with lesson vector store. |
| FR-057 | The system **shall** display "Sources ▼" link under each AI response. |
| FR-058 | The system **shall** expand to show source URLs with titles when "Sources" is clicked. |
| FR-059 | The system **shall** limit students to 20 AI messages per day. |
| FR-060 | The system **shall** display "Daily AI limit reached. Message your teacher!" after limit. |
| FR-061 | The system **shall** prepend "[AI]" or "[Teacher]" to message notifications. |

#### **2.3 System Features**

##### **2.3.1 Content Processing**

**User Story:** As a system, I need to process educational URLs into searchable knowledge, so that students receive accurate plant care information.

| ID | Requirement Description |
| :---- | :---- |
| FR-062 | The system **shall** call Firecrawl API with parameters: {formats: ['markdown'], maxDepth: 1}. |
| FR-063 | The system **shall** chunk extracted content into segments of maximum 1000 characters. |
| FR-064 | The system **shall** generate embeddings using OpenAI text-embedding-ada-002 model. |
| FR-065 | The system **shall** store embeddings in Pinecone with metadata: {lessonId, urlId, chunkIndex}. |
| FR-066 | The system **shall** retry failed API calls up to 3 times with exponential backoff. |
| FR-067 | The system **shall** log processing errors with URL and error message for teacher visibility. |
| FR-068 | The system **shall** update chunk count in lesson data after successful processing. |

##### **2.3.2 Vision AI Analysis**

**User Story:** As a system, I need to analyze plant photos for health metrics, so that students receive accurate assessments.

| ID | Requirement Description |
| :---- | :---- |
| FR-069 | The system **shall** send photos to Google Vision AI within 500ms of upload completion. |
| FR-070 | The system **shall** extract: plant presence, growth stage, color analysis, and visible issues. |
| FR-071 | The system **shall** calculate health score (0-100) based on color vibrancy and issue count. |
| FR-072 | The system **shall** compare current photo with previous to calculate growth rate. |
| FR-073 | The system **shall** store analysis results with photo record in Firestore. |
| FR-074 | The system **shall** trigger guidance generation immediately after analysis completion. |
| FR-075 | The system **shall** flag photos without visible plants for manual review. |

##### **2.3.3 Photo Lifecycle Management**

**User Story:** As a system, I need to automatically delete photos after 24 hours, so that student privacy is protected.

| ID | Requirement Description |
| :---- | :---- |
| FR-076 | The system **shall** set metadata field "expiresAt" to currentTime + 24 hours on upload. |
| FR-077 | The system **shall** run cleanup Cloud Function every 60 minutes. |
| FR-078 | The system **shall** query all photos where expiresAt < currentTime. |
| FR-079 | The system **shall** delete photo from Storage and remove Firestore record atomically. |
| FR-080 | The system **shall** preserve analysis data while deleting photo file. |
| FR-081 | The system **shall** log deletion count and timestamp for audit purposes. |

### **3. Data Handling and Validation**

#### **3.1 Input Validation Rules**

| Field | Validation Rule | Error Message |
| :---- | :---- | :---- |
| Email | RFC 5322 compliant email format | "Please enter a valid email address" |
| Password | Minimum 8 characters, 1 uppercase, 1 number | "Password must be at least 8 characters with 1 uppercase and 1 number" |
| Lesson Name | 3-100 characters, alphanumeric + spaces | "Lesson name must be 3-100 characters" |
| URL | Valid HTTP/HTTPS URL format | "Please enter a valid URL starting with http:// or https://" |
| Message | Maximum 500 characters | "Message too long (500 character limit)" |
| Student Name | 2-50 characters, letters only | "Name must be 2-50 letters" |
| Plant Nickname | 1-30 characters, optional | "Nickname must be 30 characters or less" |

#### **3.2 Data Processing Logic**

| Process | Input | Transformation | Output |
| :---- | :---- | :---- | :---- |
| Health Score | Vision AI metrics | (ColorScore * 0.4) + (GrowthScore * 0.3) + (IssueScore * 0.3) | 0-100 integer |
| Growth Rate | Current + Previous height | (CurrentHeight - PreviousHeight) / DaysBetween | cm/day float |
| Submission Rate | Student count + Submissions | (SubmissionsToday / TotalStudents) * 100 | Percentage |
| Day Counter | Planting date | CurrentDate - PlantingDate | Integer days |
| Story Order | Upload timestamps | Sort by timestamp DESC | Ordered array |

#### **3.3 Output Formatting**

| Data Type | Display Format | Example |
| :---- | :---- | :---- |
| Dates | MMM DD, YYYY | Dec 24, 2024 |
| Times | 12-hour with AM/PM | 3:30 PM |
| Health Score | X% with color | 85% (green) |
| Growth Rate | X.X cm/day | 1.2 cm/day |
| Day Counter | Day X of Y | Day 23 of 75 |
| Currency | $X.XX | $5.99 |

### **4. Error Handling and Messaging**

#### **4.1 Authentication Errors**

| Condition | System Action | User Message |
| :---- | :---- | :---- |
| Invalid email/password | Prevent login, log attempt | "Invalid email or password. Please try again." |
| Account locked (5 failures) | Block login for 30 minutes | "Account temporarily locked. Try again in 30 minutes." |
| Session expired | Redirect to login | "Your session has expired. Please log in again." |
| Unauthorized access | Redirect to appropriate view | "You don't have permission to view this page." |

#### **4.2 Data Input Errors**

| Condition | System Action | User Message |
| :---- | :---- | :---- |
| Missing required field | Highlight field in red | "[Field name] is required" |
| Invalid URL format | Prevent form submission | "Please enter a valid URL (example: https://website.com)" |
| Photo too large | Compress or reject | "Photo too large. Maximum size is 5MB." |
| Duplicate submission | Block action | "You've already submitted a photo today!" |
| Network timeout | Retry automatically | "Connection lost. Retrying..." |

#### **4.3 System Errors**

| Condition | System Action | User Message |
| :---- | :---- | :---- |
| API service down | Use cached data if available | "Some features temporarily unavailable. We're working on it!" |
| Processing failure | Queue for retry | "Processing your request. This may take a moment." |
| Storage quota exceeded | Alert administrators | "Unable to upload. Please try again later." |
| Invalid API response | Log error, use fallback | "Something went wrong. Please refresh and try again." |

### **5. Traceability Matrix**

| Business Requirement | Functional Requirements | Feature Area |
| :---- | :---- | :---- |
| TR-001 (Lesson Creation) | FR-001 through FR-010 | Lesson Management |
| TR-003 (Lesson Management) | FR-011 through FR-015 | Lesson Activation |
| TR-006 (Progress Dashboard) | FR-016 through FR-023 | Student Monitoring |
| TR-007 (Message Center) | FR-024 through FR-030 | Teacher Messaging |
| SR-001 (Photo Capture) | FR-031 through FR-038 | Daily Photos |
| SR-003 (Personalized Tips) | FR-039 through FR-045 | AI Guidance |
| SR-002 (Plant Stories) | FR-046 through FR-053 | Story Feed |
| SR-006 (Dual Messaging) | FR-054 through FR-061 | Student Chat |
| SY-001 (Web Scraping) | FR-062 through FR-068 | Content Processing |
| SY-004 (Vision AI) | FR-069 through FR-075 | Photo Analysis |
| SY-006 (Photo Lifecycle) | FR-076 through FR-081 | Privacy Protection |

### **6. Non-Functional Requirements Reference**

While this FRD focuses on functional behavior, the following non-functional requirements from the BRD apply to all features:

- **Performance**: All user actions must complete within 3 seconds
- **Availability**: 99.5% uptime during school hours (7 AM - 6 PM local time)
- **Scalability**: Support 10,000 concurrent users without degradation
- **Security**: All data encrypted in transit and at rest
- **Accessibility**: WCAG 2.1 Level AA compliance
- **Compatibility**: iOS 13+, Android 8+, React Native 0.70+

### **7. Acceptance Criteria**

Each functional requirement is considered complete when:

1. The described behavior is implemented exactly as specified
2. All error conditions are handled with appropriate messages
3. The feature passes automated unit and integration tests
4. The feature is verified through manual QA testing
5. The feature meets all applicable non-functional requirements
6. The feature is documented in user help materials

### **8. Appendices**

#### **Appendix A: API Response Formats**

```json
// Vision AI Analysis Response
{
  "healthScore": 85,
  "stage": "flowering",
  "height": 45.2,
  "issues": ["minor_yellowing_lower_leaves"],
  "confidence": 0.92
}

// RAG Query Response
{
  "guidance": "Your tomato plant is thriving...",
  "sources": [
    {
      "url": "https://example.com/tomato-care",
      "title": "Tomato Growing Guide",
      "relevance": 0.87
    }
  ]
}
```

#### **Appendix B: State Diagrams**

```
Photo Lifecycle States:
UPLOADING -> PROCESSING -> ACTIVE -> EXPIRED -> DELETED
                  |
                  v
              ERROR (retry)
```

#### **Appendix C: Validation Regex Patterns**

```javascript
EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
PHONE_REGEX = /^\(\d{3}\) \d{3}-\d{4}$/
```

---

**Document Version History**

| Version | Date | Author | Changes |
| :---- | :---- | :---- | :---- |
| 1.0 | Dec 2024 | Systems Analysis Team | Initial release |

**Approval**

| Role | Name | Signature | Date |
| :---- | :---- | :---- | :---- |
| Technical Lead | __________ | __________ | _____ |
| QA Lead | __________ | __________ | _____ |
| Product Owner | __________ | __________ | _____ |

---

*End of Document*
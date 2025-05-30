# 🎯 SPACED REPETITION QUIZ SYSTEM - PROGRAM FLOW

## 📊 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPACED REPETITION QUIZ FLOW                  │
└─────────────────────────────────────────────────────────────────┘

                         USER JOURNEY
                              │
                              ▼
                    ┌─────────────────┐
                    │   Landing Page  │
                    │  (localhost:3000) │
                    └─────────┬───────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Authentication  │
                    │   Required      │
                    └─────────┬───────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    Dashboard    │
                    │  /dashboard     │
                    └─────────┬───────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Spaced Rep     │
                    │     Demo        │
                    │ /spaced-        │
                    │ repetition-demo │
                    └─────────┬───────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        QUIZ ENGINE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. GET REVIEW QUESTIONS                                        │
│     │                                                           │
│     ├─ GET /api/quiz/review-questions                          │
│     │  • Authentication check                                   │
│     │  • Query parameters: topic, limit                        │
│     │  • Calls: get_questions_due_for_review()                │
│     │  • Returns: Questions due for review                     │
│     │                                                           │
│  2. DISPLAY QUESTION                                            │
│     │                                                           │
│     ├─ Frontend displays question with options                  │
│     │  • Multiple choice interface                              │
│     │  • Timer starts for response time                        │
│     │  • User selects answer                                    │
│     │                                                           │
│  3. SUBMIT ANSWER                                               │
│     │                                                           │
│     ├─ POST /api/quiz/adaptive-session                         │
│     │  • Validates user response                                │
│     │  • Records: question_id, answer, timing                  │
│     │  • Calls: SpacedRepetitionService                        │
│     │  • Updates: user_question_performance                    │
│     │                                                           │
│  4. SM-2 ALGORITHM PROCESSING                                   │
│     │                                                           │
│     ├─ calculate_next_review_date()                            │
│     │  • Updates ease factor based on performance              │
│     │  • Calculates next review interval                       │
│     │  • Updates repetition count                              │
│     │                                                           │
│  5. GET USER STATISTICS                                         │
│     │                                                           │
│     ├─ GET /api/user/stats/spaced-repetition                   │
│     │  • Calls: get_user_spaced_repetition_stats()            │
│     │  • Returns: 13 comprehensive metrics                     │
│     │  • Updates dashboard displays                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 DETAILED FLOW SEQUENCE

### 1. User Access Flow
```
Browser → localhost:3000 → Landing Page → Sign In → Dashboard
```

### 2. Quiz Session Flow
```
Dashboard → Spaced Repetition Demo → Load Questions → Display Quiz
    ↓
Answer Question → Submit Response → Process with SM-2 → Update DB
    ↓
Next Question ← Calculate Review Date ← Update Statistics
```

### 3. API Endpoint Flow

#### GET Review Questions
```
GET /api/quiz/review-questions?topic=math&limit=10
    ↓
Authentication Check → Database Query → Filter Due Questions
    ↓
Return JSON: { questions: [...], metadata: {...} }
```

#### POST Adaptive Session
```
POST /api/quiz/adaptive-session
Body: { quiz_topic, question_ids, responses }
    ↓
Validate Input → Process Responses → Update Performance
    ↓
SM-2 Algorithm → Calculate Next Review → Return Session Data
```

#### GET User Statistics
```
GET /api/user/stats/spaced-repetition
    ↓
Authentication → Calculate Stats → Return Metrics
    ↓
13 Metrics: accuracy, streaks, study time, mastery, etc.
```

## 🎮 AVAILABLE DEMO ROUTES

| Route | Description | Status |
|-------|-------------|--------|
| `/` | Landing page with app overview | ✅ Active |
| `/spaced-repetition-demo` | Interactive quiz demo | ✅ Active |
| `/dashboard` | User dashboard (auth required) | ✅ Active |

## 🚀 HOW TO RUN

1. **Start Development Server**: `npm run dev`
2. **Access Application**: http://localhost:3000
3. **Try Demo**: Navigate to /spaced-repetition-demo
4. **View Dashboard**: /dashboard (requires auth)

## 🧠 SM-2 ALGORITHM IN ACTION

The system implements the SuperMemo-2 spaced repetition algorithm:

1. **Initial State**: New questions start with ease factor 2.5
2. **Response Processing**: Each answer updates the ease factor
3. **Interval Calculation**: Next review date calculated based on performance
4. **Adaptive Learning**: Questions appear more/less frequently based on difficulty

## 📊 REAL-TIME FEATURES

- **Performance Tracking**: Live statistics updates
- **Adaptive Scheduling**: Questions scheduled based on SM-2
- **Progress Visualization**: Stats dashboard with 13 key metrics
- **Response Analytics**: Timing and accuracy tracking

---

**🎯 The application is now running at: http://localhost:3000**

Navigate to `/spaced-repetition-demo` to try the interactive quiz system!

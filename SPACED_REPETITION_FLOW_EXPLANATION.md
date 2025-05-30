# 🧠 SPACED REPETITION FLOW - COMPLETE BREAKDOWN

## 🎯 **WHAT'S HAPPENING WITH SPACED REPETITION?**

The spaced repetition system is **fully operational** and here's exactly how the flow works:

---

## 🔄 **COMPLETE FLOW BREAKDOWN**

### **🚀 1. QUIZ INITIALIZATION**

#### **Regular Quiz Mode:**
```
User visits: /quiz/azure-a102
```
- Loads quiz from database normally
- No spaced repetition features active

#### **Enhanced Spaced Repetition Mode:**
```
User visits: /quiz/azure-a102?spacedRepetition=true
```
- Loads quiz from database
- **POST** to `/api/quiz/adaptive-session` creates session
- Questions enhanced with spaced repetition metadata
- SM-2 algorithm initialized for each question

---

### **📝 2. QUESTION ANSWERING FLOW**

#### **Every Time User Submits an Answer:**

**STEP 1: Answer Submission**
```typescript
// Frontend: useQuizScoring.ts
submitAndScoreAnswer(question, userAnswer)
```

**STEP 2: Answer Validation**
- Edge function `score-answer` validates the answer
- Returns `isCorrect` boolean and correct answer

**STEP 3: Spaced Repetition Recording** (CRITICAL!)
```typescript
// This happens EVERY question in spaced repetition mode:
await SpacedRepetitionQuizService.recordQuestionResponse(
  question.id,
  answer,
  isCorrect,
  responseTimeMs,
  sessionId
);
```

**STEP 4: Database POST Request**
```http
POST /api/quiz/response
{
  "question_id": "question-123",
  "quiz_session_id": "session-456", 
  "user_answer_data": {...},
  "is_correct": true,
  "response_time_ms": 3500,
  "confidence_level": 4
}
```

**STEP 5: Database Trigger Fires** (AUTOMATIC!)
```sql
-- This trigger executes IMMEDIATELY after POST:
TRIGGER trigger_update_user_question_performance
  AFTER INSERT ON question_responses
  EXECUTE FUNCTION fn_update_user_question_performance()
```

---

### **⚡ 3. DATABASE CHANGES (Every Question!)**

#### **Tables Being Updated:**

**A) `question_responses` Table:**
```sql
INSERT INTO question_responses (
  user_id,
  question_id, 
  quiz_session_id,
  user_answer_data,
  is_correct,
  response_time_ms,
  confidence_level,
  submitted_at
)
```

**B) `user_question_performance` Table (UPSERT):**
```sql
-- SM-2 Algorithm Updates:
ease_factor = 2.1,        -- Adjusted based on performance
interval_days = 3,        -- Next review in 3 days  
repetitions = 2,          -- Second time seeing this question
next_review_date = '2025-06-02',
correct_streak = 1,       -- Or reset to 0 if incorrect
incorrect_streak = 0,     -- Or increment if incorrect
total_attempts = 2,
correct_attempts = 1,
avg_response_time_ms = 4200,
priority_score = 5.2,     -- Higher = needs more review
last_reviewed_at = NOW()
```

---

### **🧮 4. SM-2 ALGORITHM CALCULATION**

#### **Quality Rating Calculation:**
```sql
-- Based on correctness + response time:
IF correct AND response_time <= 5s  THEN quality = 5 (excellent)
IF correct AND response_time <= 20s THEN quality = 4 (good)  
IF correct AND response_time > 20s  THEN quality = 3 (hesitant)
IF incorrect AND low_confidence   THEN quality = 2 (partial)
IF incorrect                      THEN quality = 1 (failure)
```

#### **SM-2 Parameters Updated:**
```sql
-- Function: calculate_next_review_date()
-- Input: user_id, question_id, quality_rating
-- Output: new_ease_factor, new_interval, repetitions, next_review_date

-- Algorithm:
if quality >= 3:
  repetitions += 1
  if repetitions == 1: interval = 1 day
  if repetitions == 2: interval = 6 days  
  if repetitions >= 3: interval = previous_interval * ease_factor
else:
  repetitions = 0
  interval = 1 day  -- Reset for poor performance
  
ease_factor = ease_factor + (0.1 - (5-quality) * (0.08 + (5-quality) * 0.02))
```

---

### **📊 5. WHEN DO DATABASE CHANGES HAPPEN?**

#### **✅ EVERY SINGLE QUESTION:**
- ✅ **POST request** to `/api/quiz/response`
- ✅ **Database trigger** executes automatically  
- ✅ **SM-2 algorithm** recalculates parameters
- ✅ **Performance tracking** updates all metrics

#### **❌ NOT Every Other Question:**
The system records and updates spaced repetition data for **EVERY question answered** in spaced repetition mode, not every other question.

---

### **🔍 6. MONITORING THE FLOW**

#### **Check Database Changes:**
```sql
-- See all responses for a user:
SELECT * FROM question_responses 
WHERE user_id = 'your-user-id' 
ORDER BY submitted_at DESC;

-- See spaced repetition performance:
SELECT * FROM user_question_performance 
WHERE user_id = 'your-user-id'
ORDER BY last_reviewed_at DESC;
```

#### **Check Browser Network Tab:**
1. Open `/quiz/azure-a102?spacedRepetition=true`
2. Answer questions
3. Watch for `POST /api/quiz/response` requests
4. Each answer triggers a POST

---

### **🎮 7. USER EXPERIENCE FLOW**

```
1. User visits: /quiz/azure-a102?spacedRepetition=true
   ↓
2. Quiz loads with spaced repetition enhancements
   ↓  
3. User answers Question 1
   ↓
4. POST /api/quiz/response (records response + triggers SM-2)
   ↓
5. User answers Question 2  
   ↓
6. POST /api/quiz/response (records response + triggers SM-2)
   ↓
7. [Continues for ALL 58 questions]
   ↓
8. Quiz complete - all questions now have spaced repetition data
```

---

### **🎯 8. KEY DIFFERENCES**

#### **Regular Quiz (`/quiz/azure-a102`):**
- ❌ No spaced repetition features
- ❌ No POST to `/api/quiz/response`  
- ❌ No SM-2 algorithm updates
- ❌ No performance tracking

#### **Enhanced Quiz (`/quiz/azure-a102?spacedRepetition=true`):**
- ✅ Full spaced repetition features
- ✅ POST to `/api/quiz/response` for EVERY question
- ✅ SM-2 algorithm calculates optimal review timing
- ✅ Complete performance tracking and analytics

---

## 🎉 **SUMMARY**

**YES, the database IS being changed!**
- ✅ **Every question** answered triggers database updates
- ✅ **Two tables** are updated: `question_responses` + `user_question_performance`  
- ✅ **SM-2 algorithm** runs automatically via database triggers
- ✅ **Complete spaced repetition tracking** is active

The system is working exactly as designed for adaptive learning! 🚀

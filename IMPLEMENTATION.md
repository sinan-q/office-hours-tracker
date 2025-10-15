# Office Hours Tracker - Implementation Summary

## Project Overview
A complete, production-ready client-side Office Hours Tracker application built with React, Vite, and Tailwind CSS. The application allows users to track daily office attendance status and time, view statistics, and manage data via JSON import/export.

## Technology Stack
- **Framework**: React 18 with Hooks
- **Build Tool**: Vite (with Rolldown)
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Data Storage**: Browser localStorage
- **Deployment Ready**: GitHub Pages compatible

## File Structure
```
src/
├── components/
│   ├── CalendarView.jsx       - Main calendar grid display
│   ├── DayCell.jsx            - Individual day cell component
│   ├── StatsPanel.jsx         - Statistics display panel
│   ├── DayEditModal.jsx       - Modal for editing day status/time
│   ├── Settings.jsx           - Settings configuration modal
│   └── DataManager.jsx        - Import/Export data modal
├── services/
│   ├── storageService.js      - localStorage abstraction
│   ├── statsService.js        - Statistics calculations
│   └── jsonImportService.js   - JSON import mapping logic
├── App.jsx                    - Main application component
└── index.css                  - Tailwind CSS imports
```

## Features Implemented

### 1. Calendar View
- Monthly calendar grid with navigation (previous/next month)
- Color-coded day cells based on status:
  - **Green**: SHOW (attended)
  - **Red**: NO SHOW (absent)
  - **Yellow**: LEAVE/EXCEPTION
  - **Blue**: HOLIDAY
  - **Gray**: WEEKEND
  - **Dark Gray**: EMPTY (not logged)
  - **Purple**: WEEKEND/HOLIDAY with time logged
- Today's date highlighted with blue ring
- Time display badge on cells with logged hours
- Click to edit any day

### 2. Day Edit Modal
- Select status from dropdown (EMPTY, SHOW, NO SHOW, LEAVE, EXCEPTION, HOLIDAY, WEEKEND)
- Input time in minutes with visual conversion to hours/minutes
- Time input automatically disabled for NO SHOW, LEAVE, EXCEPTION
- Time input enabled for SHOW and optional for WEEKEND/HOLIDAY
- Save button disabled if SHOW status with zero time
- Date display with formatted date string

### 3. Statistics Panel
- **Attendance Percentage**: 
  - Numerator: SHOW days + (WEEKEND/HOLIDAY with time > 0)
  - Denominator: SHOW + NO SHOW days
  - Shows "N/A" if no attendance days logged
- **Avg. Hours (Completed Days)**: Average time for all SHOW days before today
- **Avg. Hours Needed (Remaining Days)**: Calculates required daily hours to meet goals
- Current settings display (min hours/day, min attendance %)

### 4. Settings
- Configure minimum hours per day (in minutes)
- Set minimum attendance percentage target
- Visual conversion of minutes to hours/minutes
- Saved to localStorage automatically

### 5. Data Management
- **Import JSON**: Upload JSON file to import calendar data
  - Maps external format to internal structure
  - Override rule: "At Office" with backgroundStatus uses background value
  - Merges with existing data
- **Export JSON**: Download complete data as JSON file
  - Includes all calendar data and settings
  - Filename includes date stamp

### 6. Data Mapping Rules (Import)
External → Internal:
- "No Show" → NO SHOW
- "Branch Holiday" → HOLIDAY
- "Weekend" → WEEKEND
- "Leave"/"Exception" → LEAVE
- "At Office" → SHOW
- Override: If "At Office" AND backgroundStatus exists, use backgroundStatus

## Statistics Calculation Details

### Attendance Percentage
```
Numerator = Count(SHOW) + Count(WEEKEND/HOLIDAY with time > 0)
Denominator = Count(SHOW) + Count(NO SHOW)
Percentage = (Numerator / Denominator) × 100
```

### Average Hours Till Yesterday
```
Total Minutes = Sum(time for all SHOW days before today)
Count = Number of SHOW days before today
Average = Total Minutes / Count
```

### Average Hours Needed
```
Total Required Days = Count(SHOW) + Count(EMPTY weekdays)
Total Required Minutes = Total Required Days × minHoursPerDay
Total Logged Minutes = Sum(all logged time)
Remaining Days = Count(EMPTY weekdays from today to end of month)
Average Needed = (Total Required - Total Logged) / Remaining Days
```

## Data Structure (localStorage)
```json
{
  "settings": {
    "minHoursPerDay": 300,
    "minAttendancePercentage": 80
  },
  "calendarData": {
    "2025": {
      "10": {
        "15": { "status": "SHOW", "time": 480 },
        "16": { "status": "NO SHOW", "time": null }
      }
    }
  }
}
```

## UI/UX Features
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Dark Theme**: Professional dark gray color scheme
- **Hover Effects**: Interactive feedback on all clickable elements
- **Modal Overlays**: Centered modals with dark backdrop
- **Loading State**: Shows loading indicator while data initializes
- **Auto-save**: All changes automatically saved to localStorage
- **Validation**: Form validation prevents invalid data entry

## How to Run
1. The dev server is already running at http://localhost:5173/
2. Open the browser to view the application
3. The application will hot-reload on any file changes

## How to Build for Production
```powershell
npm run build
```
This creates an optimized production build in the `dist/` folder.

## Default Behavior
- Saturdays and Sundays automatically marked as WEEKEND (unless user changes them)
- Empty weekdays remain EMPTY until logged
- First visit initializes with default settings (5 hours/day, 80% attendance)
- Current month displayed by default

## Browser Compatibility
- Modern browsers with ES6+ support
- localStorage API required
- Tested on Chrome, Firefox, Edge, Safari

## Future Enhancement Possibilities
- Multiple user profiles
- Data backup to cloud
- Monthly/yearly reports
- Customizable color themes
- Calendar notes/comments
- Holiday calendar integration
- Email reminders
- CSV export option

## Notes
- All data stored locally in browser
- No backend required
- Zero operational cost
- Privacy-focused (no data leaves browser)
- Works offline after first load

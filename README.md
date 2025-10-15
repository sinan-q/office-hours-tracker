
# Office Hours Tracker

This is a client-side Office Hours Tracker built with React, Vite, and Tailwind CSS. It helps you track your attendance, working hours, and compliance with minimum requirements for your organization.

## Features

- Calendar view for daily status and time entry
- Edit each day as SHOW, NO SHOW, LEAVE, EXCEPTION, HOLIDAY, WEEKEND, or EMPTY
- Import/export data in JSON format (supports company format)
- Statistics panel:
  - Attendance percentage (with color coding)
  - Average hours for completed days
  - Average hours needed for remaining days
  - Days you can skip (NO SHOW) while maintaining minimum attendance
  - If attendance is below minimum even if you attend all remaining days, shows how many more SHOW days are needed
  - Shows number of EMPTY days left
- Settings for minimum hours per day and minimum attendance percentage
- Data is stored in browser localStorage

## Getting Started

1. **Install dependencies:**
	```sh
	npm install
	```
2. **Start the development server:**
	```sh
	npm run dev
	```
3. **Open your browser:**
	Visit [http://localhost:5173](http://localhost:5173)

## Usage

- Click on any day in the calendar to edit its status and time.
- Use the Data Manager to import/export your data.
- View your statistics in the right panel.
- Adjust minimum requirements in the settings panel.

## Technologies Used

- React
- Vite
- Tailwind CSS

## License

MIT

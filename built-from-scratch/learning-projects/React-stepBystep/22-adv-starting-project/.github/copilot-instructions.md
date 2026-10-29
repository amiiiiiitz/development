# Copilot Instructions for Events Application

## Project Overview
This is a full-stack events management application with a React frontend and Express.js backend. Both servers must run simultaneously—backend on port 8080, frontend on port 3000.

## Architecture

### Backend (Node.js/Express)
- **Entry:** [backend/app.js](../backend/app.js) - Express server with CORS middleware enabled for all requests
- **Routes:** [backend/routes/events.js](../backend/routes/events.js) - CRUD endpoints for `/events` and `/events/:id`
- **Data Layer:** [backend/data/event.js](../backend/data/event.js) - Reads/writes to `events.json` file (no database)
- **Validation:** [backend/util/validation.js](../backend/util/validation.js) - Helper functions: `isValidText()`, `isValidDate()`, `isValidImageUrl()`
- **Errors:** [backend/util/errors.js](../backend/util/errors.js) - Custom error classes for HTTP responses

### Frontend (React 19 + React Router 7)
- **Router Config:** [frontend/src/App.js](../frontend/src/App.js) - Defines all routes with loaders and actions
- **Pages:** [frontend/src/pages/](../frontend/src/pages/) - Route components that handle data fetching via loaders and form submission via actions
- **Components:** [frontend/src/components/](../frontend/src/components/) - Reusable UI components (EventForm, EventsList, EventItem, etc.)

## Critical Patterns

### 1. React Router Loader/Action Data Fetching
**Pattern:** Fetch happens BEFORE component renders, not inside components.

```javascript
// In a page component (e.g., EventsPage)
import { useLoaderData } from "react-router-dom";

function EventsPage() {
  const data = useLoaderData(); // Gets data from THIS route's loader
  return <EventsList events={data.events} />;
}

export async function loader() {
  const response = await fetch("http://localhost:8080/events");
  if (!response.ok) throw new Response(JSON.stringify({ message: "..." }), { status: 500 });
  return response;
}
```

**Important:** For child routes under a parent route with a loader, use `useRouteLoaderData("route-id")` instead:
```javascript
// EventDetailPage is a child under ":eventId" route (which has id: "event-detail")
const data = useRouteLoaderData("event-detail"); // Gets data from parent's loader
```

### 2. Form Submission with Actions
**Pattern:** React Router Form component automatically sends data to the action function.

```javascript
// In EventForm component
import { Form } from 'react-router-dom';

<Form method="post">
  <input name="title" required />
  <input name="date" type="date" required />
  <button>Save</button>
</Form>

// In the page component (NewEventPage)
export async function action({ request }) {
  const formData = await request.formData();
  const response = await fetch("http://localhost:8080/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: formData.get("title"),
      date: formData.get("date"),
      // ...
    }),
  });
  if (!response.ok) throw new Response(/* error */);
  return redirect("/events"); // Navigate after success
}
```

### 3. Backend API Response Format
All endpoints return a consistent JSON structure:

```javascript
// Success (GET all)
{ events: [ { id, title, date, image, description }, ... ] }

// Success (GET one)
{ event: { id, title, date, image, description } }

// Success (POST/PATCH)
{ message: "Event saved.", event: { ...data } }

// Validation Error (422)
{ message: "...", errors: { field1: "error", field2: "error" } }

// Server Error (500)
{ message: "..." }
```

### 4. Backend Validation Pattern
Always validate before database writes in [routes/events.js](../backend/routes/events.js):

```javascript
let errors = {};
if (!isValidText(data.title)) errors.title = 'Invalid title.';
if (!isValidDate(data.date)) errors.date = 'Invalid date.';
if (Object.keys(errors).length > 0) {
  return res.status(422).json({ message: "Validation errors.", errors });
}
// Proceed with add() or replace()
```

## Development Workflows

### Setup
```bash
# Terminal 1: Backend
cd backend
npm install
npm start  # Runs on http://localhost:8080

# Terminal 2: Frontend
cd frontend
npm install
npm start  # Runs on http://localhost:3000
```

### Common Tasks
- **Add new event field:** Update EventForm input → backend routes validation → data/event.js type handling
- **Create new page:** Add route in App.js router config → create page component with loader/action → add page file in /pages
- **API endpoint change:** Update fetch URL consistently in loaders/actions (currently "http://localhost:8080/events")

## Key Files to Know

| File | Purpose |
|------|---------|
| [backend/routes/events.js](../backend/routes/events.js) | All HTTP handlers (GET all, GET one, POST, PATCH, DELETE) |
| [backend/data/event.js](../backend/data/event.js) | CRUD functions that read/write events.json |
| [frontend/src/App.js](../frontend/src/App.js) | Router configuration with all routes, loaders, and actions |
| [frontend/src/components/EventForm.js](../frontend/src/components/EventForm.js) | Reusable form for creating/editing events |
| [frontend/src/pages/EventsPage.js](../frontend/src/pages/EventsPage.js) | Example of loader pattern for fetching all events |
| [frontend/src/pages/NewEventPage.js](../frontend/src/pages/NewEventPage.js) | Example of action pattern for form submission |

## Important Notes
- Data persists to `backend/events.json` only—no database queries
- Both frontend and backend must be running for the app to work
- Loaders execute before component mount; use them for data fetching, not useEffect
- CORS is pre-configured on the backend for all routes
- Use UUID for generating event IDs in the backend

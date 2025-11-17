# Installation Instructions

## Issue with Parent Workspace

This project is currently located within a pnpm workspace (`/Users/aaron/Downloads/ui-main/apps/`), which is causing npm installation conflicts.

## Solution Options

### Option 1: Move the Project (Recommended)

Move the `dashboard-react` folder outside of the workspace:

```bash
# From the current location
cd /Users/aaron/Downloads/ui-main/apps
mv dashboard-react /Users/aaron/Downloads/dashboard-react

# Then install
cd /Users/aaron/Downloads/dashboard-react
npm install
npm run dev
```

### Option 2: Install from Outside the Workspace

```bash
# Navigate to a parent directory outside the workspace
cd /Users/aaron/Downloads
cp -r ui-main/apps/dashboard-react ./dashboard-react-standalone
cd dashboard-react-standalone
npm install
npm run dev
```

### Option 3: Use pnpm (If Available)

Since the parent uses pnpm, you could also use pnpm:

```bash
cd /Users/aaron/Downloads/ui-main/apps/dashboard-react
pnpm install
pnpm dev
```

## After Installation

Once dependencies are installed, you can:

1. **Start development server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

2. **Build for production:**
   ```bash
   npm run build
   # or
   pnpm build
   ```

3. **Preview production build:**
   ```bash
   npm run preview
   # or
   pnpm preview
   ```

## Project Structure

The project has been fully migrated from Next.js to Vite + React with all dashboard functionality:

- ✅ All UI components copied and adapted
- ✅ Dashboard components migrated
- ✅ Theme system implemented (dark/light mode + color themes)
- ✅ Data table with sorting, filtering, drag-and-drop
- ✅ Interactive charts
- ✅ Responsive sidebar
- ✅ All styling and configurations set up

The application will run on `http://localhost:5173` by default.

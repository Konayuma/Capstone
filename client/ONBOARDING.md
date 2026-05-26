# CapstoneGuard Onboarding System

## Overview

The onboarding system provides first-time users with an interactive guided tour and persistent help center to learn how to use CapstoneGuard AI effectively.

### Key Features

- **Interactive Tour**: Guided walkthrough on first visit (localStorage-tracked)
- **Help Center**: Comprehensive FAQ with search functionality
- **Tooltips**: Contextual help hints on specific UI elements
- **Persistent Help Button**: Access help from anywhere via Help button in sidebar
- **Reduced Motion Support**: Respects `prefers-reduced-motion` accessibility setting

## Architecture

### Components

#### 1. **OnboardingContext** (`client/src/context/OnboardingContext.jsx`)
- Central state management for tour and help visibility
- Tracks onboarding completion status in localStorage
- Provides hooks: `useOnboarding()`
- Keys: `capstone_onboarding_complete`, `capstone_onboarding_skip`

#### 2. **OnboardingTour** (`client/src/components/OnboardingTour.jsx`)
- Interactive step-by-step tour for first-time users
- 7-step progression through key features
- Spotlight highlighting system for tour targets
- Supports navigation: Next, Back, Skip, Get Started
- Progress indicators (dots, step count)

#### 3. **HelpCenter** (`client/src/components/HelpCenter.jsx`)
- Modal-based comprehensive help section
- 7 documentation categories with 26 FAQ items
- Real-time search functionality
- Expandable/collapsible items with smooth animations
- Option to restart guided tour from help center

#### 4. **Tooltip** (`client/src/components/Tooltip.jsx`)
- Reusable contextual help component
- Supports positioning: top, bottom, left, right
- Theme variants: default, info, success, warning
- Two implementations:
  - `Tooltip`: Hover-activated with optional persistence
  - `InlineTooltip`: Integrated into UI elements

### Styling

#### CSS Files
- `client/src/styles/tooltip.css` - Tooltip styles & animations
- `client/src/styles/tour.css` - Tour modal & spotlight effects
- `client/src/styles/help-center.css` - Help center modal styles

#### Design Principles

**Animations** (200-300ms for state changes):
- Fade + slide entrances (GPU-accelerated with transform)
- Smooth easing curves (ease-out)
- Reduced motion support with minimal animations
- No bounce/elastic effects (kept restrained per user preference)

**Color Palette**:
- Dark text/backgrounds with brand accents
- Muted, professional tone (no neons/gradients)
- Subtle borders and shadows

## Tour Steps

The tour guides users through 7 steps:

1. **Welcome** - Introduction to CapstoneGuard
2. **Studio Board** - Project overview & management
3. **Requirements** - AI-powered requirements generation
4. **Tasks** - Task planning & evidence tracking
5. **Documents** - Document library & AI analysis
6. **Viva** - Practice questions & preparation
7. **Complete** - Getting started confirmation

## Tour Targets

Tour steps highlight specific UI elements via `data-tour` attributes:

| Target | Location | CSS Selector |
|--------|----------|-----|
| `studio-board` | Dashboard project lanes | `[data-tour="studio-board"]` |
| `requirements` | ProjectWorkspace Requirements tab | `[data-tour="requirements"]` |
| `tasks` | ProjectWorkspace Tasks tab | `[data-tour="tasks"]` |
| `documents` | ProjectWorkspace Documents tab | `[data-tour="documents"]` |
| `viva` | VivaPractice main layout | `[data-tour="viva"]` |

## Help Center Categories

1. **Getting Started** - Project creation, team invitations, roles
2. **Requirements & Analysis** - AI generation, editing, acceptance criteria
3. **Tasks & Evidence** - Task creation, evidence uploading, status tracking
4. **Documents & Analysis** - File types, AI analysis, GitHub sync
5. **Viva Practice** - Question generation, feedback, team preparation
6. **Collaboration & Feedback** - Comments, supervisor feedback, contributions
7. **Project Settings** - Configuration, deletion, leaving projects

## Usage

### For Users

**First Visit:**
- Tour appears automatically
- Can skip, navigate back/forward, or complete
- Completion stored in localStorage
- Can re-access tour via Help button → "Restart guided tour"

**Accessing Help:**
- Click "Help" button in sidebar footer
- Search for specific topics
- Expand/collapse FAQ items
- Restart tour from help center

**Tooltips:**
- Hover over info icons on UI elements
- Some tooltips appear on interaction

### For Developers

**Adding Tooltips:**
```jsx
import { Tooltip } from '../components/Tooltip';

<Tooltip text="This is helpful context" position="top">
  <button>Click me</button>
</Tooltip>
```

**Adding Tour Targets:**
```jsx
<button data-tour="feature-name">
  My Feature
</button>
```

Then update `tourSteps` in `OnboardingTour.jsx`:
```javascript
{
  id: 'feature-name',
  title: 'Feature Title',
  description: 'Explanation of the feature...',
  target: '[data-tour="feature-name"]',
  position: 'bottom',
}
```

**Managing Onboarding State:**
```jsx
import { useOnboarding } from '../context/OnboardingContext';

const MyComponent = () => {
  const { 
    showTour, 
    startTour, 
    openHelp, 
    onboardingComplete 
  } = useOnboarding();

  return <button onClick={openHelp}>Help</button>;
};
```

## localStorage Keys

| Key | Value | Purpose |
|-----|-------|---------|
| `capstone_onboarding_complete` | `'true'` | Tracks if user completed tour |
| `capstone_onboarding_skip` | `'true'` | Tracks if user skipped tour |

## Accessibility

### ARIA Labels
- All interactive elements have descriptive aria-labels
- Focus management within modals
- Semantic HTML structure

### Reduced Motion
- Animations disabled when `prefers-reduced-motion: reduce` is set
- Instant visibility without transitions
- No animation duration or iteration count changes

### Keyboard Navigation
- Tab through tour steps and FAQ items
- Enter/Space to activate buttons
- Escape to close modals (future enhancement)

## Performance

- **Bundle Impact**: ~5-8 KB gzipped (CSS + JS)
- **Initial Load**: Zero cost (components lazy-loaded on first use)
- **GPU Acceleration**: All animations use `transform` and `opacity`
- **No Layout Thrashing**: Calculations batched in effect hooks

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## Future Enhancements

- [ ] Keyboard shortcuts (Escape to close modals)
- [ ] Contextual tooltips for common errors
- [ ] Per-feature opt-in onboarding
- [ ] Multi-language support
- [ ] Analytics tracking for tour completion
- [ ] Deep linking to help topics
- [ ] Video tutorials embedded in help
- [ ] Tooltip persistence for key workflows

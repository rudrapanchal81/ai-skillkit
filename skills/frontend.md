---
name: frontend
description: Design React and CSS interfaces that are accessible, state-aware, visually consistent, and straightforward to maintain.
triggers:
  - Use when building or refining UI components, pages, or design-system-aligned React flows
  - Use when the task requires CSS layout, component states, accessibility, and interaction design together
  - Use when a request asks for practical frontend patterns instead of abstract design advice
anti-triggers:
  - Do not use when the task is primarily backend parsing or ingestion; use the file-reading skill if uploaded files are involved
  - Do not use when the deliverable is a document or office file; use docx, pdf, pptx, or xlsx as appropriate
  - Do not use when the request is only about copywriting or visual inspiration with no implementation need
---
# Frontend Skill

## Quick Reference

| Task | Approach |
| --- | --- |
| Build a new React component | Define the props contract first, then design loading, empty, error, and success states |
| Improve CSS layout | Start with spacing, hierarchy, and responsive breakpoints before micro-styling |
| Make a UI accessible | Use semantic elements, visible focus states, labels, and `aria-live` for async feedback |
| Stabilize interaction logic | Keep state transitions explicit and isolate derived values from raw input |
| Ship a polished feature | Verify hover, focus, disabled, mobile, and long-content states before handoff |

## Step-by-Step Instructions

### 1. Design from component contract to visual detail

For reliable UI work, decide these things in order:

1. Inputs: props, events, and external dependencies
2. States: loading, error, empty, success, disabled, destructive
3. Structure: semantic HTML and keyboard flow
4. Visual system: spacing, color, typography, and responsive behavior

If you style first and model states later, the component usually becomes fragile.

### 2. Build an accessible React component with explicit state handling

```jsx
import React, { useMemo, useState } from 'react';
import './PreferencesPanel.css';

export function PreferencesPanel({ initialSettings, onSave }) {
  const [form, setForm] = useState(initialSettings);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const isDirty = useMemo(function () {
    return JSON.stringify(form) !== JSON.stringify(initialSettings);
  }, [form, initialSettings]);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('saving');
    setMessage('');

    try {
      await onSave(form);
      setStatus('success');
      setMessage('Preferences saved successfully.');
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Unable to save preferences.');
    }
  }

  function updateField(key, value) {
    setForm(function (current) {
      return Object.assign({}, current, { [key]: value });
    });
  }

  return (
    <form className="preferences-panel" onSubmit={handleSubmit}>
      <div className="preferences-panel__header">
        <div>
          <h2>Workspace Preferences</h2>
          <p>Control notifications, summaries, and weekly reporting behavior.</p>
        </div>
        <button
          className="preferences-panel__save"
          type="submit"
          disabled={!isDirty || status === 'saving'}
        >
          {status === 'saving' ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      <div className="preferences-panel__grid">
        <label className="preferences-panel__field">
          <span>Email digest frequency</span>
          <select
            value={form.digestFrequency}
            onChange={function (event) {
              updateField('digestFrequency', event.target.value);
            }}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="never">Never</option>
          </select>
        </label>

        <label className="preferences-panel__checkbox">
          <input
            type="checkbox"
            checked={form.includeMetrics}
            onChange={function (event) {
              updateField('includeMetrics', event.target.checked);
            }}
          />
          <span>Include KPI metrics in digest emails</span>
        </label>

        <label className="preferences-panel__checkbox">
          <input
            type="checkbox"
            checked={form.notifyOnFailures}
            onChange={function (event) {
              updateField('notifyOnFailures', event.target.checked);
            }}
          />
          <span>Notify me immediately about failed automations</span>
        </label>
      </div>

      <p className="preferences-panel__status" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
```

```css
:root {
  --panel-bg: #ffffff;
  --panel-border: #d8e1f0;
  --panel-text: #1f2937;
  --panel-muted: #6b7280;
  --panel-primary: #2563eb;
  --panel-primary-hover: #1d4ed8;
  --panel-success: #157f3b;
  --panel-error: #b42318;
  --panel-shadow: 0 18px 40px rgba(37, 99, 235, 0.08);
}

.preferences-panel {
  display: grid;
  gap: 1.25rem;
  padding: 1.5rem;
  border: 1px solid var(--panel-border);
  border-radius: 1rem;
  background: var(--panel-bg);
  color: var(--panel-text);
  box-shadow: var(--panel-shadow);
}

.preferences-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 1rem;
}

.preferences-panel__header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.preferences-panel__header p {
  margin: 0.35rem 0 0;
  color: var(--panel-muted);
}

.preferences-panel__grid {
  display: grid;
  gap: 1rem;
}

.preferences-panel__field,
.preferences-panel__checkbox {
  display: grid;
  gap: 0.5rem;
}

.preferences-panel__field select {
  min-height: 2.75rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--panel-border);
  border-radius: 0.75rem;
  background: #fff;
}

.preferences-panel__checkbox {
  grid-template-columns: auto 1fr;
  align-items: center;
}

.preferences-panel__save {
  border: 0;
  border-radius: 999px;
  padding: 0.8rem 1.1rem;
  background: var(--panel-primary);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.preferences-panel__save:hover {
  background: var(--panel-primary-hover);
}

.preferences-panel__save:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.preferences-panel__save:focus-visible,
.preferences-panel__field select:focus-visible,
.preferences-panel__checkbox input:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.28);
  outline-offset: 2px;
}

.preferences-panel__status {
  min-height: 1.25rem;
  margin: 0;
  color: var(--panel-success);
}

@media (max-width: 640px) {
  .preferences-panel__header {
    flex-direction: column;
    align-items: stretch;
  }

  .preferences-panel__save {
    width: 100%;
  }
}
```

### 3. Check every state before calling the component done

For any meaningful component, verify all of these:

- Initial render
- Loading or saving state
- Empty values
- Validation failure
- Success confirmation
- Keyboard-only navigation
- Small-screen layout
- Long text overflow

### 4. Prefer system-level consistency over isolated cleverness

Use design tokens, utility classes, or a consistent naming approach. A component that looks nice in isolation but ignores the rest of the app will cost more later.

## Critical Rules

- Accessibility is not a finishing pass. Put semantic structure, labels, focus handling, and status messaging into the first implementation.
- Design all state transitions explicitly. Missing empty or error states are a common source of production UI debt.
- Resist decorative complexity. Good components communicate hierarchy, action, and feedback with minimal visual noise.
- Avoid deeply nesting layout wrappers unless each one has a clear job.
- Do not lock behavior and styling together so tightly that a small design update forces a logic rewrite.

## AI Mistakes to Avoid During Vibe Coding

- Do not replace semantic buttons, links, labels, and inputs with clickable `div` elements. AI-generated UI code does this often and silently breaks keyboard access and screen-reader behavior.
- Do not remove focus outlines unless you replace them with an equally visible focus treatment. Losing focus visibility is one of the fastest ways to make a UI feel broken.
- Do not model only the happy path. Loading, empty, error, disabled, validation, and long-content states must all be designed before calling the component done.
- Do not let local component state drift away from the real data contract. AI-generated forms often save stale values, compare objects incorrectly, or duplicate derived state unnecessarily.
- Do not optimize for screenshots over usability. A component that looks polished but has weak contrast, poor mobile layout, or confusing hierarchy is still incomplete.
- Do not assume a component is finished because the mouse flow works. Test keyboard navigation, focus order, screen-reader labels, and small-screen behavior every time.

## Dependencies

- `react` and `react-dom` for component rendering
- Plain CSS, CSS Modules, Tailwind, or a design-system layer depending on the project
- Optional testing tools such as `@testing-library/react` for state and accessibility validation

# Template System Usage Guide

This guide explains how to use the standardized template system for consistent styling across all pages.

## Quick Start

### 1. Import Required Components

```tsx
import { 
  PageTemplate, 
  PageHeader, 
  DataTableTemplate,
  DashboardCard,
  FilterSection,
  TEMPLATE_STYLES 
} from '../components/templates';
```

### 2. Basic Page Structure

```tsx
const MyPage = () => {
  return (
    <PageTemplate>
      <PageHeader 
        title="Page Title"
        subtitle="Page description"
        actions={
          <button className={TEMPLATE_STYLES.buttons.primary}>
            Add New
          </button>
        }
      />
      
      {/* Page content goes here */}
    </PageTemplate>
  );
};
```

## Template Components

### PageTemplate
Provides consistent page container with proper padding and max-width.

```tsx
<PageTemplate 
  variant="default" // or "tight" for less vertical padding
  maxWidth="normal" // or "wide" or "full"
>
  {/* Page content */}
</PageTemplate>
```

### PageHeader
Standardized page header with title, subtitle, and optional actions.

```tsx
<PageHeader 
  title="Employee Management"
  subtitle="Manage your organization's employees"
  actions={
    <>
      <button className={TEMPLATE_STYLES.buttons.secondary}>Export</button>
      <button className={TEMPLATE_STYLES.buttons.primary}>Add Employee</button>
    </>
  }
/>
```

### DataTableTemplate
Reusable data table with loading and empty states.

```tsx
<DataTableTemplate
  data={employees}
  columns={[
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { 
      key: 'actions', 
      header: 'Actions',
      render: (item) => (
        <button className={TEMPLATE_STYLES.buttons.primary}>
          Edit
        </button>
      )
    }
  ]}
  loading={loading}
  emptyMessage="No employees found"
/>
```

### DashboardCard
Card component for dashboard navigation and information display.

```tsx
<DashboardCard
  title="HR Management"
  subtitle="Employee management and organization"
  icon={<Users className={TEMPLATE_STYLES.icons.dashboard} />}
  bgColor="bg-blue-600"
  hoverColor="hover:bg-blue-700"
  onClick={() => navigate('/hr')}
/>
```

### FilterSection
Consistent filter container with responsive grid layout.

```tsx
<FilterSection columns={3}>
  <div>
    <label className={TEMPLATE_STYLES.typography.label}>Search</label>
    <input 
      type="text"
      className={TEMPLATE_STYLES.forms.input}
      placeholder="Search..."
    />
  </div>
  <div>
    <label className={TEMPLATE_STYLES.typography.label}>Status</label>
    <select className={TEMPLATE_STYLES.forms.select}>
      <option>All</option>
      <option>Active</option>
      <option>Inactive</option>
    </select>
  </div>
  <div>
    <label className={TEMPLATE_STYLES.typography.label}>Department</label>
    <select className={TEMPLATE_STYLES.forms.select}>
      <option>All Departments</option>
    </select>
  </div>
</FilterSection>
```

## Using TEMPLATE_STYLES

The `TEMPLATE_STYLES` object contains all standardized style classes:

### Typography
```tsx
<h1 className={TEMPLATE_STYLES.typography.pageTitle}>Main Title</h1>
<p className={TEMPLATE_STYLES.typography.pageSubtitle}>Subtitle text</p>
<h2 className={TEMPLATE_STYLES.typography.sectionTitle}>Section Title</h2>
<label className={TEMPLATE_STYLES.typography.label}>Form Label</label>
<span className={TEMPLATE_STYLES.typography.error}>Error message</span>
```

### Buttons
```tsx
<button className={TEMPLATE_STYLES.buttons.primary}>Primary Action</button>
<button className={TEMPLATE_STYLES.buttons.secondary}>Secondary</button>
<button className={TEMPLATE_STYLES.buttons.danger}>Delete</button>
```

### Forms
```tsx
<input type="text" className={TEMPLATE_STYLES.forms.input} />
<select className={TEMPLATE_STYLES.forms.select}>...</select>
<textarea className={TEMPLATE_STYLES.forms.textarea} />
<input type="checkbox" className={TEMPLATE_STYLES.forms.checkbox} />
```

### Grids
```tsx
<div className={TEMPLATE_STYLES.grids.twoColumn}>...</div>
<div className={TEMPLATE_STYLES.grids.threeColumn}>...</div>
<div className={TEMPLATE_STYLES.grids.fourColumn}>...</div>
```

### Spacing
```tsx
<div className={TEMPLATE_STYLES.spacing.sectionGap}>...</div>
<div className={TEMPLATE_STYLES.spacing.elementGap}>...</div>
```

## Example: Complete Data Management Page

```tsx
import React, { useState } from 'react';
import { 
  PageTemplate, 
  PageHeader, 
  FilterSection,
  DataTableTemplate,
  TEMPLATE_STYLES 
} from '../components/templates';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <PageTemplate variant="tight">
      <PageHeader 
        title="Employee Management"
        subtitle="Manage your organization's employees"
        actions={
          <button className={TEMPLATE_STYLES.buttons.primary}>
            Add Employee
          </button>
        }
      />

      <FilterSection columns={3}>
        <div>
          <label className={TEMPLATE_STYLES.typography.label}>
            Search Employees
          </label>
          <input 
            type="text"
            className={TEMPLATE_STYLES.forms.input}
            placeholder="Name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <label className={TEMPLATE_STYLES.typography.label}>
            Department
          </label>
          <select className={TEMPLATE_STYLES.forms.select}>
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Sales</option>
            <option>HR</option>
          </select>
        </div>
        <div>
          <label className={TEMPLATE_STYLES.typography.label}>
            Status
          </label>
          <select className={TEMPLATE_STYLES.forms.select}>
            <option>All</option>
            <option>Active</option>
            <option>On Leave</option>
            <option>Inactive</option>
          </select>
        </div>
      </FilterSection>

      <DataTableTemplate
        data={employees}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'department', header: 'Department' },
          { key: 'status', header: 'Status' },
          { 
            key: 'actions', 
            header: 'Actions',
            render: (employee) => (
              <div className="flex gap-2">
                <button className={TEMPLATE_STYLES.buttons.primary}>
                  Edit
                </button>
                <button className={TEMPLATE_STYLES.buttons.secondary}>
                  View
                </button>
              </div>
            )
          }
        ]}
        loading={loading}
        emptyMessage="No employees found"
      />
    </PageTemplate>
  );
};

export default EmployeesPage;
```

## Migration Checklist

When updating existing pages to use the template system:

1. Replace hardcoded container divs with `<PageTemplate>`
2. Replace title sections with `<PageHeader>`
3. Replace hardcoded tables with `<DataTableTemplate>`
4. Replace filter sections with `<FilterSection>`
5. Update all className strings to use `TEMPLATE_STYLES` constants
6. Use `combineClasses()` helper when combining multiple classes
7. Test responsive behavior on different screen sizes

## Benefits

- **Consistency**: All pages follow the same design patterns
- **Maintainability**: Changes to styles only need to be made in one place
- **Responsive**: Built-in responsive breakpoints
- **Type Safety**: TypeScript support for all components
- **Accessibility**: Consistent focus states and ARIA attributes
- **Performance**: Reusable components reduce code duplication
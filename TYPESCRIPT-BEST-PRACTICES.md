# TypeScript Best Practices for HSC Development

## 🎯 **Vercel-Ready TypeScript Standards**

Based on our Vercel deployment experience, these practices ensure code passes strict production builds from day one.

## 🚨 **Critical Rules - Always Follow**

### **1. Null/Undefined Safety**
```typescript
// ❌ NEVER do this:
const item = array.find(x => x.id === id);
return item.name; // Could crash if item is undefined!

// ✅ ALWAYS do this:
const item = array.find(x => x.id === id);
if (item) {
  return item.name;
}
// OR use optional chaining:
return array.find(x => x.id === id)?.name ?? 'Default';
```

### **2. Error Handling**
```typescript
// ❌ NEVER do this:
try {
  // risky code
} catch (error) {
  console.log(error.message); // error is 'unknown' type!
}

// ✅ ALWAYS do this:
try {
  // risky code
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(message);
}
```

### **3. DOM Event Typing**
```typescript
// ❌ NEVER do this:
const handleClick = (e: MouseEvent) => { ... }
element.addEventListener('click', handleClick); // Type mismatch!

// ✅ ALWAYS do this:
const handleClick = (e: Event) => {
  const mouseEvent = e as MouseEvent;
  // Use mouseEvent.clientX, etc.
}
element.addEventListener('click', handleClick);
```

### **4. Type Casting**
```typescript
// ❌ NEVER do this:
return payload as AuthToken; // Direct cast may fail

// ✅ ALWAYS do this:
return payload as unknown as AuthToken; // Safe double cast
```

### **5. Component Props**
```typescript
// ❌ NEVER do this:
interface Props {
  onSubmit: () => void; // But passing (data: FormData) => void
}

// ✅ ALWAYS do this:
interface Props {
  onSubmit: (data: FormData) => void; // Match exactly what you pass
}
// OR remove unused props entirely
```

## 🔧 **Next.js Specific Rules**

### **6. Dynamic Routes**
```typescript
// ✅ ALWAYS add this to API routes that use cookies/headers:
export const dynamic = 'force-dynamic';

export async function GET() {
  const cookies = cookies(); // Now safe for production
}
```

### **7. Client-Side Hooks**
```typescript
// ❌ NEVER do this:
export default function Page() {
  const searchParams = useSearchParams(); // No Suspense!
}

// ✅ ALWAYS do this:
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PageContent /> {/* useSearchParams() inside here */}
    </Suspense>
  );
}
```

## 🧪 **Development Workflow**

### **8. Test Builds Locally**
```bash
# ALWAYS run this before committing:
npm run build

# If it fails locally, it will fail on Vercel
# Fix all TypeScript errors before pushing
```

### **9. Environment Variables**
```typescript
// ✅ ALWAYS check environment variables exist:
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable is required');
}
```

## 📋 **Pre-Commit Checklist**

Before every commit, verify:

- [ ] `npm run build` passes locally
- [ ] All `find()` results are null-checked
- [ ] All `catch` blocks handle `unknown` error type
- [ ] All DOM event handlers use `Event` type
- [ ] All type casts use double casting if needed
- [ ] All client hooks are wrapped in `Suspense`
- [ ] All dynamic API routes have `export const dynamic = 'force-dynamic'`
- [ ] No unused props in component interfaces

## 🎯 **Common Patterns**

### **Safe Array Operations**
```typescript
// ✅ Safe find with fallback
const user = users.find(u => u.id === id) ?? defaultUser;

// ✅ Safe find with conditional
const user = users.find(u => u.id === id);
if (user) {
  // Use user safely
}
```

### **Safe API Calls**
```typescript
// ✅ Robust error handling
async function apiCall() {
  try {
    const response = await fetch('/api/endpoint');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}
```

### **Safe Component Props**
```typescript
// ✅ Only include props you actually use
interface ComponentProps {
  title: string;
  onClose: () => void;
  // Don't include unused props like onSubmit if not needed
}
```

## 🚀 **Why This Matters**

- **Vercel Production Builds**: Use strict TypeScript compilation
- **Runtime Safety**: Prevents crashes from null/undefined access
- **Developer Experience**: Catch errors at compile time, not runtime
- **Code Quality**: Forces explicit handling of edge cases
- **Deployment Success**: Ensures builds pass on first try

## 💡 **Remember**

> "If it doesn't build locally with strict TypeScript, it won't deploy to Vercel"

Always develop with production-level strictness to avoid deployment surprises!

---

**Last Updated**: After HSC Vercel deployment TypeScript fixes
**Status**: ✅ All patterns tested and verified on Vercel production builds 
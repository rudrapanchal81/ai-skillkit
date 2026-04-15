---
name: forms
description: Form handling, validation, and submission patterns with React Hook Form, Zod, and accessible form components
version: 1.0.0
category: frontend
tags: [forms, validation, react-hook-form, zod, formik, accessibility, input]
---

# Forms Skill

Production-ready form handling patterns with validation, accessibility, and optimal user experience.

## Quick Reference

| Request Type | Use This Skill | Don't Use If |
|--------------|----------------|--------------|
| Form validation with Zod | ✅ Yes | No validation needed |
| React Hook Form setup | ✅ Yes | Simple single input |
| Accessible form components | ✅ Yes | Backend-only validation |
| File upload forms | ✅ Yes | Read-only displays |
| Multi-step forms | ✅ Yes | Static content |

## Triggers

Use this skill when the request includes:
- Forms, input, validation, submit
- React Hook Form, Formik, form state
- Zod, Yup, validation schema
- File upload, image upload
- Multi-step form, wizard
- Form accessibility, ARIA

## Anti-Triggers

Do NOT use this skill when:
- Displaying read-only data
- No user input required
- Backend-only validation
- Static content pages

## Implementation Patterns

### 1. React Hook Form with Zod Validation

```tsx
// Basic form with validation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        setError('root', { message: error.message });
        return;
      }

      // Redirect or update auth state
      window.location.href = '/dashboard';
    } catch (error) {
      setError('root', { message: 'Network error. Please try again.' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && (
        <div className="error-message" role="alert">
          {errors.root.message}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className={errors.email ? 'input-error' : 'input'}
          aria-invalid={errors.email ? 'true' : 'false'}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="error-text" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password')}
          className={errors.password ? 'input-error' : 'input'}
          aria-invalid={errors.password ? 'true' : 'false'}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <p id="password-error" className="error-text" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="flex items-center">
        <input
          id="rememberMe"
          type="checkbox"
          {...register('rememberMe')}
          className="checkbox"
        />
        <label htmlFor="rememberMe" className="ml-2 text-sm">
          Remember me
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full"
      >
        {isSubmitting ? 'Logging in...' : 'Log in'}
      </button>
    </form>
  );
}
```

### 2. Complex Form with Nested Fields

```tsx
// User profile form with nested address
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().length(2, 'State must be 2 characters'),
    zipCode: z.string().regex(/^\d{5}$/, 'Invalid ZIP code'),
  }),
  preferences: z.object({
    newsletter: z.boolean(),
    notifications: z.boolean(),
  }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

function ProfileForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const onSubmit = async (data: ProfileFormData) => {
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <section>
        <h2>Personal Information</h2>
        
        <input {...register('name')} placeholder="Name" />
        {errors.name && <span>{errors.name.message}</span>}

        <input {...register('email')} type="email" placeholder="Email" />
        {errors.email && <span>{errors.email.message}</span>}

        <textarea {...register('bio')} placeholder="Bio" rows={4} />
        {errors.bio && <span>{errors.bio.message}</span>}
      </section>

      <section>
        <h2>Address</h2>
        
        <input {...register('address.street')} placeholder="Street" />
        {errors.address?.street && <span>{errors.address.street.message}</span>}

        <input {...register('address.city')} placeholder="City" />
        {errors.address?.city && <span>{errors.address.city.message}</span>}

        <input {...register('address.state')} placeholder="State" maxLength={2} />
        {errors.address?.state && <span>{errors.address.state.message}</span>}

        <input {...register('address.zipCode')} placeholder="ZIP Code" />
        {errors.address?.zipCode && <span>{errors.address.zipCode.message}</span>}
      </section>

      <section>
        <h2>Preferences</h2>
        
        <label>
          <input type="checkbox" {...register('preferences.newsletter')} />
          Subscribe to newsletter
        </label>

        <label>
          <input type="checkbox" {...register('preferences.notifications')} />
          Enable notifications
        </label>
      </section>

      <button type="submit" disabled={!isDirty}>
        Save Changes
      </button>
    </form>
  );
}
```

### 3. File Upload Form

```tsx
// File upload with preview and validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const uploadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  image: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, 'Image is required')
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      'Max file size is 5MB'
    )
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      'Only .jpg, .png and .webp formats are supported'
    ),
});

type UploadFormData = z.infer<typeof uploadSchema>;

function UploadForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  const imageFile = watch('image');

  useEffect(() => {
    if (imageFile?.[0]) {
      const file = imageFile[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, [imageFile]);

  const onSubmit = async (data: UploadFormData) => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('image', data.image[0]);

    await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="title">Title</label>
        <input id="title" {...register('title')} />
        {errors.title && <span>{errors.title.message}</span>}
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea id="description" {...register('description')} />
      </div>

      <div>
        <label htmlFor="image">Image</label>
        <input
          id="image"
          type="file"
          accept="image/*"
          {...register('image')}
        />
        {errors.image && <span>{errors.image?.message as string}</span>}
      </div>

      {preview && (
        <div>
          <p>Preview:</p>
          <img src={preview} alt="Preview" className="max-w-md" />
        </div>
      )}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}
```

### 4. Multi-Step Form

```tsx
// Multi-step wizard form
const step1Schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const step2Schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().regex(/^\d{10}$/),
});

const step3Schema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type FormData = Step1Data & Step2Data & Step3Data;

function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({});

  const handleStep1 = (data: Step1Data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const handleStep2 = (data: Step2Data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(3);
  };

  const handleStep3 = async (data: Step3Data) => {
    const finalData = { ...formData, ...data } as FormData;
    
    await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalData),
    });
  };

  return (
    <div>
      <div className="steps">
        <div className={step >= 1 ? 'active' : ''}>Account</div>
        <div className={step >= 2 ? 'active' : ''}>Personal</div>
        <div className={step >= 3 ? 'active' : ''}>Professional</div>
      </div>

      {step === 1 && <Step1Form onNext={handleStep1} defaultValues={formData} />}
      {step === 2 && <Step2Form onNext={handleStep2} onBack={() => setStep(1)} defaultValues={formData} />}
      {step === 3 && <Step3Form onSubmit={handleStep3} onBack={() => setStep(2)} defaultValues={formData} />}
    </div>
  );
}

function Step1Form({ onNext, defaultValues }: { onNext: (data: Step1Data) => void; defaultValues: Partial<FormData> }) {
  const { register, handleSubmit, formState: { errors } } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)}>
      <h2>Create Account</h2>
      
      <input {...register('email')} type="email" placeholder="Email" />
      {errors.email && <span>{errors.email.message}</span>}

      <input {...register('password')} type="password" placeholder="Password" />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit">Next</button>
    </form>
  );
}
```

### 5. Dynamic Form Fields

```tsx
// Dynamic array fields (e.g., adding multiple phone numbers)
import { useFieldArray } from 'react-hook-form';

const contactSchema = z.object({
  name: z.string().min(1),
  phones: z.array(
    z.object({
      type: z.enum(['mobile', 'home', 'work']),
      number: z.string().regex(/^\d{10}$/),
    })
  ).min(1, 'At least one phone number is required'),
});

type ContactFormData = z.infer<typeof contactSchema>;

function ContactForm() {
  const { register, control, handleSubmit, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      phones: [{ type: 'mobile', number: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'phones',
  });

  const onSubmit = (data: ContactFormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Name</label>
        <input {...register('name')} />
        {errors.name && <span>{errors.name.message}</span>}
      </div>

      <div>
        <label>Phone Numbers</label>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <select {...register(`phones.${index}.type`)}>
              <option value="mobile">Mobile</option>
              <option value="home">Home</option>
              <option value="work">Work</option>
            </select>

            <input
              {...register(`phones.${index}.number`)}
              placeholder="Phone number"
            />

            <button type="button" onClick={() => remove(index)}>
              Remove
            </button>

            {errors.phones?.[index]?.number && (
              <span>{errors.phones[index]?.number?.message}</span>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => append({ type: 'mobile', number: '' })}
        >
          Add Phone
        </button>
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

### 6. Form with Dependent Fields

```tsx
// Conditional fields based on other field values
const shippingSchema = z.object({
  sameAsBilling: z.boolean(),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  }).optional(),
}).refine(
  (data) => data.sameAsBilling || data.shippingAddress,
  {
    message: 'Shipping address is required when different from billing',
    path: ['shippingAddress'],
  }
);

function ShippingForm() {
  const { register, watch, formState: { errors } } = useForm({
    resolver: zodResolver(shippingSchema),
  });

  const sameAsBilling = watch('sameAsBilling');

  return (
    <form>
      <label>
        <input type="checkbox" {...register('sameAsBilling')} />
        Same as billing address
      </label>

      {!sameAsBilling && (
        <div>
          <h3>Shipping Address</h3>
          <input {...register('shippingAddress.street')} placeholder="Street" />
          <input {...register('shippingAddress.city')} placeholder="City" />
          <input {...register('shippingAddress.state')} placeholder="State" />
          <input {...register('shippingAddress.zip')} placeholder="ZIP" />
        </div>
      )}
    </form>
  );
}
```

## Critical Rules

1. **Always validate on both client and server**
   - Client validation for UX
   - Server validation for security
   - Never trust client-side validation alone

2. **Use proper HTML input types**
   - `type="email"` for emails
   - `type="tel"` for phones
   - `type="number"` for numbers
   - Provides native validation and mobile keyboards

3. **Make forms accessible**
   - Use `<label>` with `htmlFor`
   - Add `aria-invalid` for errors
   - Use `aria-describedby` for error messages
   - Ensure keyboard navigation works

4. **Show clear error messages**
   - Display errors near the field
   - Use role="alert" for screen readers
   - Show field-level and form-level errors
   - Provide helpful error text

5. **Disable submit during submission**
   - Prevent double submissions
   - Show loading state
   - Disable form or show spinner

6. **Handle file uploads properly**
   - Validate file size and type
   - Show upload progress
   - Provide preview when possible
   - Use FormData for multipart uploads

7. **Preserve form state**
   - Save drafts for long forms
   - Warn before leaving with unsaved changes
   - Use localStorage for persistence

8. **Optimize performance**
   - Use controlled inputs sparingly
   - Debounce expensive validations
   - Lazy load heavy form libraries

## Common Mistakes to Avoid

1. ❌ Not validating on server
2. ❌ Missing labels for inputs
3. ❌ Not showing error messages
4. ❌ Allowing double submissions
5. ❌ Not handling file upload errors
6. ❌ Poor mobile experience
7. ❌ Not preserving form state
8. ❌ Inaccessible forms

## Dependencies

```json
{
  "react-hook-form": "^7.49.0",
  "@hookform/resolvers": "^3.3.0",
  "zod": "^3.22.0"
}
```

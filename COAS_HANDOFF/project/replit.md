# E-COAS Interior Hardware Platform

## Overview

E-COAS is a modern web application showcasing premium interior hardware solutions. The platform serves as a digital catalog for sliding door systems, cabinet fittings, glass systems, and architectural accessories. Built with a focus on bilingual support (Korean/English), the application features product browsing, intelligent search capabilities, and catalog request management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React with TypeScript, utilizing Vite as the build tool and development server. The application follows a single-page application (SPA) architecture with client-side routing via Wouter.

**UI Framework**: Built on shadcn/ui components (New York variant) with Radix UI primitives, styled using Tailwind CSS v4 with CSS variables for theming. The design system supports a light/dark theme with industrial aesthetics emphasizing cool whites, grays, and deep steel blue tones.

**State Management**: TanStack React Query (v5) handles server state management, caching, and data fetching. The query client is configured with infinite stale time and disabled automatic refetching to optimize performance.

**Component Structure**: Components are organized into distinct categories:
- `/components/ui`: Reusable shadcn/ui design system components
- `/components`: Application-specific components (Layout, SearchModal, CatalogRequestDialog)
- `/pages`: Route-level page components

**Internationalization**: The application implements bilingual support throughout, with Korean as the primary language and English as secondary. Product names, descriptions, and UI elements are duplicated in both languages.

**Animation**: Framer Motion is integrated for page transitions and interactive animations, enhancing the user experience with smooth motion effects.

### Backend Architecture

**Runtime**: Node.js with Express.js framework running in ESM mode. The server handles both API routes and static file serving.

**API Design**: RESTful API architecture with the following endpoints:
- `/api/catalog-requests`: POST/GET for catalog request management
- `/api/products`: Product listing and search
- `/api/search`: AI-enhanced product search with natural language processing
- `/api/seed-products`: Development endpoint for database seeding

**Build Strategy**: Custom build script uses esbuild to bundle server code with selective dependency bundling. Performance-critical dependencies are bundled to reduce filesystem syscalls and improve cold start times. The allowlist includes database drivers, ORM, session management, and other frequently accessed packages.

**Request Logging**: Custom middleware logs all API requests with timing information, providing visibility into endpoint performance.

### Data Layer

**ORM**: Drizzle ORM configured for PostgreSQL with schema-first development. Database schemas are defined in TypeScript and automatically generate Zod validation schemas for runtime type safety.

**Database Schema**:
- `products`: Core product catalog with bilingual fields (name, description, category), specifications, weight capacity, page references, and search optimization fields
- `catalog_requests`: Customer catalog request forms with contact information
- `search_queries`: Search analytics logging for query optimization

**Data Access Pattern**: Repository pattern implemented through the `IStorage` interface with `DatabaseStorage` implementation. This abstraction layer allows for future storage backend changes without affecting business logic.

**Schema Validation**: Drizzle-Zod integration provides automatic validation schema generation from database schemas, ensuring data integrity across the application stack.

### Build and Development

**Development Mode**: Vite dev server runs on port 5000 with HMR (Hot Module Replacement) over WebSocket. Custom Vite middleware integrates with Express for unified development experience.

**Production Build**: Two-phase build process:
1. Vite builds client application to `dist/public`
2. esbuild bundles server code to `dist/index.cjs`

**TypeScript Configuration**: Strict mode enabled with path aliases for clean imports (`@/`, `@shared/`, `@assets/`). Bundler module resolution strategy optimizes for modern tooling.

**Asset Management**: Custom Vite plugin (`vite-plugin-meta-images`) automatically updates OpenGraph and Twitter card meta tags with correct deployment URLs for social media sharing.

**Replit Integration**: Conditional development plugins (cartographer, dev-banner, runtime-error-modal) enhance the Replit development experience without affecting production builds.

### Authentication and Sessions

Currently not implemented. The application is public-facing with no user authentication system. Catalog requests are submitted anonymously with contact information.

### Performance Optimizations

**Code Splitting**: Vite automatically code-splits the application, lazy-loading route components and vendor dependencies.

**Image Optimization**: Product images are stored in the `attached_assets` directory and referenced via path aliases. The application supports multiple image formats (PNG, JPG, JPEG, GIF).

**Database Queries**: The storage layer implements efficient querying patterns with Drizzle ORM's type-safe query builder, including full-text search capabilities using PostgreSQL's `ilike` operator.

**Caching Strategy**: React Query manages client-side caching with infinite stale time, reducing unnecessary network requests.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store accessed via connection string from `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe ORM with schema migrations stored in `/migrations` directory

### AI Services
- **OpenAI API**: Powers the intelligent product search feature with natural language understanding
  - Configured via `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY`
  - Used for semantic search and AI-generated product recommendations

### UI Component Libraries
- **Radix UI**: Headless UI primitives for accessible component patterns
- **Lucide React**: Icon library providing consistent iconography
- **shadcn/ui**: Pre-built component system built on Radix UI

### Development Tools
- **Replit Platform**: Deployment and hosting environment with specialized Vite plugins
- **Vite**: Frontend build tool and development server
- **esbuild**: Fast JavaScript bundler for server-side code

### Styling
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Custom Fonts**: Google Fonts integration for Manrope and Plus Jakarta Sans typefaces

### Form Handling
- **React Hook Form**: Form state management with `@hookform/resolvers` for schema validation integration
- **Zod**: Runtime type validation library used throughout the application

### Additional Services
The application structure suggests potential for future integrations (nodemailer for emails, Stripe for payments) based on package dependencies, though these are not currently active in the codebase.
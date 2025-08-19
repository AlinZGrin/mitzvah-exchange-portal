# Mitzvah Exchange Portal

A comprehensive community platform where members can post mitzvah opportunities and others can claim and fulfill them. Built with Next.js, TypeScript, Tailwind CSS, and Prisma.

## 🌟 Features

### Core Platform Features
- **User Authentication**: Email/password registration with verification
- **Community Profiles**: Member profiles with skills, availability, and reputation
- **Mitzvah Requests**: Create, categorize, and manage community needs
- **Discovery System**: Search, filter, and browse available opportunities
- **Assignment Workflow**: Claim → In Progress → Complete → Confirm process
- **Points & Recognition**: Earn points and build reputation through completed mitzvahs
- **Real-time Notifications**: Stay updated on claims, completions, and community activity
- **Safety & Moderation**: Flagging, verification, and community oversight

### Mitzvah Categories
- **Visits**: Companionship and social visits
- **Transportation**: Rides to appointments, errands, events
- **Errands**: Shopping, pickup/delivery, administrative tasks
- **Tutoring**: Educational support and skill sharing
- **Meals**: Food preparation and delivery
- **Household**: Home maintenance and organization
- **Technology**: Computer help, device setup, digital literacy
- **Other**: Flexible category for unique needs

### User Roles
- **Members**: Create requests, claim mitzvahs, earn points
- **Moderators**: Review flagged content, verify users, resolve disputes
- **Administrators**: Full platform management and configuration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm/bun
- SQLite (for development)

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Copy `.env.local` and configure:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
EMAIL_SERVER_USER="your-email@example.com"
# ... other settings
```

3. **Initialize the database:**
```bash
npx prisma generate
npx prisma db push
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the portal.

### Building for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── app/
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # User dashboard
│   ├── discover/       # Browse mitzvahs
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Homepage
├── components/
│   ├── layout/         # Navigation and layout components
│   └── providers/      # Context providers
prisma/
├── schema.prisma       # Database schema
```

## 🎯 MVP Implementation Status

### ✅ Completed Features
- [x] Responsive UI with mobile-first design
- [x] User registration and authentication flow
- [x] Member profiles and preferences
- [x] Mitzvah request creation and management
- [x] Discovery system with search and filters
- [x] Assignment workflow (claim → complete → confirm)
- [x] Points system and recognition
- [x] Dashboard with activity tracking
- [x] Category-based organization
- [x] Safety features (flagging, moderation)

### 🚧 In Development
- [ ] Database integration with Prisma
- [ ] Email notifications system
- [ ] Real-time messaging between users
- [ ] Payment integration (optional)
- [ ] Mobile app (post-MVP)
- [ ] Advanced analytics and reporting

## 🔧 Technical Implementation

### Database Schema
- **Users**: Authentication, roles, status
- **Profiles**: Display info, skills, preferences
- **Requests**: Mitzvah opportunities with metadata
- **Assignments**: Workflow tracking
- **Points System**: Ledger and rules
- **Messaging**: Secure communication
- **Moderation**: Flags, reviews, audit logs

### API Routes (Planned)
- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User and profile management
- `/api/requests/*` - Mitzvah CRUD operations
- `/api/assignments/*` - Workflow management
- `/api/points/*` - Points calculation and history
- `/api/admin/*` - Administrative functions

## 🛡️ Safety & Trust Features

- **Identity Verification**: Email verification required, optional ID verification
- **Community Moderation**: User flagging and moderator review system
- **Reputation System**: Points, completion rates, and peer reviews
- **Privacy Protection**: Limited contact info sharing until assignment
- **Audit Trails**: Complete activity logging for accountability

## 🎨 Design Principles

- **Mobile-First**: Optimized for smartphone usage
- **Accessibility**: WCAG 2.1 AA compliance
- **Intuitive UX**: Clear workflows and progressive disclosure
- **Community Focus**: Encouraging participation and recognition
- **Trust & Safety**: Transparent systems building community confidence

## 📱 Future Enhancements

### Phase 2 Features
- **Group Mitzvahs**: Team-based large projects
- **Scheduling Integration**: Calendar sync and availability matching
- **Geographic Optimization**: Route planning and clustering
- **Advanced Matching**: AI-powered request-to-member matching
- **Community Groups**: Neighborhood or interest-based sub-communities

### Phase 3 Features
- **Mobile Native Apps**: iOS and Android applications
- **Volunteer Hour Tracking**: Integration with organizational requirements
- **Impact Metrics**: Community-wide impact measurement and reporting
- **API Platform**: Third-party integrations and partnerships

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and intended for community use. See LICENSE file for details.

## 🙏 Acknowledgments

Built with modern web technologies to serve community needs and foster meaningful connections through acts of kindness.

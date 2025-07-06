# Shree Doodh - Milk Tracking Application

Shree Doodh is a comprehensive web application designed to help users track and manage their daily milk consumption, expenses, and sources. The application provides an intuitive dashboard with detailed analytics and insights to help users optimize their milk purchases.

## Features

### Dashboard
- **Stats Cards**: Track today's milk quantity, expenses, monthly totals, average price, and registered sources
- **Interactive Charts**: Visualize milk usage trends, expense distribution, source-wise supply, and more
- **Smart Insights**: Get suggestions for cheapest sources, price hike alerts, and missed day notifications
- **Monthly Calendar**: See milk delivery status for each day with color-coded indicators
- **Budget Tracking**: Monitor your monthly milk budget with a progress bar
- **Quick Notes**: Add dated notes for any special requests or issues

### Milk Records
- Add daily milk records with details like quantity, price, source, and notes
- Auto-update records for daily sources
- Track occasional purchases separately

### Statistics
- View comprehensive charts for daily/monthly/yearly milk quantity
- Analyze expenses per source
- Track price fluctuations over time
- Compare weekly consumption patterns

### Source & Pricing
- Manage milk sources with contact information
- Track price history with automatic hike/drop detection
- Set purchase frequency (daily/occasional)

## Authentication System

The application implements a secure authentication system with the following features:

1. **User Authentication**:
   - Email/password login
   - Google authentication
   - Password reset functionality

2. **Protected Pages**:
   - All pages in the `users/` directory are protected
   - Unauthenticated users are redirected to the login page
   - After login, users are redirected to their originally requested page

3. **User Data Management**:
   - User profiles are stored in Firebase Realtime Database
   - Profile information includes name, email, and profile picture
   - No sensitive data is stored in browser localStorage

4. **Profile Management**:
   - Users can update their profile information
   - Profile pictures can be uploaded and stored
   - User preferences are saved to their profile

## Technology Stack

- HTML5, CSS3, JavaScript
- Firebase Authentication and Realtime Database
- Chart.js for data visualization
- Responsive design for mobile and desktop

## Setup Instructions

1. Clone the repository
```
git clone https://github.com/yourusername/shree-doodh.git
```

2. Set up Firebase
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Authentication (Email/Password and Google Sign-In)
   - Create a Realtime Database
   - Add your Firebase configuration to `users/config/firebase-config.js`

3. Open the project in a web server
   - You can use any local development server like Live Server for VS Code
   - Or deploy to Firebase Hosting for production

## Project Structure

```
Shree Doodh/
├── assets/             # Main landing page assets
├── index.html          # Landing page
├── pages/              # Landing page additional pages
└── users/              # User dashboard and application
    ├── assets/         # CSS, JS, and images
    ├── auth/           # Authentication pages
    ├── components/     # Reusable components
    ├── config/         # Firebase configuration
    ├── dashboard.html  # Main dashboard
    └── pages/          # Application pages
```

## Color Palette

### Light Mode
- Primary: #00BFA6 (Mint Green)
- Secondary: #F5F5F5 (Light Gray)
- Accent: #FFC93C (Warm Yellow)
- Text: #202124 (Rich Black)

### Dark Mode
- Primary: #0E202A (Dark Blue)
- Secondary: #1C2A36 (Navy Blue)
- Accent: #8DECB4 (Light Green)
- Text: #FFFFFF (White)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

Designed and developed by [Gagan Creates](https://gaganpratap.vercel.app/) 
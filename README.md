# Tasking Quest Board

A gamified productivity system that transforms task management into an engaging quest experience. Built with Next.js, TypeScript, and a custom quest board component.

![Tasking App](https://img.shields.io/badge/Next.js-15.5.4-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![CSS](https://img.shields.io/badge/CSS-3-blue?style=flat-square&logo=css3)

## Features

🎮 **Gamified Experience** - Turn your daily tasks into rewarding quests
🏆 **Points & Streaks** - Earn points for completing quests and maintain daily streaks
📋 **Daily Quests** - Pre-built productivity quests focused on common goals
🎯 **Custom Quests** - Add your own personalized quests with custom point values
📊 **Progress Tracking** - Visual progress bar showing daily completion percentage
⚡ **Auto-Save** - All progress automatically saved to localStorage
🌙 **Dark Mode Support** - Beautiful UI that adapts to your system preferences
📱 **Mobile Responsive** - Works perfectly on all device sizes

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) with App Router
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **UI Components:** Custom components built with Radix UI primitives

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd tasking
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page with quest board
│   └── globals.css        # Global styles + Quest Board CSS
├── components/            # React components
│   └── GenericQuestBoard.tsx # Main quest board component
└── lib/                  # Utilities (if needed for extensions)
    └── utils.ts          # Utility functions
```

## How to Use

### Completing Daily Quests
1. Review the available daily productivity quests
2. Click the checkbox next to any quest to mark it complete
3. Earn points immediately when you complete a quest
4. Watch your daily progress bar fill up as you complete more quests

### Adding Custom Quests
1. Use the "Quest title" field to enter your custom quest
2. Set the point value (1-1000 points)
3. Click "Add Quest" to add it to your daily list
4. Custom quests are saved per day and persist between sessions

### Points & Streaks System
- **Points**: Earned for each completed quest (varies by quest difficulty)
- **Daily Streaks**: Maintained by completing at least one quest each day
- **Progress Tracking**: Visual progress bar shows completion percentage
- **Auto-Save**: All progress is automatically saved to your browser

### Quest Management
- **Complete**: Check off quests as you finish them
- **Reset Day**: Use "Reset Today" button to clear all progress for the current day
- **Persistent Storage**: Your progress carries over between browser sessions

## Customization

### Styling
The app uses Tailwind CSS for styling. You can customize the design by:
- Modifying the Tailwind classes in components
- Adding custom styles in `src/app/globals.css`
- Updating the color scheme in Tailwind configuration

### Features
The GenericQuestBoard component is highly customizable. You can extend it with:
- Custom quest templates for different productivity systems
- Integration with external APIs for quest suggestions
- Database persistence instead of localStorage
- User authentication and cross-device sync
- Team-based quest boards and leaderboards
- Custom point multipliers and bonus systems

## Building for Production

```bash
npm run build
npm run start
```

## Deploy

### Vercel (Recommended)
The easiest way to deploy is using [Vercel](https://vercel.com/new):

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in Vercel
3. Deploy with zero configuration

### Other Platforms
This Next.js app can be deployed on any platform that supports Node.js:
- Netlify
- Heroku
- Railway
- DigitalOcean
- AWS

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

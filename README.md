# AiTend

A modern AI-powered interview preparation platform that helps job seekers practice and improve their interview skills through realistic simulations.

## What it does

AiTend provides a comprehensive interview practice environment where users can:

- **Create AI Agents**: Build custom AI interviewers with specific roles, companies, and question styles
- **Practice Interviews**: Engage in real-time video calls with AI agents that conduct realistic interviews
- **Review Performance**: Access recorded sessions, transcripts, and AI-generated summaries
- **Get Feedback**: Receive detailed analysis and improvement suggestions from AI coaches
- **Track Progress**: Monitor interview performance over time

## Key Features

- **Real-time Video Interviews**: Powered by Stream Video SDK for seamless video calls
- **AI Conversation**: Uses OpenAI's Realtime API for natural, conversational interviews
- **Smart Transcription**: Automatic transcription and analysis of interview sessions
- **Custom AI Agents**: Create agents tailored to specific job roles and companies
- **Interview Analytics**: Detailed feedback on communication, answers, and areas for improvement
- **Secure Authentication**: User management with social login options

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: tRPC, Drizzle ORM, PostgreSQL
- **AI Integration**: OpenAI Realtime API, GPT-4
- **Video**: Stream Video SDK
- **Authentication**: Better Auth
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- OpenAI API key
- Stream API credentials

### Installation

1. Clone the repository

```bash
git clone https://github.com/HimanshuxD79/aitend.git
cd aitend
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env
```

Fill in your API keys and database credentials in the `.env` file.

4. Set up the database

```bash
npm run db:push
```

5. Start the development server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Environment Variables

The following environment variables are required:

```
DATABASE_URL=your_postgresql_url
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_SECRET_KEY=your_stream_secret_key
NEXT_PUBLIC_STREAM_CHAT_API_KEY=your_stream_chat_api_key
STREAM_CHAT_SECRET_KEY=your_stream_chat_secret_key
OPENAI_API_KEY=your_openai_api_key
BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_URL=http://localhost:3000
```

## Usage

1. **Sign up** for an account
2. **Create an AI agent** with specific interview parameters
3. **Start an interview** session with your chosen agent
4. **Complete the interview** and review your performance
5. **Analyze feedback** to improve your skills

## Contributing

This is a personal project, but suggestions and feedback are welcome. Feel free to open an issue if you find bugs or have feature requests.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Created by [Himanshu](https://github.com/HimanshuxD79) - feel free to reach out with any questions.

export interface Feature {
    title: string;
    description: string;
    icon?: string;
}

export const features: Feature[] = [
    {
        title: "Virtual Hackathon Arena",
        description: "Enter a 2D gamified environment where participants can move around, interact, discover hackathons, and meet fellow innovators — just like an in-person event."
    },
    {
        title: "Host Your Own Hackathons",
        description: "Organizers can easily create, manage, and customize hackathons with features like team formation, real-time chats, project submissions, voting, and live sessions."
    },
    {
        title: "Explore Opportunities",
        description: "Users can browse and join upcoming hackathons from around the world, filter by interest, domain, or tech stack, and build their network in a virtual yet personal way."
    },
    {
        title: "Gamification & Leaderboards",
        description: "Earn XP, climb leaderboards, and win rewards. HackMeet makes participating fun and competitive at the same time."
    },
    {
        title: "AI & Collaboration Tools",
        description: "Smart matchmaking, AI-powered idea generation, and integration with tools like Excalidraw and Eraser for collaborative brainstorming."
    }
]; 
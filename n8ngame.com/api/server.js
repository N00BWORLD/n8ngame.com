import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifySocketIO from 'fastify-socket.io';
import cookie from '@fastify/cookie';

dotenv.config();

const fastify = Fastify({
    logger: true,
    trustProxy: true // trust nginx headers for IP rate limits
});

// Plugins
fastify.register(cookie, {
    secret: process.env.SESSION_SECRET || 'dev-secret-must-be-long-enough',
    parseOptions: {}
});

fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || "https://n8ngame.com",
    methods: ["GET", "POST"],
    credentials: true // Allow cookies
});

fastify.register(fastifySocketIO, {
    cors: {
        origin: process.env.CORS_ORIGIN || "https://n8ngame.com",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Routes
fastify.register(apiRoutes, { prefix: '/api' });

// Socket Gateway
fastify.ready().then(() => {
    gameGateway(fastify.io);
});

// Start
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3000');
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on ${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();

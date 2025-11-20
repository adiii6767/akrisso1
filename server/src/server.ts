import Fastify from 'fastify';
import cors from '@fastify/cors';
import prisma from './db';
import dotenv from "dotenv";
import { contactRoutes } from "./routes/contact.routes";


dotenv.config();


const server = Fastify({ logger: true });

// Enable CORS
server.register(cors, {
  origin: 'http://localhost:4200'
});

// Graceful shutdown
const gracefulShutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// GET all users
server.get('/api/users', async (request, reply) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return users;
  } catch (error) {
    reply.code(500).send({ error: 'Failed to fetch users' });
  }
});

// GET single user by ID
server.get<{ Params: { id: string } }>('/api/users/:id', async (request, reply) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(request.params.id) }
    });
    
    if (!user) {
      reply.code(404).send({ error: 'User not found' });
      return;
    }
    
    return user;
  } catch (error) {
    reply.code(500).send({ error: 'Failed to fetch user' });
  }
});

// POST create new user
server.post<{ Body: { name: string; email: string } }>('/api/users', async (request, reply) => {
  try {
    const { name, email } = request.body;
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      reply.code(400).send({ error: 'Email already exists' });
      return;
    }
    
    const newUser = await prisma.user.create({
      data: { name, email }
    });
    
    reply.code(201).send(newUser);
  } catch (error) {
    reply.code(500).send({ error: 'Failed to create user' });
  }
});

// PUT update user
server.put<{ Params: { id: string }; Body: { name: string; email: string } }>('/api/users/:id', async (request, reply) => {
  try {
    const { name, email } = request.body;
    const id = parseInt(request.params.id);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      reply.code(404).send({ error: 'User not found' });
      return;
    }
    
    // Check if email is taken by another user
    const emailTaken = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id }
      }
    });
    
    if (emailTaken) {
      reply.code(400).send({ error: 'Email already exists' });
      return;
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, email }
    });
    
    return updatedUser;
  } catch (error) {
    reply.code(500).send({ error: 'Failed to update user' });
  }
});

// DELETE user
server.delete<{ Params: { id: string } }>('/api/users/:id', async (request, reply) => {
  try {
    const id = parseInt(request.params.id);
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!existingUser) {
      reply.code(404).send({ error: 'User not found' });
      return;
    }
    
    await prisma.user.delete({
      where: { id }
    });
    
    reply.code(204).send();
  } catch (error) {
    reply.code(500).send({ error: 'Failed to delete user' });
  }
});

// Start server
const start = async () => {
  try {
    await server.listen({ port: 3000 });
    console.log('Server running on http://localhost:3000');
    console.log('Connected to PostgreSQL database');
  } catch (err) {
    server.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
};
server.register(contactRoutes);

start();
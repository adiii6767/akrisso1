import { FastifyInstance } from "fastify";
import prisma from "../db";

export async function contactRoutes(app: FastifyInstance) {

  // GET all contacts
  app.get('/api/contacts', async (req, reply) => {
    try {
      const contacts = await prisma.contact.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return { success: true, data: contacts };
    } catch (error) {
      reply.code(500).send({ success: false, message: "Failed to fetch contacts" });
    }
  });

  // POST create contact
  app.post('/api/contact', async (req, reply) => {
    try {
      const { name, email, phone, company, message } = req.body as any;

      const contact = await prisma.contact.create({
        data: { name, email, phone, company, message }
      });

      reply.send({ success: true, data: contact });
    } catch (error) {
      reply.code(500).send({ success: false, message: "Failed to create contact" });
    }
  });
}

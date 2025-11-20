import { FastifyInstance } from "fastify";
import prisma from "../db";

export async function contactRoutes(app: FastifyInstance) {

  // POST → Create a new contact message
  app.post<{ Body: { name: string; company?: string; email: string; phone?: string; message: string } }>(
    "/api/contact",
    async (req, reply) => {
      const { name, company, email, phone, message } = req.body;

      try {
        const contact = await prisma.contact.create({
          data: { name, company, email, phone, message }
        });

        reply.send({ success: true, data: contact });
      } catch (error) {
        reply.code(500).send({ success: false, error: "Failed to save contact", details: error });
      }
    }
  );

  // GET → Fetch all contact messages
  app.get("/api/contact", async (req, reply) => {
    try {
      const contacts = await prisma.contact.findMany({
        orderBy: { createdAt: "desc" }
      });

      reply.send({ success: true, data: contacts });
    } catch (error) {
      reply.code(500).send({ success: false, error: "Failed to fetch contacts", details: error });
    }
  });
}

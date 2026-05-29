import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "error" },
  ],
});

prisma.$on("error" as never, (e: unknown) => {
  logger.error("Prisma error:", e);
});

export default prisma;

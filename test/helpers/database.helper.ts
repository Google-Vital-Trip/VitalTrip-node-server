import { PrismaService } from '../../src/prisma/prisma.service';

export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.firstAidLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.healthTopic.deleteMany();
}

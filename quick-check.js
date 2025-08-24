const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAll() {
  try {
    const count = await prisma.mitzvahRequest.count();
    console.log('Total requests:', count);
    
    const withLocation = await prisma.mitzvahRequest.count({
      where: { location: { not: null } }
    });
    console.log('With complete address:', withLocation);
    
    const recent = await prisma.mitzvahRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { title: true, location: true, locationDisplay: true, createdAt: true }
    });
    console.log('Recent requests:', recent);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAll();

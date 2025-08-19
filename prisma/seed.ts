import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { JSONUtils } from '../src/lib/types'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@mitzvahexchange.com',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: true,
      profile: {
        create: {
          displayName: 'Admin User',
          bio: 'Platform administrator',
          city: 'System',
          languages: JSONUtils.stringify(['English']),
          skills: JSONUtils.stringify(['Administration', 'Moderation']),
          privacy: JSONUtils.stringify({
            showEmail: false,
            showPhone: false,
            showExactLocation: false
          })
        }
      }
    }
  })

  // Create test users
  const testUsers = [
    {
      email: 'sarah.miller@example.com',
      displayName: 'Sarah Miller',
      city: 'Downtown',
      bio: 'Retired teacher who loves helping others',
      skills: ['Tutoring', 'Visits', 'Cooking']
    },
    {
      email: 'david.cohen@example.com', 
      displayName: 'David Cohen',
      city: 'Westside',
      bio: 'Software developer with a car',
      skills: ['Transportation', 'Technology', 'Errands']
    },
    {
      email: 'rachel.goldberg@example.com',
      displayName: 'Rachel Goldberg',
      city: 'East End',
      bio: 'Healthcare worker and community volunteer',
      skills: ['Visits', 'Meals', 'Household']
    },
    {
      email: 'michael.rosenberg@example.com',
      displayName: 'Michael Rosenberg', 
      city: 'Central',
      bio: 'Retired engineer who loves fixing things',
      skills: ['Household', 'Technology', 'Transportation']
    }
  ]

  const createdUsers = []
  for (const userData of testUsers) {
    const password = await bcrypt.hash('password123', 12)
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password,
        emailVerified: true,
        profile: {
          create: {
            displayName: userData.displayName,
            bio: userData.bio,
            city: userData.city,
            languages: JSONUtils.stringify(['English']),
            skills: JSONUtils.stringify(userData.skills),
            privacy: JSONUtils.stringify({
              showEmail: false,
              showPhone: false, 
              showExactLocation: false
            })
          }
        }
      }
    })
    createdUsers.push(user)
  }

  // Create point rules
  const pointRules = [
    { category: 'VISITS', basePoints: 10 },
    { category: 'TRANSPORTATION', basePoints: 15 },
    { category: 'ERRANDS', basePoints: 8 },
    { category: 'TUTORING', basePoints: 12 },
    { category: 'MEALS', basePoints: 10 },
    { category: 'HOUSEHOLD', basePoints: 10 },
    { category: 'TECHNOLOGY', basePoints: 12 },
    { category: 'OTHER', basePoints: 8 }
  ]

  for (const rule of pointRules) {
    await prisma.pointRule.create({
      data: {
        category: rule.category,
        basePoints: rule.basePoints,
        modifiers: JSONUtils.stringify({
          urgent: 10,
          high: 5,
          longDistance: 5,
          longDuration: 5
        })
      }
    })
  }

  // Create sample requests
  const sampleRequests = [
    {
      ownerId: createdUsers[0].id, // Sarah
      title: 'Transportation to Medical Appointment',
      description: 'Need a ride to my doctor\'s appointment next Tuesday. Unable to drive myself due to recent surgery.',
      category: 'TRANSPORTATION',
      locationDisplay: 'Downtown Medical Center',
      urgency: 'HIGH',
      timeWindowStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      requirements: JSONUtils.stringify(['Must have car/license', 'Available weekday mornings'])
    },
    {
      ownerId: createdUsers[1].id, // David
      title: 'Weekly Grocery Shopping',
      description: 'Looking for someone to help with weekly grocery shopping. Can provide list and payment details.',
      category: 'ERRANDS',
      locationDisplay: 'Westside Grocery Store',
      urgency: 'NORMAL',
      requirements: JSONUtils.stringify(['Must have car/license'])
    },
    {
      ownerId: createdUsers[2].id, // Rachel  
      title: 'Visit with Elderly Community Member',
      description: 'Regular companionship visits needed for community member who lives alone. Great conversation partner!',
      category: 'VISITS',
      locationDisplay: 'East End Senior Living',
      urgency: 'LOW',
      requirements: JSONUtils.stringify(['Background check preferred'])
    },
    {
      ownerId: createdUsers[3].id, // Michael
      title: 'Technology Help - Computer Setup',
      description: 'Need help setting up new computer and transferring files. Some tech experience preferred.',
      category: 'TECHNOLOGY', 
      locationDisplay: 'Central District',
      urgency: 'NORMAL',
      requirements: JSONUtils.stringify(['Experience preferred', 'Available weekends'])
    },
    {
      ownerId: createdUsers[0].id, // Sarah
      title: 'Meal Preparation for Family',
      description: 'Need help preparing meals for the week. Family member recovering from surgery.',
      category: 'MEALS',
      locationDisplay: 'Downtown Kitchen',
      urgency: 'HIGH',
      requirements: JSONUtils.stringify(['Cooking experience', 'Available evenings'])
    }
  ]

  const createdRequests = []
  for (const requestData of sampleRequests) {
    const request = await prisma.mitzvahRequest.create({
      data: {
        ...requestData,
        attachments: JSONUtils.stringify([])
      }
    })
    createdRequests.push(request)
  }

  // Create some assignments and completions
  // David claims Sarah's transportation request
  const assignment1 = await prisma.assignment.create({
    data: {
      requestId: createdRequests[0].id,
      performerId: createdUsers[1].id, // David
      status: 'CLAIMED',
      proofPhotos: JSONUtils.stringify([])
    }
  })

  await prisma.mitzvahRequest.update({
    where: { id: createdRequests[0].id },
    data: { status: 'CLAIMED' }
  })

  // Rachel claims and completes Michael's tech help request
  const assignment2 = await prisma.assignment.create({
    data: {
      requestId: createdRequests[3].id,
      performerId: createdUsers[2].id, // Rachel
      status: 'CONFIRMED',
      completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Completed yesterday
      confirmedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // Confirmed 12 hours ago
      proofPhotos: JSONUtils.stringify([])
    }
  })

  await prisma.mitzvahRequest.update({
    where: { id: createdRequests[3].id },
    data: { status: 'CONFIRMED' }
  })

  // Award points to Rachel for completing the tech help
  await prisma.pointsLedger.create({
    data: {
      userId: createdUsers[2].id, // Rachel
      requestId: createdRequests[3].id,
      delta: 12,
      reason: 'Completed mitzvah: Technology Help - Computer Setup'
    }
  })

  // Create a review
  await prisma.review.create({
    data: {
      requestId: createdRequests[3].id,
      reviewerId: createdUsers[3].id, // Michael (reviewer)
      revieweeId: createdUsers[2].id, // Rachel (reviewee)
      stars: 5,
      comment: 'Rachel was amazing! Set up my computer perfectly and was very patient explaining everything.',
      visibility: 'PUBLIC'
    }
  })

  console.log('✅ Database seeded successfully!')
  console.log(`Created ${testUsers.length + 1} users (including admin)`)
  console.log(`Created ${pointRules.length} point rules`)
  console.log(`Created ${sampleRequests.length} sample requests`)
  console.log(`Created 2 assignments with 1 completion`)
  console.log('\nTest user credentials:')
  console.log('Admin: admin@mitzvahexchange.com / admin123')
  testUsers.forEach(user => {
    console.log(`${user.displayName}: ${user.email} / password123`)
  })
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

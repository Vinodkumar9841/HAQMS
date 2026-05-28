const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database records...');
  await prisma.queueToken.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding user credentials...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // 1. Seed Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@haqms.com',
      password: hashedPassword,
      name: 'Dr. Charles Xavier',
      role: 'ADMIN',
    },
  });

  const receptionistUser = await prisma.user.create({
    data: {
      email: 'reception1@haqms.com',
      password: hashedPassword,
      name: 'Lois Lane',
      role: 'RECEPTIONIST',
    },
  });

  const doctor1User = await prisma.user.create({
    data: {
      email: 'doctor1@haqms.com',
      password: hashedPassword,
      name: 'Dr. Stephen Strange',
      role: 'DOCTOR',
    },
  });

  const doctor2User = await prisma.user.create({
    data: {
      email: 'doctor2@haqms.com',
      password: hashedPassword,
      name: 'Dr. Gregory House',
      role: 'DOCTOR',
    },
  });

  console.log('Seeding physicians...');
  // 2. Seed Doctors
  const doctorStrange = await prisma.doctor.create({
    data: {
      name: 'Dr. Stephen Strange',
      specialization: 'Neurosurgery',
      consultationFee: 250,
      experience: 15,
      department: 'Surgery',
      userId: doctor1User.id,
    },
  });

  const doctorHouse = await prisma.doctor.create({
    data: {
      name: 'Dr. Gregory House',
      specialization: 'Diagnostic Medicine',
      consultationFee: 150,
      experience: 20,
      department: 'Diagnostics',
      userId: doctor2User.id,
    },
  });

  console.log('Seeding patient directory...');
  // 3. Seed Patients
  const patientBruce = await prisma.patient.create({
    data: {
      name: 'Bruce Wayne',
      email: 'bruce@waynecorp.com',
      phoneNumber: '555-0199',
      age: 35,
      gender: 'Male',
      medicalHistory: null, // Null value to verify optional chaining crash patch
    },
  });

  const patientClark = await prisma.patient.create({
    data: {
      name: 'Clark Kent',
      email: 'clark@dailyplanet.com',
      phoneNumber: '555-0144',
      age: 33,
      gender: 'Male',
      medicalHistory: null, // Null value
    },
  });

  const patientDiana = await prisma.patient.create({
    data: {
      name: 'Diana Prince',
      email: 'diana@themyscira.org',
      phoneNumber: '555-0100',
      age: 28,
      gender: 'Female',
      medicalHistory: 'Superb cardiovascular condition, no known allergies, slight physical trauma resistance.',
    },
  });

  console.log('Seeding appointment records...');
  // 4. Seed Appointments
  const today = new Date();
  
  // Set explicit date slots
  const apptDate1 = new Date(today.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  const apptDate2 = new Date(today.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now

  const appt1 = await prisma.appointment.create({
    data: {
      patientId: patientDiana.id,
      doctorId: doctorStrange.id,
      appointmentDate: apptDate1,
      reason: 'Bi-annual physical audit',
      status: 'PENDING',
    },
  });

  const appt2 = await prisma.appointment.create({
    data: {
      patientId: patientBruce.id,
      doctorId: doctorHouse.id,
      appointmentDate: apptDate2,
      reason: 'Chronic joint distress consultation',
      status: 'PENDING',
    },
  });

  console.log('Seeding operational live calling tokens...');
  // 5. Seed Queue Tokens
  await prisma.queueToken.create({
    data: {
      tokenNumber: 1,
      patientId: patientDiana.id,
      doctorId: doctorStrange.id,
      appointmentId: appt1.id,
      status: 'WAITING',
    },
  });

  await prisma.queueToken.create({
    data: {
      tokenNumber: 2,
      patientId: patientClark.id,
      doctorId: doctorStrange.id,
      status: 'CALLING',
    },
  });

  await prisma.queueToken.create({
    data: {
      tokenNumber: 1,
      patientId: patientBruce.id,
      doctorId: doctorHouse.id,
      appointmentId: appt2.id,
      status: 'WAITING',
    },
  });

  console.log('=========================================');
  console.log('   DATABASE SEEDING COMPLETED SUCCESSFULLY');
  console.log('=========================================');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

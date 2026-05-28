const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports/doctor-stats
router.get('/doctor-stats', authenticate, async (req, res) => {
  try {
    const start = Date.now();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [doctors, appointmentGroups, queueGroups] = await Promise.all([
      prisma.doctor.findMany(),
      prisma.appointment.groupBy({
        by: ['doctorId', 'status'],
        _count: { _all: true },
      }),
      prisma.queueToken.groupBy({
        by: ['doctorId'],
        where: { createdAt: { gte: today } },
        _count: { _all: true },
      }),
    ]);

    const apptMap = {};
    for (const row of appointmentGroups) {
      if (!apptMap[row.doctorId]) apptMap[row.doctorId] = {};
      apptMap[row.doctorId][row.status] = row._count._all;
    }

    const queueMap = {};
    for (const row of queueGroups) {
      queueMap[row.doctorId] = row._count._all;
    }

    const reportData = doctors.map((doc) => {
      const stats = apptMap[doc.id] || {};
      const totalAppointments = Object.values(stats).reduce((s, c) => s + c, 0);
      const completedAppointments = stats['COMPLETED'] || 0;
      const cancelledAppointments = stats['CANCELLED'] || 0;
      const revenue = completedAppointments * doc.consultationFee;

      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        department: doc.department,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        todayQueueSize: queueMap[doc.id] || 0,
        revenue,
      };
    });

    const durationMs = Date.now() - start;

    res.json({
      success: true,
      timeTakenMs: durationMs,
      data: reportData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
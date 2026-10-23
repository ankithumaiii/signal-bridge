import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';
import { User } from '../models/User.js';
import { Contact } from '../models/Contact.js';
import { Hazard } from '../models/Hazard.js';
import { SOSIncident } from '../models/SOSIncident.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await mongoose.connect(config.mongoUri);
    console.log('[Seed] Connected.');

    // Clear existing demo data
    await User.deleteMany({ email: { $in: ['demo@signalbridge.org', 'priya.sharma@family.net', 'arav.patel@family.net'] } });
    await Hazard.deleteMany({ isDemoSeeded: true });

    // 1. Create Demo Users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('demo12345', salt);

    const mainDemoUser = await User.create({
      name: 'Rohan Verma',
      email: 'demo@signalbridge.org',
      password: passwordHash,
      phone: '+919876543210',
      emergencyContactPhone: '+919876543211',
      bloodGroup: 'O+',
      medicalNotes: 'No chronic allergies. Asthmatic (inhaler carried in bag).',
      lastKnownLocation: {
        lat: 12.9716, // Bangalore Center
        lng: 77.5946,
        accuracy: 12,
        updatedAt: new Date()
      },
      locationSharing: {
        enabled: true,
        expiresAt: new Date(Date.now() + 8 * 3600 * 1000)
      },
      isDemoUser: true
    });

    const sisterUser = await User.create({
      name: 'Priya Verma',
      email: 'priya.sharma@family.net',
      password: passwordHash,
      phone: '+919876543211',
      bloodGroup: 'B+',
      lastKnownLocation: {
        lat: 12.9785,
        lng: 77.5995,
        accuracy: 15,
        updatedAt: new Date(Date.now() - 15 * 60 * 1000)
      },
      isDemoUser: true
    });

    const brotherUser = await User.create({
      name: 'Arav Verma',
      email: 'arav.patel@family.net',
      password: passwordHash,
      phone: '+919876543212',
      bloodGroup: 'O+',
      lastKnownLocation: {
        lat: 12.9650,
        lng: 77.6010,
        accuracy: 25,
        updatedAt: new Date(Date.now() - 40 * 60 * 1000)
      },
      isDemoUser: true
    });

    console.log('[Seed] Demo Users created (Login: demo@signalbridge.org / demo12345)');

    // 2. Create Trusted Contacts for Rohan
    await Contact.create([
      {
        userId: mainDemoUser._id,
        contactUserId: sisterUser._id,
        name: 'Priya Verma (Sister)',
        relationship: 'Sibling',
        phone: '+919876543211',
        email: 'priya.sharma@family.net',
        notifyInEmergency: true,
        status: 'connected',
        locationConsentGranted: true,
        lastCheckInReceived: {
          type: 'safe',
          message: "I am safe and home now.",
          timestamp: new Date(Date.now() - 25 * 60 * 1000)
        }
      },
      {
        userId: mainDemoUser._id,
        contactUserId: brotherUser._id,
        name: 'Arav Verma (Brother)',
        relationship: 'Sibling',
        phone: '+919876543212',
        email: 'arav.patel@family.net',
        notifyInEmergency: true,
        status: 'connected',
        locationConsentGranted: true,
        lastCheckInReceived: {
          type: 'safe',
          message: "At office, all good here.",
          timestamp: new Date(Date.now() - 120 * 60 * 1000)
        }
      },
      {
        userId: mainDemoUser._id,
        name: 'Dr. Suresh Nair',
        relationship: 'Other',
        phone: '+919811223344',
        email: 'dr.nair.clinic@health.in',
        notifyInEmergency: true,
        status: 'invited',
        locationConsentGranted: false
      }
    ]);

    console.log('[Seed] Trusted Contacts created.');

    // 3. Create Seeded Hazards in Safety Radar (Bangalore tech corridor / center)
    await Hazard.create([
      {
        reporterId: sisterUser._id,
        category: 'Flooding or Severe Weather',
        severity: 'High',
        description: 'Severe waterlogging at Sony World Junction. Knee-deep water, underpass closed for two-wheelers.',
        location: {
          lat: 12.9352,
          lng: 77.6245,
          address: 'Koramangala 80ft Road, Sony World Junction'
        },
        status: 'Corroborated Hazard',
        verificationReason: 'Corroborated by 3 community confirmations and traffic authority advisory.',
        corroborationCount: 4,
        isDemoSeeded: true
      },
      {
        reporterId: brotherUser._id,
        category: 'Blocked or Unsafe Road',
        severity: 'Medium',
        description: 'Fallen tree blocking left two lanes towards Indiranagar Metro. Traffic diverted.',
        location: {
          lat: 12.9719,
          lng: 77.6412,
          address: '100 Feet Rd, HAL 2nd Stage, Indiranagar'
        },
        status: 'Multiple Reports',
        verificationReason: 'Multiple reports active: supported by 2 nearby community cluster reports.',
        corroborationCount: 2,
        isDemoSeeded: true
      },
      {
        reporterId: mainDemoUser._id,
        category: 'Accident',
        severity: 'Critical',
        description: 'Multi-vehicle collision on Outer Ring Road flyover ramp. Emergency ambulance en-route.',
        location: {
          lat: 12.9237,
          lng: 77.6842,
          address: 'Outer Ring Road, Bellandur EcoSpace Flyover'
        },
        status: 'Corroborated Hazard',
        verificationReason: 'Corroborated by 4 peer reports and emergency dispatch advisory.',
        corroborationCount: 5,
        isDemoSeeded: true
      },
      {
        reporterId: sisterUser._id,
        category: 'Fire or Smoke',
        severity: 'Critical',
        description: 'Commercial transformer short-circuit fire with dense smoke. Fire tender dispatched.',
        location: {
          lat: 12.9820,
          lng: 77.5970,
          address: 'MG Road Metro Station North Exit'
        },
        status: 'Unverified Report',
        verificationReason: 'Single community submission awaiting local corroboration.',
        corroborationCount: 1,
        isDemoSeeded: true
      }
    ]);

    console.log('[Seed] Seeded Hazards created on Safety Radar.');

    // 4. Create Family Emergency Circle Conversation
    const familyCircle = await Conversation.create({
      type: 'family_group',
      title: 'Verma Family Circle',
      members: [mainDemoUser._id, sisterUser._id, brotherUser._id],
      lastMessage: {
        text: 'Heavy rain starting in Koramangala, stay safe everyone.',
        senderId: sisterUser._id,
        timestamp: new Date(Date.now() - 10 * 60 * 1000)
      }
    });

    await Message.create([
      {
        conversationId: familyCircle._id,
        senderId: brotherUser._id,
        text: 'Checking in - I am safe at the Indiranagar workplace.',
        messageType: 'checkin_safe',
        status: 'delivered',
        createdAt: new Date(Date.now() - 60 * 60 * 1000)
      },
      {
        conversationId: familyCircle._id,
        senderId: sisterUser._id,
        text: 'Heavy rain starting in Koramangala, stay safe everyone.',
        messageType: 'text',
        status: 'delivered',
        createdAt: new Date(Date.now() - 10 * 60 * 1000)
      }
    ]);

    console.log('[Seed] Family Emergency Circle created with initial messages.');

    // 5. Create a sample resolved past SOS incident for history demo
    await SOSIncident.create({
      incidentNumber: 'SB-2026-1049',
      userId: mainDemoUser._id,
      category: 'Medical Emergency',
      description: 'Severe asthma breathing distress during storm. Needed neighbor emergency inhaler.',
      location: {
        lat: 12.9716,
        lng: 77.5946,
        accuracy: 10,
        isCurrent: false,
        address: 'MG Road / Residency Road Junction'
      },
      status: 'resolved',
      recipients: [
        {
          name: 'Priya Verma (Sister)',
          phone: '+919876543211',
          channel: 'simulated_dispatch',
          status: 'acknowledged',
          sentAt: new Date(Date.now() - 24 * 3600 * 1000),
          deliveredAt: new Date(Date.now() - 24 * 3600 * 1000 + 3000),
          acknowledgedAt: new Date(Date.now() - 24 * 3600 * 1000 + 45000),
          acknowledgementNote: 'Brought inhaler and assisted.',
          isDemoSimulated: true
        }
      ],
      emergencyServicesAction: {
        called112: true,
        callInitiatedAt: new Date(Date.now() - 24 * 3600 * 1000 + 60000),
        status: 'assistance_confirmed_by_user',
        notes: 'Call action initiated by user; neighbor assisted before ambulance reached.'
      },
      auditTrail: [
        { status: 'active', note: 'SOS triggered by user', timestamp: new Date(Date.now() - 24 * 3600 * 1000) },
        { status: 'recipient_acknowledged', note: 'Sister acknowledged alert', timestamp: new Date(Date.now() - 24 * 3600 * 1000 + 45000) },
        { status: 'resolved', note: 'Patient stabilized. Resolved.', timestamp: new Date(Date.now() - 23 * 3600 * 1000) }
      ],
      createdAt: new Date(Date.now() - 24 * 3600 * 1000)
    });

    console.log('[Seed] Sample historical SOS incident created.');
    console.log('[Seed] Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seedDatabase();

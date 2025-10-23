import mongoose from 'mongoose';
import User from '../models/User.js';
import Task from '../models/Task.js';
import ProjectIntegration from '../models/ProjectIntegration.js';
import Invitation from '../models/Invitation.js';
import crypto from 'crypto';

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // await Task.deleteMany({});
    // await ProjectIntegration.deleteMany({});
    // await Invitation.deleteMany({});

    // Seed Integrations (these are global, not user-specific)
    const integrations = [
      {
        name: 'GitHub',
        icon: 'FaGithub',
        description: 'Link your GitHub repositories for seamless code integration.',
        connected: false,
      },
      {
        name: 'Figma',
        icon: 'FaFigma',
        description: 'Import design files and track design-to-development progress.',
        connected: false,
      },
      {
        name: 'Jira',
        icon: 'SiJira',
        description: 'Sync tasks and issues with your Jira project board.',
        connected: false,
      },
      {
        name: 'Slack',
        icon: 'FaSlack',
        description: 'Get real-time notifications in your Slack channels.',
        connected: false,
      },
      {
        name: 'Trello',
        icon: 'FaTrello',
        description: 'Sync cards and boards with your project tasks.',
        connected: false,
      },
      {
        name: 'Linear',
        icon: 'SiLinear',
        description: 'Integrate with Linear for issue tracking and sprint planning.',
        connected: false,
      },
    ];

    // Check if integrations already exist
    const existingIntegrations = await ProjectIntegration.find({});
    if (existingIntegrations.length === 0) {
      await ProjectIntegration.insertMany(integrations);
      console.log('✅ Seeded 6 integrations');
    } else {
      console.log('⏭️  Integrations already exist, skipping...');
    }

    // Seed Mock Users (only if they don't exist)
    const mockUsers = [
      {
        username: 'john_teamlead',
        email: 'john@tracker.com',
        password: 'Password123!', // Will be hashed by pre-save hook
        role: 'team_lead',
        isActive: true,
      },
      {
        username: 'sarah_employee',
        email: 'sarah@tracker.com',
        password: 'Password123!',
        role: 'user',
        isActive: true,
      },
      {
        username: 'mike_manager',
        email: 'mike@tracker.com',
        password: 'Password123!',
        role: 'manager',
        isActive: true,
      },
    ];

    let seededUsers = [];
    for (const userData of mockUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        seededUsers.push(user);
        console.log(`✅ Created user: ${user.username} (${user.role})`);
      } else {
        seededUsers.push(existingUser);
        console.log(`⏭️  User ${userData.username} already exists`);
      }
    }

    // Seed Mock Tasks for each user
    const teamLead = seededUsers.find((u) => u.role === 'team_lead');
    const employee = seededUsers.find((u) => u.role === 'user');
    const manager = seededUsers.find((u) => u.role === 'manager');

    const mockTasks = [
      // Team Lead Tasks
      {
        title: 'Design Database Schema',
        description: 'Create comprehensive MongoDB schema for user, tasks, and projects.',
        status: 'completed',
        priority: 'high',
        assignedTo: teamLead._id,
        createdBy: manager._id,
        dueDate: new Date('2025-10-15'),
        dependencies: [],
      },
      {
        title: 'Implement RBAC Middleware',
        description: 'Build role-based access control for all API routes.',
        status: 'in-progress',
        priority: 'high',
        assignedTo: teamLead._id,
        createdBy: manager._id,
        dueDate: new Date('2025-10-25'),
        dependencies: [],
      },
      {
        title: 'Code Review Sprint 3',
        description: 'Review all pull requests from team members for Sprint 3.',
        status: 'pending',
        priority: 'medium',
        assignedTo: teamLead._id,
        createdBy: manager._id,
        dueDate: new Date('2025-10-28'),
        dependencies: [],
      },

      // Employee Tasks
      {
        title: 'Fix Login Form Validation',
        description: 'Add client-side validation for email and password fields.',
        status: 'completed',
        priority: 'medium',
        assignedTo: employee._id,
        createdBy: teamLead._id,
        dueDate: new Date('2025-10-18'),
        dependencies: [],
      },
      {
        title: 'Build Dashboard Cards',
        description: 'Create reusable card components with Tailwind glassmorphism.',
        status: 'in-progress',
        priority: 'high',
        assignedTo: employee._id,
        createdBy: teamLead._id,
        dueDate: new Date('2025-10-26'),
        dependencies: [],
      },
      {
        title: 'Write Unit Tests for Auth',
        description: 'Add Jest tests for login, register, and logout flows.',
        status: 'pending',
        priority: 'low',
        assignedTo: employee._id,
        createdBy: teamLead._id,
        dueDate: new Date('2025-11-02'),
        dependencies: [],
      },

      // Manager Tasks
      {
        title: 'Q4 Planning Meeting',
        description: 'Prepare agenda and OKRs for Q4 planning session.',
        status: 'completed',
        priority: 'high',
        assignedTo: manager._id,
        createdBy: manager._id,
        dueDate: new Date('2025-10-10'),
        dependencies: [],
      },
      {
        title: 'Review Project Timeline',
        description: 'Assess current sprint velocity and adjust milestones.',
        status: 'in-progress',
        priority: 'medium',
        assignedTo: manager._id,
        createdBy: manager._id,
        dueDate: new Date('2025-10-24'),
        dependencies: [],
      },
    ];

    // Check if tasks already exist for these users
    const existingTasks = await Task.find({
      assignedTo: { $in: seededUsers.map((u) => u._id) },
    });

    if (existingTasks.length === 0) {
      await Task.insertMany(mockTasks);
      console.log(`✅ Seeded ${mockTasks.length} tasks`);
    } else {
      console.log('⏭️  Tasks already exist for seeded users, skipping...');
    }

    // Seed Mock Invitations
    const mockInvitations = [
      {
        email: 'alice@newuser.com',
        role: 'user',
        invitedBy: teamLead._id,
        status: 'pending',
        token: crypto.randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      {
        email: 'bob@newuser.com',
        role: 'user',
        invitedBy: manager._id,
        status: 'pending',
        token: crypto.randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        email: 'charlie@newuser.com',
        role: 'team_lead',
        invitedBy: manager._id,
        status: 'accepted',
        token: crypto.randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        acceptedAt: new Date('2025-10-20'),
      },
    ];

    const existingInvitations = await Invitation.find({
      invitedBy: { $in: seededUsers.map((u) => u._id) },
    });

    if (existingInvitations.length === 0) {
      await Invitation.insertMany(mockInvitations);
      console.log(`✅ Seeded ${mockInvitations.length} invitations`);
    } else {
      console.log('⏭️  Invitations already exist, skipping...');
    }

    console.log('🎉 Database seed completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Team Lead: john@tracker.com / Password123!');
    console.log('Employee: sarah@tracker.com / Password123!');
    console.log('Manager: mike@tracker.com / Password123!');
  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  }
};

export default seedDatabase;

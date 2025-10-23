/**
 * Seed Script for Teams and Projects
 * 
 * This script creates sample teams, projects, and assigns users
 * Run with: node src/seedTeamsAndProjects.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Team from './models/Team.js';
import Project from './models/Project.js';
import Task from './models/Task.js';
import connectDB from './config/database.js';

// Load environment variables
dotenv.config();

// Sample data
const sampleTeams = [
  {
    name: 'Team Alpha - Frontend',
    description: 'Frontend development team specializing in React and UI/UX'
  },
  {
    name: 'Team Beta - Backend',
    description: 'Backend development team working on APIs and database'
  },
  {
    name: 'Team Gamma - DevOps',
    description: 'DevOps team managing infrastructure and deployments'
  },
  {
    name: 'Team Delta - QA',
    description: 'Quality assurance team ensuring product excellence'
  }
];

const sampleProjects = [
  {
    name: 'KPR Tracker Dashboard',
    description: 'Main tracking dashboard with real-time analytics',
    status: 'active',
    modules: [
      { id: 1, title: 'User Authentication System', description: 'Implement OAuth and JWT authentication', status: 'completed' },
      { id: 2, title: 'Dashboard UI Design', description: 'Create responsive dashboard layout', status: 'in-progress' },
      { id: 3, title: 'Real-time Statistics', description: 'Add live data updates and charts', status: 'in-progress' },
      { id: 4, title: 'RBAC Implementation', description: 'Role-based access control system', status: 'completed' },
      { id: 5, title: 'Team Management', description: 'Team creation and user assignment features', status: 'in-progress' }
    ]
  },
  {
    name: 'API Development',
    description: 'RESTful API backend for all services',
    status: 'active',
    modules: [
      { id: 1, title: 'User API Endpoints', description: 'CRUD operations for users', status: 'completed' },
      { id: 2, title: 'Task API Endpoints', description: 'Task management endpoints', status: 'completed' },
      { id: 3, title: 'Team API Endpoints', description: 'Team management endpoints', status: 'in-progress' },
      { id: 4, title: 'Project API Endpoints', description: 'Project management endpoints', status: 'in-progress' },
      { id: 5, title: 'GitHub Integration API', description: 'GitHub OAuth and stats API', status: 'completed' }
    ]
  },
  {
    name: 'Infrastructure Setup',
    description: 'Cloud infrastructure and CI/CD pipelines',
    status: 'active',
    modules: [
      { id: 1, title: 'MongoDB Atlas Setup', description: 'Configure cloud database', status: 'completed' },
      { id: 2, title: 'CI/CD Pipeline', description: 'Automated testing and deployment', status: 'in-progress' },
      { id: 3, title: 'Docker Containerization', description: 'Containerize all services', status: 'not-started' },
      { id: 4, title: 'Load Balancer Configuration', description: 'Setup load balancing', status: 'not-started' }
    ]
  },
  {
    name: 'Testing & Quality Assurance',
    description: 'Comprehensive testing suite and quality checks',
    status: 'planning',
    modules: [
      { id: 1, title: 'Unit Tests', description: 'Write unit tests for all components', status: 'in-progress' },
      { id: 2, title: 'Integration Tests', description: 'API integration testing', status: 'not-started' },
      { id: 3, title: 'E2E Testing', description: 'End-to-end user flow testing', status: 'not-started' },
      { id: 4, title: 'Performance Testing', description: 'Load and stress testing', status: 'not-started' }
    ]
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to database
    await connectDB();

    // Clear existing teams and projects
    console.log('🗑️  Clearing existing teams and projects...');
    await Team.deleteMany({});
    await Project.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // Get all users
    const allUsers = await User.find({ isActive: true });
    console.log(`👥 Found ${allUsers.length} users in database\n`);

    if (allUsers.length === 0) {
      console.log('⚠️  No users found! Please run user seed script first.');
      process.exit(1);
    }

    // Find or create a manager user
    let manager = await User.findOne({ role: 'manager' });
    if (!manager) {
      manager = await User.findOne({ role: 'admin' });
    }
    if (!manager) {
      console.log('⚠️  No manager or admin found! Creating default manager...');
      manager = allUsers[0]; // Use first user as manager
      manager.role = 'manager';
      await manager.save();
      console.log(`✅ Set ${manager.username} as manager\n`);
    }

    // Divide users into teams (roughly equal distribution)
    const usersPerTeam = Math.ceil(allUsers.length / sampleTeams.length);
    const teamMembers = [];
    
    for (let i = 0; i < sampleTeams.length; i++) {
      const start = i * usersPerTeam;
      const end = Math.min(start + usersPerTeam, allUsers.length);
      teamMembers.push(allUsers.slice(start, end));
    }

    // Create teams and projects
    const createdTeams = [];
    const createdProjects = [];

    for (let i = 0; i < sampleTeams.length; i++) {
      const teamData = sampleTeams[i];
      const members = teamMembers[i] || [];
      
      console.log(`📋 Creating team: ${teamData.name}`);
      
      // Create team
      const team = await Team.create({
        name: teamData.name,
        description: teamData.description,
        members: members.map(m => m._id),
        createdBy: manager._id
      });
      
      createdTeams.push(team);
      console.log(`   ✅ Team created with ${members.length} members`);

      // Update users with teamId
      await User.updateMany(
        { _id: { $in: members.map(m => m._id) } },
        { teamId: team._id }
      );
      console.log(`   ✅ Updated ${members.length} users with teamId`);

      // Create corresponding project if available
      if (sampleProjects[i]) {
        const projectData = sampleProjects[i];
        
        console.log(`📁 Creating project: ${projectData.name}`);
        
        // Assign modules to team members
        const modulesWithAssignment = projectData.modules.map((module, idx) => {
          const assignedUser = members[idx % members.length];
          return {
            ...module,
            assignedToUserId: assignedUser ? assignedUser._id : null
          };
        });

        const project = await Project.create({
          name: projectData.name,
          description: projectData.description,
          status: projectData.status,
          modules: modulesWithAssignment,
          teamId: team._id,
          createdBy: manager._id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
        });

        createdProjects.push(project);
        console.log(`   ✅ Project created with ${modulesWithAssignment.length} modules`);

        // Update team with projectId
        team.projectId = project._id;
        await team.save();
        console.log(`   ✅ Linked project to team`);

        // Update users with projectId
        await User.updateMany(
          { _id: { $in: members.map(m => m._id) } },
          { projectId: project._id }
        );
        console.log(`   ✅ Updated ${members.length} users with projectId\n`);
      }
    }

    // Create sample tasks based on project modules
    console.log('📝 Creating sample tasks...');
    let taskCount = 0;

    for (const project of createdProjects) {
      for (const module of project.modules) {
        if (module.assignedToUserId) {
          // Create 2-3 tasks per module
          const numTasks = Math.floor(Math.random() * 2) + 2;
          
          for (let i = 0; i < numTasks; i++) {
            const statuses = ['pending', 'in-progress', 'completed'];
            const priorities = ['low', 'medium', 'high'];
            
            await Task.create({
              title: `${module.title} - Task ${i + 1}`,
              description: `Subtask for ${module.title}`,
              assignedTo: module.assignedToUserId,
              createdBy: manager._id,
              status: statuses[Math.floor(Math.random() * statuses.length)],
              priority: priorities[Math.floor(Math.random() * priorities.length)],
              dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
            });
            taskCount++;
          }
        }
      }
    }
    console.log(`✅ Created ${taskCount} sample tasks\n`);

    // Summary
    console.log('═══════════════════════════════════════════');
    console.log('✨ DATABASE SEEDING COMPLETE!');
    console.log('═══════════════════════════════════════════');
    console.log(`👥 Teams created: ${createdTeams.length}`);
    console.log(`📁 Projects created: ${createdProjects.length}`);
    console.log(`📝 Tasks created: ${taskCount}`);
    console.log(`👤 Total users: ${allUsers.length}`);
    console.log('═══════════════════════════════════════════\n');

    // Display team breakdown
    console.log('📊 TEAM BREAKDOWN:');
    console.log('═══════════════════════════════════════════');
    for (const team of createdTeams) {
      const populatedTeam = await Team.findById(team._id)
        .populate('members', 'username email role')
        .populate('projectId', 'name');
      
      console.log(`\n📋 ${populatedTeam.name}`);
      console.log(`   Members: ${populatedTeam.members.length}`);
      console.log(`   Project: ${populatedTeam.projectId?.name || 'None'}`);
      console.log(`   Team Members:`);
      populatedTeam.members.forEach(member => {
        console.log(`      - ${member.username} (${member.role})`);
      });
    }
    console.log('\n═══════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();

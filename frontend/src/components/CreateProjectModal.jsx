import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CreateProjectModal - Multi-step wizard for creating new projects
 * 
 * Steps:
 * 1. Project Name: Enter basic project information
 * 2. Create Modules: Define project modules/tasks
 * 3. Invite & Assign: Add team members and assign them to modules
 * 
 * Props:
 * - isOpen: Boolean to control modal visibility
 * - onClose: Callback function to close the modal
 */

const CreateProjectModal = ({ isOpen, onClose }) => {
  // ========== STATE MANAGEMENT ==========
  
  /**
   * Current step in the wizard (1-3)
   */
  const [step, setStep] = useState(1);
  
  /**
   * Project name input
   */
  const [projectName, setProjectName] = useState('');
  
  /**
   * List of project modules/tasks
   * Each module: { id: number, title: string }
   */
  const [modules, setModules] = useState([]);
  
  /**
   * List of invited team members
   * Each member: { id: number, email: string, assignedModuleId: number | null }
   */
  const [invitedMembers, setInvitedMembers] = useState([]);
  
  /**
   * Temporary inputs for adding new items
   */
  const [moduleInput, setModuleInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  // ========== HELPER FUNCTIONS ==========

  /**
   * Generate unique ID for new items
   */
  const generateId = () => Date.now() + Math.random();

  /**
   * Reset all state when modal closes
   */
  const resetForm = () => {
    setStep(1);
    setProjectName('');
    setModules([]);
    setInvitedMembers([]);
    setModuleInput('');
    setEmailInput('');
  };

  /**
   * Handle modal close with cleanup
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ========== STEP 1: PROJECT NAME HANDLERS ==========

  /**
   * Validate and proceed to step 2
   */
  const handleStep1Next = () => {
    if (!projectName.trim()) {
      alert('⚠️ Please enter a project name');
      return;
    }
    setStep(2);
  };

  // ========== STEP 2: MODULES HANDLERS ==========

  /**
   * Add a new module to the list
   */
  const handleAddModule = () => {
    if (!moduleInput.trim()) {
      alert('⚠️ Please enter a module title');
      return;
    }
    
    const newModule = {
      id: generateId(),
      title: moduleInput.trim()
    };
    
    setModules([...modules, newModule]);
    setModuleInput('');
  };

  /**
   * Remove a module from the list
   */
  const handleRemoveModule = (moduleId) => {
    setModules(modules.filter(m => m.id !== moduleId));
    // Also remove this module assignment from members
    setInvitedMembers(invitedMembers.map(member => ({
      ...member,
      assignedModuleId: member.assignedModuleId === moduleId ? null : member.assignedModuleId
    })));
  };

  /**
   * Navigate back to step 1
   */
  const handleStep2Back = () => {
    setStep(1);
  };

  /**
   * Proceed to step 3
   */
  const handleStep2Next = () => {
    setStep(3);
  };

  // ========== STEP 3: INVITE & ASSIGN HANDLERS ==========

  /**
   * Add a new member to the invitation list
   */
  const handleInviteMember = () => {
    if (!emailInput.trim()) {
      alert('⚠️ Please enter a valid email address');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      alert('⚠️ Please enter a valid email address');
      return;
    }

    // Check for duplicate emails
    if (invitedMembers.some(m => m.email.toLowerCase() === emailInput.trim().toLowerCase())) {
      alert('⚠️ This email has already been invited');
      return;
    }

    const newMember = {
      id: generateId(),
      email: emailInput.trim(),
      assignedModuleId: null
    };

    setInvitedMembers([...invitedMembers, newMember]);
    setEmailInput('');
  };

  /**
   * Remove a member from the invitation list
   */
  const handleRemoveMember = (memberId) => {
    setInvitedMembers(invitedMembers.filter(m => m.id !== memberId));
  };

  /**
   * Update module assignment for a member
   */
  const handleAssignModule = (memberId, moduleId) => {
    setInvitedMembers(invitedMembers.map(member =>
      member.id === memberId
        ? { ...member, assignedModuleId: moduleId === 'null' ? null : Number(moduleId) }
        : member
    ));
  };

  /**
   * Navigate back to step 2
   */
  const handleStep3Back = () => {
    setStep(2);
  };

  /**
   * Finalize project creation
   */
  const handleFinishProject = () => {
    console.log('=== PROJECT CREATION DATA ===');
    console.log('Project Name:', projectName);
    console.log('Modules:', modules);
    console.log('Invited Members:', invitedMembers);
    console.log('============================');

    alert('✅ Project created successfully! Check console for details.');
    handleClose();
  };

  // ========== ANIMATION VARIANTS ==========

  const modalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const contentVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: { scale: 1, opacity: 1 }
  };

  // ========== RENDER COMPONENT ==========

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalVariants}
        >
          {/* Dark Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal Content */}
          <motion.div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] rounded-3xl shadow-2xl border border-[#333]"
            variants={contentVariants}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-[#333] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-[#f8f7ec]">
                    Create New Project
                  </h2>
                  <p className="text-[#f8f7ec]/60 mt-1">
                    Step {step} of 3
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full bg-[#242424] hover:bg-[#333] text-[#f8f7ec] transition-all flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 flex gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      s <= step ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-[#333]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* ==================== STEP 1: PROJECT NAME ==================== */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-2xl font-bold text-[#f8f7ec] mb-2">
                      📝 Step 1: Name Your Project
                    </h3>
                    <p className="text-[#f8f7ec]/60">
                      Choose a clear and descriptive name for your project
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#f8f7ec] mb-2 font-medium">
                        Project Name *
                      </label>
                      <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g., KPR Tracker Dashboard"
                        className="w-full px-4 py-3 rounded-xl bg-[#242424] text-[#f8f7ec] border border-[#333] focus:border-blue-500 focus:outline-none transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={handleClose}
                      className="px-6 py-3 rounded-xl bg-[#242424] text-[#f8f7ec] hover:bg-[#333] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStep1Next}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:scale-105 transition-all shadow-lg"
                    >
                      Next →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ==================== STEP 2: CREATE MODULES ==================== */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-2xl font-bold text-[#f8f7ec] mb-2">
                      🧩 Step 2: Define Project Modules (Tasks)
                    </h3>
                    <p className="text-[#f8f7ec]/60">
                      Break down your project into manageable modules or task areas
                    </p>
                  </div>

                  {/* Add Module Form */}
                  <div className="bg-[#242424] rounded-xl p-4 border border-[#333]">
                    <label className="block text-[#f8f7ec] mb-2 font-medium">
                      Add Module
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={moduleInput}
                        onChange={(e) => setModuleInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddModule()}
                        placeholder="e.g., Build API, Design UI, Testing"
                        className="flex-1 px-4 py-3 rounded-xl bg-[#1a1a1a] text-[#f8f7ec] border border-[#333] focus:border-blue-500 focus:outline-none transition-all"
                      />
                      <button
                        onClick={handleAddModule}
                        className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Modules List */}
                  {modules.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-[#f8f7ec]">
                        Project Modules ({modules.length})
                      </h4>
                      <div className="space-y-2">
                        {modules.map((module, index) => (
                          <motion.div
                            key={module.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-4 bg-[#242424] rounded-xl border border-[#333] hover:border-[#444] transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <span className="text-[#f8f7ec] font-medium">
                                {module.title}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveModule(module.id)}
                              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all text-sm"
                            >
                              Remove
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#f8f7ec]/60">
                      <div className="text-4xl mb-2">📦</div>
                      <p>No modules added yet</p>
                      <p className="text-sm mt-1">Add your first module above</p>
                    </div>
                  )}

                  <div className="flex justify-between gap-3 pt-4">
                    <button
                      onClick={handleStep2Back}
                      className="px-6 py-3 rounded-xl bg-[#242424] text-[#f8f7ec] hover:bg-[#333] transition-all"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleStep2Next}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:scale-105 transition-all shadow-lg"
                    >
                      Next →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ==================== STEP 3: INVITE & ASSIGN ==================== */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-2xl font-bold text-[#f8f7ec] mb-2">
                      👥 Step 3: Invite & Assign Members
                    </h3>
                    <p className="text-[#f8f7ec]/60">
                      Add team members and assign them to specific modules
                    </p>
                  </div>

                  {/* Invite Member Form */}
                  <div className="bg-[#242424] rounded-xl p-4 border border-[#333]">
                    <label className="block text-[#f8f7ec] mb-2 font-medium">
                      Invite Team Member
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleInviteMember()}
                        placeholder="colleague@company.com"
                        className="flex-1 px-4 py-3 rounded-xl bg-[#1a1a1a] text-[#f8f7ec] border border-[#333] focus:border-blue-500 focus:outline-none transition-all"
                      />
                      <button
                        onClick={handleInviteMember}
                        className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-all"
                      >
                        + Invite
                      </button>
                    </div>
                  </div>

                  {/* Team & Assignments List */}
                  {invitedMembers.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-[#f8f7ec]">
                        Team & Assignments ({invitedMembers.length})
                      </h4>
                      <div className="space-y-3">
                        {invitedMembers.map((member, index) => (
                          <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 bg-[#242424] rounded-xl border border-[#333] hover:border-[#444] transition-all"
                          >
                            <div className="flex items-start justify-between gap-4">
                              {/* Member Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white font-bold">
                                    {member.email[0].toUpperCase()}
                                  </div>
                                  <span className="text-[#f8f7ec] font-medium">
                                    {member.email}
                                  </span>
                                </div>

                                {/* Module Assignment Dropdown */}
                                <div>
                                  <label className="block text-[#f8f7ec]/70 text-sm mb-2">
                                    Assign to Module:
                                  </label>
                                  <select
                                    value={member.assignedModuleId || 'null'}
                                    onChange={(e) => handleAssignModule(member.id, e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-[#1a1a1a] text-[#f8f7ec] border border-[#333] focus:border-blue-500 focus:outline-none transition-all"
                                  >
                                    <option value="null">Unassigned</option>
                                    {modules.map((module) => (
                                      <option key={module.id} value={module.id}>
                                        {module.title}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Remove Button */}
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all text-sm flex-shrink-0"
                              >
                                Remove
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#f8f7ec]/60">
                      <div className="text-4xl mb-2">👤</div>
                      <p>No members invited yet</p>
                      <p className="text-sm mt-1">Invite your first team member above</p>
                    </div>
                  )}

                  {/* Module Warning */}
                  {modules.length === 0 && (
                    <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-yellow-400 text-sm">
                        💡 Tip: You haven't created any modules yet. You can assign members later or go back to add modules.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between gap-3 pt-4">
                    <button
                      onClick={handleStep3Back}
                      className="px-6 py-3 rounded-xl bg-[#242424] text-[#f8f7ec] hover:bg-[#333] transition-all"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handleFinishProject}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:scale-105 transition-all shadow-lg"
                    >
                      ✓ Finish & Create Project
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateProjectModal;

import Task from '../models/Task.js';

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks (with filtering)
 * @access  Private
 */
export const getTasks = async (req, res, next) => {
  try {
    const { status, priority, assignedTo } = req.query;

    // Build query
    let query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    // If user is not admin/manager, show only their tasks
    if (req.user.role === 'user') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/tasks/:id
 * @desc    Get single task
 * @access  Private
 */
export const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'username email')
      .populate('createdBy', 'username email')
      .populate('dependencies');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to this task
    if (req.user.role === 'user' && task.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this task'
      });
    }

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/tasks
 * @desc    Create new task
 * @access  Private (Manager/Admin)
 */
export const createTask = async (req, res, next) => {
  try {
    // Add createdBy to task data
    req.body.createdBy = req.user._id;

    const task = await Task.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task
 * @access  Private
 */
export const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // If task is being marked as completed, set completedAt
    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedAt = Date.now();
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete task
 * @access  Private (Manager/Admin)
 */
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/tasks/:id/comments
 * @desc    Add comment to task
 * @access  Private
 */
export const addComment = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.comments.push({
      user: req.user._id,
      text: req.body.text
    });

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/tasks/assignTask
 * @desc    Assign a task to a user
 * @access  Private (Team Lead, Manager, Admin)
 */
export const assignTask = async (req, res, next) => {
  try {
    const { taskId, userId } = req.body;

    // Validate required fields
    if (!taskId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID and User ID are required',
        error: 'MISSING_FIELDS'
      });
    }

    // Find the task
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
        error: 'TASK_NOT_FOUND'
      });
    }

    // Update the assignedTo field
    task.assignedTo = userId;
    await task.save();

    // Populate the assignedTo and createdBy fields for response
    await task.populate('assignedTo', 'username email role');
    await task.populate('createdBy', 'username email');

    res.status(200).json({
      success: true,
      message: 'Task assigned successfully',
      task
    });
  } catch (error) {
    next(error);
  }
};

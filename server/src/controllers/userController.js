import User from '../models/User.js';

/**
 * @route   GET /api/users
 * @desc    Get all users (filtered by role-based access)
 * @access  Private
 */
export const getUsers = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;
    
    let query = { isActive: true };
    
    // If not manager/admin, only show users in same team
    if (userRole !== 'manager' && userRole !== 'admin') {
      const currentUser = await User.findById(userId);
      if (currentUser.teamId) {
        query.teamId = currentUser.teamId;
      } else {
        // User has no team, return empty array
        return res.status(200).json({
          success: true,
          count: 0,
          users: []
        });
      }
    }
    
    const users = await User.find(query)
      .select('-password')
      .populate('teamId', 'name')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    Get single user
 * @access  Private
 */
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin or own profile)
 */
export const updateUser = async (req, res, next) => {
  try {
    // Users can only update their own profile unless they're admin
    if (req.user.role !== 'admin' && req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    // Don't allow updating password or role through this endpoint
    const { password, role, ...updateData } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate user
 * @access  Private (Admin only)
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't actually delete, just deactivate
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

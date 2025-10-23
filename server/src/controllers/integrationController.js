import ProjectIntegration from '../models/ProjectIntegration.js';

// @desc    Get all integrations
// @route   GET /api/integrations
// @access  Private (all authenticated users)
const getIntegrations = async (req, res) => {
  try {
    const integrations = await ProjectIntegration.find({ isActive: true })
      .populate('connectedBy', 'username email')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: integrations.length,
      data: integrations,
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch integrations',
      error: error.message,
    });
  }
};

// @desc    Toggle integration connection
// @route   POST /api/integrations/:id/toggle
// @access  Private (team_lead, manager, admin only)
const toggleIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const integration = await ProjectIntegration.findById(id);

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found',
      });
    }

    // Toggle connection status
    integration.connected = !integration.connected;

    if (integration.connected) {
      integration.connectedBy = userId;
      integration.connectedAt = new Date();
    } else {
      integration.connectedBy = null;
      integration.connectedAt = null;
    }

    await integration.save();

    // Populate connectedBy before sending response
    await integration.populate('connectedBy', 'username email');

    res.status(200).json({
      success: true,
      message: `${integration.name} ${integration.connected ? 'connected' : 'disconnected'} successfully`,
      data: integration,
    });
  } catch (error) {
    console.error('Error toggling integration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle integration',
      error: error.message,
    });
  }
};

// @desc    Update integration config
// @route   PUT /api/integrations/:id/config
// @access  Private (team_lead, manager, admin only)
const updateIntegrationConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { config } = req.body;

    const integration = await ProjectIntegration.findById(id);

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found',
      });
    }

    integration.config = { ...integration.config, ...config };
    await integration.save();

    res.status(200).json({
      success: true,
      message: 'Integration config updated successfully',
      data: integration,
    });
  } catch (error) {
    console.error('Error updating integration config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update integration config',
      error: error.message,
    });
  }
};

export { getIntegrations, toggleIntegration, updateIntegrationConfig };

const express = require('express');
const router = express.Router();

// Mock alerts data - in production this would come from a database
let alerts = [
  {
    id: "1",
    title: "Low coverage in North region",
    priority: "High",
    isSelected: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    category: "Coverage",
    description: "Coverage in North region has dropped below 70% target"
  },
  {
    id: "2",
    title: "Call frequency below target",
    priority: "Medium",
    isSelected: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    category: "Frequency",
    description: "Average call frequency is 2.1 vs target of 3.0 per week"
  },
  {
    id: "3",
    title: "Product X samples running low",
    priority: "Low",
    isSelected: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    category: "Product",
    description: "Product X sample inventory is at 15% capacity"
  },
  {
    id: "4",
    title: "Missed appointments this week",
    priority: "Medium",
    isSelected: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    category: "Appointment",
    description: "3 appointments were missed this week"
  },
  {
    id: "5",
    title: "Territory coverage gap identified",
    priority: "High",
    isSelected: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    category: "Territory",
    description: "New territory identified with 0% coverage"
  },
  {
    id: "6",
    title: "Sales target achievement lagging",
    priority: "High",
    isSelected: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    category: "Coverage",
    description: "Q4 sales target achievement is at 65% vs 85% expected"
  },
  {
    id: "7",
    title: "Customer feedback score dropped",
    priority: "Medium",
    isSelected: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    category: "Frequency",
    description: "Customer satisfaction score dropped from 4.8 to 4.2"
  }
];

// GET /api/alerts - Get all alerts
router.get('/', async (req, res) => {
  try {
    // Sort alerts by creation time (latest first)
    const sortedAlerts = alerts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    res.json({
      success: true,
      data: sortedAlerts,
      count: sortedAlerts.length
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message
    });
  }
});

// POST /api/alerts - Create a new alert
router.post('/', async (req, res) => {
  try {
    const { title, priority, category, description } = req.body;
    
    if (!title || !priority || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, priority, and category are required'
      });
    }

    const newAlert = {
      id: Date.now().toString(),
      title,
      priority,
      category,
      description,
      isSelected: false,
      createdAt: new Date().toISOString()
    };

    alerts.unshift(newAlert); // Add to beginning of array
    
    res.status(201).json({
      success: true,
      data: newAlert,
      message: 'Alert created successfully'
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert',
      error: error.message
    });
  }
});

// PUT /api/alerts/:id - Update alert selection status
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isSelected } = req.body;
    
    const alertIndex = alerts.findIndex(alert => alert.id === id);
    
    if (alertIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    alerts[alertIndex].isSelected = isSelected;
    
    res.json({
      success: true,
      data: alerts[alertIndex],
      message: 'Alert updated successfully'
    });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alert',
      error: error.message
    });
  }
});

// DELETE /api/alerts/:id - Delete an alert
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const alertIndex = alerts.findIndex(alert => alert.id === id);
    
    if (alertIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    const deletedAlert = alerts.splice(alertIndex, 1)[0];
    
    res.json({
      success: true,
      data: deletedAlert,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert',
      error: error.message
    });
  }
});

module.exports = router;

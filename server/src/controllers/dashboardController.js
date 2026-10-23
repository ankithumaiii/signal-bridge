import { Contact } from '../models/Contact.js';
import { SOSIncident } from '../models/SOSIncident.js';
import { Hazard } from '../models/Hazard.js';
import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Active SOS
    const activeSOS = await SOSIncident.findOne({
      userId,
      status: { $in: ['active', 'acknowledged'] }
    }).sort({ createdAt: -1 });

    // Contacts count
    const totalContacts = await Contact.countDocuments({ userId });
    const emergencyContacts = await Contact.countDocuments({ userId, notifyInEmergency: true });

    // Active hazards count in system
    const activeHazardsCount = await Hazard.countDocuments({
      status: { $nin: ['Resolved', 'Expired'] }
    });

    // Recent hazards (limit 3)
    const recentHazards = await Hazard.find({
      status: { $nin: ['Resolved', 'Expired'] }
    })
      .sort({ createdAt: -1 })
      .limit(3);

    // Recent SOS incidents for this user (limit 3)
    const recentIncidents = await SOSIncident.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3);

    // Recent messages across user's conversations
    const userConversations = await Conversation.find({ members: userId }).select('_id');
    const convIds = userConversations.map((c) => c._id);

    const recentMessages = await Message.find({ conversationId: { $in: convIds } })
      .populate('senderId', 'name')
      .sort({ createdAt: -1 })
      .limit(3);

    res.json({
      success: true,
      stats: {
        activeSOS,
        contacts: {
          total: totalContacts,
          emergencyReady: emergencyContacts
        },
        hazards: {
          activeNearby: activeHazardsCount,
          recent: recentHazards.map((h) => h.toPublicJSON())
        },
        recentIncidents,
        recentMessages,
        locationSharing: req.user.locationSharing,
        lastKnownLocation: req.user.lastKnownLocation
      }
    });
  } catch (err) {
    next(err);
  }
};

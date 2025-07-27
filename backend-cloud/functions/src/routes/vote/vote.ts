import express from "express";
import admin from "../../utils/firebase";

const router = express.Router();
const db = admin.firestore();

const verifyToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
    const token = authHeader.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// POST /vote - Handle voting for incidents
router.post("/", verifyToken, async (req: express.Request, res: express.Response) => {
  try {
    const { incidentId } = req.body;
    const userId = req.user?.uid;

    // Validate request body
    if (!incidentId || !userId) {
      return res.status(400).json({ 
        error: "Missing required fields: incidentId and valid authentication" 
      });
    }

    // Start a Firestore transaction to ensure data consistency
    const result = await db.runTransaction(async (transaction) => {
      // Check if the incident exists
      const incidentRef = db.collection("summarized_data").doc(incidentId);
      const incidentDoc = await transaction.get(incidentRef);
      
      if (!incidentDoc.exists) {
        throw new Error("INCIDENT_NOT_FOUND");
      }

      // Check if user has already voted for this incident
      const voteQuery = db.collection("vote_data")
        .where("incidentId", "==", incidentId)
        .where("userId", "==", userId)
        .limit(1);
      
      const existingVote = await transaction.get(voteQuery);
      
      if (!existingVote.empty) {
        throw new Error("ALREADY_VOTED");
      }

      // Verify that the user exists
      const userRef = db.collection("users").doc(userId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error("USER_NOT_FOUND");
      }

      // Create vote record
      const voteRef = db.collection("vote_data").doc();
      const voteData = {
        incidentId,
        userId,
        votedAt: admin.firestore.FieldValue.serverTimestamp(),
        userEmail: userDoc.data()?.email || null,
        userName: userDoc.data()?.name || null
      };

      transaction.set(voteRef, voteData);

      // Increment the vote count in the incident
      const currentVotes = incidentDoc.data()?.votes || 0;
      transaction.update(incidentRef, {
        votes: currentVotes + 1
      });

      return {
        voteId: voteRef.id,
        newVoteCount: currentVotes + 1,
        incidentId,
        userId
      };
    });

    res.status(200).json({
      message: "Vote recorded successfully",
      data: result
    });

  } catch (error) {
    console.error("Error recording vote:", error);
    
    if (error instanceof Error) {
      switch (error.message) {
        case "INCIDENT_NOT_FOUND":
          return res.status(404).json({ error: "Incident not found" });
        case "ALREADY_VOTED":
          return res.status(409).json({ error: "User has already voted for this incident" });
        case "USER_NOT_FOUND":
          return res.status(404).json({ error: "User not found" });
        default:
          return res.status(500).json({ error: "Internal server error" });
      }
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /vote - Remove vote (unvote)
router.delete("/", verifyToken, async (req: express.Request, res: express.Response) => {
  try {
    const { incidentId } = req.body;
    const userId = req.user?.uid;

    // Validate request body
    if (!incidentId || !userId) {
      return res.status(400).json({ 
        error: "Missing required fields: incidentId and valid authentication" 
      });
    }

    // Start a Firestore transaction
    const result = await db.runTransaction(async (transaction) => {
      // Check if the incident exists
      const incidentRef = db.collection("summarized_data").doc(incidentId);
      const incidentDoc = await transaction.get(incidentRef);
      
      if (!incidentDoc.exists) {
        throw new Error("INCIDENT_NOT_FOUND");
      }

      // Find the user's vote for this incident
      const voteQuery = db.collection("vote_data")
        .where("incidentId", "==", incidentId)
        .where("userId", "==", userId)
        .limit(1);
      
      const existingVote = await transaction.get(voteQuery);
      
      if (existingVote.empty) {
        throw new Error("VOTE_NOT_FOUND");
      }

      // Delete the vote record
      const voteDoc = existingVote.docs[0];
      transaction.delete(voteDoc.ref);

      // Decrement the vote count in the incident
      const currentVotes = incidentDoc.data()?.votes || 0;
      const newVoteCount = Math.max(0, currentVotes - 1); // Ensure votes don't go below 0
      
      transaction.update(incidentRef, {
        votes: newVoteCount
      });

      return {
        voteId: voteDoc.id,
        newVoteCount,
        incidentId,
        userId
      };
    });

    res.status(200).json({
      message: "Vote removed successfully",
      data: result
    });

  } catch (error) {
    console.error("Error removing vote:", error);
    
    if (error instanceof Error) {
      switch (error.message) {
        case "INCIDENT_NOT_FOUND":
          return res.status(404).json({ error: "Incident not found" });
        case "VOTE_NOT_FOUND":
          return res.status(404).json({ error: "Vote not found for this user and incident" });
        default:
          return res.status(500).json({ error: "Internal server error" });
      }
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /vote/status/:incidentId - Check if user has voted for an incident
router.get("/status/:incidentId", verifyToken, async (req: express.Request, res: express.Response) => {
  try {
    const { incidentId } = req.params;
    const userId = req.user?.uid;

    if (!incidentId || !userId) {
      return res.status(400).json({ 
        error: "Missing required parameters" 
      });
    }

    // Check if user has voted for this incident
    const voteQuery = db.collection("vote_data")
      .where("incidentId", "==", incidentId)
      .where("userId", "==", userId)
      .limit(1);
    
    const existingVote = await voteQuery.get();
    const hasVoted = !existingVote.empty;

    // Get current vote count from incident
    const incidentRef = db.collection("summarized_data").doc(incidentId);
    const incidentDoc = await incidentRef.get();
    
    if (!incidentDoc.exists) {
      return res.status(404).json({ error: "Incident not found" });
    }

    const currentVotes = incidentDoc.data()?.votes || 0;

    res.status(200).json({
      message: "Vote status retrieved successfully",
      data: {
        incidentId,
        userId,
        hasVoted,
        currentVotes,
        voteId: hasVoted ? existingVote.docs[0].id : null
      }
    });

  } catch (error) {
    console.error("Error checking vote status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /vote/incident/:incidentId - Get all votes for a specific incident
router.get("/incident/:incidentId", verifyToken, async (req: express.Request, res: express.Response) => {
  try {
    const { incidentId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!incidentId) {
      return res.status(400).json({ error: "Missing incident ID" });
    }

    // Validate limit parameter
    if (limit < 1 || limit > 100) {
      return res.status(400).json({ error: "Limit must be between 1 and 100" });
    }

    // Check if incident exists
    const incidentRef = db.collection("summarized_data").doc(incidentId);
    const incidentDoc = await incidentRef.get();
    
    if (!incidentDoc.exists) {
      return res.status(404).json({ error: "Incident not found" });
    }

    // Get votes for this incident
    const votesQuery = db.collection("vote_data")
      .where("incidentId", "==", incidentId)
      .orderBy("votedAt", "desc")
      .limit(limit);
    
    const votesSnapshot = await votesQuery.get();
    const votes = votesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const totalVotes = incidentDoc.data()?.votes || 0;

    res.status(200).json({
      message: "Votes retrieved successfully",
      data: {
        incidentId,
        totalVotes,
        votes,
        returned: votes.length
      }
    });

  } catch (error) {
    console.error("Error fetching votes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
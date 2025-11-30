import { db } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Service for managing essays in Firestore
 */

const ESSAYS_COLLECTION = 'essays';
const VERSIONS_SUBCOLLECTION = 'versions';
const MAX_VERSIONS = 10;

/**
 * Get all essays for a user
 */
export async function getUserEssays(userId) {
  try {
    const snapshot = await db.collection(ESSAYS_COLLECTION)
      .where('user_id', '==', userId)
      .orderBy('updated_at', 'desc')
      .get();

    const essays = [];
    snapshot.forEach(doc => {
      essays.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return essays;
  } catch (error) {
    logger.error('Error fetching user essays:', error);
    throw error;
  }
}

/**
 * Get a specific essay
 */
export async function getEssay(essayId, userId) {
  try {
    const doc = await db.collection(ESSAYS_COLLECTION).doc(essayId).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    
    // Verify ownership
    if (data.user_id !== userId) {
      return null;
    }

    return {
      id: doc.id,
      ...data
    };
  } catch (error) {
    logger.error('Error fetching essay:', error);
    throw error;
  }
}

/**
 * Create a new essay
 */
export async function createEssay(userId, essayData) {
  try {
    const now = new Date().toISOString();
    
    const essay = {
      user_id: userId,
      title: essayData.title || 'Untitled Essay',
      content: essayData.content || '',
      word_count: essayData.word_count || 0,
      char_count: essayData.char_count || 0,
      created_at: essayData.created_at || now,
      updated_at: now
    };

    let docRef;
    let essayId;

    // If client provides an ID, use it; otherwise let Firestore generate one
    if (essayData.id) {
      essayId = essayData.id;
      docRef = db.collection(ESSAYS_COLLECTION).doc(essayId);
      await docRef.set(essay);
    } else {
      docRef = await db.collection(ESSAYS_COLLECTION).add(essay);
      essayId = docRef.id;
    }

    return {
      id: essayId,
      ...essay
    };
  } catch (error) {
    logger.error('Error creating essay:', error);
    throw error;
  }
}

/**
 * Create or update an essay (upsert operation)
 */
export async function createOrUpdateEssay(userId, essayId, essayData) {
  try {
    const essayRef = db.collection(ESSAYS_COLLECTION).doc(essayId);
    const doc = await essayRef.get();

    if (doc.exists) {
      // Update existing essay
      const currentData = doc.data();
      
      // Verify ownership
      if (currentData.user_id !== userId) {
        throw new Error('Unauthorized');
      }

      // If content changed, save a version
      if (essayData.content && essayData.content !== currentData.content) {
        await saveVersion(essayId, {
          content: currentData.content,
          word_count: currentData.word_count
        });
      }

      const updatedFields = {
        ...essayData,
        updated_at: new Date().toISOString()
      };

      await essayRef.update(updatedFields);

      return {
        id: essayId,
        ...currentData,
        ...updatedFields
      };
    } else {
      // Create new essay
      const now = new Date().toISOString();
      const essay = {
        user_id: userId,
        title: essayData.title || 'Untitled Essay',
        content: essayData.content || '',
        word_count: essayData.word_count || 0,
        char_count: essayData.char_count || 0,
        created_at: essayData.created_at || now,
        updated_at: now
      };

      await essayRef.set(essay);

      return {
        id: essayId,
        ...essay
      };
    }
  } catch (error) {
    logger.error('Error creating/updating essay:', error);
    throw error;
  }
}

/**
 * Update an essay and optionally save a version
 */
export async function updateEssay(essayId, userId, updates) {
  try {
    const essayRef = db.collection(ESSAYS_COLLECTION).doc(essayId);
    const doc = await essayRef.get();

    if (!doc.exists) {
      return null;
    }

    const currentData = doc.data();
    
    // Verify ownership
    if (currentData.user_id !== userId) {
      return null;
    }

    // If content changed, save a version
    if (updates.content && updates.content !== currentData.content) {
      await saveVersion(essayId, {
        content: currentData.content,
        word_count: currentData.word_count
      });
    }

    // Update essay
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    await essayRef.update(updatedData);

    // Get updated document
    const updatedDoc = await essayRef.get();
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    };
  } catch (error) {
    logger.error('Error updating essay:', error);
    throw error;
  }
}

/**
 * Delete an essay
 */
export async function deleteEssay(essayId, userId) {
  try {
    const essayRef = db.collection(ESSAYS_COLLECTION).doc(essayId);
    const doc = await essayRef.get();

    if (!doc.exists) {
      return false;
    }

    const data = doc.data();
    
    // Verify ownership
    if (data.user_id !== userId) {
      return false;
    }

    // Delete all versions first
    const versionsSnapshot = await essayRef.collection(VERSIONS_SUBCOLLECTION).get();
    const batch = db.batch();
    
    versionsSnapshot.forEach(versionDoc => {
      batch.delete(versionDoc.ref);
    });
    
    batch.delete(essayRef);
    await batch.commit();

    return true;
  } catch (error) {
    logger.error('Error deleting essay:', error);
    throw error;
  }
}

/**
 * Save a version of the essay
 */
async function saveVersion(essayId, versionData) {
  try {
    const versionsRef = db.collection(ESSAYS_COLLECTION)
      .doc(essayId)
      .collection(VERSIONS_SUBCOLLECTION);

    // Add new version
    await versionsRef.add({
      content: versionData.content,
      word_count: versionData.word_count || 0,
      created_at: new Date().toISOString()
    });

    // Keep only last MAX_VERSIONS
    const snapshot = await versionsRef
      .orderBy('created_at', 'desc')
      .get();

    if (snapshot.size > MAX_VERSIONS) {
      const batch = db.batch();
      const docsToDelete = snapshot.docs.slice(MAX_VERSIONS);
      
      docsToDelete.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    }
  } catch (error) {
    logger.error('Error saving version:', error);
    throw error;
  }
}

/**
 * Get version history for an essay
 */
export async function getVersions(essayId, userId) {
  try {
    // First verify ownership
    const essay = await getEssay(essayId, userId);
    if (!essay) {
      return null;
    }

    const snapshot = await db.collection(ESSAYS_COLLECTION)
      .doc(essayId)
      .collection(VERSIONS_SUBCOLLECTION)
      .orderBy('created_at', 'desc')
      .get();

    const versions = [];
    snapshot.forEach(doc => {
      versions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return versions;
  } catch (error) {
    logger.error('Error fetching versions:', error);
    throw error;
  }
}

/**
 * Restore a specific version
 */
export async function restoreVersion(essayId, versionId, userId) {
  try {
    // Get the version
    const versionDoc = await db.collection(ESSAYS_COLLECTION)
      .doc(essayId)
      .collection(VERSIONS_SUBCOLLECTION)
      .doc(versionId)
      .get();

    if (!versionDoc.exists) {
      return null;
    }

    const versionData = versionDoc.data();

    // Update the essay with version content
    return updateEssay(essayId, userId, {
      content: versionData.content,
      word_count: versionData.word_count
    });
  } catch (error) {
    logger.error('Error restoring version:', error);
    throw error;
  }
}

export default {
  getUserEssays,
  getEssay,
  createEssay,
  createOrUpdateEssay,
  updateEssay,
  deleteEssay,
  getVersions,
  restoreVersion
};

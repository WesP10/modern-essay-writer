// Storage utility for managing essays with Firebase sync and localStorage fallback
import { auth } from '$lib/firebaseClient';
import * as essayAPI from './api';

export interface EssayData {
	id: string;
	title: string;
	content: string;
	created: string;
	modified: string;
	wordCount?: number;
	charCount?: number;
}

export interface EssayVersion {
	content: string;
	timestamp: string;
	wordCount?: number;
}

const MAX_VERSIONS = 10;

export class EssayStorage {
	// Check if user is authenticated
	private static isAuthenticated(): boolean {
		return auth?.currentUser !== null && auth?.currentUser !== undefined;
	}

	// Get all essay IDs from localStorage
	static getAllEssayIds(): string[] {
		const keys = Object.keys(localStorage);
		return keys
			.filter(key => key.startsWith('essay-') && !key.includes('-versions'))
			.map(key => key.replace('essay-', ''));
	}

	// Get essay by ID (tries Firebase first, falls back to localStorage)
	static async getEssay(id: string): Promise<EssayData | null> {
		// Try Firebase first if authenticated
		if (this.isAuthenticated()) {
			try {
				const firebaseEssay = await essayAPI.getEssay(id);
				const essayData: EssayData = {
					id: firebaseEssay.id,
					title: firebaseEssay.title,
					content: firebaseEssay.content,
					created: firebaseEssay.created_at,
					modified: firebaseEssay.updated_at,
					wordCount: firebaseEssay.word_count,
					charCount: firebaseEssay.char_count
				};
				// Cache in localStorage
				this.saveToLocalStorage(essayData);
				return essayData;
			} catch (error) {
				console.warn('Failed to fetch from Firebase, using localStorage:', error);
			}
		}

		// Fall back to localStorage
		return this.getFromLocalStorage(id);
	}

	// Get essay from localStorage only (synchronous)
	static getFromLocalStorage(id: string): EssayData | null {
		try {
			const data = localStorage.getItem(`essay-${id}`);
			if (!data) return null;
			return JSON.parse(data);
		} catch (e) {
			console.error('Error loading essay from localStorage:', e);
			return null;
		}
	}

	// Save to localStorage only (synchronous)
	static saveToLocalStorage(essay: EssayData): void {
		try {
			// Save current version to version history
			const existingEssay = this.getFromLocalStorage(essay.id);
			if (existingEssay && existingEssay.content !== essay.content) {
				this.addVersion(essay.id, existingEssay.content, existingEssay.wordCount);
			}

			// Save the essay
			localStorage.setItem(`essay-${essay.id}`, JSON.stringify(essay));
		} catch (e) {
			console.error('Error saving essay to localStorage:', e);
		}
	}

	// Save essay (saves to both Firebase and localStorage)
	static async saveEssay(essay: EssayData): Promise<void> {
		// Always save to localStorage first for immediate feedback
		this.saveToLocalStorage(essay);

		// Sync to Firebase if authenticated
		if (this.isAuthenticated()) {
			try {
				// Use the sync endpoint which handles create or update
				await essayAPI.syncEssay(essay.id, {
					title: essay.title,
					content: essay.content,
					word_count: essay.wordCount || 0,
					char_count: essay.charCount || 0,
					created_at: essay.created
				});
				console.log('✅ Essay synced to Firebase:', essay.id);
				console.log('✅ Essay synced to Firebase:', essay.id);
			} catch (error) {
				console.error('❌ Failed to sync essay to Firebase:', error);
				// Essay is still saved in localStorage, so don't throw
			}
		}
	}

	// Get all essays (from localStorage, could be enhanced to sync from Firebase)
	static async getAllEssays(): Promise<EssayData[]> {
		// If authenticated, try to fetch from Firebase first
		if (this.isAuthenticated()) {
			try {
				const firebaseEssays = await essayAPI.getUserEssays();
				const essays: EssayData[] = firebaseEssays.map(essay => ({
					id: essay.id,
					title: essay.title,
					content: essay.content,
					created: essay.created_at,
					modified: essay.updated_at,
					wordCount: essay.word_count,
					charCount: essay.char_count
				}));
				
				// Cache in localStorage
				essays.forEach(essay => this.saveToLocalStorage(essay));
				return essays;
			} catch (error) {
				console.warn('Failed to fetch essays from Firebase, using localStorage:', error);
			}
		}

		// Fall back to localStorage
		const ids = this.getAllEssayIds();
		return ids
			.map(id => this.getFromLocalStorage(id))
			.filter((essay): essay is EssayData => essay !== null)
			.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
	}

	// Get version history for an essay
	static getVersions(essayId: string): EssayVersion[] {
		try {
			const data = localStorage.getItem(`essay-${essayId}-versions`);
			if (!data) return [];
			return JSON.parse(data);
		} catch (e) {
			console.error('Error loading versions:', e);
			return [];
		}
	}

	// Add a version to history (keeps last 10)
	private static addVersion(essayId: string, content: string, wordCount?: number): void {
		try {
			const versions = this.getVersions(essayId);
			
			// Add new version
			versions.push({
				content,
				timestamp: new Date().toISOString(),
				wordCount
			});

			// Keep only last MAX_VERSIONS
			const trimmedVersions = versions.slice(-MAX_VERSIONS);
			
			localStorage.setItem(`essay-${essayId}-versions`, JSON.stringify(trimmedVersions));
		} catch (e) {
			console.error('Error saving version:', e);
		}
	}

	// Restore a specific version
	static async restoreVersion(essayId: string, versionIndex: number): Promise<EssayData | null> {
		try {
			const versions = this.getVersions(essayId);
			const essay = await this.getEssay(essayId);
			
			if (!essay || !versions[versionIndex]) return null;

			const version = versions[versionIndex];
			const restoredEssay: EssayData = {
				...essay,
				content: version.content,
				modified: new Date().toISOString(),
				wordCount: version.wordCount
			};

			await this.saveEssay(restoredEssay);
			return restoredEssay;
		} catch (e) {
			console.error('Error restoring version:', e);
			return null;
		}
	}

	// Delete an essay from both Firebase and localStorage
	static async deleteEssay(id: string): Promise<void> {
		// Delete from localStorage
		localStorage.removeItem(`essay-${id}`);
		localStorage.removeItem(`essay-${id}-versions`);

		// Delete from Firebase if authenticated
		if (this.isAuthenticated()) {
			try {
				await essayAPI.deleteEssay(id);
				console.log('✅ Essay deleted from Firebase:', id);
			} catch (error) {
				console.error('❌ Failed to delete essay from Firebase:', error);
			}
		}
	}

	// Calculate storage usage
	static getStorageInfo(): { used: number; total: number; percentage: number } {
		let used = 0;
		for (const key in localStorage) {
			if (localStorage.hasOwnProperty(key)) {
				used += localStorage[key].length + key.length;
			}
		}
		
		// localStorage typically has 5-10MB limit, we'll use 5MB as conservative estimate
		const total = 5 * 1024 * 1024; // 5MB in bytes
		
		return {
			used,
			total,
			percentage: (used / total) * 100
		};
	}
}
